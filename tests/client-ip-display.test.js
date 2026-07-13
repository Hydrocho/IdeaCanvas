const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'supabase_schema.sql'), 'utf8');

test('defines client_ip columns in notes and comments schemas', () => {
  assert.match(schemaSql, /CREATE TABLE IF NOT EXISTS public\.notes \([\s\S]*client_ip TEXT/);
  assert.match(schemaSql, /CREATE TABLE IF NOT EXISTS public\.comments \([\s\S]*client_ip TEXT/);
});

test('js/app.js declares clientMaskedIP and fetchClientIP', () => {
  assert.match(appJs, /let clientMaskedIP = '';/);
  assert.match(appJs, /async function fetchClientIP\(\)/);
  assert.match(appJs, /clientMaskedIP = `\$\{parts\[0\]\}\.\$\{parts\[1\]\}\.\*\*\*\.\*\*\*`;/);
  assert.match(appJs, /fetchClientIP\(\);/);
});

test('js/app.js passes client_ip on new notes and comments inserts', () => {
  assert.match(appJs, /client_ip: clientMaskedIP/);
});

test('js/app.js renders client_ip on notes cards and comments metadata', () => {
  assert.match(appJs, /\$\{note\.client_ip \? `\(ip: \$\{note\.client_ip\}\)` : ''\}/);
  assert.match(appJs, /\$\{c\.client_ip \? `\(ip: \$\{c\.client_ip\}\)` : ''\}/);
});
