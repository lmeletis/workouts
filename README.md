# Train — strength & mobility tracker

An offline-first iPad web app (PWA) for a 12-week hypertrophy + hip-mobility program with
beach conditioning and sauna / cold-lake recovery. Data stays on the device (localStorage);
use Profile → Export backup to save a copy.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173 (also on your LAN)
npm test           # program + progression engine tests
npm run build      # static site in dist/
```

## Code map

- `src/lib/program.ts` — schedule (3/4/5 lifting days), 12-week phases, sets/reps per block, starting weights, warm-ups, plate math
- `src/lib/progression.ts` — turns post-workout feedback into next-session weights and reps
- `src/lib/library.ts` — exercises, swaps, mobility moves and flows
- `src/screens/*` — Today, Workout logger, Feedback, Mobility player, Program, Outdoor + recovery, Progress, Profile

## Install on iPad

Run `npm run deploy` to publish to GitHub Pages, open the site in Safari,
then Share → Add to Home Screen. It works offline after the first load.
