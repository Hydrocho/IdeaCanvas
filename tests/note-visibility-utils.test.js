const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const modulePath = path.join(__dirname, '..', 'js', 'note-visibility-utils.js');

test('recovers only when loaded notes have no visible cards and search is empty', () => {
  assert.ok(fs.existsSync(modulePath), 'note visibility utility must exist');
  const { shouldRecoverNoteVisibility } = require(modulePath);

  assert.equal(shouldRecoverNoteVisibility({ noteCount: 3, visibleCardCount: 0, searchQuery: '' }), true);
  assert.equal(shouldRecoverNoteVisibility({ noteCount: 0, visibleCardCount: 0, searchQuery: '' }), false);
  assert.equal(shouldRecoverNoteVisibility({ noteCount: 3, visibleCardCount: 1, searchQuery: '' }), false);
  assert.equal(shouldRecoverNoteVisibility({ noteCount: 3, visibleCardCount: 0, searchQuery: 'science' }), false);
  assert.equal(shouldRecoverNoteVisibility({ noteCount: 3, visibleCardCount: 0, searchQuery: '   ' }), true);
});

test('selects the shared grid for both flat layouts and kanban for section view', () => {
  const { getActiveNoteSurfaceId } = require(modulePath);
  assert.equal(getActiveNoteSurfaceId(false), 'notes-grid');
  assert.equal(getActiveNoteSurfaceId(true), 'kanban-board');
});
