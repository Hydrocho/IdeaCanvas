# Board Settings JSON Single Source Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `settings_json` the sole persistent source for mutable board settings while preserving unknown future settings.

**Architecture:** The client reads a complete JSON document, adds defaults for known keys, and saves patches merged into that document. The database backfills legacy columns to JSON, changes RLS to read its JSON key, then removes legacy columns.

**Tech Stack:** Browser JavaScript, Node.js built-in test runner, Supabase/PostgreSQL JSONB and RLS.

## Global Constraints

- Defaults: `write_enabled`, `comments_enabled`, and `likes_enabled` true; `bg_color` `default`; `sections_enabled` false.
- Unknown JSON keys survive every read-modify-write operation.
- `boards.title` remains the title source.

---

### Task 1: JSON normalization and patch contract

**Files:**
- Modify: `js/board-settings-utils.js`
- Modify: `tests/board-settings-utils.test.js`

**Interfaces:** Produces `normalizeBoardSettings(settings)` with the complete JSON document and known UI settings projected at the top level.

- [ ] Write a failing test whose input has `{ settings_json: { write_enabled: false, future_feature: { mode: 'x' } } }` and asserts the projected boolean plus the intact `future_feature` object.
- [ ] Run `node --test tests/board-settings-utils.test.js` and verify the new test fails.
- [ ] Parse JSON, use legacy fields only as migration fallback, apply missing known defaults into a copied JSON document, and return that complete document as `settings_json`.
- [ ] Run `node --test tests/board-settings-utils.test.js` and verify it passes.

### Task 2: JSON-only read-modify-write API

**Files:**
- Modify: `js/board-settings.js`
- Modify: `tests/board-settings.test.js`

**Interfaces:** Consumes Task 1 normalized data. Produces `saveBoardSettingsToServer(client, currentSettings, patch, now, boardId)` that writes `settings_json` and `updated_at`, plus identity fields on insert.

- [ ] Write a failing save test with an existing unknown JSON key and a `write_enabled` patch; assert the update payload contains both.
- [ ] Run `node --test tests/board-settings.test.js` and verify the new test fails.
- [ ] Merge `currentSettings.settings_json` with the patch before normalizing; remove legacy setting columns and `title` from all persistence payloads.
- [ ] Run `node --test tests/board-settings.test.js` and verify it passes.

### Task 3: Database migration and RLS conversion

**Files:**
- Modify: `supabase/supabase_schema.sql`

**Interfaces:** Consumes legacy settings rows. Produces JSON-backed rows and note/comment write policies that use `COALESCE((settings_json ->> 'write_enabled')::boolean, true)`.

- [ ] Create new installations with `settings_json` only; backfill legacy columns into empty JSON values; replace all `bs.write_enabled` policy references; drop `title`, `write_enabled`, `comments_enabled`, `likes_enabled`, and `bg_color`; notify PostgREST after DDL.
- [ ] Run `rg -n "bs\\.write_enabled" supabase/supabase_schema.sql` and verify no result remains.

### Task 4: Verification and commit

**Files:**
- Modify: `docs/superpowers/plans/2026-07-12-board-settings-json-single-source.md`

- [ ] Run `node --test tests/*.test.js`; expected: all tests pass.
- [ ] Run `git diff --check` and review `git status --short` for only intended implementation files plus the user’s pre-existing `board.html` and `js/app.js` changes.
- [ ] Stage only the implementation files and commit with `feat: use JSON as board settings source`.
