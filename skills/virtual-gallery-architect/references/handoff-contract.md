# Agent handoff contract

Deliver a source snapshot another machine can run—not a chat summary that depends on the previous agent.

Include:

1. A START-HERE document with the exact working-directory choice, required runtime, installation and development commands, and initial review task.
2. A CLAUDE.md (or equivalent) with project boundaries, immutable assets, architecture map, naming conventions and test commands.
3. The source and package-manager lockfile; optimized art files and catalog; a statement about whether full-resolution originals are included.
4. A room-by-room description of what is implemented, verified reference anchors, and intentional approximations. Link primary sources; do not assume a web page's photos are reusable assets.
5. A roadmap distinguishing proposals from implemented rooms, with geometry strategy, art presentation, priority and acceptance criteria.
6. Validation evidence that distinguishes compile/build, data/geometry checks, browser interaction, visual review and measured performance.
7. Deployment identity and audience, with fresh credentials omitted. Document how to continue locally when the receiving agent lacks provider-specific deployment tools.
8. An archive manifest or checksum and a quick archive integrity/secret-exclusion check.

Exclude .git history unless explicitly useful, node_modules, build caches, .env files, auth tokens, captured private tool responses and unrelated source folders. Keep the archive unchanged after calculating its checksum. When handing off a previously published site, identify the matching source commit and deployment status; do not imply newer local work is already live.
