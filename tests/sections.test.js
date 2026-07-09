const test = require('node:test');
const assert = require('node:assert/strict');

const {
  loadSectionsFromServer,
  createDefaultSectionInServer,
  addSectionToServer,
  renameSectionInServer,
  deleteSectionInServer,
  migrateLegacyDefaultSectionsInServer,
} = require('../js/sections');

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
          this._insertPayload = payload;
          return this;
        },
        update(payload) {
          calls.push(['update', payload]);
          this._updatePayload = payload;
          return this;
        },
        delete() {
          calls.push(['delete']);
          return this;
        },
        eq(column, value) {
          calls.push(['eq', column, value]);
          return handler.eqResult
            ? Promise.resolve(handler.eqResult)
            : this;
        },
      };
    },
  };
}

test('loads sections ordered by sort_order', async () => {
  const client = createClientStub({
    sections: { orderResult: { data: [{ id: 'a', name: 'A', sort_order: 1 }], error: null } },
  });

  const sections = await loadSectionsFromServer(client);

  assert.equal(sections[0].name, 'A');
  assert.deepEqual(client.calls, [
    ['from', 'sections'],
    ['select', '*'],
    ['order', 'sort_order', { ascending: true }],
  ]);
});

test('loads sections by board_id when provided', async () => {
  const client = createClientStub({
    sections: { orderResult: { data: [{ id: 'a', board_id: 'board-1', name: 'A', sort_order: 1 }], error: null } },
  });

  await loadSectionsFromServer(client, 'board-1');

  assert.deepEqual(client.calls, [
    ['from', 'sections'],
    ['select', '*'],
    ['eq', 'board_id', 'board-1'],
    ['order', 'sort_order', { ascending: true }],
  ]);
});

test('creates the default section on the server', async () => {
  const client = createClientStub({
    sections: { selectResult: { data: [{ id: 'new', name: '새 섹션', sort_order: 1 }], error: null } },
  });

  const section = await createDefaultSectionInServer(client, { name: '새 섹션', sort_order: 1 });

  assert.equal(section.id, 'new');
  assert.equal(section.name, '새 섹션');
});

test('creates the default section with board_id when provided', async () => {
  const client = createClientStub({
    sections: { selectResult: { data: [{ id: 'new', board_id: 'board-1', name: '새 섹션', sort_order: 1 }], error: null } },
  });

  await createDefaultSectionInServer(client, { name: '새 섹션', sort_order: 1 }, 'board-1');

  assert.deepEqual(client.calls[1], ['insert', [{ name: '새 섹션', sort_order: 1, board_id: 'board-1' }]]);
});

test('adds a named section to the server', async () => {
  const client = createClientStub({
    sections: { selectResult: { data: [{ id: 'new', name: '새 섹션(1)', sort_order: 2 }], error: null } },
  });

  const section = await addSectionToServer(client, '새 섹션(1)', 2);

  assert.equal(section.name, '새 섹션(1)');
});

test('adds a named section with board_id when provided', async () => {
  const client = createClientStub({
    sections: { selectResult: { data: [{ id: 'new', board_id: 'board-1', name: '새 섹션(1)', sort_order: 2 }], error: null } },
  });

  await addSectionToServer(client, '새 섹션(1)', 2, 'board-1');

  assert.deepEqual(client.calls[1], ['insert', [{ name: '새 섹션(1)', sort_order: 2, board_id: 'board-1' }]]);
});

test('renames a section and moves notes from the old name', async () => {
  const calls = [];
  const client = createClientStub({
    sections: { eqResult: { error: null } },
    notes: { eqResult: { error: null } },
  }, calls);

  await renameSectionInServer(client, 'section-id', '새 이름', '예전 이름');

  assert.deepEqual(calls, [
    ['from', 'sections'],
    ['update', { name: '새 이름' }],
    ['eq', 'id', 'section-id'],
    ['from', 'notes'],
    ['update', { section: '새 이름' }],
    ['eq', 'section', '예전 이름'],
  ]);
});

test('deletes a section and moves notes by name and id', async () => {
  const calls = [];
  const client = createClientStub({
    sections: { eqResult: { error: null } },
    notes: { eqResult: { error: null } },
  }, calls);

  await deleteSectionInServer(client, { id: 'section-id', name: '삭제 대상' }, '새 섹션');

  assert.deepEqual(calls, [
    ['from', 'sections'],
    ['delete'],
    ['eq', 'id', 'section-id'],
    ['from', 'notes'],
    ['update', { section: '새 섹션' }],
    ['eq', 'section', '삭제 대상'],
    ['from', 'notes'],
    ['update', { section: '새 섹션' }],
    ['eq', 'section', 'section-id'],
  ]);
});

test('migrates legacy default sections to a single default section', async () => {
  const calls = [];
  const client = createClientStub({
    sections: { eqResult: { error: null } },
    notes: { eqResult: { error: null } },
  }, calls);

  await migrateLegacyDefaultSectionsInServer(client, [
    { id: 'one', name: '아이디어' },
    { id: 'two', name: '질문' },
    { id: 'three', name: '피드백' },
  ], '새 섹션');

  assert.deepEqual(calls, [
    ['from', 'sections'],
    ['update', { name: '새 섹션', sort_order: 1 }],
    ['eq', 'id', 'one'],
    ['from', 'notes'],
    ['update', { section: '새 섹션' }],
    ['eq', 'section', '아이디어'],
    ['from', 'notes'],
    ['update', { section: '새 섹션' }],
    ['eq', 'section', '질문'],
    ['from', 'notes'],
    ['update', { section: '새 섹션' }],
    ['eq', 'section', '피드백'],
    ['from', 'sections'],
    ['delete'],
    ['eq', 'id', 'two'],
    ['from', 'sections'],
    ['delete'],
    ['eq', 'id', 'three'],
  ]);
});
