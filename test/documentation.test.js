'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('HTML loads the core before the UI and declares a CSP', () => {
  const html = read('index.html');
  assert.ok(html.indexOf('logic.js') < html.indexOf('script.js'));
  assert.match(html, /Content-Security-Policy/);
});

test('bilingual entry points and language control are tracked', () => {
  assert.ok(fs.existsSync(path.join(root, 'README.en.md')));
  assert.match(read('index.html'), /id="languageBtn"/);
  assert.match(read('script.js'), /languagechange/);
});

test('every static translation key appears in both message tables', () => {
  const html = read('index.html');
  const script = read('script.js');
  const keys = [...html.matchAll(/data-i18n(?:-placeholder|-title|-aria)?="([^"]+)"/g)].map(match => match[1]);
  for (const key of new Set(keys)) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const occurrences = script.match(new RegExp(`\\b${escaped}:`, 'g')) || [];
    assert.ok(occurrences.length >= 2, `missing Japanese/English pair for ${key}`);
  }
});

test('documentation states that ciphertext remains unchanged and results are hints', () => {
  assert.match(read('README.md'), /暗号文[^\n]*変更しません/);
  assert.match(read('README.en.md'), /does not modify the ciphertext/i);
  assert.match(read('README.md'), /断定/);
  assert.match(read('README.en.md'), /cannot.*determine|does not prove/i);
});

test('mapping history and named candidates are bilingual and documented', () => {
  const html = read('index.html');
  const script = read('script.js');
  assert.match(html, /id="btnUndoMapping"/);
  assert.match(html, /id="btnRedoMapping"/);
  assert.match(html, /id="btnSaveCandidate"/);
  assert.match(html, /id="candidateComparison"/);
  assert.match(script, /mappingSnapshots/);
  assert.match(read('README.md'), /最大50段階/);
  assert.match(read('README.en.md'), /up to 50 states/i);
});

test('word-candidate helper is explicit, manual, bilingual, and documented', () => {
  const html = read('index.html');
  const script = read('script.js');
  assert.match(html, /id="wordCandidateCipher"/);
  assert.match(html, /id="btnFindWordCandidates"/);
  assert.match(html, /id="wordCandidateResults"/);
  assert.match(script, /checkWordCandidate/);
  assert.match(script, /commitMapping\(checked\.mapping\)/);
  assert.match(read('README.md'), /内蔵語彙[^\n]*学習用/);
  assert.match(read('README.en.md'), /built-in vocabulary[^\n]*learning/i);
  assert.match(read('README.md'), /順位付け[^\n]*行いません/);
  assert.match(read('README.en.md'), /does not rank/i);
});
