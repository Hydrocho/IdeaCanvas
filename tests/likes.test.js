const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildLikeSummary,
  saveLikeToServer,
} = require('../js/likes');

test('counts duplicate like rows from the same user only once per note', () => {
  const summary = buildLikeSummary([
    { note_id: 'note-1', user_session_id: 'user-a' },
    { note_id: 'note-1', user_session_id: 'user-a' },
    { note_id: 'note-1', user_session_id: 'user-b' },
    { note_id: 'note-2', user_session_id: 'user-a' },
  ], 'user-a');

  assert.deepEqual(summary.likeCountMap, {
    'note-1': 2,
    'note-2': 1,
  });
  assert.deepEqual(summary.userLikesMap, {
    'note-1': true,
    'note-2': true,
  });
});

test('saves a like with note and user-session upsert conflict target', async () => {
  const calls = [];
  const client = {
    from(table) {
      calls.push(['from', table]);
      return {
        upsert(payload, options) {
          calls.push(['upsert', payload, options]);
          return Promise.resolve({ error: null });
        },
      };
    },
  };

  await saveLikeToServer(client, 'note-1', 'user-a', 'auth-user-1');

  assert.deepEqual(calls, [
    ['from', 'likes'],
    ['upsert', [{ note_id: 'note-1', user_session_id: 'user-a', user_id: 'auth-user-1' }], { onConflict: 'note_id,user_session_id' }],
  ]);
});
