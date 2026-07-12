# Section Management Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent anonymous students from creating, renaming, or deleting board sections while preserving read-only section viewing.

**Architecture:** Keep `canCurrentUserManageBoard()` as the shared client authorization decision. Apply it both while rendering section controls and at every section mutation entry point, while Supabase RLS remains the server-side boundary.

**Tech Stack:** Browser JavaScript, Node.js built-in test runner, Supabase RLS

## Global Constraints

- Anonymous students may read section names and notes.
- Only approved teachers and masters may create, rename, or delete sections.
- Unauthorized attempts must not mutate local state or contact Supabase.

---

### Task 1: Section Management Authorization

**Files:**
- Modify: `js/app.js:793-1028`
- Create: `tests/section-management-permissions.test.js`

**Interfaces:**
- Consumes: `canCurrentUserManageBoard(): boolean`
- Produces: permission-gated `renderSectionsUI()`, `addNewSection()`, `updateSectionName()`, and `deleteSection()` behavior

- [ ] **Step 1: Write the failing test**

Add source-level regression assertions that require a `canManageSections` render decision, conditional management markup/event binding, and `if (!canCurrentUserManageBoard()) return` guards in all three mutation functions.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/section-management-permissions.test.js`

Expected: FAIL because section markup, event bindings, and mutation functions are currently unconditional.

- [ ] **Step 3: Write minimal implementation**

In `renderSectionsUI()`, compute `const canManageSections = canCurrentUserManageBoard()`. Render edit cursor, add/delete buttons, and the add-section card only when it is true; bind double-click title editing only in that branch. Add an authorization helper that alerts on a direct unauthorized call, and return before any local or remote mutation in `addNewSection()`, `updateSectionName()`, and `deleteSection()`.

- [ ] **Step 4: Run focused and full verification**

Run: `node --test tests/section-management-permissions.test.js`

Expected: PASS.

Run: `node --check js/app.js; node --test tests/*.test.js; git diff --check`

Expected: syntax check succeeds, all tests pass, and diff check reports no errors.

- [ ] **Step 5: Review diff**

Confirm only section-management UI and mutation authorization changed, with no changes to student note viewing or teacher workflows.

