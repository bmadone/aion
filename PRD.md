# Aion — Interval Timer PWA

## Problem Statement

Athletes and fitness enthusiasts need a reliable, distraction-free interval timer they can glance at from a distance mid-workout. Existing solutions are either cluttered with ads, require accounts, or have poor mobile UX. There is no simple, installable, offline-capable interval timer that looks great, sounds right, and gets out of the way.

## Solution

Aion is a mobile-first PWA interval timer built with Vite + React. It runs entirely in the browser with no backend. Users configure a workout (work duration, rest duration, intervals per round, rounds, optional rest between rounds) via a simple form, choose from built-in presets, and launch a full-screen timer. Color-coded states, distinct sounds, and a 5-second countdown make it immediately readable from across the room. A confetti animation celebrates workout completion.

## Workout Structure

A workout is organized as **rounds of intervals**:

- **Interval**: one work + one rest cycle (e.g. 40s work / 20s rest)
- **Round (block)**: a fixed number of intervals performed back-to-back (e.g. 4 intervals)
- **Rest between rounds**: a longer rest taken after completing all intervals in a round, before the next round begins

**Example** — 4 intervals × 3 rounds × 90s rest between rounds:
```
Countdown 5-4-3-2-1
[Round 1]  Work 40s → Rest 20s → Work 40s → Rest 20s → Work 40s → Rest 20s → Work 40s → Rest 20s
[Rest between rounds 90s]
[Round 2]  Work 40s → Rest 20s → Work 40s → Rest 20s → Work 40s → Rest 20s → Work 40s → Rest 20s
[Rest between rounds 90s]
[Round 3]  Work 40s → Rest 20s → ...
Complete!
```

## User Stories

1. As a user, I want to open the app on my phone and immediately see a clean form to configure my workout, so I can get started quickly.
2. As a user, I want to set a work duration in seconds, so I can define how long each active interval lasts.
3. As a user, I want to set a rest duration in seconds, so I can define recovery time after each work interval.
4. As a user, I want to set the number of intervals per round, so I can define how many work/rest cycles make up one block.
5. As a user, I want to set the number of rounds, so I can define how many blocks the full workout contains.
6. As a user, I want to optionally set a rest period between rounds, so I can take longer breaks between blocks.
7. As a user, I want to select a preset (Tabata, AMRAP, EMOM, Custom) to pre-fill the form, so I can start common workouts without manual configuration.
8. As a user, I want the default preset to be Custom (blank form), so I can freely configure my own workout.
9. As a user, I want my last-used form values to be remembered across sessions via localStorage, so I don't have to re-enter them every time I open the app.
10. As a user, I want to tap a Start button to begin the workout, so I can launch the timer when ready.
11. As a user, I want a 5-4-3-2-1 countdown before the first interval starts, so I have time to get into position.
12. As a user, I want the timer to take over the full screen when running, so I can focus entirely on the workout.
13. As a user, I want the background to turn red during work intervals, so I can tell at a glance what state I'm in.
14. As a user, I want the background to turn green during rest intervals and rest-between-rounds, so I can immediately recognize recovery time.
15. As a user, I want to see a large, bold countdown timer front-and-center, so I can read it from across the room.
16. As a user, I want to see the current interval label (e.g. "WORK" / "REST") prominently displayed, so I always know what I should be doing.
17. As a user, I want to see my current round and total rounds (e.g. "Round 2 / 3") and my current interval within the round (e.g. "Interval 3 / 4"), so I know exactly how far into the workout I am.
18. As a user, I want to see a "next up" indicator showing the name and duration of the coming interval, so I can mentally prepare.
19. As a user, I want a large, easy-to-tap Pause/Resume button, so I can stop the timer mid-workout with sweaty hands.
20. As a user, I want a Skip button to jump to the next interval, so I can move on early if needed.
21. As a user, I want a Stop/Reset button to end the workout and return to the form, so I can reconfigure or start fresh.
22. As a user, I want the form to retain my previous values when I stop and return, so I don't lose my configuration.
23. As a user, I want a distinct sound to play when a work interval starts, so I get an audio cue without looking at the screen.
24. As a user, I want a distinct, softer sound to play when a rest interval starts, so I know it's time to recover.
25. As a user, I want a celebratory sound to play when the full workout is complete, so I know I'm done.
26. As a user, I want a confetti animation to play when the workout completes, so the finish feels rewarding.
27. As a user, I want a mute toggle to disable all sounds, so I can use the app in quiet environments.
28. As a user, I want my mute preference to persist across sessions, so I don't have to toggle it every time.
29. As a user, I want to install the app to my phone's home screen as a PWA, so I can open it like a native app.
30. As a user, I want the app and all sounds to work fully offline, so I can use it at the gym without reliable data.
31. As a user, I want a dark/light mode toggle in the nav, so I can choose the display that works best for my environment.
32. As a user, I want the app to default to my device's color scheme preference, so it looks right without manual configuration.
33. As a user, I want the UI to be fully accessible with proper ARIA labels and keyboard navigation, so the app works for everyone.
34. As a user, I want large touch targets on all controls during the active timer, so I can interact reliably with sweaty or gloved hands.

