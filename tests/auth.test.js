const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeProfile,
  isApprovedTeacher,
  isTeacherAccount,
  isMaster,
  canCreateBoard,
  canWriteToBoard,
  getProfileInsertCandidates,
  getDisplayName,
} = require('../js/auth');

test('normalizes missing and partial profiles', () => {
  assert.equal(normalizeProfile(null), null);
  assert.deepEqual(normalizeProfile({
    user_id: 'u1',
    display_name: '  Kim Teacher  ',
    role: 'teacher_pending',
  }), {
    user_id: 'u1',
    display_name: 'Kim Teacher',
    role: 'teacher_pending',
    is_master: false,
    is_primary_master: false,
  });
});

test('detects teacher and master capabilities', () => {
  const pending = normalizeProfile({ user_id: 'p', display_name: 'Pending', role: 'teacher_pending' });
  const teacher = normalizeProfile({ user_id: 't', display_name: 'Teacher', role: 'teacher' });
  const master = normalizeProfile({ user_id: 'm', display_name: 'Master', role: 'teacher', is_master: true });

  assert.equal(isApprovedTeacher(pending), false);
  assert.equal(isApprovedTeacher(teacher), true);
  assert.equal(isTeacherAccount(pending), true);
  assert.equal(isMaster(master), true);
  assert.equal(canCreateBoard(pending), false);
  assert.equal(canCreateBoard(teacher), true);
  assert.equal(canCreateBoard(master), true);
});

test('allows guest writing only when write_enabled is true', () => {
  assert.equal(canWriteToBoard(null, { write_enabled: false }), false);
  assert.equal(canWriteToBoard(null, { write_enabled: true }), true);
});

test('allows teacher accounts and masters to write regardless of board setting', () => {
  const pending = normalizeProfile({ user_id: 'p', display_name: 'Pending', role: 'teacher_pending' });
  const teacher = normalizeProfile({ user_id: 't', display_name: 'Teacher', role: 'teacher' });
  const master = normalizeProfile({ user_id: 'm', display_name: 'Master', role: 'teacher_pending', is_master: true });

  assert.equal(canWriteToBoard(pending, { write_enabled: false }), true);
  assert.equal(canWriteToBoard(teacher, { write_enabled: false }), true);
  assert.equal(canWriteToBoard(master, { write_enabled: false }), true);
});

test('uses profile name before email when displaying an authenticated user', () => {
  assert.equal(getDisplayName({ display_name: 'Lee' }, { email: 'lee@example.com' }), 'Lee');
  assert.equal(getDisplayName(null, { email: 'park@example.com' }), 'park');
  assert.equal(getDisplayName(null, null), '');
});

test('builds primary-master then pending-teacher profile insert candidates', () => {
  assert.deepEqual(getProfileInsertCandidates({ id: 'u1', email: 'first@example.com' }, ' First Teacher '), [
    {
      user_id: 'u1',
      display_name: 'First Teacher',
      role: 'teacher',
      is_master: true,
      is_primary_master: true,
    },
    {
      user_id: 'u1',
      display_name: 'First Teacher',
      role: 'teacher_pending',
      is_master: false,
      is_primary_master: false,
    },
  ]);
  assert.equal(getProfileInsertCandidates(null, 'Name').length, 0);
});
