const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const board = fs.readFileSync(path.join(__dirname, '..', 'board.html'), 'utf8');

test('renders section management controls only for board managers', () => {
  assert.match(app, /const canManageSections = canCurrentUserManageBoard\(\);/);
  assert.match(app, /if \(canManageSections && titleEl && inputEl\)/);
  assert.match(app, /canManageSections \? `[\s\S]*deleteSection/);
  assert.match(app, /if \(canManageSections\) \{[\s\S]*add-kanban-section-btn/);
});

test('guards every section mutation entry point', () => {
  assert.match(app, /async function addSection\(\) \{\s*if \(!requireSectionManagementPermission\(\)\) return;/);
  assert.match(app, /async function updateSectionName\(sectionId, newName, oldName\) \{\s*if \(!requireSectionManagementPermission\(\)\) return;/);
  assert.match(app, /async function deleteSection\(sectionId\) \{\s*if \(!requireSectionManagementPermission\(\)\) return;/);
});

test('refreshes section controls when authentication changes', () => {
  assert.match(app, /async function refreshAuthState\(sessionUser\) \{[\s\S]*updateAuthUI\(\);\s*renderBoardSettings\(\);\s*renderSectionsUI\(\);/);
});

test('loads the permission fix with a fresh application version', () => {
  assert.match(board, /<script src="js\/app\.js\?v=1\.0\.8"><\/script>/);
});
