# Substitution Cipher Analysis Workbench

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/substitution-cipher-analysis-workbench?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/substitution-cipher-analysis-workbench?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/substitution-cipher-analysis-workbench)
![GitHub license](https://img.shields.io/github/license/ipusiron/substitution-cipher-analysis-workbench)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://ipusiron.github.io/substitution-cipher-analysis-workbench/)

**Day106 — Security Tools Built with Generative AI 200**

[日本語](README.md)

This browser-based workbench supports manual analysis of substitution ciphers. It combines statistics, frequency comparisons, N-grams, word patterns, and repeated-sequence observations without automatically solving or ranking answers. Applying a mapping does not modify the ciphertext; it updates a separate derived plaintext candidate.

---

## 🌐 Live demo

**[Open the GitHub Pages demo](https://ipusiron.github.io/substitution-cipher-analysis-workbench/)**

The application runs entirely in the browser.

## 📸 Screenshots

> ![Mapping history and comparison](assets/screenshot1.png)
>
> *Compare a named mapping candidate with the current mapping without changing the ciphertext*

> ![N-gram analysis](assets/screenshot2.png)
>
> *Frequent-sequence observations in the N-gram tab*

## ✨ Features

| Phase | Purpose | Tabs |
|---|---|---|
| Phase 1: Overview | Observe ciphertext properties | Statistics, IC, spacing, repeats |
| Phase 2: Hypotheses | Form mapping hypotheses | Word hints, frequency |
| Phase 3: Verification | Compare hypotheses with the full text | N-grams, patterns |
| Phase 4: Advanced | Observe polyalphabetic-cipher clues | Kasiski examination |

- One-to-one validation for the 26-letter mapping grid
- A derived plaintext candidate that leaves the ciphertext unchanged
- Undo and redo for up to 50 valid mapping states
- Up to 20 named mapping candidates with letter-by-letter comparison and restoration
- Frequency percentages that always use every ciphertext letter as the denominator
- Index of Coincidence, spacing, repeat, word-pattern, N-gram, and Kasiski observations
- Highlight navigation and tab-specific reference notes
- Japanese/English UI and local browser storage

## 📖 Usage

1. Paste the ciphertext into the input area.
2. Normalize it if uppercase A–Z text is appropriate for the exercise.
3. Run analyses in Phase 1 and Phase 2.
4. Enter tentative ciphertext-to-plaintext mappings.
5. Inspect the derived candidate; the original ciphertext remains unchanged.
6. Name useful mapping states and compare additions, changes, and removals.
7. Use undo, redo, or candidate restoration to revisit a branch.
8. Compare multiple independent observations and revise the hypothesis.

Uppercase letters in the candidate are unresolved ciphertext letters. Lowercase letters are plaintext letters produced by confirmed mappings. A plaintext letter cannot be assigned to more than one ciphertext letter.

Change history keeps up to 50 states for the current page session. You can name up to 20 candidates; the top-level Save action includes them in the saved workspace. Restoring a candidate changes only the mapping and never the ciphertext.

### Keyboard shortcuts

| Key | Action |
|---|---|
| `1`–`4` | Switch phase |
| `Ctrl+S` | Save the workspace |
| `Ctrl+M` | Update the derived candidate |
| `Ctrl+Enter` | Run the current analysis |
| `?` | Open Help |
| `Esc` | Close a modal |

## 🎯 Use cases

- **Falsify a mapping hypothesis:** set a mapping such as `A→e`, then compare its effect across word patterns, N-grams, and frequency differences.
- **Compare hypothesis branches:** save frequency-based and word-pattern-based mappings under different names, then inspect their letter-level differences.
- **Observe sample-size effects:** compare short and long samples to see why IC and frequency values can diverge from reference data.
- **Learn the one-to-one constraint:** see an immediate conflict when two ciphertext letters are assigned the same plaintext letter.
- **Contrast cipher families:** compare monoalphabetic observations with Kasiski candidate factors while keeping their scopes separate.
- **Classroom exercises:** record human reasoning before consulting an automated solver.

## ⚠️ Limitations

- A small frequency difference does not prove a letter mapping.
- IC alone cannot determine a cipher type or language.
- The most frequent Kasiski factor does not determine the key length.
- Short texts, proper names, technical vocabulary, style, and altered spacing can differ substantially from reference corpora.
- Outputs are observations, not proof of a solution, authenticity, or cryptographic strength.
- History and candidate comparison show differences; they do not score which hypothesis is correct.

## 🔗 Related tools

- [IC Learning Visualizer](https://ipusiron.github.io/ic-learning-visualizer/)
- [Frequency Analyzer](https://ipusiron.github.io/frequency-analyzer/)
- [RepeatSeq Analyzer](https://ipusiron.github.io/repeatseq-analyzer/)

## 📁 Directory structure

```text
substitution-cipher-analysis-workbench/
├── favicon.svg         # Browser icon
├── index.html          # Application structure and CSP
├── logic.js            # Testable mapping and frequency core
├── script.js           # Analysis and bilingual UI behavior
├── style.css           # Shared styles
├── style-mobile.css    # Mobile-first layout
├── style-tablet.css    # Enhancements from 600 px
├── style-laptop.css    # Enhancements from 900 px
├── README.md           # Japanese documentation
├── README.en.md        # English documentation
├── package.json        # Test command
├── test/               # Node.js regression tests
├── docs/               # Detailed and screen specifications
├── .github/workflows/  # Continuous integration
├── assets/             # Screenshots
└── LICENSE             # MIT License
```

## 💻 Requirements

- A modern browser with JavaScript enabled
- No server or third-party library is required; `file://` and static HTTP hosting are supported

## 📄 License

See [LICENSE](LICENSE).

## 🛠️ About this project

This tool is part of the “Security Tools Built with Generative AI 200” project, an initiative to build and publish security-related tools over 100 days with assistance from generative AI.

See the [project page](https://akademeia.info/?page_id=44607) for the other tools.
