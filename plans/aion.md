# Plan: Aion Interval Timer PWA

> Source PRD: PRD.md

## Architectural decisions

- **Single page**: No routing — one page, two views (form view / timer view) toggled by app state
- **Key models**:
  - `WorkoutConfig` — `{ workDuration: number, restDuration: number, rounds: number, restBetweenRounds: number }`
  - `TimerState` — `{ phase: 'idle' | 'countdown' | 'work' | 'rest' | 'rest-between-rounds' | 'complete', currentRound: number, totalRounds: number, timeRemaining: number }`
- **Persistence keys**: `aion:lastWorkout` (JSON), `aion:muted` (boolean), `aion:theme` (`"dark" | "light" | "system"`)
- **Audio**: All sounds bundled as static `.mp3` assets — `work-start.mp3`, `rest-start.mp3`, `complete.mp3` — never fetched from external URLs
- **Theming**: CSS custom properties only, no CSS-in-JS. Theme applied via `data-theme` attribute on `<html>`
- **Presets**:
  - Tabata: 20s work / 10s rest / 8 rounds / no rest between rounds
  - AMRAP: 1200s work / 0s rest / 1 round / no rest between rounds
  - EMOM: 60s work / 0s rest / 10 rounds / no rest between rounds
  - Custom: blank

---

## Phase 1: Project foundation & theming

**User stories**: 30, 31

### What to build

Strip the Vite scaffold to a clean shell. Set up CSS custom properties for the full color palette (background, text, work red, rest green, surface colors) in both dark and light variants. Build ThemeProvider that reads `prefers-color-scheme` on first load, applies the correct theme, and exposes a toggle. Persist the user's choice to `aion:theme`. Build a minimal NavBar that shows the app name and the theme toggle icon button. The toggle should switch themes instantly with no flash on load.

### Acceptance criteria

- [ ] App loads with dark theme on a device set to dark mode, light theme on light mode
- [ ] Theme toggle in NavBar switches between dark and light instantly
- [ ] Theme preference persists across page reloads
- [ ] No flash of wrong theme on load
- [ ] CSS variables are used for all colors — no hardcoded hex values in component styles

---

## Phase 2: Workout form + presets + persistence

**User stories**: 1, 2, 3, 4, 5, 6, 7, 8, 21

### What to build

Build the WorkoutForm with four fields: work duration, rest duration, rounds, and optional rest between rounds. Add a PresetSelector above the form showing four preset buttons (Custom selected by default). Selecting a preset pre-fills the form with preset values. Form values are written to `aion:lastWorkout` in localStorage on every change. On load, form is initialised from localStorage if present, otherwise empty (Custom). Add a Start button at the bottom — it validates the form and, if valid, signals readiness to launch the timer (timer itself built in Phase 3). Form shows inline validation errors for invalid inputs.

### Acceptance criteria

- [ ] Form renders with work duration, rest duration, rounds, and optional rest-between-rounds fields
- [ ] Custom preset is selected by default with a blank form
- [ ] Selecting Tabata, AMRAP, or EMOM pre-fills the form with correct values
- [ ] Selecting Custom clears the form
- [ ] Form values persist in localStorage on change and are restored on reload
- [ ] Start button is disabled / shows errors when required fields are missing or invalid (negative durations, zero rounds)
- [ ] Form is fully keyboard-navigable
- [ ] All fields and the preset selector have correct ARIA labels

---

## Phase 3: Timer engine + full-screen display

**User stories**: 9, 10, 11, 12, 13, 14, 15, 16, 17

### What to build

Build TimerEngine as a pure logic module (no UI) that accepts a `WorkoutConfig` and drives the state machine: `idle → countdown → work → rest → rest-between-rounds → work → … → complete`. Expose pause, resume, skip, and stop controls. Drive ticks with `requestAnimationFrame` or `setInterval` at 100ms resolution for smooth countdown display.

