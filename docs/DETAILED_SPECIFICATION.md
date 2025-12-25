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
- No output is labeled as “answer” or “solution”

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

## 5. Statistics Analysis
Outputs:
- Total characters
- Uppercase count
- Lowercase count
- Spaces
- Symbols
- Newlines
- Word count (if spaces exist)
- Unresolved letters (A–Z)
- Resolved letters (a–z)
- Missing letters

Also:
- Decryption progress indicator (ratio of lowercase letters)

## 6. Index of Coincidence (IC)
- Calculate IC for the input
- Display relative position against reference ranges
- IC is informational only (no classification)

## 7. Word Spacing
- Detect existence and reliability of spaces
- Count consecutive spaces
- Word length distribution
- Optional highlighting of space positions

## 8. Repeated Sequences
- Detect repeated substrings
- Output pattern, length, count, positions
- Click to highlight occurrences in ciphertext

## 9. Word Hints
Separated into:
### Language Constraints
- One-letter words: a, I
- Common English constraints (non-binding tendencies)

### Statistical Hints
- Top frequent words (if spaces exist)
- Average word length
- Word length distribution

## 10. Frequency Analysis
- Letter frequency (A–Z)
- Bar chart visualization
- Probability-based grouping (high / mid / low)

## 11. N-grams / Adjacency
- 2-gram frequency (Top 25)
- 3-gram frequency (Top 10)
- Highlight on selection
- Explicit disclaimer: tendency only

## 12. Pattern Word Analysis
### Pattern Words
- Patterns like 121, 122, 1213
- Frequency
- Position classification (start / middle / end)

### Non-pattern Words
- All-unique patterns (e.g. 12345)
- Filter by length and frequency
- Marked as “attention candidates” only

### Extra Observations
- Double letters (LL, EE, etc.)
- Reversible pairs (er-re, on-no, etc.)

## 13. Ciphertext Viewer
- Monospaced display
- Highlight on selection
- Next / Previous navigation
- Toggle highlights

## 14. Non-Goals
- No key guessing
- No plaintext guessing
- No scoring or ranking of answers
- No automatic substitution mapping

