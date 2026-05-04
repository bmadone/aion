# Aion — Interval Timer

> Greek: *aion* (αἰών) — cyclical, eternal time.

<!-- demo gif -->

A free interval timer that gets out of the way. No ads, no sign-up, no bloat — just open it and train.

## Why

Every interval timer app I tried was either buried in ads, required an account, or had an interface that took longer to configure than the workout itself. I wanted something that opens instantly, looks good from across the room, and works at the gym without Wi-Fi.

Aion is that app.

## What it does

Configure a workout — work duration, rest, intervals per round, rounds, rest between rounds — hit Start, and get out of the way. The screen turns **red** when you work and **green** when you rest. A big countdown tells you how much time is left. Audio cues mean you don't have to watch the screen at all.

Built-in presets cover the most common formats:

| Preset | Work | Rest | Intervals | Rounds |
|--------|------|------|-----------|--------|
| Tabata | 20s | 10s | 8 | 1 |
| EMOM | 60s | — | 10 | 1 |
| AMRAP | 20 min | — | 1 | 1 |
| Custom | anything | anything | anything | anything |

Your last settings are remembered, so reopening the app picks up where you left off.

## Other details

- Installs to your home screen as a PWA and works fully offline
- Dark and light mode, follows your system preference
- Confetti when you finish (earned it)

## Development

```bash
npm install
npm run dev
npm run test
npm run build
```

Built with Vite + React + TypeScript. Deployed to Vercel.
