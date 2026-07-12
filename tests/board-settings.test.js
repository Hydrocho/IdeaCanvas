const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBoardSettingsFromServer, saveBoardSettingsToServer } = require('../js/board-settings');

function clientFor(result, calls) {
  const table = {
    select: () => table,
    eq: () => table,
    maybeSingle: () => Promise.resolve(result),
    update: (payload) => { calls.push(['update', payload]); return table; },
    insert: (payload) => { calls.push(['insert', payload]); return table; },
    upsert: (payload) => { calls.push(['upsert', payload]); return table; },
    single: () => Promise.resolve(result),
  };
  return { from: () => table };
}

test('loads settings from a JSON-only server row', async () => {
  const settings = await loadBoardSettingsFromServer(clientFor({
    data: { id: 's1', board_id: 'b1', settings_json: { write_enabled: false } }, error: null,
  }, []), 'default', 'b1');
  assert.equal(settings.write_enabled, false);
  assert.equal(settings.settings_json.comments_enabled, true);
});

test('merges a toggle patch into JSON without losing future settings', async () => {
  const calls = [];
  await saveBoardSettingsToServer(clientFor({
    data: { id: 's1', board_id: 'b1', settings_json: {} }, error: null,
  }, calls), {
    id: 's1', board_id: 'b1', settings_json: { write_enabled: false, future_feature: { mode: 'x' } },
  }, { write_enabled: true }, () => '2026-07-12T00:00:00.000Z', 'b1');

  assert.deepEqual(calls[0], ['update', {
    settings_json: {
      write_enabled: true, comments_enabled: true, likes_enabled: true,
      bg_color: 'default', sections_enabled: false, future_feature: { mode: 'x' },
      note_sort: 'newest',
      note_layout: 'masonry',
    },
    updated_at: '2026-07-12T00:00:00.000Z',
  }]);
});

test('writes no legacy setting columns', async () => {
  const calls = [];
  await saveBoardSettingsToServer(clientFor({ data: { id: 's1', settings_json: {} }, error: null }, calls),
    { id: 's1', settings_json: {} }, { likes_enabled: false }, () => 'now');
  assert.deepEqual(Object.keys(calls[0][1]).sort(), ['id', 'settings_json', 'updated_at']);
});

test('inserts a JSON-only row when an update finds no board row', async () => {
  const calls = [];
  const client = clientFor({ data: null, error: null }, calls);
  client.from = () => {
    const table = {
      select: () => table, eq: () => table,
      update: (p) => { calls.push(['update', p]); return table; },
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      insert: (p) => { calls.push(['insert', p]); return table; },
      single: () => Promise.resolve({ data: { id: 'board:b1', board_id: 'b1', settings_json: {} }, error: null }),
    };
    return table;
  };
  await saveBoardSettingsToServer(client, { id: 'default', settings_json: {} }, { sections_enabled: true }, () => 'now', 'b1');
  assert.deepEqual(Object.keys(calls[1][1]).sort(), ['board_id', 'id', 'settings_json', 'updated_at']);
});
