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
    normalizeCiphertext
  };
});