## Implementation Decisions

### WorkoutConfig Model

```ts
interface WorkoutConfig {
  workDuration: number       // seconds per work interval
  restDuration: number       // seconds of rest after each work interval
  intervals: number          // work/rest cycles per round (block)
  rounds: number             // number of rounds (blocks)
  restBetweenRounds: number  // seconds of rest between rounds (0 = none)
}
```

### Modules

- **PresetSelector** — displays preset buttons (Tabata, AMRAP, EMOM, Custom); selecting one pre-fills the WorkoutForm with preset values.
- **WorkoutForm** — controlled form for work duration, rest duration, intervals per round, rounds, and optional rest-between-rounds; validates inputs; persists values to localStorage on change.
- **TimerEngine** — pure logic module (no UI) that manages interval and round sequencing, state transitions; driven by `requestAnimationFrame`; fully testable in isolation.
- **TimerDisplay** — full-screen view rendered during an active workout; reads state from TimerEngine; renders countdown, interval label, round/interval indicators, next-up, and color-coded background.
- **Controls** — pause/resume (primary), skip (secondary), stop/reset (secondary); large touch targets; shown only during active timer.
- **SoundManager** — synthesizes audio via Web Audio API; respects mute state; works fully offline (no external assets required).
- **CountdownOverlay** — renders the 5-4-3-2-1 → GO sequence before the first interval; blocks timer start until complete.
- **ConfettiEffect** — triggered on workout completion; plays alongside the completion sound.
- **ThemeProvider** — reads `prefers-color-scheme`, applies dark/light CSS variables; persists user toggle to localStorage.
- **NavBar** — minimal top bar with app name, dark/light toggle, and mute toggle.

### Preset Definitions

| Preset  | Work | Rest | Intervals | Rounds | Rest Between Rounds |
|---------|------|------|-----------|--------|---------------------|
| Tabata  | 20s  | 10s  | 8         | 1      | none                |
| AMRAP   | 20min| 0s   | 1         | 1      | none                |
| EMOM    | 60s  | 0s   | 10        | 1      | none                |
| Custom  | —    | —    | —         | —      | —                   |

### State Machine (TimerEngine)

```
idle → countdown →
  [for each round 1..R]:
    [for each interval 1..N]:
      work → rest (if restDuration > 0)
    [if more rounds]: rest-between-rounds
→ complete
```

States: `idle` | `countdown` | `work` | `rest` | `rest-between-rounds` | `complete`

### TimerState Model

```ts
interface TimerState {
  phase: Phase
  currentRound: number     // 1-based
  totalRounds: number
  currentInterval: number  // 1-based, within the current round
  totalIntervals: number
  timeRemaining: number    // seconds
}
```

### Persistence

- `localStorage` key `aion:lastWorkout` — last form values (JSON)
- `localStorage` key `aion:muted` — boolean
- `localStorage` key `aion:theme` — `"dark"` | `"light"`

### PWA

- Vite PWA plugin (`vite-plugin-pwa`) with `generateSW` strategy
- App installable via browser native prompt; runs fully offline

### Audio

- Synthesized tones via Web Audio API — no external files needed, works offline
- `playWork()` — sharp ascending tone
- `playRest()` — descending tone
- `playComplete()` — celebratory triple-tone sequence

### Tech Stack

- Vite + React + TypeScript
- CSS custom properties for theming (no CSS-in-JS)
- `vite-plugin-pwa` for PWA/service worker
- `canvas-confetti` for the completion animation
- Deployed to Vercel

## Testing Decisions

Good tests verify external behavior — what the module does — not how it does it internally.

### Modules to Test

- **TimerEngine** — test the full sequence of state transitions: countdown → work → rest → intervals → rounds → rest-between-rounds → complete. Test pause/resume, skip, and stop. Test edge cases: 0s rest, 1 interval/1 round (AMRAP), multi-round with rest-between-rounds.

### Out of Scope for Testing

- TimerDisplay, Controls, ConfettiEffect, SoundManager — thin UI/side-effect wrappers validated manually.

## Out of Scope

- User accounts or cloud sync
- Workout history or statistics
- Arbitrary interval sequencing beyond the rounds-of-intervals model
- Custom sound uploads or volume control
- Custom preset creation or saving
- A custom "Add to Home Screen" install banner
- Any backend or server-side logic

## Further Notes

- The app name **Aion** comes from the Greek concept of cyclical, eternal time — fitting for a repeating interval timer.
- All touch targets during the active timer must be at minimum 48×48px per WCAG guidelines.
- The color red (work) and green (rest) should have sufficient contrast against white text to meet WCAG AA at the large text sizes used.
- The countdown (5-4-3-2-1) is purely visual — no audio beeps during countdown.
