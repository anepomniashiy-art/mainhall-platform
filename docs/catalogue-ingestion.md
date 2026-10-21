# Public catalogue intake before nmarket
Started 2026-10-21, task #23.

Run Collect public project catalogue in GitHub Actions or:
python3 scripts/collect-public-projects.py scripts/public-project-sources.json --output collected/public-projects.json --raw-dir collected/raw --download-images collected/images --max-images 2
python3 scripts/adapt-official-units.py collected/public-projects.json --raw-dir collected/raw --output collected/market-units.json --download-plans collected/plans

The workflow archives source HTML, checked timestamps, image URLs and original plans. It does not automatically replace the published catalogue with unreviewed results.
Public prices come from exact identified apartment objects in official server data, not search snippets, page-wide regex or recommended apartments. Missing values remain null. Base and discounted prices are separate. UNKNOWN availability is never presented as guaranteed stock.
Published snapshots: data/catalogue/public-units.json. Project galleries and source provenance are separate data. The existing partner-feed import contract remains unchanged.

nmarket integration: preserve the MAINHALL project slug and editorial dossier. Map nmarket project/building/unit identifiers explicitly to the matching project/building/unit number; do not equate unrelated source IDs. Keep original source IDs, timestamps, price history and floor-plan provenance. Once connected, verified nmarket stock has priority over public_site snapshots; do not mark a public unit sold merely because it is absent from a different source. The sourcePriority array records that planned precedence, not a running nmarket connector.
No developer outbound sales links are rendered; apartment enquiry links identify the selected unit and lead to MAINHALL WhatsApp.
