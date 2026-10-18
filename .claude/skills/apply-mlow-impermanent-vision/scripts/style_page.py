#!/usr/bin/env python3
"""Apply the MLow Impermanent Vision treatment without altering source art."""

from __future__ import annotations

import argparse
import math
import random
from pathlib import Path

from PIL import (
    Image,
    ImageChops,
    ImageDraw,
    ImageEnhance,
    ImageFilter,
    ImageOps,
)


RESAMPLE = Image.Resampling.LANCZOS
PALETTE = [
    (41, 98, 255),
    (0, 229, 255),
    (255, 46, 99),
    (168, 79, 255),
    (240, 244, 248),
    (190, 133, 76),
]
LEVELS = {
    "whisper": 0.20,
    "bloom": 0.34,
    "melt": 0.50,
}
BLOOM_PAGES = {1, 6, 8, 12, 18, 20, 22, 24}
MELT_PAGES = {24}


def cover_fit(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return ImageOps.fit(image.convert("RGB"), size, method=RESAMPLE)


def trim_transparent(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    box = rgba.getchannel("A").getbbox()
    return rgba.crop(box) if box else rgba


def extract_flower(sheet: Image.Image, variant: int) -> Image.Image:
    sheet = sheet.convert("RGBA")
    third = sheet.width // 3
    left = min(variant % 3, 2) * third
    right = sheet.width if variant % 3 == 2 else left + third
    return trim_transparent(sheet.crop((left, 0, right, sheet.height)))


def edge_vignette(size: tuple[int, int], frame: int) -> Image.Image:
    width, height = size
    mask = Image.new("L", size, 255)
    draw = ImageDraw.Draw(mask)
    inset = max(frame * 6, 120)
    draw.rounded_rectangle(
        (inset, inset, width - inset, height - inset),
        radius=inset // 2,
        fill=0,
    )
    return mask.filter(ImageFilter.GaussianBlur(max(frame * 4, 80)))


def shadow_mask(image: Image.Image) -> Image.Image:
    gray = ImageOps.grayscale(image)
    inverted = ImageOps.invert(gray)
    return ImageEnhance.Contrast(inverted).enhance(1.35)


def scale_mask(mask: Image.Image, factor: float) -> Image.Image:
    return mask.point(lambda value: max(0, min(255, round(value * factor))))


def colorized_contours(
    texture: Image.Image,
    accent: tuple[int, int, int],
) -> tuple[Image.Image, Image.Image]:
    gray = ImageOps.grayscale(texture)
    edges = gray.filter(ImageFilter.FIND_EDGES)
    edges = edges.filter(ImageFilter.GaussianBlur(0.65))
    edges = ImageOps.autocontrast(edges, cutoff=3)
    edges = edges.point(lambda value: 0 if value < 42 else value)
    colored = ImageOps.colorize(edges, black=(0, 0, 0), white=accent)
    return colored, edges


def draw_portal(
    layer: Image.Image,
    rng: random.Random,
    page_index: int,
    strength: float,
) -> None:
    width, height = layer.size
    draw = ImageDraw.Draw(layer, "RGBA")
    side = -1 if page_index % 2 == 0 else 1
    center_x = int(width * (0.04 if side < 0 else 0.96))
    center_y = int(height * (0.28 + 0.44 * rng.random()))
    base_w = int(width * (0.18 + 0.07 * strength))
    base_h = int(base_w * (1.55 + 0.25 * rng.random()))
    accent = PALETTE[(page_index + 1) % 4]
    for ring in range(7):
        grow = ring * int(width * 0.018)
        box = (
            center_x - base_w // 2 - grow,
            center_y - base_h // 2 - grow,
            center_x + base_w // 2 + grow,
            center_y + base_h // 2 + grow,
        )
        alpha = int((52 - ring * 5) * (0.7 + strength))
        draw.arc(box, 68 if side < 0 else 112, 292 if side < 0 else 248, fill=(*accent, alpha), width=2)


def draw_drips(
    layer: Image.Image,
    rng: random.Random,
    page_index: int,
    strength: float,
    frame: int,
) -> None:
    width, height = layer.size
    draw = ImageDraw.Draw(layer, "RGBA")
    count = 6 if strength < 0.4 else 10
    edge_right = page_index % 2 == 1
    for drip in range(count):
        color = PALETTE[(page_index + drip) % len(PALETTE)]
        alpha = int(42 + 80 * strength)
        line_width = rng.choice([2, 2, 3, 4])
        if drip % 3 == 0:
            x = int(width * (0.08 + 0.84 * rng.random()))
            y0 = rng.randint(0, frame * 2)
            length = rng.randint(frame * 3, frame * 10)
            points = []
            for step in range(9):
                y = y0 + length * step / 8
                sway = math.sin(step * 1.35 + page_index) * frame * 0.18
                points.append((x + sway, y))
        else:
            x0 = width - frame if edge_right else frame
            y = int(height * (0.12 + 0.76 * rng.random()))
            length = rng.randint(frame * 3, frame * 8)
            direction = -1 if edge_right else 1
            points = []
            for step in range(9):
                x = x0 + direction * length * step / 8
                sway = math.sin(step * 1.2 + drip) * frame * 0.15
                points.append((x, y + sway))
        draw.line(points, fill=(*color, alpha), width=line_width, joint="curve")
        end_x, end_y = points[-1]
        radius = max(2, line_width + 1)
        draw.ellipse(
            (end_x - radius, end_y - radius, end_x + radius, end_y + radius),
            fill=(*color, min(180, alpha + 35)),
        )


def place_flower(
    canvas: Image.Image,
    flower_sheet: Image.Image,
    page_index: int,
    level: str,
    frame: int,
) -> None:
    flower = extract_flower(flower_sheet, page_index - 1)
    width, height = canvas.size
    base_size = {
        "whisper": int(width * 0.075),
        "bloom": int(width * 0.095),
        "melt": int(width * 0.115),
    }[level]
    ratio = base_size / flower.width
    flower = flower.resize(
        (base_size, max(1, round(flower.height * ratio))),
        RESAMPLE,
    )
    if page_index % 2:
        x = width - flower.width - frame // 3
    else:
        x = frame // 3
    y_fraction = 0.19 + ((page_index * 0.173) % 0.58)
    y = int(height * y_fraction)
    y = min(height - flower.height - frame, max(frame, y))

    halo = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    halo_draw = ImageDraw.Draw(halo)
    pad = int(base_size * 0.20)
    halo_draw.ellipse(
        (
            x - pad,
            y - pad,
            x + flower.width + pad,
            y + flower.height + pad,
        ),
        fill=(2, 6, 18, 150),
    )
    halo = halo.filter(ImageFilter.GaussianBlur(max(8, base_size // 8)))
    canvas.alpha_composite(halo)
    canvas.alpha_composite(flower, (x, y))


def apply_style(
    source: Image.Image,
    texture: Image.Image,
    flower_sheet: Image.Image,
    page_index: int,
    level: str,
) -> Image.Image:
    source = source.convert("RGB")
    width, height = source.size
    frame = max(18, round(min(width, height) * 0.026))
    strength = LEVELS[level]
    rng = random.Random(6803 + page_index * 191)

    texture = cover_fit(texture, (width, height))
    texture = ImageEnhance.Color(texture).enhance(1.18)
    texture = ImageEnhance.Contrast(texture).enhance(1.16)
    dark_field = Image.blend(texture, Image.new("RGB", source.size, (2, 7, 22)), 0.48)

    canvas = dark_field.convert("RGBA")
    inset = source.resize((width - frame * 2, height - frame * 2), RESAMPLE)
    canvas.alpha_composite(inset.convert("RGBA"), (frame, frame))

    base_rgb = canvas.convert("RGB")
    texture_screen = ImageChops.screen(base_rgb, dark_field)
    edge_mask = edge_vignette(source.size, frame)
    shadows = shadow_mask(base_rgb)
    invasion_mask = ImageChops.multiply(edge_mask, shadows)
    invasion_mask = scale_mask(invasion_mask, 0.46 + strength)
    invaded = Image.composite(texture_screen, base_rgb, invasion_mask)

    accent = PALETTE[(page_index + 1) % 4]
    contour_rgb, contour_alpha = colorized_contours(texture, accent)
    contour_mask = ImageChops.multiply(contour_alpha, edge_mask)
    contour_mask = scale_mask(contour_mask, 0.24 + strength * 0.72)
    contoured = Image.composite(
        ImageChops.screen(invaded, contour_rgb),
        invaded,
        contour_mask,
    )
    canvas = contoured.convert("RGBA")

    marks = Image.new("RGBA", source.size, (0, 0, 0, 0))
    draw_portal(marks, rng, page_index, strength)
    draw_drips(marks, rng, page_index, strength, frame)
    canvas.alpha_composite(marks)
    place_flower(canvas, flower_sheet, page_index, level, frame)

    if level == "melt":
        glaze = cover_fit(texture, source.size).convert("RGBA")
        glaze.putalpha(scale_mask(edge_vignette(source.size, frame), 0.16))
        canvas.alpha_composite(glaze)

    final_rgb = canvas.convert("RGB")
    final_rgb = ImageEnhance.Contrast(final_rgb).enhance(1.03)
    final_rgb = ImageEnhance.Sharpness(final_rgb).enhance(1.08)
    return final_rgb


def mode_for_page(page_index: int) -> str:
    if page_index in MELT_PAGES:
        return "melt"
    if page_index in BLOOM_PAGES:
        return "bloom"
    return "whisper"


def process_one(
    source_path: Path,
    output_path: Path,
    texture_paths: list[Path],
    flower_path: Path,
    page_index: int,
    level: str | None,
) -> None:
    chosen_level = level or mode_for_page(page_index)
    texture_path = texture_paths[(page_index - 1) % len(texture_paths)]
    with Image.open(source_path) as source:
        with Image.open(texture_path) as texture:
            with Image.open(flower_path) as flowers:
                result = apply_style(
                    source,
                    texture,
                    flowers,
                    page_index,
                    chosen_level,
                )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    result.save(output_path, "PNG", optimize=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Apply the MLow Impermanent Vision treatment to one page or a page directory."
    )
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--textures", type=Path, nargs="+", required=True)
    parser.add_argument("--flowers", type=Path, required=True)
    parser.add_argument("--page-index", type=int, default=1)
    parser.add_argument("--level", choices=sorted(LEVELS))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.input.is_dir():
        args.output.mkdir(parents=True, exist_ok=True)
        sources = sorted(args.input.glob("page_*.png"))
        if not sources:
            raise SystemExit(f"No page PNG files found in {args.input}")
        for index, source in enumerate(sources, 1):
            process_one(
                source,
                args.output / source.name,
                args.textures,
                args.flowers,
                index,
                args.level,
            )
    else:
        process_one(
            args.input,
            args.output,
            args.textures,
            args.flowers,
            args.page_index,
            args.level,
        )


if __name__ == "__main__":
    main()
