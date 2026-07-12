# Dashboard Action Color Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dashboard's brown primary action buttons with the approved deep sage `#245F50`.

**Architecture:** Add one semantic Tailwind color token for dashboard actions and consume it in the two approved button locations. Keep all other primary and secondary colors unchanged.

**Tech Stack:** HTML, Tailwind CDN configuration, vanilla JavaScript templates, Node test runner

## Global Constraints

- Apply `#245F50` only to the `새 보드` and all-board-card `열기` buttons.
- Keep white button text and icons.
- Preserve existing sizing, radius, hover, and disabled styling.
- Do not change sidebar, toggle, recent-board link, or board-page colors.

---

### Task 1: Dashboard action color

**Files:**
- Modify: `index.html`
- Modify: `js/boards-page.js`
- Modify: `tests/dashboard-layout.test.js`

**Interfaces:**
- Consumes: Tailwind CDN `theme.extend.colors`
- Produces: `dashboard-action` utility color with value `#245F50`

- [ ] **Step 1: Write the failing test**

Add assertions that `index.html` defines `"dashboard-action": "#245F50"`, the create button uses `bg-dashboard-action`, and the board-card template uses the same class.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/dashboard-layout.test.js`

Expected: FAIL because the token and utility classes do not exist.

- [ ] **Step 3: Write minimal implementation**

Define `"dashboard-action": "#245F50"` in Tailwind colors. Replace `bg-secondary` with `bg-dashboard-action` only on `#create-board-btn` and the all-board-card open anchor.

- [ ] **Step 4: Run verification**

Run: `node --check js/boards-page.js`

Run: `node --test tests/*.test.js`

Run: `git diff --check`

Expected: JavaScript syntax check succeeds, all tests pass, and no whitespace errors are reported.
