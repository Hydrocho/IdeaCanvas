# Anonymous Note Visibility Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore loaded notes when an anonymous student's empty-space click leaves the active note layout with no visible cards.

**Architecture:** Add a pure visibility predicate in a focused browser/CommonJS utility. The shared canvas click handler will ignore notes and interactive controls, then check the active layout on the next animation frame and rerender only when the predicate reports an invalid display state.

**Tech Stack:** Browser JavaScript, Node.js built-in test runner, DOM APIs

## Global Constraints

- Do not query, insert, update, or delete Supabase data during recovery.
- Do not recover legitimate empty search results.
- Support masonry, aligned-grid, and section views.
- Do not change teacher click behavior.

---

### Task 1: Visibility Predicate

**Files:**
- Create: `js/note-visibility-utils.js`
- Create: `tests/note-visibility-utils.test.js`

**Interfaces:**
- Produces: `shouldRecoverNoteVisibility({ noteCount, visibleCardCount, searchQuery }): boolean`

- [ ] **Step 1: Write the failing test**

Test that recovery is true only for loaded notes with zero visible cards and an empty search query. Cover zero data, visible cards, and a non-empty search query.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/note-visibility-utils.test.js`

Expected: FAIL because `js/note-visibility-utils.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create a UMD-style utility matching the project's existing utility modules. Normalize numeric counts and trim the search query before returning the invalid-state decision.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/note-visibility-utils.test.js`

Expected: PASS.

### Task 2: Anonymous Empty-Click Recovery

**Files:**
- Modify: `board.html:733-734`
- Modify: `js/app.js:1-20,2227-2240`
- Create: `tests/anonymous-note-visibility-recovery.test.js`

**Interfaces:**
- Consumes: `IdeaCanvasNoteVisibilityUtils.shouldRecoverNoteVisibility(...)`
- Produces: `recoverAnonymousNoteVisibility()` and a next-frame empty-canvas click check

- [ ] **Step 1: Write the failing integration test**

Assert that the utility script loads before `app.js`, the app counts visible cards from the active layout, excludes notes and interactive controls from empty clicks, limits recovery to anonymous users, and calls `renderSectionsUI()` plus `renderNotes()` only after the predicate succeeds.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/anonymous-note-visibility-recovery.test.js`

Expected: FAIL because the script and recovery functions are absent.

- [ ] **Step 3: Implement the recovery path**

Load `js/note-visibility-utils.js` before `app.js`. Add helpers that select `#kanban-board` or `#notes-grid`, count cards with client rectangles, ignore interactive click targets, and schedule one animation-frame check. If anonymous notes are loaded, search is empty, and no card is visible, rebuild sections when active and rerender notes once inside a `try/catch`.

- [ ] **Step 4: Run focused and full verification**

Run: `node --check js/app.js; node --test <all test files>; git diff --check`

Expected: syntax succeeds, all tests pass, and diff check has no errors.

- [ ] **Step 5: Verify the real anonymous board**

Open the public board anonymously in masonry, aligned-grid, and section views. Repeated empty-space clicks must preserve visible note cards with no console errors.

