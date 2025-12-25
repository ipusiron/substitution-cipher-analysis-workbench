# Substitution Cipher Analysis Workbench
## Screen Specification

## 1. Global Layout

### Header
- Tool name
- Subtitle: Manual substitution cipher analysis
- Help button (modal)

### Ciphertext Input Area (Persistent)
- Multi-line text area
- Legend:
  - A–Z: unresolved ciphertext
  - a–z: confirmed plaintext
- Buttons:
  - Normalize input
  - Clear
- Character counter

## 2. Phase Navigation

### Phase 1: Overview
Tabs:
- Statistics
- Index of Coincidence
- Word Spacing
- Repeated Sequences

### Phase 2: Hypothesis Generation
Tabs:
- Word Hints
- Frequency Analysis

### Phase 3: Hypothesis Verification
Tabs:
- N-grams
- Pattern Analysis

## 3. Common Tab Header (Mandatory)
Each tab must show:
- What this analysis reveals
- What to look at next
- Run Analysis button
- Last execution timestamp

## 4. Statistics Tab
Layout:
- Summary cards (counts)
- Letter sets:
  - Unresolved letters
  - Resolved letters
  - Missing letters
- Progress indicator

## 5. IC Tab
Layout:
- Relative IC position bar
- Reference ranges
- Disclaimer text

## 6. Word Spacing Tab
Layout:
- Spacing summary
- Word length distribution
- Highlight controls

## 7. Repeated Sequences Tab
Layout:
- Left: repetition table
- Right: ciphertext viewer with highlights

## 8. Word Hints Tab
Layout:
- Language constraints section
- Statistical hints section
- Ciphertext viewer

## 9. Frequency Analysis Tab
Layout:
- Frequency bar chart
- Grouped frequency table

## 10. N-grams Tab
Layout:
- Mode switch: 2-gram / 3-gram
- Left: ranking list
- Right: ciphertext viewer
- Always show disclaimer

## 11. Pattern Analysis Tab
Layout:
- Pattern word table
- Non-pattern word table
- Extra observation panel
- Ciphertext viewer

## 12. Ciphertext Viewer (Shared Component)
- Monospaced text
- Highlight overlays
- Navigation controls
- Highlight toggle

## 13. UX Rules
- No automatic execution
- No answer-like labels
- All language phrased as hints or observations
- Japanese UI text throughout

