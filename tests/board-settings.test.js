const test = require('node:test');
const assert = require('node:assert/strict');

const {
  loadBoardSettingsFromServer,
  loadBoardSettingsByBoardIdsFromServer,
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
    data: { id: 'default', title: '서버 보드', write_enabled: false },
    error: null,
  }, calls);

  const settings = await loadBoardSettingsFromServer(client, 'default');

  assert.equal(settings.title, '서버 보드');
  assert.equal(settings.write_enabled, false);
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
    data: { id: 'settings-1', board_id: 'board-1', title: '보드별 설정', write_enabled: true },
    error: null,
  }, calls);

  const settings = await loadBoardSettingsFromServer(client, 'default', 'board-1');

  assert.equal(settings.title, '보드별 설정');
  assert.equal(settings.write_enabled, true);
  assert.deepEqual(calls, [
    ['from', 'board_settings'],
    ['select', '*'],
    ['eq', 'board_id', 'board-1'],
    ['maybeSingle'],
  ]);
});

test('loads board settings for multiple board ids', async () => {
  const calls = [];
  const client = {
    from(table) {
      calls.push(['from', table]);
      return {
        select(columns) {
          calls.push(['select', columns]);
          return this;
        },
        in(column, values) {
          calls.push(['in', column, values]);
          return Promise.resolve({
            data: [
              { id: 's1', board_id: 'board-1', title: 'Board 1', write_enabled: false },
              { id: 's2', board_id: 'board-2', title: 'Board 2', write_enabled: true },
            ],
            error: null,
          });
        },
      };
    },
  };

  const settings = await loadBoardSettingsByBoardIdsFromServer(client, ['board-1', 'board-2']);

  assert.equal(settings['board-1'].write_enabled, false);
  assert.equal(settings['board-2'].write_enabled, true);
  assert.deepEqual(calls, [
    ['from', 'board_settings'],
    ['select', '*'],
    ['in', 'board_id', ['board-1', 'board-2']],
  ]);
});

test('saves normalized board settings with updated_at', async () => {
  const calls = [];
  const client = createClientStub({
    data: { id: 'default', title: '저장된 보드', write_enabled: false },
    error: null,
  }, calls);

  const settings = await saveBoardSettingsToServer(
    client,
    { id: 'default', title: '기존', write_enabled: true },
    { title: ' 저장된 보드 ', write_enabled: false },
    () => '2026-07-08T00:00:00.000Z'
  );

  assert.equal(settings.title, '저장된 보드');
  assert.equal(settings.write_enabled, false);
  assert.deepEqual(calls, [
    ['from', 'board_settings'],
    ['upsert', {
      id: 'default',
      title: '저장된 보드',
      write_enabled: false,
      updated_at: '2026-07-08T00:00:00.000Z',
    }],
    ['select', undefined],
    ['single'],
  ]);
});

test('saves board settings with board_id when provided', async () => {
  const calls = [];
  const client = createClientStub({
    data: { id: 'default', board_id: 'board-1', title: '보드 제목', write_enabled: true },
    error: null,
  }, calls);

  await saveBoardSettingsToServer(
    client,
    { id: 'default', title: '기존', write_enabled: false },
    { title: '보드 제목', write_enabled: true },
    () => '2026-07-08T00:00:00.000Z',
    'board-1'
  );

  assert.deepEqual(calls[1], ['upsert', {
    id: 'board:board-1',
    board_id: 'board-1',
    title: '보드 제목',
    write_enabled: true,
    updated_at: '2026-07-08T00:00:00.000Z',
  }]);
});
