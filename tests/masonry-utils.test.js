const test = require('node:test');
const assert = require('node:assert/strict');
const { getMasonryColumnCount, assignItemsToShortestColumns } = require('../js/masonry-utils');

test('uses the same responsive column counts as the board layout', () => {
    assert.equal(getMasonryColumnCount(500), 1);
    assert.equal(getMasonryColumnCount(800), 2);
    assert.equal(getMasonryColumnCount(1100), 3);
    assert.equal(getMasonryColumnCount(1400), 4);
});

test('places each card in the currently shortest masonry column', () => {
    assert.deepEqual(assignItemsToShortestColumns([300, 120, 220, 180, 160], 3, 20), [
        [0],
        [1, 3],
        [2, 4]
    ]);
});
