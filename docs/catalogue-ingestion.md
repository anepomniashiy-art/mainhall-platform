# Public catalogue intake before nmarket
Started 2026-10-21, task #23.

Run Collect public project catalogue in GitHub Actions or:
python3 scripts/collect-public-projects.py scripts/public-project-sources.json --output collected/public-projects.json --raw-dir collected/raw --download-images collected/images --max-images 2
python3 scripts/adapt-official-units.py collected/public-projects.json --raw-dir collected/raw --output collected/market-units.json --download-plans collected/plans

The workflow archives source HTML, checked timestamps, image URLs and original plans. It does not automatically replace the published catalogue with unreviewed results.
Public prices come from exact identified apartment objects in official server data, not search snippets, page-wide regex or recommended apartments. Missing values remain null. Base and discounted prices are separate. UNKNOWN availability is never presented as guaranteed stock.
Published snapshots: data/catalogue/public-units.json. Project galleries and source provenance are separate data. The existing partner-feed import contract remains unchanged.

nmarket integration: preserve the MAINHALL project slug and editorial dossier. Map nmarket project/building/unit identifiers explicitly to the matching project/building/unit number; do not equate unrelated source IDs. Keep original source IDs, timestamps, price history and floor-plan provenance. Once connected, verified nmarket stock has priority over public_site snapshots; do not mark a public unit sold merely because it is absent from a different source. The Nmarket XML snapshot now supplies all 144 projects and 20,282 offers without a price filter. Imported property facts and all original media enter the public catalogue; editorial analysis remains curated. Matching requires the project, building, apartment number, floor and area. Historical public URLs retain a canonical route to the matching imported apartment. Raw XML including source contacts stays private and is never shipped in public assets.
No developer outbound sales links are rendered; apartment enquiry links identify the selected unit and lead to MAINHALL WhatsApp.


## Full XML import (2026-11-19)

The importer accepts a downloaded XML file, a verified image manifest and the pre-import project registry. It rejects missing media, duplicate offer IDs and colliding project slugs. Stable source IDs form apartment routes. Existing project slugs, dossiers and covers retain priority; source descriptions and building facts supplement them.

All source image references resolve to downloaded original bytes. Shared image URLs are stored once, without an arbitrary gallery limit. Plans and floor plans retain their tags and cannot become project covers. XML descriptions are rendered as plain text; source contacts and links are excluded from public copy. The source archive remains outside Git and public build output.

Production publishing measures the archive and extracted release before upload, checks real free disk space and inodes, and requires an additional 5 GiB free reserve. Existing releases are retained for rollback. No automatic deletion or paid hosting upgrade is part of the import.

Original Nmarket media lives in the static release, outside Git. Before a production build, `scripts/download-nmarket-images.py --source-manifest data/catalogue/nmarket-media.json.gz --manifest /tmp/nmarket-media-downloaded.json --workers 64` restores every original and checks its snapshot SHA-256. The release workflow caches these originals by manifest digest. A source image that changes or disappears blocks a new release, preserving the current website.

Deployment measures the compressed archive, expanded release and inode demand against the production filesystem before uploading. It requires an additional 5 GiB free reserve. Checksums are streamed, so large archives do not load into server RAM. No historical release is automatically deleted.

The source snapshot references 27,421 unique media resources. All 27,420 available originals were saved (1,710,759,418 bytes). One floor-plan resource in Деснаречье returns confirmed HTTP 404 for four offers; its original URL and affected IDs remain in `data/provenance/nmarket-unavailable-media.json`. It is never replaced with an invented image or rendered as a broken photograph. Any additional missing resource still blocks import and deployment.

Large normalized feed snapshots use deterministic gzip compression in source control. Every field is preserved losslessly and expanded during rendering; public pages and original images remain complete.
