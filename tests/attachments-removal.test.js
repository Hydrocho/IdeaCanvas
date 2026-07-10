const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');

function readWorkspaceFile(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

test('note composer no longer exposes file attachment controls', () => {
  const html = readWorkspaceFile('board.html');

  assert.equal(html.includes('tool-btn-file'), false);
  assert.equal(html.includes('panel-file'), false);
  assert.equal(html.includes('attachment-file-input'), false);
  assert.equal(html.includes('file-preview-box'), false);
});

test('note saving no longer stores generic file attachment data', () => {
  const app = readWorkspaceFile('js/app.js');

  assert.equal(app.includes('attachedFileData'), false);
  assert.equal(app.includes('attachedFileMeta'), false);
  assert.equal(app.includes('file_data'), false);
  assert.equal(app.includes('file_name'), false);
  assert.equal(app.includes('file_type'), false);
  assert.equal(app.includes('attachmentFileInput'), false);
});

test('schema does not add file attachment columns to notes', () => {
  const schema = readWorkspaceFile('supabase/supabase_schema.sql');

  assert.equal(schema.includes('file_name TEXT'), false);
  assert.equal(schema.includes('file_type TEXT'), false);
  assert.equal(schema.includes('file_data TEXT'), false);
});
