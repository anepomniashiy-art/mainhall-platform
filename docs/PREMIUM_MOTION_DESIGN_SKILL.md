# MAINHALL — Premium Motion & Typography Skill
Last reviewed: 2026-10-19. Design system for this repository. Apply to every UI change.

## Sources researched
- Motion scroll-linked and parallax: https://motion.dev/docs/react-scroll-animations
- Motion transforms: https://motion.dev/docs/react-use-transform
- GSAP ScrollTrigger pin/scrub: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- Community authored GSAP workflow: https://github.com/TweenLabs/gsap_agent/blob/main/SKILLS/gsap-scrolltrigger/SKILL.md
- Official architectural reference FORUM / MR Group: https://forum.mr-group.ru/

## Design contract
1. Luxury is spatial restraint, not preset loaders. No blocking splash screens. First 100vh is architectural editorial storytelling.
2. Hero imagery MUST be a premium, luminous Moscow development. Use developer-source references for art direction; rights for final redistribution should be verified before commercial production. Do not silently substitute generic Unsplash interiors.
3. Pair only Cormorant Garamond + Manrope. Main display: tracking -0.045em, line-height .94–1.04. Labels: 10–11px uppercase medium, tracking .18–.2em. No faux italic.
4. 60% negative space at the viewport and section scale. Strong left alignment, large vertical rhythm, elegant unobtrusive navigation.
5. Motion choreography: architectural slow scale-in, sticky cinematic scroll stage, parallax/clip-path reveal, 3D CSS orbit sculpture. Prefer transforms/opacity; no scroll-jacking.
6. If adding Motion React, map useScroll progress to useTransform; if adding GSAP, use ScrollTrigger pin/scrub deliberately. Do not add a heavy 3D runtime for a decorative scene without performance need.
7. Motion under prefers-reduced-motion: reduce: disable. Avoid blocking interaction, running animations continuously on low-end mobile, and CPU-heavy filters per frame.
8. No invented prices, yields, inventory or project images. Photo rights tracked. Preserve /commercial and project routes.
9. Verify production visual appearance (mobile + desktop), build, URLs, contrast and image loads. GitHub green step alone is not visual acceptance.
10. Workflow: make code change → successful CI → publish preview → check HTTP/visuals → send owner one URL + what changed. Do not claim deployment before it is verified.

## Implementation state
Branch codex/preserve-commercial-site implements a sticky photoreal architectural hero, editorial sections and CSS spatial orbit scene without adding dependencies. The official MR Group image is remote-referenced for preview; a permission-cleared/self-hosted production asset is still needed.
