# Ten Kings teaser (Remotion)

A 60-second teaser in three parts:
- an animated map that places the ten rulers in reign order and draws the collisions between their kingdoms;
- one card per ruler;
- the title.

## Files

- `src/data.ts`: the title, the rulers, their one-line hooks, and the map events. Edit this file to change the words. The hooks follow `research_original_kings_review.md`, not the claims in the current chapters.
- `src/scenes.tsx`: the opening, the map, the ruler card and the end card.
- `scripts/copy-assets.mjs`: runs before every preview or render. It:
  - copies the portraits from `../illustrations` (they are JPEGs despite their `.png` names);
  - copies the fonts from `node_modules`;
  - builds `src/mapData.json` with `scripts/build-map.mjs`, which projects the coastline (with no modern borders) and the places.

## Running it

```bash
npm install
npm run studio      # preview in the browser
npm run render      # writes out/ten-kings-teaser.mp4
```

Remotion downloads its own headless browser the first time it renders. If that download is blocked, pass one explicitly:

```bash
npm run render -- --browser-executable=/path/to/headless_shell
```

## Licensing

- **Remotion:** free for individuals and for companies of up to three people. Larger companies need a company license (see remotion.dev/license).
- **Fonts:** Cinzel and Cormorant Garamond are under the SIL Open Font License.
