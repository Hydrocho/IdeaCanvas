const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('teacher dashboard has a desktop sidebar and right top bar', () => {
  assert.match(html, /id="dashboard-sidebar"/);
  assert.match(html, /id="dashboard-topbar"/);
  assert.match(html, /id="public-dashboard-header"/);
});

test('dashboard keeps board and account navigation available on mobile', () => {
  assert.match(html, /data-mobile-tab="boards"/);
  assert.match(html, /data-mobile-tab="accounts"/);
});

test('public shell is hidden completely when the dashboard is shown', () => {
  const pageScript = fs.readFileSync(path.join(__dirname, '..', 'js', 'boards-page.js'), 'utf8');
  assert.match(html, /<main id="public-shell" class="public-shell">/);
  assert.match(pageScript, /elements\.publicShell\?\.classList\.toggle\('hidden', dashboardAllowed\)/);
});

test('dashboard primary action buttons use the approved deep sage color', () => {
  const pageScript = fs.readFileSync(path.join(__dirname, '..', 'js', 'boards-page.js'), 'utf8');
  assert.match(html, /"dashboard-action": "#245F50"/);
  assert.match(html, /id="create-board-btn"[^>]+bg-dashboard-action/);
  assert.match(pageScript, /bg-dashboard-action text-white text-xs font-bold/);
});
