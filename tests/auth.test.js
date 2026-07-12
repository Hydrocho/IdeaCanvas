const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeProfile,
  isApprovedTeacher,
  isTeacherAccount,
  isMaster,
  canCreateBoard,
  canUseDashboard,
  canWriteToBoard,
  resolveAuthPanelMode,
  validatePasswordConfirmation,
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
    const rejected = normalizeProfile({ user_id: 'r', display_name: 'Rejected', role: 'teacher_rejected' });
  const teacher = normalizeProfile({ user_id: 't', display_name: 'Teacher', role: 'teacher' });
  const master = normalizeProfile({ user_id: 'm', display_name: 'Master', role: 'teacher', is_master: true });

    assert.equal(isApprovedTeacher(pending), false);
    assert.equal(isApprovedTeacher(teacher), true);
    assert.equal(isTeacherAccount(pending), true);
    assert.equal(isTeacherAccount(rejected), false);
  assert.equal(isMaster(master), true);
    assert.equal(canCreateBoard(pending), false);
    assert.equal(canCreateBoard(rejected), false);
  assert.equal(canCreateBoard(teacher), true);
  assert.equal(canCreateBoard(master), true);
  assert.equal(canUseDashboard(null), false);
  assert.equal(canUseDashboard(pending), false);
  assert.equal(canUseDashboard(teacher), true);
  assert.equal(canUseDashboard(master), true);
});

test('allows guest writing only when write_enabled is true', () => {
  assert.equal(canWriteToBoard(null, { write_enabled: false }), false);
  assert.equal(canWriteToBoard(null, { write_enabled: true }), true);
});

test('allows teacher accounts and masters to write regardless of board setting', () => {
  const pending = normalizeProfile({ user_id: 'p', display_name: 'Pending', role: 'teacher_pending' });
  const teacher = normalizeProfile({ user_id: 't', display_name: 'Teacher', role: 'teacher' });
    const master = normalizeProfile({ user_id: 'm', display_name: 'Master', role: 'teacher_pending', is_master: true });
    const rejected = normalizeProfile({ user_id: 'r', display_name: 'Rejected', role: 'teacher_rejected' });

  assert.equal(canWriteToBoard(pending, { write_enabled: false }), true);
  assert.equal(canWriteToBoard(teacher, { write_enabled: false }), true);
    assert.equal(canWriteToBoard(master, { write_enabled: false }), true);
    assert.equal(canWriteToBoard(rejected, { write_enabled: true }), false);
});

test('uses profile name before email when displaying an authenticated user', () => {
  assert.equal(getDisplayName({ display_name: 'Lee' }, { email: 'lee@example.com' }), 'Lee');
  assert.equal(getDisplayName(null, { email: 'park@example.com' }), 'park');
  assert.equal(getDisplayName(null, null), '');
});

test('resolves dashboard auth panel modes', () => {
  assert.equal(resolveAuthPanelMode(undefined, null), 'closed');
  assert.equal(resolveAuthPanelMode('login', null), 'login');
  assert.equal(resolveAuthPanelMode('signup', null), 'signup');
  assert.equal(resolveAuthPanelMode('unknown', null), 'closed');
  assert.equal(resolveAuthPanelMode('login', { id: 'u1' }), 'logged_in');
});

test('validates password confirmation for signup', () => {
  assert.deepEqual(validatePasswordConfirmation('', ''), {
    valid: false,
    message: '비밀번호를 입력해 주세요.',
  });
  assert.deepEqual(validatePasswordConfirmation('123456', '654321'), {
    valid: false,
    message: '비밀번호가 일치하지 않습니다.',
  });
  assert.deepEqual(validatePasswordConfirmation('123456', '123456'), {
    valid: true,
    message: '',
  });
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
