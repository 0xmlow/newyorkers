/* ================================================================
   v327 FRAME RATE: ONE DRAW PER PROP, PER BLOCK (2026-11-24)
   The scanned props were placed one call at a time by twenty versions, and every call made its own instanced meshes:
   crates at the bodega, the fruit stand, the market and the DROP line were four sets of draws. phPlace() (v238) now
   queues every call made while the page loads and places each model once per 60 metre block, so the same crates,
   bins, bags, plants and fruit in one block are one draw per part. Blocks keep distance culling working.
   ================================================================ */
window.__PHQ = { on: true };
