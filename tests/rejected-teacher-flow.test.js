const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('supports rejecting a pending teacher and displaying the rejected state', () => {
    const auth = fs.readFileSync(path.join(__dirname, '..', 'js', 'auth.js'), 'utf8');
    const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
    const dashboard = fs.readFileSync(path.join(__dirname, '..', 'js', 'boards-page.js'), 'utf8');
    const board = fs.readFileSync(path.join(__dirname, '..', 'board.html'), 'utf8');
    const schema = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'supabase_schema.sql'), 'utf8');

    assert.match(auth, /'teacher_rejected'/);
    assert.match(dashboard, /data-action="reject-teacher"/);
    assert.match(dashboard, /action === 'reject-teacher'/);
    assert.match(dashboard, /role: 'teacher_rejected'/);
    assert.match(app, /가입이 거부되었습니다/);
    assert.match(schema, /'teacher_pending', 'teacher', 'teacher_rejected'/);
    assert.match(schema, /current_profile_is_rejected/);
    assert.match(schema, /NOT \(SELECT private\.current_profile_is_rejected\(\)\)/);
    assert.match(schema, /Non-rejected users can like/);
});
