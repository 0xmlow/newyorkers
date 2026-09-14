# THE MUSEUM · the networked mint kit

Every room of THE MUSEUM as a token, and every room joined to the others. A collector who opens one token can walk out of its doors into the next room, round the ring, across the borough or across the city, and back to the lobby that opens them all. The whole network lives on IPFS, so it keeps working if n3wyorkers.com ever goes dark.

Built by `NEW YORKERS SITE/_build/museum/mint_network.py`. Nothing here is pinned, nothing is minted, and no contract is deployed.

## What is in this folder

| Path | What it is | How it gets pinned |
|---|---|---|
| `network/` | The lobby (`index.html`), the ring map, the shared engine and art, one walkable page per room in `rooms/NNN-id/index.html`, the compressed GLB beside each page, the object viewer (`viewer.html`), the collection cover and banner | **One directory, one CID.** The room pages reach the engine and each other by relative paths, so this folder must never be split up |
| `tokens/NNN-id/` | Per token media: `preview.gif` (the marketplace image), `preview.mp4`, `daycycle.gif` and `daycycle.mp4` (daylit rooms only), `hours.jpg`, `poster.jpg`, `poster.png`, `room.web.glb`, `room.glb`, `room.json` | One directory CID, or file by file (fill `pin_plan.csv`) |
| `metadata/` | `1.json` to `N.json`. `animation_url` is the walkable page | After `finalize.py`, one folder |
| `metadata-object/` | The same tokens with the compressed GLB as `animation_url` | After `finalize.py`, one folder |
| `collection.json` | Contract level metadata (contractURI) | With the metadata |
| `network.json` | The graph: every room and every door | Inside `network/` too |
| `manifest.csv` | One row per token: wing, borough, works, sizes, doors | Not pinned |
| `pin_plan.csv` | Every token file with a pin name and an empty `cid` column | Not pinned |
| `finalize.py` | Rewrites the metadata to IPFS URIs once the CIDs exist | Not pinned |
| `validate.py` | The gate. Exit 0 or do not pin | Not pinned |

## One token, three ways to see it

- **The walkable room** (`metadata/`): the museum engine locked to this room, with the light on the New York clock, the hang pinned to the mint day, and the doors panel on the left (`[` and `]` walk back and forward).
- **The room as an object** (`metadata-object/`): the whole room as a GLB with meshopt geometry and WebP textures, 5 to 10 MB, readable by OpenSea's 3D viewer, model-viewer, three.js, Babylon and Blender 4 or later. The full, uncompressed GLB (35 to 90 MB, PNG textures) is listed in `properties.files` for anyone who wants the source.
- **The previews**: `preview.gif` is a slow pan either side of the room's composed view; `daycycle.gif` is the same view from dawn to night, because the light is what makes the rooms dynamic. No hour or date is burned into any frame.

## The network

Every room has four doors, written into its page and its metadata:

- **Back** and **forward**: the previous and next room on the ring, which is the museum's own order, 136 wraps to 1.
- **Same borough**: the next room in the same borough that is not already a door. Boroughs and wings live in `_build/museum/mint/places.json` and were assigned from each room's place. Water crossings and harbor islands read as The Harbor; the subway and the appetizing counter as Citywide. **Check them before the mint.**
- **Across the city**: the room 52 places round the ring (the golden stride), which throws each door far from its neighbors, so the network never feels like a corridor.

The wings are named in `places.json` and follow how the museum was built: The Founding Rooms (1 to 21), The Five Boroughs (22 to 61), The Icons (62 to 81), The Institutions (82 to 111), The Working City (112 to 121), The Landmarks (122 to 136). **The names are proposals.** Rename them there and rebuild; nothing else changes.

## Order of operations

1. **Rulings first.** Contract and chain, royalty (the kit carries 750 bps, the TSC standard, which needs MLow's yes), the royalty wallet (`collection.json` says `SET_ROYALTY_WALLET`, and `validate.py --final` refuses it), wing names, boroughs, and whether the hang stays pinned (see below).
2. `python3 validate.py` must exit 0.
3. Pin `network/` as one directory. Note the CID. Open `https://<gateway>/ipfs/<CID>/` and walk three rooms through their doors before going on.
4. Pin `tokens/` as one directory (simplest), or file by file with the pin names in `pin_plan.csv`, then fill its `cid` column.
5. `python3 finalize.py --network-cid <NET> --tokens-cid <TOK>` (or `--cids pin_plan.csv`). Add `--platform studio-drops` if the contract appends a bare token id. It writes `final/`.
6. `python3 validate.py --final` must exit 0.
7. Pin `final/metadata/` as one folder. Its CID plus a trailing slash is the baseURI. For an ERC 7160 contract, pin `final/metadata-object/` too and give each token both URIs: the walkable room first, the object second.
8. Gateway fetch token 1 and token N by hand before the mint opens.

Size budget: the network folder carries the shared engine, 24 MB of atlases, about 400 MB of wall art, the props and every compressed GLB. The tokens folder carries the full GLBs and the loops. Check the totals in the build log against the pinning plan before uploading.

## What is dynamic

- **Light.** Daylit rooms read the clock in America/New_York and blend sky, sun, moon, fog and window glow by the hour. Fixed hour rooms keep their night.
- **Hang.** The token pins the hang of the mint day (`window.NY_MINT.day` in each room page), so the works listed in `properties.works` and `room.json` stay true forever. Remove the `day` key in `mint_network.py` to let every token reshuffle daily like the live site; then drop the works list from the metadata, because it would no longer be what hangs.
- **Live.** `external_url` points at the room on n3wyorkers.com, where the museum keeps moving.

## Rebuild

From `NEW YORKERS SITE/` with the dev server running (`python3 _build/serve.py 4185`):

```
python3 _build/museum/mint_export.py --day 2026-09-14 --hour 14
python3 _build/museum/mint_gifs.py --out "../MUSEUM EXPORTS/2026-09-14 MINT/previews" --skip-done
python3 _build/museum/mint_network.py --day 2026-09-14
```

The export takes about ten minutes for every room, the previews about forty, and the network build about fifteen. Rerunning any step skips work that is already done.
