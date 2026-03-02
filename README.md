# BRF Besiktningsschema

A static web application for Swedish housing cooperative (BRF) administrators to create and print apartment inspection schedules. All UI text is in Swedish; this README targets developers.

## Features

- **Building Configuration** -- define building structure (floors, apartments per floor, uniform count option)
- **Inspection Scheduling** -- configure inspection periods, daily time slots, lunch breaks, exclusions, and configurable end-of-day
- **Message Templates** -- create reusable templates with placeholders for personalized apartment letters, locale-aware date formatting
- **Print Output** -- print individual letters or schedule overview as A4 documents via the browser's native print dialog

## Prerequisites

- Node.js 18 or later

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Available Scripts

| Script            | Command              | Description                        |
| ----------------- | -------------------- | ---------------------------------- |
| `npm run dev`     | `vite`               | Start development server with HMR  |
| `npm run build`   | `vite build`         | Production build to `dist/`        |
| `npm run preview` | `vite preview`       | Preview the production build       |
| `npm test`        | `vitest run`         | Run unit tests once                |
| `npm run test:watch` | `vitest`          | Run unit tests in watch mode       |
| `npm run test:e2e` | `playwright test`   | Run E2E tests (Chromium/Firefox/WebKit) |
| `npm run test:e2e:ui` | `playwright test --ui` | Open Playwright UI runner |

## Tech Stack

- **Svelte 5** (`^5.0.0`) -- runes API, compiles to vanilla JS
- **Vite 6** (`^6.0.0`) -- build tool and dev server
- **TypeScript** (`^5.5.0`) -- strict mode
- **Vitest** (`^4.0.0`) -- unit tests with native Vite integration
- **Playwright** (`^1.58.2`) -- end-to-end tests across Chromium, Firefox, and WebKit
- Zero runtime dependencies -- all packages are devDependencies only

## Project Structure

```
src/
  lib/
    components/   # Svelte UI components
    models/       # Domain models and business logic
    services/     # Storage and other services
  __tests__/      # Unit tests
  App.svelte      # Root component
  main.ts         # Entry point
docs/
  adrs/           # Architecture Decision Records
  features/       # Feature packages (stories, specs, design, tasks)
  constraints.adoc
  architecture.adoc
e2e/              # Playwright end-to-end tests
playwright.config.ts
```

## Data Storage

All data is stored in the browser's `localStorage`. No backend, no accounts, no external services. Keys are namespaced with `brf-schedule:` to avoid collisions.

## Testing

Unit tests (229 tests across 8 test files):

```bash
npm test
```

End-to-end tests (105 tests across Chromium, Firefox, and WebKit):

```bash
npm run test:e2e
```

## License

No license file exists yet.
