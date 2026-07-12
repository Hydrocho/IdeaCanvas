const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('delegates image lightbox clicks from the shared board canvas', () => {
    const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

    assert.match(app, /const noteContentArea = document\.getElementById\('main-canvas'\);/);
    assert.match(app, /noteContentArea\.addEventListener\('click', \(e\) =>/);
    assert.doesNotMatch(app, /elements\.notesGrid\.addEventListener\('click', \(e\) =>/);
});
