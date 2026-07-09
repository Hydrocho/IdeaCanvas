# Board Dashboard Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the board dashboard into a quiet Idea Canvas workspace focused on board titles and actions.

**Architecture:** Keep the dashboard as static HTML plus the existing `boards-page.js` renderer. Add one small pure helper in `boards.js` for board search so filtering is testable without browser DOM setup.

**Tech Stack:** Plain HTML, Tailwind CDN classes, vanilla JavaScript, Node built-in test runner.

## Global Constraints

- No new dependencies.
- Keep the current Tailwind CDN setup.
- Keep Supabase API calls unchanged.
- Preserve the existing board creation, rename, delete, and navigation behavior.
- Use Korean user-facing text where the dashboard already uses Korean copy.
- Do not add a welcome hero, marketing copy, statistics cards, memo counts, section counts, or recent activity.

---

### Task 1: Add Board Search Helper

**Files:**
- Modify: `js/boards.js`
- Test: `tests/boards.test.js`

**Interfaces:**
- Consumes: `normalizeBoards(boards: Array<object>): Array<object>`
- Produces: `filterBoardsByQuery(boards: Array<object>, query: string): Array<object>`

- [ ] **Step 1: Write the failing test**

Add this import in `tests/boards.test.js`:

```js
filterBoardsByQuery,
```

Add this test:

```js
test('filters boards by title query without mutating the list', () => {
  const source = [
    { id: '1', title: 'Design Sprint' },
    { id: '2', title: 'Class Ideas' },
    { id: '3', title: 'Retrospective' },
  ];

  const result = filterBoardsByQuery(source, ' idea ');

  assert.deepEqual(result.map(board => board.id), ['2']);
  assert.equal(source.length, 3);
  assert.deepEqual(filterBoardsByQuery(source, ''), source);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/boards.test.js`

Expected: FAIL because `filterBoardsByQuery` is not a function.

- [ ] **Step 3: Write minimal implementation**

Add this function to `js/boards.js`:

```js
function filterBoardsByQuery(boards, query) {
    const normalizedQuery = typeof query === 'string' ? query.trim().toLowerCase() : '';
    if (!normalizedQuery) return boards;
    return normalizeBoards(boards).filter(board => board.title.toLowerCase().includes(normalizedQuery));
}
```

Export it in the returned object:

```js
filterBoardsByQuery,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/boards.test.js`

Expected: PASS.

### Task 2: Refresh Dashboard Markup

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: Existing element IDs used by `boards-page.js`.
- Produces: New `board-search-input` element for client-side filtering.

- [ ] **Step 1: Update layout**

In `index.html`, change the title to `Idea Canvas`, keep `boards-connection-detail`, keep `create-board-btn`, and add:

```html
<input id="board-search-input" type="search" placeholder="보드 검색" ...>
```

- [ ] **Step 2: Preserve script order**

Keep scripts in this order: Supabase library, `supabase_config.js`, `supabase-client.js`, `boards.js`, `boards-page.js`.

- [ ] **Step 3: Manually inspect HTML**

Run: `Get-Content -LiteralPath 'C:\MYCLAUDE_PROJECT\IdeaCanvas\index.html'`

Expected: `Idea Canvas`, `board-search-input`, `boards-list`, and `create-board-btn` are present.

### Task 3: Render Filtered Cards and Empty State

**Files:**
- Modify: `js/boards-page.js`

**Interfaces:**
- Consumes: `boardsApi.filterBoardsByQuery(boards, searchQuery)`.
- Produces: Card rendering that hides board IDs and keeps open/manage/rename/delete actions.

- [ ] **Step 1: Track search input**

Add `searchInput: document.getElementById('board-search-input')` to `elements`, and add `let searchQuery = '';`.

- [ ] **Step 2: Render filtered boards**

Inside `renderBoards`, compute:

```js
const visibleBoards = boardsApi.filterBoardsByQuery(boards, searchQuery);
```

Use `visibleBoards` for the empty check and card loop.

- [ ] **Step 3: Improve empty state**

Render a centered empty state with concise copy and a `data-action="create-board"` button when no filtered boards exist.

- [ ] **Step 4: Improve cards**

Render cards with a subtle top accent line, title input, and actions. Do not render the board ID.

- [ ] **Step 5: Wire interactions**

On search input `input`, update `searchQuery` and call `renderBoards()`. In `handleListClick`, support `data-action="create-board"` by calling `createBoard()`.

- [ ] **Step 6: Run tests**

Run: `node --test tests/*.test.js`

Expected: PASS.
