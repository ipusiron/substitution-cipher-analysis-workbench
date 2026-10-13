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

test('mapping comparison distinguishes additions, changes, and removals', () => {
  const result = Core.diffMappings(
    { A: 'e', B: 't', C: 'a' },
    { A: 'e', B: 'o', D: 'i' }
  );
  assert.deepEqual(result.rows, [
    { cipher: 'B', before: 't', after: 'o', type: 'changed' },
    { cipher: 'C', before: 'a', after: '', type: 'removed' },
    { cipher: 'D', before: '', after: 'i', type: 'added' }
  ]);
  assert.deepEqual(result.counts, { added: 1, changed: 1, removed: 1 });
});

test('mapping equality ignores invalid values after normalization', () => {
  assert.equal(Core.mappingsEqual({ A: 'E', B: '12' }, { A: 'e' }), true);
  assert.equal(Core.mappingsEqual({ A: 'e' }, { A: 't' }), false);
});

test('snapshot normalization validates, limits, and deduplicates candidates', () => {
  const valid = { id: 'one', name: ' Candidate 1 ', createdAt: 123, mapping: { A: 'e' } };
  const duplicate = { ...valid, name: 'Duplicate' };
  const conflict = { id: 'bad', name: 'Bad', createdAt: 456, mapping: { A: 'e', B: 'e' } };
  const result = Core.normalizeSnapshots([valid, duplicate, conflict], 20);
  assert.equal(result.length, 1);
  assert.equal(result[0].name, 'Candidate 1');
  assert.equal(result[0].mapping.A, 'e');
});

test('word patterns preserve repeated-letter structure without digit ambiguity', () => {
  assert.equal(Core.wordPattern('XYYX'), '1-2-2-1');
  assert.equal(Core.wordPattern('committee'), '1-2-3-3-4-5-5-6-6');
  assert.equal(Core.wordPattern('not-a-word'), '');
});

test('word candidate check derives a one-to-one mapping and explains additions', () => {
  const result = Core.checkWordCandidate('XYYX', 'NOON', {});
  assert.equal(result.valid, true);
  assert.deepEqual(result.additions, [
    { cipher: 'X', plain: 'n' },
    { cipher: 'Y', plain: 'o' }
  ]);
  assert.equal(result.mapping.X, 'n');
  assert.equal(result.mapping.Y, 'o');
});

test('word candidate check rejects pattern and mapping conflicts', () => {
  assert.equal(Core.checkWordCandidate('XYYX', 'NEON', {}).reason, 'pattern');
  assert.equal(Core.checkWordCandidate('XYYX', 'NOON', { X: 't' }).reason, 'cipher-conflict');
  assert.equal(Core.checkWordCandidate('XYYX', 'NOON', { Z: 'n' }).reason, 'plain-conflict');
});

test('word candidate suggestions are deduplicated and alphabetical, not scored', () => {
  const result = Core.suggestWordCandidates('XYYX', ['toot', 'noon', 'deed', 'NOON', 'neon'], {}, 50);
  assert.deepEqual(result.candidates.map(item => item.plainWord), ['deed', 'noon', 'toot']);
  assert.equal(result.compatibleCount, 3);
  assert.equal(result.truncated, false);
  assert.equal(result.rejected.pattern, 1);
  assert.ok(result.candidates.every(item => !Object.hasOwn(item, 'score')));
});

test('word candidate suggestions respect the current partial mapping', () => {
  const result = Core.suggestWordCandidates('XYYX', ['deed', 'noon', 'toot'], { X: 'n' });
  assert.deepEqual(result.candidates.map(item => item.plainWord), ['noon']);
  assert.deepEqual(result.candidates[0].retained, [{ cipher: 'X', plain: 'n' }]);
});

test('word candidate suggestions report when the display limit truncates matches', () => {
  const result = Core.suggestWordCandidates('XYYX', ['deed', 'noon', 'peep', 'toot'], {}, 2);
  assert.equal(result.candidates.length, 2);
  assert.equal(result.compatibleCount, 4);
  assert.equal(result.truncated, true);
});
