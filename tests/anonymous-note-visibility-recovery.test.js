const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const board = fs.readFileSync(path.join(__dirname, '..', 'board.html'), 'utf8');

test('loads note visibility utilities before the application', () => {
  const utilityIndex = board.indexOf('<script src="js/note-visibility-utils.js"></script>');
  const appIndex = board.indexOf('<script src="js/app.js?v=1.0.8"></script>');
  assert.ok(utilityIndex >= 0, 'note visibility utility script must be loaded');
  assert.ok(appIndex > utilityIndex, 'application must load after note visibility utilities');
});

test('recovers anonymous notes only after an empty canvas click', () => {
  assert.match(app, /const noteVisibilityUtils = globalThis\.IdeaCanvasNoteVisibilityUtils;/);
  assert.match(app, /function getActiveNoteSurface\(\)/);
  assert.match(app, /function countVisibleRenderedNotes\(\)/);
  assert.match(app, /function isEmptyCanvasClickTarget\(target\)/);
  assert.match(app, /target\.closest\('\[id\^="note-"\], button, input, textarea, select, a, \[role="button"\]'\)/);
  assert.match(app, /function recoverAnonymousNoteVisibility\(\) \{[\s\S]*if \(currentUser\) return;/);
  assert.match(app, /noteVisibilityUtils\.shouldRecoverNoteVisibility\(\{/);
  assert.match(app, /if \(isSectionViewEnabled\) renderSectionsUI\(\);\s*renderNotes\(\);/);
  assert.match(app, /if \(isEmptyCanvasClickTarget\(e\.target\)\) \{\s*window\.requestAnimationFrame\(recoverAnonymousNoteVisibility\);/);
});
