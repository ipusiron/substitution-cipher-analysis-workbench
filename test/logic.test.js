'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../logic.js');

test('mapping validation rejects duplicate plaintext assignments', () => {
  const mapping = Core.createEmptyMapping();
  mapping.A = 'e';
  mapping.B = 'e';
  const result = Core.validateMapping(mapping);
  assert.equal(result.valid, false);
  assert.deepEqual(result.conflicts, [{ plain: 'e', ciphers: ['A', 'B'] }]);
});

test('mapping validation accepts an injective partial mapping', () => {
  const mapping = { A: 'e', B: 't' };
  assert.equal(Core.validateMapping(mapping).valid, true);
});

test('invalid mapping values are ignored during normalization', () => {
  const mapping = Core.normalizeMapping({ A: 'E', B: '12', C: 'é', D: ' t ' });
  assert.equal(mapping.A, 'e');
  assert.equal(mapping.B, '');
  assert.equal(mapping.C, '');
  assert.equal(mapping.D, 't');
});

test('applying a mapping derives lowercase plaintext without mutating the source', () => {
  const source = 'AB BA!';
  const result = Core.applyMapping(source, { A: 'e', B: 't' });
  assert.equal(result.ok, true);
  assert.equal(result.text, 'et te!');
  assert.equal(source, 'AB BA!');
});

test('applying a conflicting mapping returns the unchanged source', () => {
  const result = Core.applyMapping('AB', { A: 'e', B: 'e' });
  assert.equal(result.ok, false);
  assert.equal(result.text, 'AB');
});

test('frequency percentages keep the full-letter denominator after partial mapping', () => {
  const result = Core.analyzeFrequency('AAAABB', { A: 'e' });
  const a = result.rows.find(row => row.letter === 'A');
  const b = result.rows.find(row => row.letter === 'B');
  assert.equal(result.total, 6);
  assert.equal(a.count, 4);
  assert.equal(a.percent, 4 / 6 * 100);
  assert.equal(b.percent, 2 / 6 * 100);
  assert.ok(Math.abs(result.percentTotal - 100) < 1e-9);
});

test('frequency analysis handles input without letters', () => {
  const result = Core.analyzeFrequency('123 !', {});
  assert.equal(result.total, 0);
  assert.equal(result.percentTotal, 0);
});

test('normalization keeps line breaks and removes punctuation and digits', () => {
  assert.equal(Core.normalizeCiphertext(' ab, 12\n\ncd! '), 'AB \nCD');
});
