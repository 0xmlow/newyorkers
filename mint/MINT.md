# Minting BREAK GLASS

Everything is pinned on IPFS through Pinata (pins.json has every CID and sha256).

| Field | Value |
|---|---|
| tokenURI | `ipfs://bafkreieivnnc3rcfiypyeikvvecri2ab6zktlhmj5ysvib32iqmlbychia` |
| animation_url (the piece) | `ipfs://bafybeig4swrcrlm64mvv2l3tfooy2axwercjlr6l26ubikl5s7zqmimbva/index.html` |
| image (the GIF loop) | `ipfs://bafybeig4swrcrlm64mvv2l3tfooy2axwercjlr6l26ubikl5s7zqmimbva/break_glass.gif` |
| still | `ipfs://bafybeig4swrcrlm64mvv2l3tfooy2axwercjlr6l26ubikl5s7zqmimbva/preview.png` |
| film | `ipfs://bafybeig4swrcrlm64mvv2l3tfooy2axwercjlr6l26ubikl5s7zqmimbva/break_glass_film.mp4` |

- **Your own contract (Manifold, Transient Labs, rare-cli):** mint one token with the tokenURI above. `metadata.json` here is the exact file behind it.
- **A form that wants files (SuperRare, Foundation, OpenSea Studio):** upload `dist/index.html` as the media (HTML), `dist/break_glass.gif` as the preview or thumbnail, paste the name and description from `metadata.json`, and add the traits from its `attributes`. Some platforms cap HTML at 50 MB; this file is 17.6 MB.
- The film and GIF are in this folder for the post: `break_glass_film.mp4` (44 s, 1920x1080, -14 LUFS) and `break_glass.gif` (6 s loop, 720x720, 12.5 MB).

Not verified: the HTML through a public gateway (Pinata's public gateway refuses HTML by policy and ipfs.io was rate limiting); the metadata, GIF, still and film all served from gateway.pinata.cloud. Not minted. Nothing posted.
