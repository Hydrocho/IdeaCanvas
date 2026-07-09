const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_BOARD_TITLE,
  getBoardIdFromUrl,
  normalizeBoard,
  normalizeBoards,
  filterBoardsByQuery,
  loadBoardFromServer,
  loadBoardsFromServer,
  createBoardInServer,
  renameBoardInServer,
  deleteBoardInServer,
} = require('../js/boards');

function createClientStub(handlers, calls = []) {
  return {
    calls,
    from(table) {
      calls.push(['from', table]);
      const handler = handlers[table] || {};
      return {
        select(columns) {
          calls.push(['select', columns]);
          if (handler.selectResult) return Promise.resolve(handler.selectResult);
          return this;
        },
        order(column, options) {
          calls.push(['order', column, options]);
          return Promise.resolve(handler.orderResult || { data: [], error: null });
        },
        insert(payload) {
          calls.push(['insert', payload]);
          return this;
        },
        update(payload) {
          calls.push(['update', payload]);
          return this;
        },
        delete() {
          calls.push(['delete']);
          return this;
        },
        eq(column, value) {
          calls.push(['eq', column, value]);
          if (handler.eqChainResult) return this;
          return Promise.resolve(handler.eqResult || { error: null });
        },
        maybeSingle() {
          calls.push(['maybeSingle']);
          return Promise.resolve(handler.maybeSingleResult || { data: null, error: null });
        },
      };
    },
  };
}

test('reads board_id from a URL', () => {
  assert.equal(getBoardIdFromUrl('http://localhost/index.html?board_id=abc'), 'abc');
  assert.equal(getBoardIdFromUrl('http://localhost/index.html'), '');
});

test('uses a readable default board title', () => {
  assert.equal(DEFAULT_BOARD_TITLE, '새 보드');
});

test('normalizes board data', () => {
  assert.deepEqual(normalizeBoard({ id: '1', title: '  Sprint  ' }), {
    id: '1',
    title: 'Sprint',
    description: '',
    sort_order: 0,
  });
  assert.equal(normalizeBoard({ id: '2', title: ' ' }).title, DEFAULT_BOARD_TITLE);
});

test('normalizes board arrays and filters missing ids', () => {
  assert.deepEqual(normalizeBoards([{ id: '1', title: 'A' }, { title: 'B' }]).map(b => b.id), ['1']);
});

test('filters boards by title query without mutating the list', () => {
  const source = [
    { id: '1', title: 'Design Sprint' },
    { id: '2', title: 'Class Ideas' },
    { id: '3', title: 'Retrospective' },
  ];

  const result = filterBoardsByQuery(source, ' idea ');

  assert.deepEqual(result.map(board => board.id), ['2']);
  assert.equal(source.length, 3);
  assert.deepEqual(filterBoardsByQuery(source, ''), source);
});

test('loads boards ordered by sort_order', async () => {
  const client = createClientStub({
    boards: { orderResult: { data: [{ id: '1', title: 'A' }], error: null } },
  });

  const boards = await loadBoardsFromServer(client);

  assert.equal(boards[0].title, 'A');
  assert.deepEqual(client.calls, [
    ['from', 'boards'],
    ['select', '*'],
    ['order', 'sort_order', { ascending: true }],
  ]);
});

test('loads a single board by id', async () => {
  const client = createClientStub({
    boards: {
      eqChainResult: true,
      maybeSingleResult: { data: { id: 'board-1', title: 'Board 1' }, error: null },
    },
  });

  const board = await loadBoardFromServer(client, 'board-1');

  assert.equal(board.title, 'Board 1');
  assert.deepEqual(client.calls, [
    ['from', 'boards'],
    ['select', '*'],
    ['eq', 'id', 'board-1'],
    ['maybeSingle'],
  ]);
});

test('creates, renames, and deletes boards on the server', async () => {
  const calls = [];
  const client = createClientStub({
    boards: {
      selectResult: { data: [{ id: 'new', title: '새 보드', sort_order: 1 }], error: null },
      eqResult: { error: null },
    },
  }, calls);

  const created = await createBoardInServer(client, '새 보드');
  await renameBoardInServer(client, 'new', '변경');
  await deleteBoardInServer(client, 'new');

  assert.equal(created.id, 'new');
  assert.deepEqual(calls, [
    ['from', 'boards'],
    ['insert', [{ title: '새 보드' }]],
    ['select', undefined],
    ['from', 'boards'],
    ['update', { title: '변경' }],
    ['eq', 'id', 'new'],
    ['from', 'boards'],
    ['delete'],
    ['eq', 'id', 'new'],
  ]);
});