Build CountdownOverlay that renders the 5-4-3-2-1 → GO sequence (visual only, no sound) before the first interval. Build TimerDisplay as a full-screen view that takes over the screen when the timer starts, showing: large countdown number, interval label (WORK / REST), round indicator (e.g. Round 2 / 5), and a next-up strip at the bottom. Background color transitions to red for work and green for rest. Stopping returns the user to the form with their config intact.

Write unit tests for TimerEngine covering: full sequence of state transitions, pause/resume, skip, stop, edge cases (0s rest, 1 round, AMRAP single interval).

### Acceptance criteria

- [ ] Tapping Start launches the 5-4-3-2-1 → GO countdown overlay
- [ ] After countdown, timer enters first work interval; form view is replaced by full-screen timer
- [ ] Background is red during work, green during rest
- [ ] Large countdown number counts down correctly
- [ ] Interval label shows "WORK" or "REST"
- [ ] Round indicator shows correct current / total rounds
- [ ] Next-up strip shows the correct upcoming interval name and duration
- [ ] Timer transitions automatically through all intervals and rounds to complete state
- [ ] Stop/Reset returns to form view with previous config values intact
- [ ] TimerEngine unit tests pass for all state transitions and edge cases

---

## Phase 4: Controls + sounds + completion

**User stories**: 18, 19, 20, 22, 23, 24, 25, 26, 27

### What to build

Add the three controls to TimerDisplay: Pause/Resume (large primary button), Skip (secondary), Stop/Reset (secondary). All buttons must be at least 48×48px touch targets.

Build SoundManager that preloads the three bundled audio files and exposes `playWork()`, `playRest()`, `playComplete()`. SoundManager reads mute state from `aion:muted` in localStorage. Add a mute toggle icon button to NavBar; toggling it updates localStorage and SoundManager immediately. Wire SoundManager into TimerEngine state transitions: play work sound on entering work phase, rest sound on entering rest phase, complete sound on entering complete state.

Build ConfettiEffect that triggers `canvas-confetti` when the timer reaches the complete state, in sync with the completion sound.

### Acceptance criteria

- [ ] Pause button pauses the countdown; Resume resumes from where it stopped
- [ ] Skip advances to the next interval immediately
- [ ] Stop/Reset ends the session and returns to the form
- [ ] Work-start sound plays each time a work interval begins
- [ ] Rest-start sound plays each time a rest interval begins
- [ ] Completion sound plays when the final interval ends
- [ ] Confetti animation fires on workout completion
- [ ] Mute toggle in NavBar silences all sounds
- [ ] Mute preference persists across reloads
- [ ] All control buttons meet 48×48px minimum touch target size

---

## Phase 5: PWA + accessibility + polish

**User stories**: 28, 29, 32, 33

### What to build

Install and configure `vite-plugin-pwa` with `generateSW` strategy. Configure the precache manifest to include all static assets — HTML, JS, CSS, fonts, and crucially all three `.mp3` audio files. Add a `manifest.webmanifest` with app name, icons, theme color, and `display: standalone`. Verify the app is installable via the browser's native install prompt.

Audit every interactive element for ARIA labels, roles, and keyboard accessibility. Ensure focus is managed correctly when switching between form view and timer view (focus should move to the timer on start, return to the form on stop). Test with a screen reader. Verify all touch targets are ≥48×48px. Add a Vercel `vercel.json` if any config is needed for single-page app routing (likely not needed for a single-page app with no routes, but confirm).

### Acceptance criteria

- [ ] App can be installed to home screen via browser native prompt on iOS and Android
- [ ] App loads and runs fully offline after first visit, including all sounds
- [ ] Lighthouse PWA audit passes (installable + offline)
- [ ] All interactive elements have appropriate ARIA labels
- [ ] Keyboard navigation works correctly throughout the app
- [ ] Focus moves to the timer display when the timer starts, returns to form when stopped
- [ ] All timer control buttons are ≥48×48px
- [ ] App deploys successfully to Vercel and works in production
