# Board Note Sort Design

## Goal

Let a board manager choose one shared note sort mode. Every viewer sees the same section-local order without persisting per-note positions.

## Setting

Store `note_sort` in `board_settings.settings_json`. Allowed values are `newest`, `oldest`, `likes_desc`, and `comments_desc`; the default is `newest`.

## Behavior

The selected mode is applied independently within each section. Sections retain their configured order. For like and comment modes, ties are broken by newer `created_at` first. The UI computes the order from existing note, like, and comment data on every render, so no `sort_order` column or concurrent reorder synchronization is required.

## UI and verification

The board settings panel exposes a manager-only selector. Tests cover each comparator, the tie-breaker, default normalization, and preservation of the setting through JSON patch saves.
