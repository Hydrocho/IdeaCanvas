const test = require('node:test');
const assert = require('node:assert/strict');

const {
  loadBoardSettingsFromServer,
  saveBoardSettingsToServer,
} = require('../js/board-settings');

function createTableStub(result, capture) {
  return {
    select(columns) {
      capture.push(['select', columns]);
      return this;
    },
    eq(column, value) {
      capture.push(['eq', column, value]);
      return this;
    },
    maybeSingle() {
      capture.push(['maybeSingle']);
      return Promise.resolve(result);
    },
    upsert(payload) {
      capture.push(['upsert', payload]);
      return this;
    },
    single() {
      capture.push(['single']);
      return Promise.resolve(result);
    },
  };
}

function createClientStub(result, capture) {
  return {
    from(table) {
      capture.push(['from', table]);
      return createTableStub(result, capture);
    },
  };
}

test('loads board settings from the board_settings table', async () => {
  const calls = [];
  const client = createClientStub({
    data: { id: 'default', title: '서버 보드', auth_write: true },
    error: null,
  }, calls);

  const settings = await loadBoardSettingsFromServer(client, 'default');

  assert.equal(settings.title, '서버 보드');
  assert.equal(settings.auth_write, true);
  assert.deepEqual(calls, [
    ['from', 'board_settings'],
    ['select', '*'],
    ['eq', 'id', 'default'],
    ['maybeSingle'],
  ]);
});

test('loads board settings by board_id when provided', async () => {
  const calls = [];
  const client = createClientStub({
    data: { id: 'settings-1', board_id: 'board-1', title: '보드별 설정', auth_write: false },
    error: null,
  }, calls);

  const settings = await loadBoardSettingsFromServer(client, 'default', 'board-1');

  assert.equal(settings.title, '보드별 설정');
  assert.deepEqual(calls, [
    ['from', 'board_settings'],
    ['select', '*'],
    ['eq', 'board_id', 'board-1'],
    ['maybeSingle'],
  ]);
});

test('saves normalized board settings with updated_at', async () => {
  const calls = [];
  const client = createClientStub({
    data: { id: 'default', title: '저장된 보드', auth_write: false },
    error: null,
  }, calls);

  const settings = await saveBoardSettingsToServer(
    client,
    { id: 'default', title: '기존', auth_write: true },
    { title: ' 저장된 보드 ', auth_write: false },
    () => '2026-07-08T00:00:00.000Z'
  );

  assert.equal(settings.title, '저장된 보드');
  assert.equal(settings.auth_write, false);
  assert.deepEqual(calls, [
    ['from', 'board_settings'],
    ['upsert', {
      id: 'default',
      title: '저장된 보드',
      auth_write: false,
      updated_at: '2026-07-08T00:00:00.000Z',
    }],
    ['select', undefined],
    ['single'],
  ]);
});

test('saves board settings with board_id when provided', async () => {
  const calls = [];
  const client = createClientStub({
    data: { id: 'default', board_id: 'board-1', title: '보드 제목', auth_write: true },
    error: null,
  }, calls);

  await saveBoardSettingsToServer(
    client,
    { id: 'default', title: '기존', auth_write: false },
    { title: '보드 제목', auth_write: true },
    () => '2026-07-08T00:00:00.000Z',
    'board-1'
  );

  assert.deepEqual(calls[1], ['upsert', {
    id: 'default',
    board_id: 'board-1',
    title: '보드 제목',
    auth_write: true,
    updated_at: '2026-07-08T00:00:00.000Z',
  }]);
});
