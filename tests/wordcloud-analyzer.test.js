const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const boardHtml = fs.readFileSync(path.join(__dirname, '..', 'board.html'), 'utf8');

test('board.html loads wordcloud2.js cdn and contains the trigger button', () => {
  assert.match(boardHtml, /src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/wordcloud2\.js\/1\.2\.2\/wordcloud2\.min\.js"/);
  assert.match(boardHtml, /id="open-wordcloud-btn"/);
});

test('board.html contains the wordcloud modal and stats list container', () => {
  assert.match(boardHtml, /id="wordcloud-modal"/);
  assert.match(boardHtml, /id="wordcloud-canvas"/);
  assert.match(boardHtml, /id="wordcloud-stats-list"/);
});

test('js/app.js extractWordFrequencies analyzes only content and trims postpositions', () => {
  assert.match(appJs, /function extractWordFrequencies\(\)/);
  // Excludes note title check: it should loop currentNotes and append only note.content
  assert.match(appJs, /combinedText \+= ' ' \+ note\.content;/);
  assert.doesNotMatch(appJs, /combinedText \+= ' ' \+ note\.title;/);

  // Trims postpositions (은/는/이/가/을/를/에/의)
  assert.match(appJs, /const postpositions = \[/);
  assert.match(appJs, /word\.endsWith\(suffix\)/);
});

test('js/app.js opens and closes wordcloud modal and binds event listeners', () => {
  assert.match(appJs, /function openWordCloudModal\(\)/);
  assert.match(appJs, /function closeWordCloudModal\(\)/);
  assert.match(appJs, /openWordCloudBtn\.addEventListener\('click', openWordCloudModal\)/);
});
