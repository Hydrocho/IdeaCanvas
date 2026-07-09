# Auth and Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement real-email teacher/master authentication, guest writing controls, and SQL/RLS scaffolding for Idea Canvas.

**Architecture:** Add small testable JavaScript helpers for profile/permission logic, then wire them into the existing static pages. Store the database schema and RLS policy SQL in `supabase/supabase_schema.sql` so the deployment path remains copy/paste friendly for Supabase SQL Editor.

**Tech Stack:** Plain HTML, vanilla JavaScript, Supabase JS v2 CDN, PostgreSQL RLS SQL, Node built-in test runner.

## Global Constraints

- Student accounts are not created.
- Teachers and masters use real email/password Supabase Auth.
- The board setting is a single `글쓰기 기능 ON/OFF` toggle stored as `board_settings.write_enabled`.
- Approved teachers and masters can write regardless of `write_enabled`.
- Guests can write only when `write_enabled = true` and author name is present.
- Edge Functions are not required for the first implementation.
- Do not expose `service_role`, JWT secret, database password, or real user password lists in frontend code.

---

### Task 1: Permission Helpers

**Files:**
- Create: `js/auth.js`
- Test: `tests/auth.test.js`

**Interfaces:**
- Produces: `normalizeProfile(profile)`, `isApprovedTeacher(profile)`, `isMaster(profile)`, `canCreateBoard(profile)`, `canWriteToBoard(profile, settings)`, `getDisplayName(profile, user)`.

- [ ] Add failing tests covering guest writing, pending teacher, approved teacher, master, and display name fallback.
- [ ] Implement the helper functions in a browser/CommonJS compatible module.
- [ ] Run `node --test tests/auth.test.js`.

### Task 2: Board Settings Migration

**Files:**
- Modify: `js/board-settings-utils.js`
- Modify: `js/board-settings.js`
- Test: `tests/board-settings-utils.test.js`
- Test: `tests/board-settings.test.js`

**Interfaces:**
- Replace `auth_write` with `write_enabled`.
- Keep backward compatibility when reading old `auth_write` rows.

- [ ] Update tests to expect `write_enabled`.
- [ ] Verify tests fail before implementation.
- [ ] Normalize old rows using `write_enabled = !auth_write` when `write_enabled` is missing.
- [ ] Save `write_enabled` to Supabase.
- [ ] Run board settings tests.

### Task 3: SQL Schema and RLS

**Files:**
- Modify: `supabase/supabase_schema.sql`

**Interfaces:**
- Creates `public.profiles`.
- Adds `write_enabled` to `public.board_settings`.
- Adds authenticated ownership columns needed for RLS compatibility.

- [ ] Replace RLS disable statements with RLS enable statements.
- [ ] Add helper functions for `is_teacher_or_master`, `is_master`, and primary-master protection.
- [ ] Add policies for guest read/write, teacher board creation, profile self read, and master profile management.
- [ ] Keep `supabase_realtime` publication creation.

### Task 4: Dashboard Auth and Account Management

**Files:**
- Modify: `index.html`
- Modify: `js/boards-page.js`

**Interfaces:**
- Uses `IdeaCanvasAuth` helpers.
- Loads current profile from `profiles`.
- Shows board/account tabs.
- Shows account management only to masters.

- [ ] Add email/password/name auth controls.
- [ ] Add password recovery control.
- [ ] Hide new board button unless `canCreateBoard(profile)`.
- [ ] Add account tab with pending/approved teacher lists for masters.
- [ ] Wire approve teacher, grant master, revoke non-primary master through RLS-protected profile updates.

### Task 5: Board Screen Auth and Writing Toggle

**Files:**
- Modify: `board.html`
- Modify: `js/app.js`

**Interfaces:**
- Uses `IdeaCanvasAuth` helpers.
- Replaces `auth_write` UI with `write_enabled`.
- Enforces write access before opening note modal and before submit.

- [ ] Update settings panel labels to real email login and `글쓰기 기능`.
- [ ] Require guest author name when writing as guest.
- [ ] Set teacher/master author name from profile display name.
- [ ] Add password recovery button.
- [ ] Keep existing note/comment behavior compatible with guest local `author_id`.

### Task 6: Verification

**Files:**
- All changed files.

- [ ] Run `node --test tests/*.test.js`.
- [ ] Run a local static server and inspect dashboard/board load if browser access permits.
- [ ] Report remaining Supabase dashboard setup steps.
