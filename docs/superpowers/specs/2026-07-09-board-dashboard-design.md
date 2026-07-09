# Board Dashboard Design

## Goal

Refresh the board dashboard into a quiet Idea Canvas workspace focused on board titles and actions.

## Decisions

- Use `Idea Canvas` as the only main title.
- Do not add a welcome hero, marketing copy, statistics cards, memo counts, section counts, or recent activity.
- Keep Supabase connection feedback as a small status line.
- Add a compact search toolbar so the page feels useful without becoming busy.
- Make board cards more substantial with a subtle top color accent, stronger title treatment, and clear actions.
- Hide board IDs from the normal card view.
- Keep actions title-focused: open, manage, rename, delete.
- Improve the empty state with a centered icon, short message, and create action.

## Files

- `index.html`: update the dashboard layout, title, toolbar, and empty-state target structure.
- `js/boards.js`: add a small board filtering helper for search.
- `js/boards-page.js`: render filtered cards and wire search interactions.
- `tests/boards.test.js`: cover the search helper.

## Constraints

- No new dependencies.
- Keep the current Tailwind CDN setup.
- Keep Supabase API calls unchanged.
- Preserve the existing board creation, rename, delete, and navigation behavior.
- Use Korean user-facing text where the dashboard already uses Korean copy.
