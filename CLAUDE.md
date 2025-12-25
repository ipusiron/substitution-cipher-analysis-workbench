# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Substitution Cipher Analysis Workbench is a **manual cryptanalysis tool** for substitution ciphers. It does NOT perform automatic decryption - its purpose is to support and accelerate human reasoning through various analysis tabs.

Key design principles:
- Manual analysis only (no brute force, no auto-solving)
- Phase-based thinking support (Overview → Hypothesis Generation → Hypothesis Verification)
- English ciphertext assumed
- Uppercase letters (A–Z): unresolved ciphertext
- Lowercase letters (a–z): confirmed plaintext
- Japanese UI text throughout

## Development

This is a static web application using plain HTML/CSS/JavaScript (no frameworks). To run locally, open `index.html` in a browser or use a local server:

```bash
python -m http.server 8000
# Then open http://localhost:8000
```

## Architecture

### Analysis Phases

The tool is organized into three phases with multiple analysis tabs:

**Phase 1: Overview** - Understand the nature of ciphertext
- Statistics (character counts, progress indicator)
- Index of Coincidence (IC)
- Word Spacing
- Repeated Sequences

**Phase 2: Hypothesis Generation** - Form candidate mappings
- Word Hints (language constraints + statistical hints)
- Frequency Analysis

**Phase 3: Hypothesis Verification** - Verify hypotheses
- N-grams / Adjacency (2-gram, 3-gram)
- Pattern Word Analysis

### UX Rules
- No analysis runs automatically on input change (triggered manually per tab)
- All outputs are hints/observations, never labeled as "answer" or "solution"
- Each tab must show: what the analysis reveals, what to look at next, Run Analysis button, last execution timestamp

### CSS Architecture (Mobile-First)

Uses separate CSS files loaded conditionally:
- `style.css` - Base/common styles
- `style-mobile.css` - Mobile-specific (no media query)
- `style-tablet.css` - Loaded at `min-width: 600px`
- `style-laptop.css` - Loaded at `min-width: 900px`

## Deployment

- Deployed to GitHub Pages at `https://ipusiron.github.io/substitution-cipher-analysis-workbench/`
- The `.nojekyll` file ensures GitHub Pages serves files as-is
