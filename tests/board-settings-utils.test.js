const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_BOARD_SETTINGS,
  normalizeBoardSettings,
} = require('../js/board-settings-utils');

test('uses default board settings when server data is missing', () => {
  assert.deepEqual(normalizeBoardSettings(null), DEFAULT_BOARD_SETTINGS);
});

test('normalizes partial board settings from the server', () => {
  assert.deepEqual(normalizeBoardSettings({
    id: 'default',
    title: '  프로젝트 보드  ',
  }), {
    id: 'default',
    title: '프로젝트 보드',
    auth_write: false,
  });
});

test('falls back to the default title when title is blank', () => {
  assert.equal(normalizeBoardSettings({ title: '   ', auth_write: true }).title, '새로운 생각');
});
