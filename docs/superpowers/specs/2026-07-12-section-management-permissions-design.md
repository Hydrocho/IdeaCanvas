# Section Management Permissions Design

## Goal

Anonymous students may view section names and notes, but only approved teachers and masters may create, rename, or delete sections.

## Design

`canCurrentUserManageBoard()` remains the single client-side authority for section-management UI. `renderSectionsUI()` will render management controls and bind edit events only when that function returns `true`. Student section headers remain readable text without edit affordances.

Every section mutation entry point (`addNewSection`, `updateSectionName`, and `deleteSection`) will also reject unauthorized calls before changing local state or contacting Supabase. This second boundary prevents direct function calls or stale DOM controls from bypassing the UI restriction. Existing Supabase RLS remains the final server-side boundary.

## Error Handling

Unauthorized mutation attempts stop immediately and leave `currentSections`, rendered notes, and the server unchanged. Normal student viewing does not show disruptive alerts because the controls are absent; an alert is reserved for a direct or stale-control invocation.

## Verification

Automated tests will verify that:

- section management controls and edit bindings are conditional on board-management permission;
- all three mutation entry points perform an authorization guard;
- existing teacher and section behavior tests continue to pass.

