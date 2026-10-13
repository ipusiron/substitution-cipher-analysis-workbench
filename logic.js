(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SubstitutionWorkbenchCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function createEmptyMapping() {
    return Object.fromEntries([...ALPHABET].map(letter => [letter, '']));
  }

  function normalizeMapping(candidate) {
    const normalized = createEmptyMapping();
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      return normalized;
    }
    for (const letter of ALPHABET) {
      const value = typeof candidate[letter] === 'string'
        ? candidate[letter].trim().toLowerCase()
        : '';
      normalized[letter] = /^[a-z]$/.test(value) ? value : '';
    }
    return normalized;
  }

  function validateMapping(candidate) {
    const mapping = normalizeMapping(candidate);
    const owners = new Map();
    const conflicts = [];
    for (const cipher of ALPHABET) {
      const plain = mapping[cipher];
      if (!plain) continue;
      if (owners.has(plain)) {
        conflicts.push({ plain, ciphers: [owners.get(plain), cipher] });
      } else {
        owners.set(plain, cipher);
      }
    }
    return { valid: conflicts.length === 0, mapping, conflicts };
  }

  function applyMapping(source, candidate) {
    const validation = validateMapping(candidate);
    if (!validation.valid) {
      return { ok: false, text: String(source ?? ''), conflicts: validation.conflicts };
    }
    const text = [...String(source ?? '')].map(char => {
      const upper = char.toUpperCase();
      if (!/^[A-Z]$/.test(upper)) return char;
      return validation.mapping[upper] || upper;
    }).join('');
    return { ok: true, text, conflicts: [] };
  }

  function analyzeFrequency(source, candidate) {
    const validation = validateMapping(candidate);
    const counts = Object.fromEntries([...ALPHABET].map(letter => [letter, 0]));
    const letters = String(source ?? '').toUpperCase().replace(/[^A-Z]/g, '');
    for (const letter of letters) counts[letter]++;
    const total = letters.length;
    const rows = [...ALPHABET].map(letter => ({
      letter,
      count: counts[letter],
      percent: total ? counts[letter] / total * 100 : 0,
      mappedTo: validation.mapping[letter]
    }));
    rows.sort((a, b) => b.count - a.count || a.letter.localeCompare(b.letter));
    return {
      total,
      rows,
      percentTotal: rows.reduce((sum, row) => sum + row.percent, 0),
      validMapping: validation.valid,
      conflicts: validation.conflicts
    };
  }

  function mappingsEqual(left, right) {
    const a = normalizeMapping(left);
    const b = normalizeMapping(right);
    return ALPHABET.split('').every(letter => a[letter] === b[letter]);
  }

  function diffMappings(reference, current) {
    const before = normalizeMapping(reference);
    const after = normalizeMapping(current);
    const rows = [];
    for (const cipher of ALPHABET) {
      if (before[cipher] === after[cipher]) continue;
      const type = !before[cipher] ? 'added' : !after[cipher] ? 'removed' : 'changed';
      rows.push({ cipher, before: before[cipher], after: after[cipher], type });
    }
    return {
      rows,
      counts: {
        added: rows.filter(row => row.type === 'added').length,
        changed: rows.filter(row => row.type === 'changed').length,
        removed: rows.filter(row => row.type === 'removed').length
      }
    };
  }

  function normalizeSnapshots(candidate, limit = 20) {
    if (!Array.isArray(candidate)) return [];
    const normalized = [];
    const ids = new Set();
    for (const item of candidate) {
      if (normalized.length >= limit || !item || typeof item !== 'object') continue;
      const validation = validateMapping(item.mapping);
      const id = typeof item.id === 'string' ? item.id.slice(0, 80) : '';
      const name = typeof item.name === 'string' ? item.name.trim().slice(0, 40) : '';
      const createdAt = Number.isFinite(item.createdAt) && item.createdAt > 0
        ? Math.trunc(item.createdAt)
        : 0;
      if (!validation.valid || !id || ids.has(id) || !name || !createdAt) continue;
      ids.add(id);
      normalized.push({ id, name, createdAt, mapping: validation.mapping });
    }
    return normalized;
  }

  function normalizeCiphertext(source) {
    return String(source ?? '')
      .toUpperCase()
      .replace(/[^A-Z\s]/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }

  function normalizeWord(source) {
    const word = String(source ?? '').trim().toUpperCase();
    return /^[A-Z]+$/.test(word) ? word : '';
  }

  function wordPattern(source) {
    const word = normalizeWord(source);
    if (!word) return '';
    const numbers = new Map();
    let next = 1;
    return [...word].map(letter => {
      if (!numbers.has(letter)) numbers.set(letter, next++);
      return numbers.get(letter);
    }).join('-');
  }

  function checkWordCandidate(cipherSource, plainSource, candidate) {
    const cipherWord = normalizeWord(cipherSource);
    const plainWord = normalizeWord(plainSource).toLowerCase();
    const validation = validateMapping(candidate);
    const result = {
      valid: false,
      reason: '',
      cipherWord,
      plainWord,
      pattern: wordPattern(cipherWord),
      mapping: validation.mapping,
      additions: [],
      retained: []
    };
    if (!validation.valid) {
      result.reason = 'invalid-mapping';
      return result;
    }
    if (!cipherWord || !plainWord) {
      result.reason = 'invalid-word';
      return result;
    }
    if (cipherWord.length !== plainWord.length) {
      result.reason = 'length';
      return result;
    }
    if (wordPattern(cipherWord) !== wordPattern(plainWord)) {
      result.reason = 'pattern';
      return result;
    }

    const proposed = { ...validation.mapping };
    const owners = new Map();
    for (const cipher of ALPHABET) {
      if (proposed[cipher]) owners.set(proposed[cipher], cipher);
    }
    for (let index = 0; index < cipherWord.length; index++) {
      const cipher = cipherWord[index];
      const plain = plainWord[index];
      if (proposed[cipher] && proposed[cipher] !== plain) {
        result.reason = 'cipher-conflict';
        return result;
      }
      if (owners.has(plain) && owners.get(plain) !== cipher) {
        result.reason = 'plain-conflict';
        return result;
      }
      if (validation.mapping[cipher] === plain) {
        if (!result.retained.some(item => item.cipher === cipher)) {
          result.retained.push({ cipher, plain });
        }
      } else if (!proposed[cipher]) {
        proposed[cipher] = plain;
        owners.set(plain, cipher);
        if (!result.additions.some(item => item.cipher === cipher)) {
          result.additions.push({ cipher, plain });
        }
      }
    }
    result.valid = true;
    result.reason = 'compatible';
    result.mapping = proposed;
    return result;
  }

  function suggestWordCandidates(cipherSource, words, candidate, limit = 50) {
    const cipherWord = normalizeWord(cipherSource);
    const maximum = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 200) : 50;
    const unique = new Set();
    for (const source of Array.isArray(words) ? words : []) {
      const word = normalizeWord(source).toLowerCase();
      if (word) unique.add(word);
    }
    const accepted = [];
    let compatibleCount = 0;
    const rejected = { length: 0, pattern: 0, mapping: 0 };
    for (const word of [...unique].sort((a, b) => a.localeCompare(b, 'en'))) {
      const checked = checkWordCandidate(cipherWord, word, candidate);
      if (checked.valid) {
        compatibleCount++;
        if (accepted.length < maximum) accepted.push(checked);
      } else if (checked.reason === 'length') {
        rejected.length++;
      } else if (checked.reason === 'pattern') {
        rejected.pattern++;
      } else {
        rejected.mapping++;
      }
    }
    return {
      cipherWord,
      pattern: wordPattern(cipherWord),
      candidates: accepted,
      compatibleCount,
      truncated: compatibleCount > accepted.length,
      rejected
    };
  }

  return {
    ALPHABET,
    createEmptyMapping,
    normalizeMapping,
    validateMapping,
    applyMapping,
    analyzeFrequency,
    mappingsEqual,
    diffMappings,
    normalizeSnapshots,
    normalizeCiphertext,
    wordPattern,
    checkWordCandidate,
    suggestWordCandidates
  };
});
