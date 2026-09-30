# AGENTS.md — agendamento-frontend

Rules for contributors and AI agents working in this repository. Run all commands from the repository root.

> Placeholders marked `TODO` need facts from the repo. Replace or delete them before committing.

## Related repository

The backend is a **separate repository**: `TODO: GitHub URL of agendamento-backend` (NestJS API under `/api`). You cannot read or edit it from here. Do not guess endpoint paths, field names or status codes: use the ones already used in the existing services, or ask. If a task needs a backend change, say so in your summary instead of working around it in the UI. `TODO: link or path to the API endpoint list, if one exists.`

## Source of truth

1. Code and package manifests (`package.json`, lockfile, `vite.config`) win over any prose.
2. Old docs that describe TypeScript (`main.tsx`, `.tsx` files), i18n registries, a module scaffolder, `useListing`, `requestHelper<T>` or `.context.md` files describe a different setup and are obsolete unless the code actually has them. Follow the code and mention the discrepancy in your summary.
3. See `ARCHITECTURE.md` for how the frontend is structured.

## Stack

- React 19 SPA, Vite 8.
- **JavaScript/JSX, not TypeScript.** Do not convert files to TypeScript or rename to `.tsx` opportunistically; a migration, if planned, will be its own task.
- React Router 7, plain CSS, fetch-based HTTP helpers, auth context.
- Folder layout: `src/core/`, `src/modules/`, `src/shared/`.
- Do not add a UI framework, state-management library or API-client library unless the task explicitly requires it.

## Commands

Verify against `package.json`; these are the expected names.

| Task | Command |
| --- | --- |
| Install | `npm install` |
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Tests | `TODO: state the test runner, or "none configured"` |

Before finishing, run lint and build (and tests, if configured).

## Environment

- API base URL and other env vars: `TODO: e.g. VITE_API_URL, dev proxy settings`.
- Never commit `.env` files or secrets.

## Architecture

- Dependencies flow downward: `modules/<feature>` may import from `shared` and `core`; `shared` may import from `core`; `core` and `shared` never import from `modules`. The router (in `core`) is the one deliberate exception, since it wires modules together.
- A module does not import another module. If two features need the same thing, move it to `shared`, or document the exception.
- Pages compose the screen, hooks own state and effects, services own HTTP calls and API-to-UI mapping. Shared components contain no domain rules.
- Use the existing fetch helpers and auth context for all HTTP and session handling. Do not call `fetch` directly from pages or components.
- Promote code to `shared` only when there is real reuse.
- Use `TODO: a small, well-kept module` as the reference when adding a feature.

## UI behavior

- Handle loading, error and empty states for every data fetch, and keep them distinct (an empty list is not a loading list).
- For async code, check that: stale responses cannot overwrite newer data (use `AbortController` or an ignore flag in effects); cancellation on unmount or parameter change is not shown as an error; the UI stays consistent after retry or reload.
- Distinguish `401` (session expired, redirect to login) from `403` (authenticated but not allowed). Never rely on the UI alone for permissions; the backend enforces them.
- Validate form input before sending it, for UX only. The backend is the real validator; show its field errors.
- Preserve basic accessibility: labels on inputs, keyboard access, meaningful button text.
- Dates and times: the backend stores UTC. Show times in `TODO: America/Sao_Paulo`, format explicitly, and never rely on the browser's default zone or build dates from local-time strings.
- User-facing strings: `TODO: language, and whether an i18n mechanism exists.`

## Testing

- `TODO: describe the test setup, or "no test framework is configured; do not add one without being asked. Verify manually and describe how in your summary."`
- When an API contract is involved, confirm the call against the backend's DTOs rather than guessing field names.

## Booking behavior in the UI

- The frontend may pre-check availability for UX, but the backend is the real guard against double booking. Always handle a `409` conflict response gracefully (message plus refreshed availability).
- Cancellation and rescheduling rules: `TODO`. Show the backend's error message when an action is refused.

## Git and safety

- Never run `git commit`, `git push`, `git reset`, `git checkout`, branch switches or bulk deletions without explicit authorization in the current turn.
- Check the workspace state before editing and preserve changes you did not make.
- Never run migrations, seeds or destructive scripts against anything other than the local development database.
- Never publish, deploy or change infrastructure.
- Never commit `.env` files or secrets. Never log tokens, passwords or PII.
- Commit message convention (if asked to write one): `TODO: e.g. Conventional Commits — feat:, fix:, refactor:, test:, docs:, chore:`.

## Workflow

1. **Before editing:** find the file that *decides* the behavior (not just the one that forwards to it) and read one neighboring implementation of the same pattern. Do not explore the whole repo when one page, hook, service or component answers the question.
2. **Editing:** make the smallest change that solves the problem. Reuse existing helpers. Do not create abstractions to save a few lines. Comments explain *why*, never *what*.
3. **After editing:** run the narrowest check first, then lint, build and the wider suite as the impact warrants. If something fails, fix that same slice and re-run. Review your diff for accidental changes.
4. **Report:** what you changed, what you ran and the results, and anything you could not verify.

## Working style

- Keep changes focused. No drive-by refactors, formatting sweeps or dependency bumps.
- Do not add dependencies without a stated reason in the summary.
- Language: `TODO: e.g. code identifiers and commit messages in English; user-facing strings in Brazilian Portuguese.` Keep API field names consistent with the existing ones.
