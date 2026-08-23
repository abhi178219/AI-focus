# LendStream DSA Hub — open hypotheses (need more data)

- Composite score pillar weighting (equal-weighted by default, `products.pillar_weights`) may not match real underwriting practice — needs tuning once real cases are run through it. Not yet tested against more than one synthetic example.
- Now on `gemma3:4b` (switched from `qwen2.5:7b-instruct` for speed — see rules.md), still without a real bake-off on messier/lower-quality OCR text (all live tests so far used a clean synthetic salary slip). Real scanned documents with noisier OCR output may need a different/larger model or a retry/repair step — worth re-testing if extraction confidence looks low on real-world uploads, since a smaller model may be more sensitive to noisy input than the larger `qwen2.5:7b` was.
- Synchronous inline pipeline execution is untested under concurrent load — unknown at what point (number of simultaneous uploads) it becomes a real bottleneck requiring a background job queue.
