# Substitution Cipher Analysis Workbench
## Detailed Specification

## 1. Purpose
This tool is a **manual cryptanalysis workbench** for substitution ciphers.
It does NOT perform automatic decryption.
Its purpose is to support and accelerate human reasoning.

## 2. Core Principles
- Manual analysis only
- No brute force, no auto-solving
- Phase-based thinking support
- English ciphertext assumed
- Uppercase letters (A–Z): unresolved ciphertext
- Lowercase letters (a–z): confirmed plaintext

## 3. Global Rules
- Input is ciphertext only
- Analysis is triggered manually per tab
- No analysis runs automatically on input change
- All outputs are hints, tendencies, or observations
- No output is labeled as "answer" or "solution"

## 4. Analysis Phases

### Phase 1: Overview
Goal: Understand the nature of the ciphertext.

Tabs:
- Statistics
- Index of Coincidence (IC)
- Word Spacing
- Repeated Sequences

### Phase 2: Hypothesis Generation
Goal: Form candidate mappings and word hypotheses.

Tabs:
- Word Hints
- Frequency Analysis

### Phase 3: Hypothesis Verification
Goal: Verify hypotheses against the full text.

Tabs:
- N-grams / Adjacency
- Pattern Word Analysis

### Phase 4: Advanced
Goal: Analyze polyalphabetic ciphers.

Tabs:
- Kasiski Test

## 5. Character Mapping Section
- 26-character input grid (A-Z)
- Each input maps a ciphertext letter to a plaintext letter
- Apply button: applies all mappings to ciphertext
- Reset button: clears all mappings
- Mapping validation: prevents duplicate assignments

## 6. Statistics Analysis
Outputs:
- Total characters
- Uppercase count (unresolved)
- Lowercase count (resolved)
- Spaces
- Symbols
- Newlines
- Word count (if spaces exist)
- Unresolved letters (A–Z)
- Resolved letters (a–z)
- Missing letters

Enhanced Features:
- **Decryption progress pie chart**: visual ratio of resolved/unresolved
- **Frequency ranking table**: sorted letter counts with percentages
- **Mapping status grid**: 26-cell grid showing current mappings

## 7. Index of Coincidence (IC)
- Calculate IC for the input
- Display relative position against reference ranges
- IC is informational only (no classification)
- Reference ranges:
  - English: 0.065–0.069
  - Random: ~0.038
  - Various other languages for comparison

## 8. Word Spacing
- Detect existence and reliability of spaces
- Count consecutive spaces
- Word length distribution
- Optional highlighting of space positions

## 9. Repeated Sequences
- Detect repeated substrings
- Output pattern, length, count, positions
- Click to highlight occurrences in ciphertext

## 10. Word Hints
Separated into:
### Language Constraints
- One-letter words: a, I
- Common English constraints (non-binding tendencies)

### Statistical Hints
- Top frequent words (if spaces exist)
- Average word length
- Word length distribution

## 11. Frequency Analysis
- Letter frequency (A–Z)
- Bar chart visualization with English standard frequencies overlay
- Frequency groups:
  - High frequency (E, T, A, O, I, N, S, H, R)
  - Medium frequency (D, L, C, U, M, W, F, G, Y, P, B)
  - Low frequency (V, K, J, X, Q, Z)

## 12. N-grams / Adjacency
- Toggle between 2-gram and 3-gram modes
- Top 25 bigrams / Top 10 trigrams
- Highlight on selection
- Explicit disclaimer: tendency only
- Reference data for common English N-grams

## 13. Pattern Word Analysis
### Pattern Words
- Patterns like 121, 122, 1213
- Frequency
- Position classification (start / middle / end)
- Common pattern words reference

### Non-pattern Words
- All-unique patterns (e.g. 12345)
- Filter by length and frequency
- Marked as "attention candidates" only

### Extra Observations
- Double letters (LL, EE, etc.)
- Reversible pairs (er-re, on-no, etc.)

## 14. Kasiski Test (Phase 4)
- Detect repeated sequences of length 3+
- Calculate distances between repetitions
- Factor analysis of distances
- Key length estimation for polyalphabetic ciphers
- Visual highlighting of repeated sequences

## 15. Ciphertext Viewer
- Monospaced display
- Highlight on selection
- Next / Previous navigation
- Toggle highlights
- Position counter

## 16. Reference Data Feature
- Each tab has a "📖 資料" button
- Opens modal with English text statistical reference data
- Data sourced from cryptanalysis reference materials:
  - Letter frequencies
  - Common bigrams/trigrams
  - Word patterns
  - IC values for various languages

## 17. External Tool Links
Links to related analysis tools:
- IC Learning Visualizer
- Frequency Analyzer
- RepeatSeq Analyzer

## 18. Keyboard Shortcuts
| Key | Function |
|-----|----------|
| 1-4 | Phase switch |
| Ctrl+S | Save state |
| Ctrl+M | Apply mapping |
| Ctrl+Enter | Run analysis |
| ? | Show help |
| Esc | Close modal |

## 19. State Persistence
- Save/Load functionality via localStorage
- Preserves:
  - Ciphertext input
  - Character mappings
  - Current phase/tab selection

## 20. Non-Goals
- No key guessing
- No plaintext guessing
- No scoring or ranking of answers
- No automatic substitution mapping
