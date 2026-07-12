const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('uses dedicated masonry columns instead of CSS multi-columns', () => {
    const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
    const board = fs.readFileSync(path.join(__dirname, '..', 'board.html'), 'utf8');

    assert.match(app, /const masonryUtils = globalThis\.IdeaCanvasMasonryUtils;/);
    assert.match(app, /function createMasonryColumns\(/);
    assert.match(app, /function rebalanceMasonryColumns\(/);
    assert.match(app, /scheduleMasonryRebalance/);
    assert.match(board, /<script src="js\/masonry-utils\.js"><\/script>/);
    assert.match(board, /\.masonry-grid \{\s*display: grid;/);
    assert.doesNotMatch(board, /column-count:/);
});
