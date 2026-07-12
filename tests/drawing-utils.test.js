const test = require('node:test');
const assert = require('node:assert/strict');
const { flattenCanvasOnWhiteBackground } = require('../js/drawing-utils');

test('flattens a drawing canvas onto an opaque white background before export', () => {
    const calls = [];
    const drawingCanvas = { width: 400, height: 300 };
    const whiteCanvas = { width: 0, height: 0 };
    const whiteContext = {
        fillStyle: '',
        fillRect: (...args) => calls.push(['fillRect', ...args]),
        drawImage: (...args) => calls.push(['drawImage', ...args])
    };
    const documentRef = {
        createElement: (tagName) => {
            assert.equal(tagName, 'canvas');
            return whiteCanvas;
        }
    };
    whiteCanvas.getContext = () => whiteContext;
    whiteCanvas.toDataURL = () => 'data:image/png;base64,white-background';

    const result = flattenCanvasOnWhiteBackground(drawingCanvas, documentRef);

    assert.equal(result, 'data:image/png;base64,white-background');
    assert.equal(whiteCanvas.width, 400);
    assert.equal(whiteCanvas.height, 300);
    assert.equal(whiteContext.fillStyle, '#ffffff');
    assert.deepEqual(calls, [
        ['fillRect', 0, 0, 400, 300],
        ['drawImage', drawingCanvas, 0, 0]
    ]);
});
