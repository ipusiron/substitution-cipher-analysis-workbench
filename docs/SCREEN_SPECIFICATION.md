# Substitution Cipher Analysis Workbench
## Screen Specification

## 1. Global Layout

### Header
- Tool name: "Substitution Cipher Analysis Workbench"
- Subtitle: "手動による換字式暗号解析支援ツール"
- Help button (opens modal with usage instructions)

### Ciphertext Input Area (Persistent)
- Multi-line text area
- Legend:
  - A–Z: unresolved ciphertext
  - a–z: confirmed plaintext
- Buttons:
  - Normalize input (uppercase, remove symbols)
  - Clear
  - Copy to clipboard
- Character counter (total / uppercase / lowercase)

### Character Mapping Section
- 26-cell grid (A-Z)
- Each cell: label + input field
- Apply button: applies mappings to ciphertext
- Reset button: clears all mappings
- Visual feedback for filled/empty cells

### Footer
- GitHub repository link
- Project attribution

## 2. Phase Navigation

### Phase 1: Overview (概観)
Tabs:
- Statistics (統計)
- Index of Coincidence (一致指数)
- Word Spacing (単語間隔)
- Repeated Sequences (繰り返し)

### Phase 2: Hypothesis Generation (仮説生成)
Tabs:
- Word Hints (単語ヒント)
- Frequency Analysis (頻度分析)

### Phase 3: Hypothesis Verification (仮説検証)
Tabs:
- N-grams (N-gram)
- Pattern Analysis (パターン)

### Phase 4: Advanced (上級)
Tabs:
- Kasiski Test (Kasiski)

## 3. Common Tab Header (Mandatory)
Each tab must show:
- What this analysis reveals (description)
- Run Analysis button
- Reference Data button (📖 資料)
- Last execution timestamp (optional)

## 4. Statistics Tab
Layout:
- Summary cards grid (3 columns on tablet+):
  - Total characters
  - Uppercase count
  - Lowercase count
  - Spaces
  - Symbols
  - Word count
- Letter sets (horizontal on tablet+):
  - Unresolved letters (A-Z remaining)
  - Resolved letters (mapped letters)
  - Missing letters (not in ciphertext)
- **Progress pie chart**: visual decryption progress
- **Frequency ranking table**: sorted letter counts
- **Mapping status grid**: 26-cell current mapping display

## 5. IC Tab
Layout:
- Calculated IC value (large display)
- Reference ranges bar:
  - English: 0.065–0.069
  - Random: ~0.038
- Language IC reference table
- Disclaimer text

## 6. Word Spacing Tab
Layout:
- Spacing summary statistics
- Word length distribution (bar chart)
- Highlight controls for ciphertext viewer

## 7. Repeated Sequences Tab
Layout:
- Split view (side by side on tablet+):
  - Left: repetition table (pattern, length, count, positions)
  - Right: ciphertext viewer with highlights
- Click row to highlight in viewer

## 8. Word Hints Tab
Layout:
- Split view:
  - Language constraints section
  - Statistical hints section
- Ciphertext viewer

## 9. Frequency Analysis Tab
Layout:
- Frequency bar chart with:
  - Ciphertext frequencies (bars)
  - English standard frequencies (overlay line)
- Frequency groups table:
  - High frequency letters
  - Medium frequency letters
  - Low frequency letters

## 10. N-grams Tab
Layout:
- Mode toggle: 2-gram / 3-gram
- Split view:
  - Left: ranking table (clickable rows)
  - Right: ciphertext viewer with highlights
- Navigation: Previous / Next buttons
- Always show disclaimer

## 11. Pattern Analysis Tab
Layout:
- Split view:
  - Pattern sections:
    - Pattern word table
    - Non-pattern word table
    - Double letters
    - Reversible pairs
  - Ciphertext viewer

## 12. Kasiski Test Tab
Layout:
- Split view:
  - Left: Results sections
    - Repeated sequences table
    - Distance analysis
    - Factor analysis
    - Estimated key lengths
  - Right: ciphertext viewer with highlights

## 13. Ciphertext Viewer (Shared Component)
- Monospaced text (word-break enabled)
- Highlight overlays (colored backgrounds)
- Navigation controls (Previous / Next)
- Highlight toggle
- Match counter display

## 14. Modals

### Help Modal
- Keyboard shortcuts table
- Basic usage instructions
- Close button / Esc key

### Reference Data Modal
- Tab-specific reference data
- Statistical tables
- Close button / Esc key

## 15. Responsive Design

### Mobile (default, < 600px)
- Single column layout
- Stacked navigation
- Phase buttons show numbers only
- Mapping grid: 2 rows of 13
- Touch-friendly button sizes (min 44px)

### Tablet (600px+)
- Two-column layouts where appropriate
- Phase names visible
- Split views side by side
- Mapping grid: single row of 13 + 13

### Laptop/Desktop (900px+)
- Maximum content width
- Enhanced spacing
- Full feature visibility

## 16. UX Rules
- No automatic execution on input change
- No answer-like labels
- All language phrased as hints or observations
- Japanese UI text throughout
- Consistent button styling
- Clear visual feedback for interactions

## 17. Color Scheme
- Primary: #007bff (blue)
- Success: #28a745 (green)
- Warning: #ffc107 (yellow)
- Danger: #dc3545 (red)
- Background: #f8f9fa (light gray)
- Text: #333 (dark gray)
- Highlight: rgba(255, 255, 0, 0.3) (yellow overlay)

## 18. External Links
- IC Learning Visualizer
- Frequency Analyzer
- RepeatSeq Analyzer
- GitHub repository (footer)
