#!/usr/bin/env node
/* Build ERC-7160 additional token metadata from a headless render manifest.
   Usage: node build-metadata.mjs --manifest /abs/OUT/manifest.jsonl --out /abs/OUT
   Writes:
     OUT/metadata/<token>.json          one variant metadata file per token
     OUT/contract/batch_add_token_uris.json   array payload for the 7160 addTokenUris call
   Media URIs use the GIF_CID / META_CID placeholders. Pin the gifs folder first,
   substitute the CID, pin metadata, substitute again. Nothing here invents chain facts. */
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
function flag(name, def){ const i = args.indexOf(name); return i>=0 ? args[i+1] : def; }
const manifestPath = flag('--manifest');
const outDir = flag('--out');
if(!manifestPath || !outDir){
  console.error('usage: node build-metadata.mjs --manifest manifest.jsonl --out OUT_DIR');
  process.exit(2);
}

const metaDir = path.join(outDir, 'metadata');
const contractDir = path.join(outDir, 'contract');
fs.mkdirSync(metaDir, {recursive:true});
fs.mkdirSync(contractDir, {recursive:true});

const FX_LABEL = {
  kaleido:'Kaleido', mirror:'Mirror', bulge:'Bulge', swirl:'Swirl', tile:'Tile',
  wave:'Wave Warp', ripple:'Ripple Scan', wobble:'Wobble', pixelate:'Pixelate',
  ledwall:'LED Wall', slices:'Slices', blocks:'Glitch Blocks', mosh:'Datamosh',
  smear:'Melt', jpeg:'JPEG Crush', crystals:'Crystals', interlace:'Interlace',
  rgbshift:'RGB Shift', badtv:'Bad TV', vhs:'VHS', noise:'Noise', ghost:'Ghost Trails',
  glow:'Glow', blur:'Blur', sharpen:'Sharpen', oil:'Oil Paint', adjust:'Levels',
  dither:'Dither Lab', posterize:'Posterize', halftone:'Halftone', edges:'Edges',
  duotone:'Duotone', heatmap:'Heatmap', prism:'Prism', invert:'Invert',
  solarize:'Solarize', deepfry:'Deep Fry', strobe:'Strobe', scan:'Scanlines',
  crt:'CRT', vignette:'Vignette', overlay:'Code Overlay', ascii:'ASCII',
  emojimosaic:'Emoji Mosaic', emojirain:'Emoji Rain', petals:'Petal Storm',
  stamp:'Blossom Stamp', camhud:'Cam HUD', brandhaunt:'Brand Haunt',
};
const lines = fs.readFileSync(manifestPath,'utf8').split('\n').filter(l=>l.trim());
const batch = [];
let n = 0;
for(const line of lines){
  const r = JSON.parse(line);
  const gifFile = encodeURIComponent(path.basename(r.gif));
  const treatment = (r.chain||[]).map(c=>FX_LABEL[c.id]||c.id).join(' + ');
  const article = /^[AEIOUX]/i.test(r.familyName) ? 'an' : 'a';
  const description =
    `${r.name} returns as ${article} ${r.familyName} glitch edition, moshed through MOSH LAB and gifted to the holder of the original. ${r.tag}`;
  const meta = {
    name: `${r.name} · ${r.familyName}`,
    description,
    image: `ipfs://GIF_CID/${gifFile}`,
    animation_url: `ipfs://GIF_CID/${gifFile}`,
    attributes: [
      { trait_type: 'Edition', value: 'Glitch Variant' },
      { trait_type: 'Glitch Family', value: r.familyName },
      { trait_type: 'Treatment', value: treatment },
      ...(r.arc ? [{ trait_type: 'Collapse Curve', value: r.arc === 'ramp' ? 'Ramp' : 'Burst' }] : []),
      ...(r.fps ? [{ trait_type: 'Tempo', value: `${r.fps} fps` }] : []),
      { trait_type: 'Frames', value: r.frames },
      ...(r.maxColors ? [{ trait_type: 'Palette', value: `${r.maxColors} colors` }] : []),
      ...(r.brandMode ? [{ trait_type: 'Brand Marks', value: r.brandMode[0].toUpperCase()+r.brandMode.slice(1) }] : []),
      ...(r.bonus ? [{ trait_type: 'Bonus Effect', value: FX_LABEL[r.bonus]||r.bonus }] : []),
      { trait_type: 'Loop Seconds', value: r.loopSec },
      { trait_type: 'Mosh Seed', value: r.seed },
      { trait_type: 'Character Number', value: Number(r.token) || r.token },
    ],
  };
  fs.writeFileSync(path.join(metaDir, r.token + '.json'), JSON.stringify(meta, null, 2));
  batch.push({ tokenId: Number(r.token) || r.token, uri: `ipfs://META_CID/${r.token}.json` });
  n++;
}
batch.sort((a,b)=>(+a.tokenId||0)-(+b.tokenId||0));
fs.writeFileSync(path.join(contractDir, 'batch_add_token_uris.json'), JSON.stringify(batch, null, 1));
console.log(`metadata: ${n} files → ${metaDir}`);
console.log(`contract payload: ${path.join(contractDir,'batch_add_token_uris.json')}`);
