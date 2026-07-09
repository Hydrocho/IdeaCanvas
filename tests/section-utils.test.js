const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_SECTION_NAME,
  getDefaultSectionName,
  getValidSectionName,
  getNextSectionName,
  isLegacyDefaultSections,
  normalizeSections,
} = require('../js/section-utils');

test('uses the first section as the default and falls back to 새 섹션', () => {
  assert.equal(DEFAULT_SECTION_NAME, '새 섹션');
  assert.equal(getDefaultSectionName([{ id: 'a', name: '진행중' }]), '진행중');
  assert.equal(getDefaultSectionName([]), '새 섹션');
  assert.equal(getDefaultSectionName([{ id: 'a', name: '   ' }]), '새 섹션');
});

test('normalizes missing, unknown, and id-based note sections to a valid section name', () => {
  const sections = [
    { id: 'sec-1', name: '새 섹션' },
    { id: 'sec-2', name: '완료' },
  ];

  assert.equal(getValidSectionName('', sections), '새 섹션');
  assert.equal(getValidSectionName('아이디어', sections), '새 섹션');
  assert.equal(getValidSectionName('sec-2', sections), '완료');
  assert.equal(getValidSectionName('완료', sections), '완료');
});

test('generates unique default section names', () => {
  assert.equal(getNextSectionName([{ name: '새 섹션' }]), '새 섹션(1)');
  assert.equal(
    getNextSectionName([{ name: '새 섹션' }, { name: '새 섹션(1)' }]),
    '새 섹션(2)'
  );
});

test('detects legacy hard-coded default sections regardless of ids', () => {
  assert.equal(isLegacyDefaultSections([
    { id: 'uuid-1', name: '아이디어' },
    { id: 'uuid-2', name: '질문' },
    { id: 'uuid-3', name: '피드백' },
  ]), true);

  assert.equal(isLegacyDefaultSections([
    { id: 'uuid-1', name: '아이디어' },
    { id: 'custom', name: '검토' },
  ]), false);
});

test('normalizes legacy hard-coded defaults to the single default section', () => {
  assert.deepEqual(normalizeSections([
    { id: 'uuid-1', name: '아이디어', sort_order: 1 },
    { id: 'uuid-2', name: '질문', sort_order: 2 },
    { id: 'uuid-3', name: '피드백', sort_order: 3 },
  ]), [
    { id: 'sec-1', name: '새 섹션', sort_order: 1 },
  ]);
});
