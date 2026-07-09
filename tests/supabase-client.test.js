const test = require('node:test');
const assert = require('node:assert/strict');

const {
  resolveSupabaseConfig,
} = require('../js/supabase-client');

test('ignores placeholder Supabase config values', () => {
  assert.deepEqual(resolveSupabaseConfig({
    SUPABASE_URL: 'YOUR_SUPABASE_URL',
    SUPABASE_KEY: 'YOUR_SUPABASE_ANON_KEY',
  }), {
    url: '',
    key: '',
    isConfigured: false,
  });
});

test('trims and returns valid Supabase config values', () => {
  assert.deepEqual(resolveSupabaseConfig({
    SUPABASE_URL: ' https://example.supabase.co ',
    SUPABASE_KEY: ' test-anon-key ',
  }), {
    url: 'https://example.supabase.co',
    key: 'test-anon-key',
    isConfigured: true,
  });
});
