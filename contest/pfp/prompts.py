"""Prompts for the PFP likeness redo (2026-10-09). Stage 1 Krea Seedream 5 Pro, stage 2 FLORA FLUX 3 Image (final)."""
import json
PHOTO = {"78"}  # PFP is a photo of a real person, not a cartoon
def who(m):
    if m in PHOTO:
        return ("the same real man as in image 2, feature for feature: face shape, age, skin tone, eyes, eyebrows, nose, mouth "
                "and smile, short dark hair, painted in thick oil, not a photo")
    return ("exactly the character in image 2, their PFP: the same species or head shape, the same colours, eyes, mouth, "
            "markings, headwear, eyewear and clothing details, so anyone who knows the PFP recognises them at a glance. Keep it "
            "that character, not a generic human, rendered as a living figure in thick oil paint")
def krea(m):
    return ("Image 1 is a finished oil painting of a New York street marble race. Repaint it with the same composition, place, "
            "light, crowd, giant glowing glass marble, colourful chalk lanes, eye-flowers and thick impasto brushwork, but the "
            "main figure is " + who(m) + ". Keep the figure's pose and action from image 1. "
            "ABSOLUTELY NO letters, words, numbers, logos or writing anywhere in the image.")
def flux(m):
    return ("Image 1 is an oil painting. Keep everything exactly as it is: the place, the light, the crowd, the giant glass "
            "marble, the chalk lanes, the pose, the brushwork. Edit ONLY the main figure so the figure is " + who(m) + ". "
            "Match image 2 feature for feature. No text, no letters, no logos.")
