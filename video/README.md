# Ten Kings teaser (Remotion)

A two-minute narrated teaser. It has four parts:

1. An opening.
2. An animated map that places the ten rulers in reign order and draws the collisions between their kingdoms.
3. One card per ruler.
4. The title.

The pictures follow the voice: every scene takes its timing from the narration.

## Files

- **`narration.json`** holds what the narrator says:
  - the voice;
  - hand-set pronunciations for the Indian names;
  - the lines themselves.

  Edit this file to change the words, the voice (`bf_emma`, `bm_george`, `bm_fable`, `am_michael`, `af_heart`, and others) or the pacing. To pace a single line differently, write it as `{"text": ..., "speed": 0.8}`.
- **`src/data.ts`** holds the text on screen: the title, the rulers, their hooks, and the map events. The hooks follow `research_original_kings_review.md`.
- **`scripts/audio.py`** builds the sound:
  - It speaks the narration with Kokoro, an open neural text-to-speech model (Apache 2.0). The model downloads from GitHub into `models/` on first run.
  - It synthesises the score: a tanpura drone, a low pad, hits on the cuts and whooshes into the cards.
  - It ducks the score under the voice.
  - It writes `public/audio/soundtrack.wav` and `src/timeline.json`, which sets every scene's timing.
- **`scripts/copy-assets.mjs`** copies in:
  - the portraits from `../illustrations` (they are JPEGs despite their `.png` names);
  - the fonts;
  - the map, which it builds with `scripts/build-map.mjs`.

## Running it

```bash
pip install -r requirements.txt
npm install
npm run studio      # preview in the browser
npm run render      # writes out/ten-kings-teaser.mp4
```

Both commands rebuild the assets and the soundtrack first. Spoken lines are cached in `build/`, so only changed lines are re-spoken.

Remotion downloads its own headless browser the first time it renders. If that download is blocked, pass one explicitly:

```bash
npm run render -- --browser-executable=/path/to/headless_shell
```

## Licensing

- **Remotion:** free for individuals and for companies of up to three people. Larger companies need a company license (see remotion.dev/license).
- **Kokoro:** Apache 2.0.
- **Fonts:** Cinzel and Cormorant Garamond are under the SIL Open Font License.
