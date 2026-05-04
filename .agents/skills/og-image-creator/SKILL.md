---
name: og-image-creator
description: Create branded Open Graph and social preview images for DocsBot landing pages, marketing pages, tools, feature pages, and similar website routes. Use when Codex needs to generate or refresh OG/social card assets, match existing DocsBot visual style, use hero screenshots or existing OG images as references, composite accurate logo/text overlays, optimize JPEG/PNG dimensions and file size, and wire page-specific SEO metadata.
---

# OG Image Creator

## Workflow

1. Inspect the target page and nearby examples before designing:
   - Read the page component and SEO block.
   - Inspect existing OG assets with `file`, `du -h`, and visual review.
   - If a local server is already running, use it; otherwise start the repo's normal dev server.
   - Screenshot the page hero when it helps match layout, visual motifs, or copy.

2. Use generated or captured artwork only for the background:
   - Use image generation for the no-text visual system when the page needs a new marketing illustration.
   - Prompt for no readable text, no fake logos, no pseudo-letters, and a clean safe area for the final overlay.
   - Prefer DocsBot's dark navy, teal, and cyan visual language unless the page has a stronger local convention.
   - Keep the real logo and readable headline out of the image model output.

3. Composite final copy deterministically:
   - Use `scripts/render-og-card.mjs` to add the real DocsBot logo, upper-right page pill, title, subtitle, and accent marks.
   - Keep important text inside the 16:9 center-safe area. For 1200x630 cards, assume a centered 1120x630 crop can happen.
   - Default to `1200x630` progressive JPEG around quality `82`, then verify size against existing assets.

4. Wire the page metadata:
   - Add page-specific `openGraph.images` with absolute production URL, `width`, `height`, `alt`, and `type`.
   - Ensure Twitter uses `summary_large_image` when the page does not already set it.
   - Decide whether section children should inherit the section image or keep the site default.

5. Validate:
   - Check `file <asset>` and `du -h <asset>`.
   - Visually inspect the full card and a simulated 16:9 center crop.
   - Fetch local HTML and confirm emitted `og:image`, `og:image:width`, `og:image:height`, `og:image:type`, and `twitter:card`.
   - Run repo checks appropriate to the edit, usually `npm run lint`, `npm run test:core`, and `git diff --check`.

## Renderer

Use the bundled renderer from the repo root:

```bash
node .agents/skills/og-image-creator/scripts/render-og-card.mjs \
  --background /path/to/generated-or-screenshot-background.png \
  --logo public/branding/docsbot-logo.svg \
  --output public/og-new-page.jpeg \
  --pill "AI Actions" \
  --title "AI agents|that take action" \
  --subtitle "Turn answers into action|with governed workflows."
```

Or use a JSON config:

```bash
node .agents/skills/og-image-creator/scripts/render-og-card.mjs \
  --config .agents/skills/og-image-creator/assets/sample-config.json
```

The renderer depends on `sharp`, which is already available in this repo. If another repo lacks `sharp`, use its existing image toolchain or install/use the repo-approved equivalent before relying on this script.

## Overlay Template

`assets/overlay-template.html` is the reusable HTML/CSS version of the card overlay. Use it as the source of truth when porting the layout to a browser renderer, screenshot pipeline, or design tool.

The script renders an SVG equivalent because `sharp` can composite it directly without a browser dependency.

## Prompt Pattern

For generated backgrounds, use this structure and adapt page specifics:

```text
Create a polished dark SaaS marketing OG background for a DocsBot page about <topic>.
Use dark navy, teal, and cyan accents, subtle grid lines, crisp glassy panels, and clean product-like workflow visuals.
Leave the left/center-left area clean for overlaid logo and headline, and keep the main visual on the right or lower center.
Do not include readable text, brand names, logos, watermarks, pseudo-letters, humans, or robots with faces.
Avoid purple gradients, beige palettes, clutter, blurry UI, and stock-photo styling.
```

When the target page has a strong hero visual, mention the screenshot/reference explicitly and ask the image model to match its mood and motifs, not its text.

## Crop Check

Simulate a common 16:9 center preview from a `1200x630` card:

```bash
node - <<'NODE'
const sharp = require('sharp')
sharp('public/og-new-page.jpeg')
  .extract({ left: 40, top: 0, width: 1120, height: 630 })
  .toFile('/tmp/og-new-page-16x9.jpeg')
NODE
```

Inspect `/tmp/og-new-page-16x9.jpeg`; the logo, title, and subtitle should remain readable.
