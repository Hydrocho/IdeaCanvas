const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('keeps pending-teacher account status and logout visible after login', () => {
    const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
    const board = fs.readFileSync(path.join(__dirname, '..', 'board.html'), 'utf8');

    assert.match(board, /id="auth-status-badge"/);
    assert.match(board, /<script src="js\/app\.js\?v=1\.0\.6"><\/script>/);
    assert.match(app, /const isPendingTeacher = currentProfile\?\.role === 'teacher_pending';/);
    assert.match(app, /statusBadge\.textContent = isPendingTeacher \? '교사 승인 대기 중' : \(isRejectedTeacher \? '가입이 거부되었습니다' : ''\);/);
    assert.match(app, /!\['teacher_pending', 'teacher_rejected'\]\.includes\(currentProfile\?\.role\)/);
});
