const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const boardsPage = fs.readFileSync(path.join(__dirname, '..', 'js', 'boards-page.js'), 'utf8');

test('removes static/unconditional user widget appending from init()', () => {
  // Verify that elements.sidebarUserSlot.appendChild(elements.authLoggedIn) is NOT inside init() block statically
  const initBlock = boardsPage.substring(boardsPage.indexOf('async function init()'));
  
  // Checking that the static code block is removed from boards-page.js
  const staticAppendPattern = /if\s*\(elements\.sidebarUserSlot\s*&&\s*elements\.authLoggedIn\)\s*\{\s*elements\.sidebarUserSlot\.appendChild/;
  assert.ok(!staticAppendPattern.test(initBlock), 'Static appending of authLoggedIn to sidebarUserSlot should be removed from init()');
});

test('handles dynamic positioning and styling inside renderAuthState()', () => {
  // Verify that renderAuthState has conditional positioning logic for elements.authLoggedIn
  assert.match(boardsPage, /if\s*\(elements\.authLoggedIn\)/);
  assert.match(boardsPage, /if\s*\(dashboardAllowed\)/);
  assert.match(boardsPage, /elements\.sidebarUserSlot\.appendChild\(elements\.authLoggedIn\)/);
  assert.match(boardsPage, /const\s+headerContainer\s*=\s*elements\.authActions\?\.parentElement/);
  assert.match(boardsPage, /headerContainer\.appendChild\(elements\.authLoggedIn\)/);
  
  // Verify CSS class toggles are present
  assert.match(boardsPage, /elements\.authLoggedIn\.classList\.add\('w-full',\s*'flex-col',\s*'items-stretch'\)/);
  assert.match(boardsPage, /elements\.authLoggedIn\.classList\.remove\('items-center',\s*'gap-3'\)/);
  assert.match(boardsPage, /elements\.authLoggedIn\.classList\.remove\('w-full',\s*'flex-col',\s*'items-stretch'\)/);
  assert.match(boardsPage, /elements\.authLoggedIn\.classList\.add\('items-center',\s*'gap-3'\)/);
});
