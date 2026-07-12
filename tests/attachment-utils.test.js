const test = require('node:test');
const assert = require('node:assert/strict');
const { canSelectAttachment, normalizeAttachmentType, isYoutubeUrl, resolveDraftAttachmentType } = require('../js/attachment-utils');

test('allows only the active attachment type until it is cleared', () => {
  assert.equal(canSelectAttachment(null, 'image'), true);
  assert.equal(canSelectAttachment('image', 'image'), true);
  assert.equal(canSelectAttachment('image', 'link'), false);
});

test('normalizes supported attachment types', () => {
  assert.equal(normalizeAttachmentType('youtube'), 'youtube');
  assert.equal(normalizeAttachmentType('file'), null);
});

test('detects youtube URLs separately from regular links', () => {
  assert.equal(isYoutubeUrl('https://youtu.be/abc123'), true);
  assert.equal(isYoutubeUrl('https://example.com/video'), false);
});

test('locks a text attachment on the first non-space character and unlocks when cleared', () => {
  assert.equal(resolveDraftAttachmentType(null, 'link', 'h'), 'link');
  assert.equal(resolveDraftAttachmentType('link', 'link', '   '), null);
  assert.equal(resolveDraftAttachmentType('youtube', 'youtube', 'x'), 'youtube');
});
