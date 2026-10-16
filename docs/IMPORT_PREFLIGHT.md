# Feed preflight

Before importing an approved feed, validate the existing feed contract and freshness (72 hours) using `assertImportFreshness` from `src/lib/feed-readiness.mjs`. An empty feed must not be interpreted as sold-out stock. The current legacy importer does not call this guard yet; integration is required before live use.

No live import is verified. Permission evidence is a claim, not proof of publication rights.
