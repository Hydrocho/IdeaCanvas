const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'supabase_schema.sql'), 'utf8');

test('defines anonymous guest comment deletion policy in schema sql', () => {
  assert.match(schemaSql, /DROP POLICY IF EXISTS "Guests can delete comments" ON public\.comments/);
  assert.match(schemaSql, /CREATE POLICY "Guests can delete comments"[\s\S]*ON public\.comments FOR DELETE[\s\S]*TO anon/);
});

test('js/app.js shows comment delete button to either owner or board manager', () => {
  assert.match(appJs, /const commentOwner = c\.author_id === authorId \|\| canCurrentUserManageBoard\(\);/);
});

test('js/app.js deleteComment() enforces author check only for non-managers', () => {
  assert.match(appJs, /async function deleteComment\(cmtId, noteId\)/);
  assert.match(appJs, /if \(!canCurrentUserManageBoard\(\)\) \{/);
  assert.match(appJs, /query = query\.eq\('author_id', authorId\);/);
});
