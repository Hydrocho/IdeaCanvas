const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

test('js/app.js renderBoardAccessUI() hides title pencil icon and edit hint for non-managers', () => {
  assert.match(appJs, /function renderBoardAccessUI\(\)/);
  assert.match(appJs, /const titleContainer = document\.getElementById\('board-title-container'\);/);
  assert.match(appJs, /titleContainer\.classList\.add\('cursor-pointer', 'group'\);/);
  assert.match(appJs, /titleContainer\.classList\.remove\('cursor-pointer', 'group'\);/);
  assert.match(appJs, /pencilIcon\.classList\.add\('hidden'\);/);
});
