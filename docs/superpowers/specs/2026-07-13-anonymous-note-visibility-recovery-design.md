# Anonymous Note Visibility Recovery Design

## Goal

Keep already-loaded notes visible when an anonymous student clicks empty board space, without changing note data, search behavior, or teacher controls.

## Evidence and Scope

The issue is transient: refreshing restores the notes, so the Supabase rows remain intact. Direct testing showed that closing the anonymous teacher-login menu does not itself hide the note containers. The failure is therefore treated as an intermittent client display-state violation rather than deletion or an authorization failure.

## Design

Add a small pure visibility predicate that reports an invalid state only when all of the following are true: notes are loaded, the search query is empty, and no rendered note card is visible in the active layout. It must work for masonry, aligned-grid, and section views.

After a click on empty space inside `#main-canvas`, schedule one check on the next animation frame. Ignore clicks originating from notes or interactive controls. If the predicate detects the invalid state, rebuild section containers when necessary and call `renderNotes()` once. Normal clicks and legitimate empty search results must not trigger recovery.

## Error Handling

Recovery is idempotent and limited to one render per empty-space click. It does not query or mutate Supabase. If rendering fails, log the error and leave the data untouched.

## Verification

- Unit-test the visibility predicate for all layouts and search filtering.
- Assert that the shared canvas click handler schedules recovery only for empty-space clicks.
- Verify in the live anonymous board that notes and the active layout remain visible after repeated empty-space clicks.

