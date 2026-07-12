const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('renders sketch thumbnails in a fixed-height contain frame without clipping', () => {
    const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
    const board = fs.readFileSync(path.join(__dirname, '..', 'board.html'), 'utf8');

    assert.match(app, /rounded-xl overflow-hidden h-48 mb-3 bg-white/);
    assert.doesNotMatch(app, /rounded-xl overflow-hidden max-h-48 mb-3 bg-white/);
    assert.match(app, /clickable-note-img note-drawing-img/);
    assert.match(app, /img\.classList\.toggle\('bg-white', isDrawing\)/);
    assert.match(app, /openImageLightbox\(src, title, clickedImg\.classList\.contains\('note-drawing-img'\)\)/);
    assert.match(board, /<script src="js\/drawing-utils\.js"><\/script>/);
    assert.match(board, /<script src="js\/app\.js\?v=1\.0\.6"><\/script>/);
});
