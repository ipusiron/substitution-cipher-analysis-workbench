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

  function normalizeCiphertext(source) {
    return String(source ?? '')
      .toUpperCase()
      .replace(/[^A-Z\s]/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }

  return {
    ALPHABET,
    createEmptyMapping,
    normalizeMapping,
    validateMapping,
    applyMapping,
    analyzeFrequency,
    normalizeCiphertext
  };
});
