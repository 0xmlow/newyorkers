# Dynamic NFT and portable-world delivery

Treat the interactive artwork, exchange preview, and 3D source as separate outputs with one versioned identity.

- Export a standards-compliant GLB for archive, marketplaces, and downstream editing. Runtime-only art, procedural shaders, and UI do not automatically exist inside that GLB; state this clearly.
- Ship a fully self-contained HTML edition when portability is requested. Bundle the exact Three.js runtime and addons, inline CSS/JavaScript, embed the GLB and media as data URLs, and scan the finished file for residual relative asset paths.
- Give dynamic states stable names and expose them through ordinary UI. Platform-specific token updates require the chosen chain, contract standard, storage provider, and wallet authorization; prepare metadata placeholders without pretending a mint occurred.
- Keep the MLow remix in a separately named artifact. Never let runtime flags, materials, or branded geometry contaminate the faithful reconstruction.
- A hype video is a derived preview. Render it from the same versioned GLB, verify duration/codec/frames, and include its generator so a later agent can reproduce it.
- Handoff packages need START-HERE, project boundaries, evidence ledger, exact rebuild commands, validation evidence, known limits, checksums, and no credentials or caches.

For large self-contained files, test offline and inspect mobile memory. Base64 embedding adds size; preserve the GLB separately even when it is also embedded.
