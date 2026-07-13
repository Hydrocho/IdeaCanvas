const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const authJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'auth.js'), 'utf8');
const boardsPageJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'boards-page.js'), 'utf8');
const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'supabase_schema.sql'), 'utf8');

test('defines email column in public.profiles table schema and triggers', () => {
  assert.match(schemaSql, /CREATE TABLE IF NOT EXISTS public\.profiles \([\s\S]*email TEXT/);
  assert.match(schemaSql, /CREATE OR REPLACE FUNCTION public\.handle_profile_email_sync\(\)/);
  assert.match(schemaSql, /CREATE TRIGGER on_profile_insert_sync_email/);
});

test('js/auth.js normalizes and extracts the email property', () => {
  // normalizeProfile extracts email
  assert.match(authJs, /email:\s*typeof profile\.email\s*===\s*'string'\s*\?\s*profile\.email\s*:\s*''/);
});

test('js/auth.js includes email inside profile insert candidates', () => {
  // getProfileInsertCandidates includes email
  assert.match(authJs, /email:\s*user\.email\s*\|\|\s*''/);
});

test('js/boards-page.js auto-syncs email inside loadCurrentProfile()', () => {
  // checks loadCurrentProfile updates missing email
  assert.match(boardsPageJs, /if\s*\(currentProfile\s*&&\s*!currentProfile\.email\s*&&\s*currentUser\.email\)/);
  assert.match(boardsPageJs, /\.update\(\{\s*email:\s*currentUser\.email\s*\}\)/);
});

test('js/boards-page.js renders profile email inside renderProfileRow()', () => {
  // renderProfileRow renders email with fallback to user_id
  assert.match(boardsPageJs, /escapeHtml\(profile\.email\s*\|\|\s*profile\.user_id\)/);
});
