# Board Settings JSON Single Source Design

## Goal

Store all mutable board feature settings in `public.board_settings.settings_json` so new settings can be added without a schema change. The JSON document is the only setting source of truth.

## Data model

`board_settings` retains only row identity and lifecycle fields: `id`, `board_id`, `settings_json`, and `updated_at`. Board titles remain owned by `boards.title` and are not duplicated in settings.

`settings_json` contains the known settings (`write_enabled`, `comments_enabled`, `likes_enabled`, `bg_color`, and `sections_enabled`) plus arbitrary future keys. Known keys receive defaults when absent. Unknown keys are preserved unchanged.

## Read and write contract

Reading normalizes known keys for the UI while retaining the complete JSON document. Writing treats the caller input as a patch: it merges the existing JSON document with the patch, normalizes known keys, and writes the merged document. A single toggle update therefore cannot overwrite other settings or unknown future keys.

## Migration and authorization

The migration backfills `settings_json` from the legacy columns, changes RLS policies that gate writing to read `settings_json.write_enabled` with a `true` default, then removes the legacy setting columns. Client code no longer writes or reads those columns.

## Verification

Tests cover toggle patches against existing JSON, preservation of unknown keys, defaults for absent known keys, JSON-only write payloads, and the existing read/write behavior. The full Node test suite is run after the changes.
