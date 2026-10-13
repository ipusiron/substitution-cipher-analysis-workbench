// Substitution Cipher Analysis Workbench
// Manual cryptanalysis support tool

(function() {
  'use strict';

  const Core = window.SubstitutionWorkbenchCore;

  // State
  let currentPhase = 1;
  let currentTab = 'statistics';
  let ngramMode = 2;
  let highlightState = {};
  let highlightColor = 'yellow';
  let mapping = Core.createEmptyMapping();
  const MAX_MAPPING_HISTORY = 50;
  const MAX_SNAPSHOTS = 20;
  let mappingHistory = [Core.createEmptyMapping()];
  let mappingHistoryIndex = 0;
  let mappingSnapshots = [];
  let snapshotSerial = 0;
  let language = localStorage.getItem('cipher-workbench-language') === 'en' ? 'en' : 'ja';
  const executedAnalyses = new Set();
  const lastRunTimes = new Map();
  let activeReferenceType = null;
  let wordCandidateHasRun = false;
  let lastWordCandidateWords = [];

  const MESSAGES = {
    ja: {
      subtitle: '手動による換字式暗号解析支援ツール', save: '保存', saveTitle: '作業状態を保存 (Ctrl+S)', load: '読込', loadTitle: '作業状態を読込', help: 'ヘルプ', helpTitle: 'ヘルプ (?)',
      inputTitle: '暗号文入力', inputLegend: 'A-Z: 暗号文字', inputPlaceholder: '暗号文を入力してください...', normalize: '正規化', normalizeTitle: '大文字化・記号除去', clear: 'クリア', copy: 'コピー', copyTitle: '暗号文をクリップボードにコピー', characters: '文字',
      mappingTitle: '文字マッピング', apply: '候補を更新', applyTitle: '復号候補を更新 (Ctrl+M)', reset: 'リセット', derivedTitle: '復号候補（派生表示）', copyDerived: '候補をコピー', derivedNote: '入力した暗号文は変更しません。確定した対応だけを小文字で表示します。', candidateWorkspaceTitle: '対応候補の履歴と比較', candidateWorkspaceNote: '対応変更を戻したり、名前を付けた候補と現在の対応を比較したりできます。暗号文は変更しません。', undoMapping: '戻す', redoMapping: 'やり直す', candidateNameLabel: '候補名', candidateNamePlaceholder: '例: 頻度仮説A', saveCandidate: '現在の対応を保存', savedCandidatesLabel: '保存した候補', restoreCandidate: 'この候補へ戻す', deleteCandidate: '削除', noSavedCandidates: '保存した候補はありません',
      phaseOverview: '概観', phaseHypothesis: '仮説生成', phaseVerification: '仮説検証', phaseAdvanced: '上級', tabStatistics: '統計', tabIc: '一致指数', tabSpacing: '単語間隔', tabRepeated: '繰り返し', tabWordHints: '単語ヒント', tabFrequency: '頻度分析', tabPattern: 'パターン',
      statisticsDesc: '暗号文と復号候補の基本統計を表示します。文字数、種類別のカウント、作業進捗を確認できます。', statisticsNext: '次に見るべき: 一致指数タブでIC値を確認し、暗号の種類を検討',
      icDesc: '一致指数（Index of Coincidence）を計算し、参照範囲と比較します。', icNext: '次に見るべき: IC値をほかの観察結果と組み合わせて暗号種別を検討',
      spacingDesc: 'スペースの存在と単語長の分布を観察します。区切りが正しいとは限りません。', spacingNext: '次に見るべき: 単語ヒントタブで1文字語や頻出語を確認',
      repeatedDesc: '繰り返し出現する部分文字列を検出します。クリックでハイライト表示します。', repeatedNext: '次に見るべき: 繰り返しから共通語や接辞の仮説を立てる',
      wordHintsDesc: '言語上の制約と統計的な観察候補を表示します。', wordHintsNext: '次に見るべき: 頻度分析で文字の出現頻度を確認',
      frequencyDesc: '暗号文字の出現頻度を、全文字数を分母として英語の参照頻度と比較します。', frequencyNext: '次に見るべき: 高頻度文字を仮説候補として比較し、ほかの証拠で検証',
      ngramsDesc: '2〜4文字の連続列の頻度を表示します。', ngramsNext: '注意: N-gram頻度は観察指標であり、対応の正しさを証明しません。',
      patternDesc: '単語内の同字反復パターンと、すべて異なる文字からなる語を分析します。', patternNext: '次に見るべき: 二重文字や可逆ペアもほかの観察と組み合わせる',
      kasiskiDesc: 'Kasiski（カシスキー）テストで多表式暗号の鍵長候補を観察します。', kasiskiNext: '注意: 単一換字式には適用しません。反復距離だけで鍵長を断定できません。',
      reference: '📖 資料', run: '分析実行', notRun: '未実行', runPrompt: '「分析実行」ボタンを押して解析を開始してください。', showSpaces: 'スペース位置表示', clickRow: '表の行をクリック→', previous: '◀ 前', next: '次 ▶', highlight: 'ハイライト', highlightColor: 'ハイライト色', languageConstraints: '言語制約', statisticalHints: '統計的ヒント', toggleHighlight: 'ハイライト切替', patternWords: 'パターンワード', nonPatternWords: '非パターンワード（注目候補）', extraObservations: '追加観察', clickPattern: 'パターンをクリック→', close: '閉じる', githubLink: '🔗 GitHubリポジトリはこちら', referenceTitle: '参考資料', yellow: '黄', cyan: '水色', lime: '緑', pink: 'ピンク', orange: '橙', wordCandidateTitle: '単語候補の照合', wordCandidateNote: '反復パターンと現在の対応に両立する語だけを列挙します。正解率や確率の順位付けは行いません。', wordCandidateCipherLabel: '暗号語', wordCandidateCipherPlaceholder: '例: XYYX', useLearningVocabulary: '内蔵の学習用語彙を使う', wordCandidateCustomLabel: '追加候補（空白・改行・カンマ区切り）', wordCandidateCustomPlaceholder: '例: noon deed peep', findWordCandidates: '候補を照合', clearWordCandidates: '候補欄をクリア', wordCandidateLimit: '内蔵語彙は学習用の小規模な一覧です。候補がないことは、その平文語が存在しない証拠にはなりません。',
      enterCipher: '暗号文を入力してください', saved: '作業状態を保存しました', saveFailed: '保存に失敗しました', loaded: '作業状態を復元しました', loadFailed: '保存データを読み込めませんでした', normalized: '正規化しました', copied: '暗号文をコピーしました', copiedDerived: '復号候補をコピーしました', copyFailed: 'コピーに失敗しました', mappingUpdated: '復号候補を更新しました', mappingEmpty: '有効なマッピングがありません', mappingReset: 'マッピングをリセットしました', duplicate: (plain, owner) => `「${plain}」は ${owner} に使用済みです。一対一対応になるようにしてください。`, lastRun: time => `最終実行: ${time}`, historyPosition: (position, total) => `変更履歴 ${position} / ${total}（最大${MAX_MAPPING_HISTORY}段階）`, defaultCandidate: number => `候補 ${number}`, candidateOption: (name, count) => `${name}（${count}文字）`, candidateSaved: name => `「${name}」を保存しました`, candidateRestored: name => `「${name}」の対応へ戻しました`, candidateDeleted: name => `「${name}」を削除しました`, candidateLimit: `保存候補は最大${MAX_SNAPSHOTS}件です`, candidateNeedsMapping: '1文字以上の対応を設定してから保存してください', compareNone: '保存候補を選ぶと、現在の対応との差分を表示します。', compareSame: name => `「${name}」と現在の対応は同じです。`, compareSummary: (name, added, changed, removed) => `「${name}」との比較: 追加 ${added}、変更 ${changed}、解除 ${removed}`, diffCipher: '暗号文字', diffSaved: '保存候補', diffCurrent: '現在', diffType: '差分', diffAdded: '追加', diffChanged: '変更', diffRemoved: '解除', unassigned: '未設定', wordCandidateNeedWord: 'A-Zの暗号語を入力してください。', wordCandidateNoSource: '内蔵語彙を使うか、追加候補を入力してください。', wordCandidateFound: (shown, total, pattern) => `${total}件が両立します${shown < total ? `（先頭${shown}件を表示）` : ''}（パターン ${pattern}）。アルファベット順で、正解順ではありません。`, wordCandidateNone: pattern => `両立する候補はありません（パターン ${pattern}）。語彙にない語は判定できません。`, wordCandidateExisting: '維持する対応', wordCandidateAdds: '追加する対応', wordCandidateNoAdds: '新しい対応なし', applyWordCandidate: 'この対応を適用', wordCandidateApplied: word => `「${word}」の対応を履歴へ追加しました。`, wordCandidateUnchanged: 'すべて現在の対応と同じです。', wordCandidateStale: '現在の対応とは両立しなくなりました。再照合してください。'
    },
    en: {
      subtitle: 'Manual substitution-cipher analysis workbench', save: 'Save', saveTitle: 'Save workspace (Ctrl+S)', load: 'Load', loadTitle: 'Load workspace', help: 'Help', helpTitle: 'Help (?)',
      inputTitle: 'Ciphertext input', inputLegend: 'A-Z: ciphertext letters', inputPlaceholder: 'Enter ciphertext...', normalize: 'Normalize', normalizeTitle: 'Uppercase and remove nonletters', clear: 'Clear', copy: 'Copy', copyTitle: 'Copy ciphertext to the clipboard', characters: 'characters',
      mappingTitle: 'Letter mapping', apply: 'Update candidate', applyTitle: 'Update the derived candidate (Ctrl+M)', reset: 'Reset', derivedTitle: 'Plaintext candidate (derived view)', copyDerived: 'Copy candidate', derivedNote: 'The ciphertext input is not modified. Only confirmed mappings appear in lowercase.', candidateWorkspaceTitle: 'Mapping history and comparison', candidateWorkspaceNote: 'Undo mapping changes or compare the current mapping with named candidates. The ciphertext is not modified.', undoMapping: 'Undo', redoMapping: 'Redo', candidateNameLabel: 'Candidate name', candidateNamePlaceholder: 'Example: Frequency hypothesis A', saveCandidate: 'Save current mapping', savedCandidatesLabel: 'Saved candidates', restoreCandidate: 'Restore this candidate', deleteCandidate: 'Delete', noSavedCandidates: 'No saved candidates',
      phaseOverview: 'Overview', phaseHypothesis: 'Hypotheses', phaseVerification: 'Verification', phaseAdvanced: 'Advanced', tabStatistics: 'Statistics', tabIc: 'Index of Coincidence', tabSpacing: 'Word spacing', tabRepeated: 'Repeats', tabWordHints: 'Word hints', tabFrequency: 'Frequency', tabPattern: 'Patterns',
      statisticsDesc: 'Shows basic statistics for the ciphertext and the derived candidate, including counts and work progress.', statisticsNext: 'Next: inspect the IC together with other evidence when considering the cipher type.',
      icDesc: 'Calculates the Index of Coincidence and compares it with reference values.', icNext: 'Next: combine the IC with other observations; do not classify a cipher from this value alone.',
      spacingDesc: 'Observes spaces and the word-length distribution. Existing separators may be false.', spacingNext: 'Next: inspect one-letter and frequent words in Word hints.',
      repeatedDesc: 'Finds repeated substrings. Select a row to highlight its occurrences.', repeatedNext: 'Next: use repeats to form hypotheses about common words or affixes.',
      wordHintsDesc: 'Shows language constraints and statistical observations.', wordHintsNext: 'Next: inspect letter counts in Frequency.',
      frequencyDesc: 'Compares ciphertext frequencies with English reference frequencies, using all letters as the denominator.', frequencyNext: 'Next: treat frequent letters as hypotheses and verify them with other evidence.',
      ngramsDesc: 'Shows frequencies of consecutive sequences from two to four letters.', ngramsNext: 'Caution: N-gram frequency is an observation, not proof of a mapping.',
      patternDesc: 'Analyzes repeated-letter word patterns and words whose letters are all distinct.', patternNext: 'Next: combine double letters and reversible pairs with other observations.',
      kasiskiDesc: 'Uses repeated-sequence distances to observe possible key lengths for polyalphabetic ciphers.', kasiskiNext: 'Caution: this does not apply to monoalphabetic substitution, and distances alone do not determine a key length.',
      reference: '📖 Reference', run: 'Run analysis', notRun: 'Not run', runPrompt: 'Select “Run analysis” to start.', showSpaces: 'Show spaces', clickRow: 'Select a row →', previous: '◀ Previous', next: 'Next ▶', highlight: 'Highlight', highlightColor: 'Highlight color', languageConstraints: 'Language constraints', statisticalHints: 'Statistical observations', toggleHighlight: 'Toggle highlights', patternWords: 'Pattern words', nonPatternWords: 'All-distinct words (candidates)', extraObservations: 'Additional observations', clickPattern: 'Select a pattern →', close: 'Close', githubLink: '🔗 GitHub repository', referenceTitle: 'Reference data', yellow: 'Yellow', cyan: 'Cyan', lime: 'Lime', pink: 'Pink', orange: 'Orange', wordCandidateTitle: 'Word-candidate compatibility', wordCandidateNote: 'Lists words compatible with the repetition pattern and current mapping. It does not rank correctness or probability.', wordCandidateCipherLabel: 'Ciphertext word', wordCandidateCipherPlaceholder: 'Example: XYYX', useLearningVocabulary: 'Use the built-in learning vocabulary', wordCandidateCustomLabel: 'Additional candidates (space, newline, or comma separated)', wordCandidateCustomPlaceholder: 'Example: noon deed peep', findWordCandidates: 'Check candidates', clearWordCandidates: 'Clear candidate fields', wordCandidateLimit: 'The built-in vocabulary is a small learning list. No result does not prove that a plaintext word is impossible.',
      enterCipher: 'Enter ciphertext first.', saved: 'Workspace saved.', saveFailed: 'Could not save the workspace.', loaded: 'Workspace restored.', loadFailed: 'Could not load the saved workspace.', normalized: 'Ciphertext normalized.', copied: 'Ciphertext copied.', copiedDerived: 'Plaintext candidate copied.', copyFailed: 'Could not copy to the clipboard.', mappingUpdated: 'Plaintext candidate updated.', mappingEmpty: 'There are no valid mappings to apply.', mappingReset: 'Mappings reset.', duplicate: (plain, owner) => `“${plain}” is already assigned to ${owner}. Keep the mapping one-to-one.`, lastRun: time => `Last run: ${time}`, historyPosition: (position, total) => `Change history ${position} / ${total} (up to ${MAX_MAPPING_HISTORY} states)`, defaultCandidate: number => `Candidate ${number}`, candidateOption: (name, count) => `${name} (${count} letters)`, candidateSaved: name => `Saved “${name}”.`, candidateRestored: name => `Restored the mapping from “${name}”.`, candidateDeleted: name => `Deleted “${name}”.`, candidateLimit: `You can save up to ${MAX_SNAPSHOTS} candidates.`, candidateNeedsMapping: 'Set at least one mapping before saving a candidate.', compareNone: 'Select a saved candidate to compare it with the current mapping.', compareSame: name => `The current mapping is identical to “${name}”.`, compareSummary: (name, added, changed, removed) => `Compared with “${name}”: ${added} added, ${changed} changed, ${removed} removed`, diffCipher: 'Cipher', diffSaved: 'Saved candidate', diffCurrent: 'Current', diffType: 'Difference', diffAdded: 'Added', diffChanged: 'Changed', diffRemoved: 'Removed', unassigned: 'Not set', wordCandidateNeedWord: 'Enter an A–Z ciphertext word.', wordCandidateNoSource: 'Use the built-in vocabulary or enter additional candidates.', wordCandidateFound: (shown, total, pattern) => `${total} compatible candidate(s)${shown < total ? `; showing the first ${shown}` : ''} (pattern ${pattern}). Alphabetical order is not a correctness ranking.`, wordCandidateNone: pattern => `No compatible candidate was found (pattern ${pattern}). Words outside the vocabulary cannot be evaluated.`, wordCandidateExisting: 'Existing assignments', wordCandidateAdds: 'Assignments to add', wordCandidateNoAdds: 'No new assignments', applyWordCandidate: 'Apply these assignments', wordCandidateApplied: word => `Added the assignments for “${word}” to history.`, wordCandidateUnchanged: 'All assignments already match the current mapping.', wordCandidateStale: 'This candidate no longer fits the current mapping. Check candidates again.'
    }
  };

  function t(key, ...args) {
    const value = MESSAGES[language][key];
    return typeof value === 'function' ? value(...args) : value;
  }

  function ui(ja, en) {
    return language === 'ja' ? ja : en;
  }

  // HTML escape function for XSS prevention
  function escapeHtml(str) {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return str.replace(/[&<>"']/g, char => escapeMap[char]);
  }

  // English letter frequencies (percentage)
  const ENGLISH_FREQ = {
    E: 12.7, T: 9.1, A: 8.2, O: 7.5, I: 7.0, N: 6.7, S: 6.3, H: 6.1, R: 6.0,
    D: 4.3, L: 4.0, C: 2.8, U: 2.8, M: 2.4, W: 2.4, F: 2.2, G: 2.0, Y: 2.0,
    P: 1.9, B: 1.5, V: 1.0, K: 0.8, J: 0.15, X: 0.15, Q: 0.10, Z: 0.07
  };

  // Small, deliberately non-exhaustive vocabulary for pattern-learning exercises.
  const LEARNING_VOCABULARY = `
    a i am an as at be by do go he if in is it me my no of oh on or ox so to up us we
    add age all and any are ask bad bag bar bat bed bee big bit book box boy bus but buy
    can car cat code come cool data day deed did dog door down each easy else end even ever
    eye fact far fast feel feet few find fire first fish five food foot for four free from
    game get give good green had has have he hello help her here high him his home hope how
    key kind know last late learn letter little long look made make man many map may mean men
    message more most move name near need never new next night noon not now number odd off old
    one only open other our out over own page pair paper pattern peep people play point proof
    read red repeat right run same say see seem set she short show simple small some space start
    state still stop such take tell test text than that the their them then there these they
    thing think this three time to too tool toot two under use used user very want way well were
    what when where which white who why will with word work world would write year yes you your
  `.trim().split(/\s+/);

  // Reference data for each analysis tab (merged with appendix data)
  const REFERENCE_DATA = {
    statistics: {
      title: '英文の基本統計',
      content: `
        <h3>文字の出現頻度（順位）</h3>
        <p><strong>E T A O I N S H R D L C U M W F G Y P B V K J X Q Z</strong></p>
        <p style="font-size: 0.85rem; color: #666;">覚え方: "ETAOIN SHRDLU" は最も頻出する12文字</p>

        <h3>平均的な英文の特徴</h3>
        <ul>
          <li>平均単語長はコーパスと数え方で変動（一般的な英語本文では約4〜5文字が目安）</li>
          <li>母音の割合: 約40%（A, E, I, O, U）</li>
          <li>最頻出文字 E: 約12.7%</li>
          <li>1文字単語は a と I のみ</li>
        </ul>

        <h3>頻度によるグループ分類</h3>
        <table class="ref-table">
          <tr><th>グループ</th><th>文字</th><th>出現確率</th></tr>
          <tr><td>最頻度</td><td>E</td><td>12%</td></tr>
          <tr><td>高頻度</td><td>T, A, O, I, N, S, H, R</td><td>6〜9%</td></tr>
          <tr><td>中頻度</td><td>D, L, U, C, M</td><td>3〜4%</td></tr>
          <tr><td>低頻度</td><td>P, F, Y, W, G, B, V</td><td>1.5〜2.8%</td></tr>
          <tr><td>稀頻度</td><td>J, K, Q, X, Z</td><td>1%以下</td></tr>
        </table>

        <h3>各言語の頻出文字</h3>
        <table class="ref-table">
          <tr><th>言語</th><th>頻出文字列</th></tr>
          <tr><td>英語</td><td>ETAOIN SHRDLU</td></tr>
          <tr><td>スペイン語</td><td>EAOSR NIDLT</td></tr>
          <tr><td>フランス語</td><td>ESAIT NRUOL</td></tr>
          <tr><td>ドイツ語</td><td>ENISR ATDHU</td></tr>
          <tr><td>イタリア語</td><td>EAION LRTSC</td></tr>
        </table>
      `
    },
    ic: {
      title: '一致指数（IC）参考値',
      content: `
        <h3>一致指数とは</h3>
        <p>テキストからランダムに選ばれた2つの文字が同じである確率です。</p>

        <h3>IC値の目安</h3>
        <table class="ref-table">
          <tr><th>暗号種別</th><th>IC値</th></tr>
          <tr><td>英語平文</td><td>0.0667 (6.7%)</td></tr>
          <tr><td>単一換字式暗号</td><td>0.0667（平文と同じ）</td></tr>
          <tr><td>ヴィジュネル暗号（短い鍵）</td><td>0.045〜0.055</td></tr>
          <tr><td>ヴィジュネル暗号（長い鍵）</td><td>0.040〜0.045</td></tr>
          <tr><td>完全ランダム</td><td>0.0385 (≈ 1/26)</td></tr>
        </table>

        <h3>各言語の一致指数</h3>
        <table class="ref-table">
          <tr><th>言語</th><th>IC値</th><th>言語</th><th>IC値</th></tr>
          <tr><td>チェコ語</td><td>5.1%</td><td>フィンランド語</td><td>7.0%</td></tr>
          <tr><td>ロシア語</td><td>5.3%</td><td>トルコ語</td><td>7.0%</td></tr>
          <tr><td>ポーランド語</td><td>6.1%</td><td>スペイン語</td><td>7.2%</td></tr>
          <tr><td>英語</td><td>6.7%</td><td>ドイツ語</td><td>7.3%</td></tr>
          <tr><td>デンマーク語</td><td>6.7%</td><td>イタリア語</td><td>7.4%</td></tr>
          <tr><td>スウェーデン語</td><td>6.8%</td><td>ポルトガル語</td><td>8.2%</td></tr>
          <tr><td>フランス語</td><td>6.9%</td><td></td><td></td></tr>
        </table>

        <h3>判定のポイント</h3>
        <ul>
          <li>単一換字式は平文のICを保つが、ICだけで暗号種別は決まらない</li>
          <li>多表式暗号ではICが一様ランダム値へ近づくことがある</li>
          <li>短い暗号文では標本変動が大きい</li>
        </ul>
      `
    },
    spacing: {
      title: '英語の単語長分布',
      content: `
        <h3>単語長の分布</h3>
        <table class="ref-table">
          <tr><th>単語長</th><th>割合</th><th>代表例</th></tr>
          <tr><td>1文字</td><td>約2%</td><td>a, I</td></tr>
          <tr><td>2文字</td><td>約17%</td><td>to, of, in, it, is</td></tr>
          <tr><td>3文字</td><td>約20%</td><td>the, and, for, are</td></tr>
          <tr><td>4文字</td><td>約17%</td><td>that, with, have</td></tr>
          <tr><td>5文字</td><td>約12%</td><td>their, about, which</td></tr>
          <tr><td>6文字以上</td><td>約32%</td><td>（様々）</td></tr>
        </table>

        <h3>各言語の平均単語長</h3>
        <table class="ref-table">
          <tr><th>言語</th><th>平均</th><th>言語</th><th>平均</th></tr>
          <tr><td>フィンランド語</td><td>7.6文字</td><td>ドイツ語</td><td>6.0文字</td></tr>
          <tr><td>ロシア語</td><td>6.6文字</td><td>スウェーデン語</td><td>6.0文字</td></tr>
          <tr><td>イタリア語</td><td>6.5文字</td><td>フランス語</td><td>6.0文字</td></tr>
          <tr><td>英語</td><td>資料・数え方で変動</td><td>スペイン語</td><td>資料・数え方で変動</td></tr>
        </table>

        <h3>注意点</h3>
        <p>暗号文にスペースがある場合、それが本物の単語区切りかどうかを確認する必要があります。偽のスペースが挿入されている可能性もあります。</p>
      `
    },
    repeated: {
      title: '繰り返しパターンの参考情報',
      content: `
        <h3>よくある繰り返しパターン</h3>
        <ul>
          <li><strong>the</strong>: 英語で最も頻出する3文字パターン</li>
          <li><strong>and</strong>: 2番目に多い3文字パターン</li>
          <li><strong>ing</strong>: 語尾としてよく出現</li>
          <li><strong>tion</strong>: 名詞化接尾辞</li>
          <li><strong>ment</strong>: 名詞化接尾辞</li>
        </ul>

        <h3>パターンの解釈</h3>
        <table class="ref-table">
          <tr><th>パターン長</th><th>可能性</th></tr>
          <tr><td>3文字</td><td>the, and, for, are, tha, ent, ing, ion など</td></tr>
          <tr><td>4文字</td><td>that, this, with, tion など</td></tr>
          <tr><td>5文字以上</td><td>特定の単語の繰り返し</td></tr>
        </table>

        <h3>活用方法</h3>
        <ol>
          <li>最も長く頻出するパターンに注目</li>
          <li>位置（文頭、文末など）を確認</li>
          <li>the, and などの候補を当てはめてみる</li>
        </ol>
      `
    },
    wordHints: {
      title: '英語の単語パターン',
      content: `
        <h3>頻出単語ベスト30</h3>
        <p style="font-size: 0.85rem;">the, of, and, to, a, in, that, is, I, it, for, as, with, his, he, be, not, by, but, have, you, are, on, or, her, had, at, from, which</p>

        <h3>1文字単語</h3>
        <p><strong>a</strong> または <strong>I</strong>（常に大文字）のみ</p>

        <h3>先頭文字別の頻出単語</h3>
        <table class="ref-table">
          <tr><th>先頭</th><th>2文字</th><th>3文字</th><th>4文字</th></tr>
          <tr><td>a</td><td>as, at, an, am</td><td>and, are, all, any</td><td>-</td></tr>
          <tr><td>b</td><td>be, by</td><td>but</td><td>been</td></tr>
          <tr><td>c</td><td>-</td><td>can</td><td>come</td></tr>
          <tr><td>f</td><td>-</td><td>for</td><td>from</td></tr>
          <tr><td>g</td><td>go</td><td>get</td><td>good</td></tr>
          <tr><td>h</td><td>he</td><td>had, her, has, him</td><td>have, here</td></tr>
          <tr><td>i</td><td>in, it, is, if</td><td>-</td><td>-</td></tr>
          <tr><td>n</td><td>no</td><td>not</td><td>-</td></tr>
          <tr><td>o</td><td>of, or, on</td><td>one, our, out</td><td>-</td></tr>
          <tr><td>t</td><td>to</td><td>the</td><td>that, this, they, time</td></tr>
          <tr><td>w</td><td>we</td><td>was</td><td>with, want</td></tr>
          <tr><td>y</td><td>-</td><td>you</td><td>your</td></tr>
        </table>

        <h3>語末パターン</h3>
        <table class="ref-table">
          <tr><td>-ing</td><td>現在分詞、動名詞</td><td>-tion</td><td>名詞化</td></tr>
          <tr><td>-ed</td><td>過去形、過去分詞</td><td>-ly</td><td>副詞</td></tr>
          <tr><td>-er</td><td>比較級、行為者</td><td>-est</td><td>最上級</td></tr>
        </table>
      `
    },
    frequency: {
      title: '英語の文字頻度',
      content: `
        <h3>各アルファベットの出現確率</h3>
        <table class="ref-table">
          <tr><th>文字</th><th>確率</th><th>文字</th><th>確率</th><th>文字</th><th>確率</th></tr>
          <tr><td><strong>A</strong></td><td>8.2%</td><td>J</td><td>0.2%</td><td>S</td><td>6.3%</td></tr>
          <tr><td>B</td><td>1.5%</td><td>K</td><td>0.8%</td><td><strong>T</strong></td><td>9.1%</td></tr>
          <tr><td>C</td><td>2.8%</td><td>L</td><td>4.0%</td><td>U</td><td>2.8%</td></tr>
          <tr><td>D</td><td>4.3%</td><td>M</td><td>2.4%</td><td>V</td><td>1.0%</td></tr>
          <tr><td><strong>E</strong></td><td>12.7%</td><td>N</td><td>6.7%</td><td>W</td><td>2.3%</td></tr>
          <tr><td>F</td><td>2.2%</td><td><strong>O</strong></td><td>7.5%</td><td>X</td><td>0.1%</td></tr>
          <tr><td>G</td><td>2.0%</td><td>P</td><td>1.9%</td><td>Y</td><td>2.0%</td></tr>
          <tr><td>H</td><td>6.1%</td><td>Q</td><td>0.1%</td><td>Z</td><td>0.1%</td></tr>
          <tr><td><strong>I</strong></td><td>7.0%</td><td>R</td><td>6.0%</td><td></td><td></td></tr>
        </table>

        <h3>頻度によるグループ分類</h3>
        <table class="ref-table">
          <tr><th>グループ</th><th>文字</th><th>確率</th><th>備考</th></tr>
          <tr><td>最頻度</td><td>E</td><td>12%</td><td>解読で積極的に利用</td></tr>
          <tr><td>高頻度</td><td>T, A, O, I, N, S, H, R</td><td>6〜9%</td><td>よく現れる</td></tr>
          <tr><td>中頻度</td><td>D, L, U, C, M</td><td>3〜4%</td><td></td></tr>
          <tr><td>低頻度</td><td>P, F, Y, W, G, B, V</td><td>1.5〜2.8%</td><td></td></tr>
          <tr><td>稀頻度</td><td>J, K, Q, X, Z</td><td>1%以下</td><td>100文字でも登場しないことがある</td></tr>
        </table>

        <h3>暗記法: ETAOIN SHRDLU</h3>
        <p>最も頻出する12文字を覚えるためのニーモニック。リノタイプ機のキーボード配列に由来。</p>
      `
    },
    ngrams: {
      title: 'N-gram（連字）頻度表',
      content: `
        <h3>頻出2-gram（バイグラム）ベスト25</h3>
        <p style="font-size: 0.9rem;"><strong>th, he, in, er, an, re, nd, at, on, nt, ha, es, st, en, ed, to, it, ou, ea, hi, is, or, ti, as, te</strong></p>

        <h3>頻出3-gram（トライグラム）ベスト15</h3>
        <p style="font-size: 0.9rem;"><strong>the, and, tha, ent, ing, ion, tio, for, nde, has, nce, edt, tis, oft, sth</strong></p>

        <h3>頻出4-gram（テトラグラム）ベスト10</h3>
        <p style="font-size: 0.9rem;"><strong>that, ther, with, tion, here, ould, ight, have, hich, whic</strong></p>
        <p style="font-size: 0.85rem; color: #666; margin-top: 0.25rem;">
          その他: ould, atio, ight, ment, ough, ance, ence, ever, ings, ness
        </p>

        <h3>先頭文字別の連字・3連字</h3>
        <table class="ref-table">
          <tr><th>先頭</th><th>2-gram</th><th>3-gram</th></tr>
          <tr><td>a</td><td>an, at, ar, al</td><td>and</td></tr>
          <tr><td>e</td><td>er, es, ea, en, ed, et</td><td>ent, ere, eth</td></tr>
          <tr><td>h</td><td>he, ha</td><td>has, her</td></tr>
          <tr><td>i</td><td>in, is, it</td><td>ion, ing</td></tr>
          <tr><td>n</td><td>nd, nt, ng</td><td>nde, nce</td></tr>
          <tr><td>o</td><td>on, or, ou, of</td><td>oft</td></tr>
          <tr><td>r</td><td>re, ri</td><td>-</td></tr>
          <tr><td>s</td><td>st, se</td><td>sth</td></tr>
          <tr><td>t</td><td>th, ti, to, te</td><td>the, tha, tio, tis</td></tr>
        </table>

        <h3>活用のポイント</h3>
        <ul>
          <li>THは最も頻出する2-gram</li>
          <li>THEは最も頻出する3-gram</li>
          <li>THATは最も頻出する4-gram</li>
          <li>TIONは名詞の語尾によく現れる4-gram</li>
          <li>暗号文の頻出N-gramと比較して推測</li>
        </ul>
      `
    },
    pattern: {
      title: 'パターン語と非パターン語',
      content: `
        <h3>パターン語とは</h3>
        <p>同じ文字が出てくるパターンのある語。同じ数字は同じ文字を意味します。</p>

        <h3>高頻出のパターン語</h3>
        <table class="ref-table">
          <tr><th>パターン</th><th>パターン語の例</th></tr>
          <tr><td>121</td><td>did, eye</td></tr>
          <tr><td>122</td><td>add, all, bee, egg, off, see, too</td></tr>
          <tr><td>1213</td><td>away, even, ever, nine, none</td></tr>
          <tr><td>1221</td><td>noon</td></tr>
          <tr><td>1223</td><td>been, book, cook, cool, deep, door, feed, feel, feet, food</td></tr>
          <tr><td>1233</td><td>ball, bell, bill, call, fill, free, full, hall, hill, knee, less</td></tr>
          <tr><td>12134</td><td>enemy, every, paper, usual</td></tr>
          <tr><td>12234</td><td>allow, apple, offer</td></tr>
          <tr><td>12314</td><td>catch, clock, enter, taste, truth</td></tr>
          <tr><td>12334</td><td>brook, carry, green, happy, hurry, sleep</td></tr>
        </table>

        <h3>高頻出の非パターン語（すべて異なる文字）</h3>
        <table class="ref-table">
          <tr><th>文字数</th><th>非パターン語</th></tr>
          <tr><td>2文字</td><td>an, as, at, be, by, do, go, he, if, in</td></tr>
          <tr><td>3文字</td><td>bow, car, day, ear, far, get, has, its, joy, led</td></tr>
          <tr><td>4文字</td><td>able, boat, cent, deal, each, fact, gain, have, into, join</td></tr>
        </table>

        <h3>高頻出の二重文字ベスト10</h3>
        <p><strong>ll, tt, ss, ee, pp, oo, rr, ff, cc, dd</strong></p>

        <h3>一般的な反転字（可逆ペア）</h3>
        <p style="font-size: 0.9rem;">er-re, es-se, an-na, ti-it, on-no, in-ni, en-ne, at-ta, te-et, or-ro, to-ot, ar-ra, st-ts, is-si, ed-de, of-fo</p>
      `
    },
    kasiski: {
      title: 'Kasiskiテストの参考情報',
      content: `
        <h3>Kasiskiテストとは</h3>
        <p>多表式暗号（特にヴィジュネル暗号）の鍵長を推定する手法。繰り返しパターン間の距離の最大公約数から鍵長を推測します。</p>

        <h3>手順</h3>
        <ol>
          <li>暗号文中の繰り返しパターンを見つける</li>
          <li>各パターン間の距離を計算</li>
          <li>距離の因数を分析</li>
          <li>多く出現する因数を鍵長候補として追加検証</li>
        </ol>

        <h3>注意点</h3>
        <ul>
          <li>短い暗号文では精度が低下</li>
          <li>偶然の一致による誤検出の可能性</li>
          <li>複数の候補がある場合は各候補でIC分析を実施</li>
        </ul>

        <h3>IC値との併用</h3>
        <p>Kasiskiで複数の鍵長候補を絞り、各候補で暗号文を列分割してIC値などを比較します。ICが英語の目安へ近いことだけでは正しい鍵長を証明できません。</p>

        <h3>単一換字式との区別</h3>
        <table class="ref-table">
          <tr><th>特徴</th><th>単一換字式</th><th>多表式</th></tr>
          <tr><td>IC値</td><td>≈ 0.067</td><td>0.038〜0.055</td></tr>
          <tr><td>文字頻度</td><td>英語と類似</td><td>平坦化</td></tr>
          <tr><td>Kasiski</td><td>適用外</td><td>有効</td></tr>
        </table>
      `
    }
  };

  const REFERENCE_DATA_EN = {
    statistics: {
      title: 'Basic English statistics',
      content: `<h3>Letter-frequency order</h3><p><strong>E T A O I N S H R D L C U M W F G Y P B V K J X Q Z</strong></p><p>“ETAOIN SHRDLU” is a mnemonic for the twelve most frequent letters. Frequencies depend on the corpus, text length, genre, names, and spelling, so they are comparison data rather than a key.</p>`
    },
    ic: {
      title: 'Index of Coincidence reference',
      content: `<h3>Reference values</h3><table class="ref-table"><tr><th>Text or cipher</th><th>Typical IC</th></tr><tr><td>English plaintext / monoalphabetic substitution</td><td>about 0.0667</td></tr><tr><td>Long-key polyalphabetic text</td><td>about 0.040–0.045</td></tr><tr><td>Uniform random A–Z</td><td>about 0.0385</td></tr></table><p>Short samples vary widely. IC preserves letter-count concentration under monoalphabetic substitution, but one value cannot identify a cipher.</p>`
    },
    spacing: {
      title: 'English word-length reference',
      content: `<h3>How to use spacing</h3><p>One-letter English words are normally <strong>a</strong> and <strong>I</strong>. Short words are common, but distributions vary by corpus. Spaces may have been removed, preserved, or deliberately inserted, so treat separators as a hypothesis.</p>`
    },
    repeated: {
      title: 'Repeated-sequence reference',
      content: `<h3>Interpretation</h3><p>Repeated sequences may represent recurring words, affixes, formulaic text, or coincidence. Longer repeats are usually more informative, but their meaning depends on position and surrounding patterns.</p>`
    },
    wordHints: {
      title: 'English word patterns',
      content: `<h3>Common words</h3><p>the, of, and, to, a, in, that, is, I, it, for, as, with, be, not, by, have, you, are</p><p>These are corpus-based tendencies. A short text, a proper name, or a specialized topic may differ substantially.</p>`
    },
    frequency: {
      title: 'English letter frequencies',
      content: `<h3>Approximate percentages</h3><p>E 12.7, T 9.1, A 8.2, O 7.5, I 7.0, N 6.7, S 6.3, H 6.1, R 6.0.</p><p>The chart compares a sample with reference frequencies. A small difference supports only a hypothesis; it does not establish a correct mapping.</p>`
    },
    ngrams: {
      title: 'English N-gram reference',
      content: `<h3>Common sequences</h3><p><strong>Bigrams:</strong> th, he, in, er, an, re, on, at, en, nd</p><p><strong>Trigrams:</strong> the, and, ing, ent, ion, her, for, tha</p><p><strong>Tetragrams:</strong> that, ther, with, tion, here, ould, ight, have</p><p>Lists differ by corpus and preprocessing. Use them to form hypotheses, not as proof.</p>`
    },
    pattern: {
      title: 'Word-pattern reference',
      content: `<h3>Repeated-letter patterns</h3><p>121 includes “did” and “eye”; 122 includes “all” and “see”; 1221 includes “noon”. A pattern preserves equality positions under monoalphabetic substitution, but many words can share one pattern.</p>`
    },
    kasiski: {
      title: 'Kasiski examination reference',
      content: `<h3>Procedure</h3><ol><li>Find repeated sequences.</li><li>Measure distances between occurrences.</li><li>Inspect shared factors.</li><li>Test several candidate periods with column IC and other evidence.</li></ol><p>Coincidental repeats, repeated plaintext aligned under different key positions, and short samples can mislead. The largest factor count is not automatically the true key length.</p>`
    }
  };

  const HELP_CONTENT = {
    ja: `<h3>このツールについて</h3><p>単一換字式暗号を人が解析するための作業台です。自動解読や正解判定は行いません。</p><h3>基本ルール</h3><ul><li>入力欄は暗号文の原文として保持します。</li><li>マッピングした平文文字は、復号候補に小文字で表示します。</li><li>同じ平文文字を複数の暗号文字へ割り当てることはできません。</li></ul><h3>使い方</h3><ol><li>暗号文を入力し、必要なら正規化します。</li><li>各タブで分析を実行します。</li><li>観察結果から対応仮説を立て、文字マッピングへ入力します。</li><li>必要な候補へ名前を付け、現在の対応との差分を比較します。</li><li>復号候補と複数の指標を比較して仮説を見直します。</li></ol><h3>単語候補の照合</h3><p>パターンタブでは、反復パターンと現在の対応に両立する語を内蔵語彙や追加候補から探せます。候補は正解順ではなく、選んで適用するまで対応表を変更しません。</p><h3>履歴と保存候補</h3><p>戻す・やり直すは最大50段階、名前付き候補は最大20件です。上部の「保存」で候補一覧も作業状態へ保存します。候補を復元しても暗号文は変更しません。</p><h3>ショートカット</h3><table class="shortcut-table"><tr><td><kbd>1</kbd>–<kbd>4</kbd></td><td>フェーズ切替</td></tr><tr><td><kbd>Ctrl</kbd>+<kbd>S</kbd></td><td>保存</td></tr><tr><td><kbd>Ctrl</kbd>+<kbd>M</kbd></td><td>復号候補を更新</td></tr><tr><td><kbd>Ctrl</kbd>+<kbd>Enter</kbd></td><td>現在の分析を実行</td></tr><tr><td><kbd>?</kbd></td><td>ヘルプ</td></tr></table><p class="note">すべての出力はヒントや観察指標です。暗号種別、文字対応、鍵長、平文の正しさを証明しません。</p>`,
    en: `<h3>About this tool</h3><p>This is a manual workbench for monoalphabetic-substitution analysis. It does not automatically solve or judge an answer.</p><h3>Core rules</h3><ul><li>The input remains the original ciphertext.</li><li>Mapped plaintext letters appear in lowercase in the derived candidate.</li><li>A plaintext letter cannot be assigned to more than one ciphertext letter.</li></ul><h3>Workflow</h3><ol><li>Enter ciphertext and normalize it if needed.</li><li>Run analyses in the tabs.</li><li>Form mapping hypotheses and enter them in the mapping grid.</li><li>Name useful candidates and compare them with the current mapping.</li><li>Compare the derived candidate with several independent observations.</li></ol><h3>Word-candidate compatibility</h3><p>In the Patterns tab, check the built-in vocabulary or added words against a repetition pattern and the current mapping. Results are not ranked by correctness and do not change the mapping until you explicitly apply one.</p><h3>History and saved candidates</h3><p>Undo and redo keep up to 50 states, and you can name up to 20 candidates. The top-level Save action stores the candidate list with the workspace. Restoring a candidate does not modify the ciphertext.</p><h3>Shortcuts</h3><table class="shortcut-table"><tr><td><kbd>1</kbd>–<kbd>4</kbd></td><td>Switch phase</td></tr><tr><td><kbd>Ctrl</kbd>+<kbd>S</kbd></td><td>Save</td></tr><tr><td><kbd>Ctrl</kbd>+<kbd>M</kbd></td><td>Update candidate</td></tr><tr><td><kbd>Ctrl</kbd>+<kbd>Enter</kbd></td><td>Run current analysis</td></tr><tr><td><kbd>?</kbd></td><td>Help</td></tr></table><p class="note">Every output is a hint or observation. It does not prove a cipher type, letter mapping, key length, or plaintext.</p>`
  };

  // DOM Elements
  const cipherInput = document.getElementById('cipherInput');
  const charCount = document.getElementById('charCount');
  const btnNormalize = document.getElementById('btnNormalize');
  const btnClear = document.getElementById('btnClear');
  const btnCopy = document.getElementById('btnCopy');
  const btnHelp = document.getElementById('btnHelp');
  const btnSave = document.getElementById('btnSave');
  const btnLoad = document.getElementById('btnLoad');
  const helpModal = document.getElementById('helpModal');
  const btnCloseHelp = document.getElementById('btnCloseHelp');
  const refModal = document.getElementById('refModal');
  const refModalTitle = document.getElementById('refModalTitle');
  const refModalBody = document.getElementById('refModalBody');
  const btnCloseRef = document.getElementById('btnCloseRef');
  const mappingGrid = document.getElementById('mappingGrid');
  const mappingMessage = document.getElementById('mappingMessage');
  const derivedText = document.getElementById('derivedText');
  const btnApplyMapping = document.getElementById('btnApplyMapping');
  const btnClearMapping = document.getElementById('btnClearMapping');
  const btnCopyDerived = document.getElementById('btnCopyDerived');
  const btnUndoMapping = document.getElementById('btnUndoMapping');
  const btnRedoMapping = document.getElementById('btnRedoMapping');
  const historyStatus = document.getElementById('historyStatus');
  const candidateName = document.getElementById('candidateName');
  const btnSaveCandidate = document.getElementById('btnSaveCandidate');
  const candidateSelect = document.getElementById('candidateSelect');
  const btnRestoreCandidate = document.getElementById('btnRestoreCandidate');
  const btnDeleteCandidate = document.getElementById('btnDeleteCandidate');
  const candidateComparison = document.getElementById('candidateComparison');
  const languageBtn = document.getElementById('languageBtn');
  const helpModalBody = document.getElementById('helpModalBody');
  const toast = document.getElementById('toast');
  const highlightColorSelect = document.getElementById('highlightColor');
  const wordCandidateCipher = document.getElementById('wordCandidateCipher');
  const wordCandidateCustom = document.getElementById('wordCandidateCustom');
  const useLearningVocabulary = document.getElementById('useLearningVocabulary');
  const btnFindWordCandidates = document.getElementById('btnFindWordCandidates');
  const btnClearWordCandidates = document.getElementById('btnClearWordCandidates');
  const wordCandidatePattern = document.getElementById('wordCandidatePattern');
  const wordCandidateStatus = document.getElementById('wordCandidateStatus');
  const wordCandidateResults = document.getElementById('wordCandidateResults');

  // Initialize
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    generateMappingGrid();
    setupEventListeners();
    setupKeyboardShortcuts();
    updateCharCount();
    applyLanguage();
    updateDerivedText();
    updateViewers();
    loadFromStorage();
    renderCandidateWorkspace();
  }

  function applyLanguage() {
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const value = t(element.dataset.i18n);
      if (value !== undefined) element.textContent = value;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      element.placeholder = t(element.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      element.title = t(element.dataset.i18nTitle);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
      element.setAttribute('aria-label', t(element.dataset.i18nAria));
    });
    languageBtn.textContent = language === 'ja' ? 'English' : '日本語';
    languageBtn.setAttribute('aria-label', language === 'ja' ? 'Switch to English' : '日本語に切り替える');
    document.querySelectorAll('.phase-btn').forEach(button => {
      button.title = `${button.textContent.trim()} (${button.dataset.phase})`;
    });
    document.querySelectorAll('.btn-ref').forEach(button => {
      button.title = t('referenceTitle');
    });
    if (highlightColorSelect) highlightColorSelect.title = t('highlightColor');
    helpModalBody.innerHTML = HELP_CONTENT[language];
    toast.textContent = '';
    toast.classList.remove('show');
    updateDerivedText();
    updateViewers();
    renderCandidateWorkspace();
    if (wordCandidateHasRun) renderWordCandidates(lastWordCandidateWords);
    for (const [type, time] of lastRunTimes) {
      const element = document.getElementById(`lastRun-${type}`);
      if (element) element.textContent = t('lastRun', time.toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-US'));
    }
    for (const type of executedAnalyses) runAnalysis(type, false);
    if (activeReferenceType && !refModal.classList.contains('hidden')) showReferenceModal(activeReferenceType);
    document.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));
  }

  function getWorkingText() {
    const result = Core.applyMapping(cipherInput.value, mapping);
    return result.ok ? result.text : cipherInput.value;
  }

  function updateDerivedText() {
    if (!derivedText) return;
    derivedText.textContent = getWorkingText();
  }

  function generateMappingGrid() {
    mappingGrid.innerHTML = '';
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      const div = document.createElement('div');
      div.className = 'mapping-item';
      div.innerHTML = `
        <label class="mapping-label" for="mapping-${letter}">${letter}</label>
        <input type="text" class="mapping-input" id="mapping-${letter}" data-letter="${letter}" maxlength="1" autocomplete="off" aria-label="${letter}">
      `;
      mappingGrid.appendChild(div);
    }

    // Add input handlers
    mappingGrid.querySelectorAll('.mapping-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        if (val && !/^[a-z]$/.test(val)) {
          e.target.value = mapping[e.target.dataset.letter] || '';
          return;
        }
        if (val) {
          const owner = Object.entries(mapping).find(([cipher, plain]) => cipher !== e.target.dataset.letter && plain === val);
          if (owner) {
            e.target.value = mapping[e.target.dataset.letter] || '';
            e.target.setAttribute('aria-invalid', 'true');
            mappingMessage.textContent = t('duplicate', val, owner[0]);
            mappingMessage.className = 'mapping-message error';
            return;
          }
        }
        const nextMapping = { ...mapping, [e.target.dataset.letter]: val };
        commitMapping(nextMapping);
        e.target.removeAttribute('aria-invalid');
        mappingMessage.textContent = '';
        mappingMessage.className = 'mapping-message';
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          applyMapping();
        }
      });
    });
  }

  function setupEventListeners() {
    // Input events
    cipherInput.addEventListener('input', () => {
      updateCharCount();
      updateDerivedText();
      updateViewers();
    });

    btnNormalize.addEventListener('click', normalizeCiphertext);
    btnClear.addEventListener('click', clearCiphertext);
    btnCopy.addEventListener('click', copyCiphertext);
    btnCopyDerived.addEventListener('click', copyDerivedText);
    languageBtn.addEventListener('click', () => {
      language = language === 'ja' ? 'en' : 'ja';
      localStorage.setItem('cipher-workbench-language', language);
      applyLanguage();
    });

    // Save/Load
    btnSave.addEventListener('click', saveToStorage);
    btnLoad.addEventListener('click', loadFromStorage);

    // Mapping
    btnApplyMapping.addEventListener('click', applyMapping);
    btnClearMapping.addEventListener('click', clearMapping);
    btnUndoMapping.addEventListener('click', undoMapping);
    btnRedoMapping.addEventListener('click', redoMapping);
    btnSaveCandidate.addEventListener('click', saveCandidateSnapshot);
    btnRestoreCandidate.addEventListener('click', restoreCandidateSnapshot);
    btnDeleteCandidate.addEventListener('click', deleteCandidateSnapshot);
    candidateSelect.addEventListener('change', renderCandidateComparison);
    candidateName.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        saveCandidateSnapshot();
      }
    });

    wordCandidateCipher.addEventListener('input', updateWordCandidatePattern);
    wordCandidateCipher.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        findWordCandidates();
      }
    });
    btnFindWordCandidates.addEventListener('click', findWordCandidates);
    btnClearWordCandidates.addEventListener('click', clearWordCandidates);

    // Highlight color
    if (highlightColorSelect) {
      highlightColorSelect.addEventListener('change', (e) => {
        highlightColor = e.target.value;
        updateAllViewers();
      });
    }

    // Help modal
    btnHelp.addEventListener('click', () => helpModal.classList.remove('hidden'));
    btnCloseHelp.addEventListener('click', () => helpModal.classList.add('hidden'));
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) helpModal.classList.add('hidden');
    });

    // Reference modal
    document.querySelectorAll('.btn-ref').forEach(btn => {
      btn.addEventListener('click', () => showReferenceModal(btn.dataset.ref));
    });
    btnCloseRef.addEventListener('click', () => refModal.classList.add('hidden'));
    refModal.addEventListener('click', (e) => {
      if (e.target === refModal) refModal.classList.add('hidden');
    });

    // Phase navigation
    document.querySelectorAll('.phase-btn').forEach(btn => {
      btn.addEventListener('click', () => switchPhase(parseInt(btn.dataset.phase)));
    });

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Analysis buttons
    document.querySelectorAll('.btn-run').forEach(btn => {
      btn.addEventListener('click', () => runAnalysis(btn.dataset.analysis));
    });

    // N-gram mode switch
    document.querySelectorAll('[data-ngram]').forEach(btn => {
      btn.addEventListener('click', () => {
        ngramMode = parseInt(btn.dataset.ngram);
        document.querySelectorAll('[data-ngram]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Viewer navigation buttons
    setupViewerNavigation('repeated');
    setupViewerNavigation('ngrams');
    setupViewerNavigation('pattern');
    setupViewerNavigation('spacing');
    setupViewerNavigation('wordHints');
  }

  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ignore if typing in input/textarea
      if (e.target.matches('input, textarea')) {
        if (e.key === 'Escape') {
          e.target.blur();
        }
        return;
      }

      // Phase switching: 1-4
      if (/^[1-4]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
        switchPhase(parseInt(e.key));
        return;
      }

      // Help: ?
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        helpModal.classList.toggle('hidden');
        return;
      }

      // Escape: close modals
      if (e.key === 'Escape') {
        helpModal.classList.add('hidden');
        refModal.classList.add('hidden');
        return;
      }

      // Ctrl+S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToStorage();
        return;
      }

      // Ctrl+M: Apply mapping
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        applyMapping();
        return;
      }

      // Ctrl+Enter: Run current analysis
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runAnalysis(currentTab);
        return;
      }
    });
  }

  function setupViewerNavigation(tabName) {
    const btnPrev = document.getElementById(`btnPrev${capitalize(tabName)}`);
    const btnNext = document.getElementById(`btnNext${capitalize(tabName)}`);
    const btnToggle = document.getElementById(`btnToggle${capitalize(tabName)}`);

    if (btnPrev) {
      btnPrev.addEventListener('click', () => navigateHighlight(tabName, -1));
    }
    if (btnNext) {
      btnNext.addEventListener('click', () => navigateHighlight(tabName, 1));
    }
    if (btnToggle) {
      btnToggle.addEventListener('click', () => toggleHighlights(tabName));
    }
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Toast notification
  function showToast(message, type = '') {
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }

  // Reference modal
  function showReferenceModal(refType) {
    const data = (language === 'ja' ? REFERENCE_DATA : REFERENCE_DATA_EN)[refType];
    if (!data) return;

    activeReferenceType = refType;

    refModalTitle.textContent = data.title;
    refModalBody.innerHTML = data.content;
    refModal.classList.remove('hidden');
  }

  function cloneMapping(candidate) {
    return { ...Core.normalizeMapping(candidate) };
  }

  function syncMappingInputs() {
    mappingGrid.querySelectorAll('.mapping-input').forEach(input => {
      const value = mapping[input.dataset.letter] || '';
      input.value = value;
      input.classList.toggle('has-value', Boolean(value));
      input.removeAttribute('aria-invalid');
    });
  }

  function refreshMappingViews() {
    syncMappingInputs();
    updateDerivedText();
    updateViewers();
    renderCandidateWorkspace();
    if (wordCandidateHasRun) renderWordCandidates(lastWordCandidateWords);
  }

  function updateWordCandidatePattern() {
    const pattern = Core.wordPattern(wordCandidateCipher.value);
    wordCandidatePattern.textContent = pattern || '-';
  }

  function collectWordCandidateWords() {
    const custom = wordCandidateCustom.value
      .split(/[\s,;]+/)
      .filter(Boolean)
      .slice(0, 500);
    return useLearningVocabulary.checked ? [...LEARNING_VOCABULARY, ...custom] : custom;
  }

  function findWordCandidates() {
    const cipherWord = wordCandidateCipher.value.trim().toUpperCase();
    wordCandidateCipher.value = cipherWord;
    updateWordCandidatePattern();
    if (!/^[A-Z]+$/.test(cipherWord)) {
      wordCandidateHasRun = false;
      wordCandidateStatus.textContent = t('wordCandidateNeedWord');
      wordCandidateStatus.className = 'word-candidate-status error';
      wordCandidateResults.innerHTML = '';
      return;
    }
    const words = collectWordCandidateWords();
    if (words.length === 0) {
      wordCandidateHasRun = false;
      wordCandidateStatus.textContent = t('wordCandidateNoSource');
      wordCandidateStatus.className = 'word-candidate-status error';
      wordCandidateResults.innerHTML = '';
      return;
    }
    wordCandidateHasRun = true;
    lastWordCandidateWords = words;
    renderWordCandidates(words);
  }

  function formatAssignments(items) {
    return items.length > 0
      ? items.map(item => `${item.cipher}→${item.plain}`).join(', ')
      : t('wordCandidateNoAdds');
  }

  function renderWordCandidates(words) {
    if (!wordCandidateHasRun) return;
    const result = Core.suggestWordCandidates(wordCandidateCipher.value, words, mapping, 50);
    updateWordCandidatePattern();
    wordCandidateStatus.textContent = result.candidates.length > 0
      ? t('wordCandidateFound', result.candidates.length, result.compatibleCount, result.pattern)
      : t('wordCandidateNone', result.pattern || '-');
    wordCandidateStatus.className = `word-candidate-status${result.candidates.length ? '' : ' empty'}`;
    wordCandidateResults.innerHTML = '';

    for (const candidate of result.candidates) {
      const card = document.createElement('article');
      card.className = 'word-candidate-card';
      const heading = document.createElement('div');
      heading.className = 'word-candidate-card-heading';
      const word = document.createElement('strong');
      word.textContent = candidate.plainWord;
      const pattern = document.createElement('code');
      pattern.textContent = candidate.pattern;
      heading.append(word, pattern);

      const details = document.createElement('dl');
      const existingLabel = document.createElement('dt');
      existingLabel.textContent = t('wordCandidateExisting');
      const existingValue = document.createElement('dd');
      existingValue.textContent = candidate.retained.length > 0
        ? formatAssignments(candidate.retained)
        : '—';
      const additionsLabel = document.createElement('dt');
      additionsLabel.textContent = t('wordCandidateAdds');
      const additionsValue = document.createElement('dd');
      additionsValue.textContent = formatAssignments(candidate.additions);
      details.append(existingLabel, existingValue, additionsLabel, additionsValue);

      const applyButton = document.createElement('button');
      applyButton.type = 'button';
      applyButton.className = 'btn btn-small btn-primary';
      applyButton.textContent = t('applyWordCandidate');
      applyButton.disabled = candidate.additions.length === 0;
      applyButton.addEventListener('click', () => {
        const checked = Core.checkWordCandidate(wordCandidateCipher.value, candidate.plainWord, mapping);
        if (!checked.valid) {
          showToast(t('wordCandidateStale'), 'error');
          renderWordCandidates(lastWordCandidateWords);
          return;
        }
        if (commitMapping(checked.mapping)) {
          mappingMessage.textContent = t('wordCandidateApplied', candidate.plainWord);
          mappingMessage.className = 'mapping-message success';
          showToast(t('wordCandidateApplied', candidate.plainWord));
        } else {
          showToast(t('wordCandidateUnchanged'));
        }
      });
      card.append(heading, details, applyButton);
      wordCandidateResults.appendChild(card);
    }
  }

  function clearWordCandidates() {
    wordCandidateCipher.value = '';
    wordCandidateCustom.value = '';
    wordCandidatePattern.textContent = '-';
    wordCandidateStatus.textContent = '';
    wordCandidateResults.innerHTML = '';
    wordCandidateHasRun = false;
    lastWordCandidateWords = [];
    wordCandidateCipher.focus();
  }

  function resetMappingHistory(candidate) {
    mapping = cloneMapping(candidate);
    mappingHistory = [cloneMapping(mapping)];
    mappingHistoryIndex = 0;
    refreshMappingViews();
  }

  function commitMapping(candidate) {
    const validation = Core.validateMapping(candidate);
    if (!validation.valid || Core.mappingsEqual(mapping, validation.mapping)) return false;
    mapping = cloneMapping(validation.mapping);
    mappingHistory = mappingHistory.slice(0, mappingHistoryIndex + 1);
    mappingHistory.push(cloneMapping(mapping));
    if (mappingHistory.length > MAX_MAPPING_HISTORY) {
      mappingHistory.splice(0, mappingHistory.length - MAX_MAPPING_HISTORY);
    }
    mappingHistoryIndex = mappingHistory.length - 1;
    refreshMappingViews();
    return true;
  }

  function undoMapping() {
    if (mappingHistoryIndex <= 0) return;
    mappingHistoryIndex--;
    mapping = cloneMapping(mappingHistory[mappingHistoryIndex]);
    mappingMessage.textContent = '';
    mappingMessage.className = 'mapping-message';
    refreshMappingViews();
  }

  function redoMapping() {
    if (mappingHistoryIndex >= mappingHistory.length - 1) return;
    mappingHistoryIndex++;
    mapping = cloneMapping(mappingHistory[mappingHistoryIndex]);
    mappingMessage.textContent = '';
    mappingMessage.className = 'mapping-message';
    refreshMappingViews();
  }

  function getSelectedSnapshot() {
    return mappingSnapshots.find(snapshot => snapshot.id === candidateSelect.value) || null;
  }

  function renderCandidateWorkspace() {
    if (!candidateSelect) return;
    historyStatus.textContent = t('historyPosition', mappingHistoryIndex + 1, mappingHistory.length);
    btnUndoMapping.disabled = mappingHistoryIndex <= 0;
    btnRedoMapping.disabled = mappingHistoryIndex >= mappingHistory.length - 1;

    const selectedId = candidateSelect.value;
    candidateSelect.innerHTML = '';
    if (mappingSnapshots.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = t('noSavedCandidates');
      candidateSelect.appendChild(option);
    } else {
      for (const snapshot of mappingSnapshots) {
        const option = document.createElement('option');
        const count = Object.values(snapshot.mapping).filter(Boolean).length;
        option.value = snapshot.id;
        option.textContent = t('candidateOption', snapshot.name, count);
        candidateSelect.appendChild(option);
      }
      candidateSelect.value = mappingSnapshots.some(snapshot => snapshot.id === selectedId)
        ? selectedId
        : mappingSnapshots[mappingSnapshots.length - 1].id;
    }
    const hasSelection = Boolean(getSelectedSnapshot());
    candidateSelect.disabled = !hasSelection;
    btnRestoreCandidate.disabled = !hasSelection;
    btnDeleteCandidate.disabled = !hasSelection;
    renderCandidateComparison();
  }

  function renderCandidateComparison() {
    const snapshot = getSelectedSnapshot();
    if (!snapshot) {
      candidateComparison.innerHTML = `<p class="candidate-empty">${escapeHtml(t('compareNone'))}</p>`;
      return;
    }
    const comparison = Core.diffMappings(snapshot.mapping, mapping);
    if (comparison.rows.length === 0) {
      candidateComparison.innerHTML = `<p class="candidate-comparison-summary">${escapeHtml(t('compareSame', snapshot.name))}</p>`;
      return;
    }
    const typeLabels = {
      added: t('diffAdded'),
      changed: t('diffChanged'),
      removed: t('diffRemoved')
    };
    const rows = comparison.rows.map(row => `
      <tr>
        <th scope="row"><code>${row.cipher}</code></th>
        <td><code>${row.before || escapeHtml(t('unassigned'))}</code></td>
        <td><code>${row.after || escapeHtml(t('unassigned'))}</code></td>
        <td class="candidate-change-type">${escapeHtml(typeLabels[row.type])}</td>
      </tr>
    `).join('');
    candidateComparison.innerHTML = `
      <p class="candidate-comparison-summary">${escapeHtml(t('compareSummary', snapshot.name, comparison.counts.added, comparison.counts.changed, comparison.counts.removed))}</p>
      <table class="candidate-diff-table">
        <thead><tr><th>${escapeHtml(t('diffCipher'))}</th><th>${escapeHtml(t('diffSaved'))}</th><th>${escapeHtml(t('diffCurrent'))}</th><th>${escapeHtml(t('diffType'))}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function saveCandidateSnapshot() {
    if (!Object.values(mapping).some(Boolean)) {
      showToast(t('candidateNeedsMapping'), 'error');
      return;
    }
    if (mappingSnapshots.length >= MAX_SNAPSHOTS) {
      showToast(t('candidateLimit'), 'error');
      return;
    }
    const name = candidateName.value.trim().slice(0, 40) || t('defaultCandidate', mappingSnapshots.length + 1);
    const createdAt = Date.now();
    const snapshot = {
      id: `candidate-${createdAt}-${++snapshotSerial}`,
      name,
      createdAt,
      mapping: cloneMapping(mapping)
    };
    mappingSnapshots.push(snapshot);
    candidateName.value = '';
    renderCandidateWorkspace();
    candidateSelect.value = snapshot.id;
    renderCandidateComparison();
    showToast(t('candidateSaved', name), 'success');
  }

  function restoreCandidateSnapshot() {
    const snapshot = getSelectedSnapshot();
    if (!snapshot) return;
    commitMapping(snapshot.mapping);
    candidateSelect.value = snapshot.id;
    renderCandidateComparison();
    showToast(t('candidateRestored', snapshot.name), 'success');
  }

  function deleteCandidateSnapshot() {
    const snapshot = getSelectedSnapshot();
    if (!snapshot) return;
    mappingSnapshots = mappingSnapshots.filter(candidate => candidate.id !== snapshot.id);
    renderCandidateWorkspace();
    showToast(t('candidateDeleted', snapshot.name), 'success');
  }

  // Storage functions
  function saveToStorage() {
    const data = {
      version: 2,
      ciphertext: cipherInput.value,
      mapping: mapping,
      mappingSnapshots,
      phase: currentPhase,
      tab: currentTab,
      language
    };
    try {
      localStorage.setItem('cipher-workbench-state', JSON.stringify(data));
      showToast(t('saved'), 'success');
    } catch (e) {
      showToast(t('saveFailed'), 'error');
    }
  }

  function loadFromStorage() {
    try {
      const saved = localStorage.getItem('cipher-workbench-state');
      if (saved) {
        const data = JSON.parse(saved);
        let loadedMapping = Core.createEmptyMapping();
        if (typeof data.ciphertext === 'string') {
          cipherInput.value = typeof data.originalCiphertext === 'string' && data.originalCiphertext
            ? data.originalCiphertext
            : data.ciphertext.toUpperCase();
          updateCharCount();
        }
        if (data.mapping && Core.validateMapping(data.mapping).valid) {
          loadedMapping = Core.normalizeMapping(data.mapping);
        }
        mappingSnapshots = Core.normalizeSnapshots(data.mappingSnapshots, MAX_SNAPSHOTS);
        if (data.phase) {
          switchPhase(data.phase);
        }
        if (data.tab) {
          switchTab(data.tab);
        }
        if (data.language === 'ja' || data.language === 'en') language = data.language;
        resetMappingHistory(loadedMapping);
        applyLanguage();
        updateDerivedText();
        updateViewers();
        showToast(t('loaded'), 'success');
      }
    } catch (e) {
      showToast(t('loadFailed'), 'error');
    }
  }

  // Mapping functions
  function applyMapping() {
    const validation = Core.validateMapping(mapping);
    if (!validation.valid) {
      const conflict = validation.conflicts[0];
      mappingMessage.textContent = t('duplicate', conflict.plain, conflict.ciphers[0]);
      mappingMessage.className = 'mapping-message error';
      return;
    }
    updateDerivedText();
    updateViewers();
    const hasMapping = Object.values(mapping).some(Boolean);
    showToast(t(hasMapping ? 'mappingUpdated' : 'mappingEmpty'), hasMapping ? 'success' : '');
  }

  function clearMapping() {
    commitMapping(Core.createEmptyMapping());
    mappingMessage.textContent = '';
    mappingMessage.className = 'mapping-message';
    showToast(t('mappingReset'), 'success');
  }

  // Input functions
  function updateCharCount() {
    charCount.textContent = cipherInput.value.length;
  }

  function normalizeCiphertext() {
    cipherInput.value = Core.normalizeCiphertext(cipherInput.value);
    updateCharCount();
    updateDerivedText();
    updateViewers();
    showToast(t('normalized'), 'success');
  }

  function clearCiphertext() {
    cipherInput.value = '';
    updateCharCount();
    updateDerivedText();
    updateViewers();
    document.querySelectorAll('.panel-body').forEach(panel => {
      const placeholder = panel.querySelector('.placeholder');
      if (!placeholder) {
        panel.innerHTML = `<p class="placeholder">${t('runPrompt')}</p>`;
      }
    });
    document.querySelectorAll('.last-run').forEach(el => {
      el.textContent = t('notRun');
    });
  }

  function copyCiphertext() {
    navigator.clipboard.writeText(cipherInput.value).then(() => {
      showToast(t('copied'), 'success');
    }).catch(() => {
      showToast(t('copyFailed'), 'error');
    });
  }

  function copyDerivedText() {
    navigator.clipboard.writeText(getWorkingText()).then(() => {
      showToast(t('copiedDerived'), 'success');
    }).catch(() => showToast(t('copyFailed'), 'error'));
  }

  function updateViewers() {
    const text = getWorkingText();
    ['repeated', 'wordHints', 'ngrams', 'pattern', 'spacing'].forEach(tabName => {
      const viewer = document.getElementById(`viewerText-${tabName}`);
      if (viewer) {
        viewer.innerHTML = formatCiphertext(text, tabName === 'spacing');
      }
    });
  }

  function updateAllViewers() {
    ['repeated', 'wordHints', 'ngrams', 'pattern'].forEach(tabName => {
      if (highlightState[tabName]) {
        updateViewerWithHighlights(tabName);
      }
    });
  }

  function formatCiphertext(text, showSpaces = false) {
    return text.split('').map(char => {
      if (/[A-Z]/.test(char)) {
        return `<span class="upper">${char}</span>`;
      } else if (/[a-z]/.test(char)) {
        return `<span class="lower">${char}</span>`;
      } else if (showSpaces && char === ' ') {
        return `<span class="space-marker"> </span>`;
      }
      return escapeHtml(char);
    }).join('');
  }

  // Navigation functions
  function switchPhase(phase) {
    currentPhase = phase;

    document.querySelectorAll('.phase-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.phase) === phase);
    });

    document.querySelectorAll('.tab-group').forEach(group => {
      group.classList.toggle('hidden', parseInt(group.dataset.phase) !== phase);
    });

    const firstTab = document.querySelector(`.tab-group[data-phase="${phase}"] .tab-btn`);
    if (firstTab) {
      switchTab(firstTab.dataset.tab);
    }
  }

  function switchTab(tab) {
    currentTab = tab;

    document.querySelectorAll(`.tab-group[data-phase="${currentPhase}"] .tab-btn`).forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `panel-${tab}`);
    });
  }

  // Analysis functions
  function runAnalysis(type, recordRun = true) {
    const text = getWorkingText();
    if (!text.trim()) {
      showToast(t('enterCipher'), 'error');
      return;
    }

    if (recordRun) lastRunTimes.set(type, new Date());
    const lastRunEl = document.getElementById(`lastRun-${type}`);
    if (lastRunEl && lastRunTimes.has(type)) {
      lastRunEl.textContent = t('lastRun', lastRunTimes.get(type).toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-US'));
    }
    executedAnalyses.add(type);

    switch (type) {
      case 'statistics':
        analyzeStatistics(text);
        break;
      case 'ic':
        analyzeIC(text);
        break;
      case 'spacing':
        analyzeSpacing(text);
        break;
      case 'repeated':
        analyzeRepeated(text);
        break;
      case 'wordHints':
        analyzeWordHints(text);
        break;
      case 'frequency':
        analyzeFrequency(cipherInput.value);
        break;
      case 'ngrams':
        analyzeNgrams(text);
        break;
      case 'pattern':
        analyzePattern(text);
        break;
      case 'kasiski':
        analyzeKasiski(text);
        break;
    }
  }

  // Statistics Analysis
  function analyzeStatistics(text) {
    const stats = {
      total: text.length,
      uppercase: (text.match(/[A-Z]/g) || []).length,
      lowercase: (text.match(/[a-z]/g) || []).length,
      spaces: (text.match(/ /g) || []).length,
      newlines: (text.match(/\n/g) || []).length,
      symbols: (text.match(/[^A-Za-z\s\n]/g) || []).length,
      digits: (text.match(/[0-9]/g) || []).length
    };

    stats.letters = stats.uppercase + stats.lowercase;
    stats.words = text.includes(' ') ? text.split(/\s+/).filter(w => w.length > 0).length : 0;

    const unresolvedLetters = new Set(text.match(/[A-Z]/g) || []);
    const resolvedLetters = new Set(text.match(/[a-z]/g) || []);
    const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const usedLetters = new Set([...unresolvedLetters, ...[...resolvedLetters].map(c => c.toUpperCase())]);
    const missingLetters = allLetters.filter(l => !usedLetters.has(l));

    const progress = stats.letters > 0 ? (stats.lowercase / stats.letters * 100).toFixed(1) : 0;

    // 1. 文字の出現回数ランキング
    const letterFreq = {};
    for (const char of text) {
      if (/[A-Z]/.test(char)) {
        letterFreq[char] = (letterFreq[char] || 0) + 1;
      }
    }
    const freqRanking = Object.entries(letterFreq)
      .sort((a, b) => b[1] - a[1])
      .map(([letter, count]) => ({ letter, count }));

    // 2. 暗号文の特徴判定
    const features = [];
    features.push(stats.spaces > 0 ? ui('✓ スペースあり（区切り候補）', '✓ Spaces present (possible separators)') : ui('✗ スペースなし', '✗ No spaces'));
    features.push(stats.digits > 0 ? ui('✓ 数字を含む', '✓ Contains digits') : ui('✗ 数字なし', '✗ No digits'));
    features.push(stats.symbols > 0 ? ui(`✓ 記号を含む (${stats.symbols}個)`, `✓ Contains symbols (${stats.symbols})`) : ui('✗ 記号なし', '✗ No symbols'));
    if (unresolvedLetters.size === 26) {
      features.push(ui('● 全26文字使用', '● All 26 letters appear'));
    } else if (unresolvedLetters.size < 10) {
      features.push(ui(`● 使用文字が少ない (${unresolvedLetters.size}種) — 短文では自然に起こります`, `● Small alphabet (${unresolvedLetters.size} letters) — common in short samples`));
    }

    // 3. マッピング状況グリッド (26文字)
    const mappingGridHtml = allLetters.map(letter => {
      const isUnresolved = unresolvedLetters.has(letter);
      const mappedTo = mapping[letter] || '';
      const hasMapped = mappedTo && /^[a-z]$/.test(mappedTo);

      let statusClass = 'unused';
      let statusLabel = '';
      if (hasMapped) {
        statusClass = 'resolved';
        statusLabel = mappedTo;
      } else if (isUnresolved) {
        statusClass = 'unresolved';
      }

      return `<div class="mapping-status-cell ${statusClass}" title="${letter}${hasMapped ? ' → ' + mappedTo : ''}">
        <span class="cell-letter">${letter}</span>
        ${statusLabel ? `<span class="cell-mapped">${escapeHtml(statusLabel)}</span>` : ''}
      </div>`;
    }).join('');

    // 4. 解読済みマッピング一覧
    const appliedMappings = Object.entries(mapping)
      .filter(([_, v]) => v)
      .sort((a, b) => a[0].localeCompare(b[0]));
    const mappingListHtml = appliedMappings.length > 0
      ? appliedMappings.map(([from, to]) => `<span class="applied-mapping-item">${escapeHtml(from)}→${escapeHtml(to)}</span>`).join('')
      : `<span class="no-mapping">${ui('マッピング未設定', 'No mappings')}</span>`;

    const resultEl = document.getElementById('result-statistics');
    resultEl.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">${ui('総文字数', 'Total characters')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.uppercase}</div>
          <div class="stat-label">${ui('大文字（未解読）', 'Uppercase (unresolved)')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.lowercase}</div>
          <div class="stat-label">${ui('小文字（解読済み）', 'Lowercase (mapped)')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.spaces}</div>
          <div class="stat-label">${ui('スペース', 'Spaces')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.newlines}</div>
          <div class="stat-label">${ui('改行', 'Line breaks')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.words}</div>
          <div class="stat-label">${ui('単語数', 'Words')}</div>
        </div>
      </div>

      <div class="stats-section">
        <h3 class="stats-section-title">${ui('暗号文の特徴', 'Ciphertext observations')}</h3>
        <div class="feature-list">
          ${features.map(f => `<div class="feature-item">${escapeHtml(f)}</div>`).join('')}
        </div>
      </div>

      <div class="stats-section">
        <h3 class="stats-section-title">${ui('出現頻度ランキング（未解読文字）', 'Frequency ranking (unresolved letters)')}</h3>
        <div class="freq-ranking">
          ${freqRanking.length > 0
            ? freqRanking.map((item, idx) => `<span class="freq-rank-item ${idx < 3 ? 'top' : ''}">${escapeHtml(item.letter)}<small>(${item.count})</small></span>`).join('')
            : `<span class="no-data">${ui('未解読文字なし', 'No unresolved letters')}</span>`}
        </div>
      </div>

      <div class="stats-section">
        <h3 class="stats-section-title">${ui('マッピング状況', 'Mapping status')}</h3>
        <div class="mapping-status-legend">
          <span><span class="legend-dot unresolved"></span>${ui('未解読', 'Unresolved')}</span>
          <span><span class="legend-dot resolved"></span>${ui('対応済み', 'Mapped')}</span>
          <span><span class="legend-dot unused"></span>${ui('未使用', 'Unused')}</span>
        </div>
        <div class="mapping-status-grid">${mappingGridHtml}</div>
      </div>

      <div class="stats-section">
        <h3 class="stats-section-title">${ui('適用中のマッピング', 'Active mappings')}</h3>
        <div class="applied-mappings">${mappingListHtml}</div>
      </div>

      <div class="stats-section">
        <h3 class="stats-section-title">${ui('作業進捗', 'Work progress')}</h3>
        <div class="progress-chart-container">
          <div class="pie-chart" style="background: conic-gradient(
            #27ae60 0deg ${stats.lowercase / stats.letters * 360 || 0}deg,
            #e74c3c ${stats.lowercase / stats.letters * 360 || 0}deg ${(stats.lowercase + stats.uppercase) / stats.letters * 360 || 0}deg,
            #95a5a6 ${(stats.lowercase + stats.uppercase) / stats.letters * 360 || 0}deg 360deg
          );">
            <div class="pie-center">
              <span class="pie-percent">${progress}%</span>
              <span class="pie-label">${ui('対応済', 'Mapped')}</span>
            </div>
          </div>
          <div class="pie-legend">
            <div class="pie-legend-item"><span class="pie-dot resolved"></span>${ui('対応済み', 'Mapped')} (${stats.lowercase})</div>
            <div class="pie-legend-item"><span class="pie-dot unresolved"></span>${ui('未解読', 'Unresolved')} (${stats.uppercase})</div>
            <div class="pie-legend-item"><span class="pie-dot other"></span>${ui('その他', 'Other')} (${stats.spaces + stats.newlines + stats.symbols})</div>
          </div>
        </div>
      </div>
    `;
  }

  // Index of Coincidence Analysis
  function analyzeIC(text) {
    const letters = text.replace(/[^A-Za-z]/g, '').toUpperCase();
    const n = letters.length;

    if (n < 2) {
      document.getElementById('result-ic').innerHTML = `<p class="placeholder">${ui('IC計算には2文字以上の英字が必要です。', 'IC requires at least two letters.')}</p>`;
      return;
    }

    const freq = {};
    for (const char of letters) {
      freq[char] = (freq[char] || 0) + 1;
    }

    let sum = 0;
    for (const count of Object.values(freq)) {
      sum += count * (count - 1);
    }
    const ic = sum / (n * (n - 1));

    const references = [
      { name: ui('ランダム', 'Uniform random'), value: 0.0385, desc: ui('A–Zが一様な長い文字列', 'A long uniform A–Z string') },
      { name: ui('英語平文', 'English plaintext'), value: 0.0667, desc: ui('標準的な英語の目安', 'A typical English reference') },
      { name: ui('単一換字式', 'Monoalphabetic substitution'), value: 0.0667, desc: ui('文字頻度の集中度を保つ', 'Preserves letter-count concentration') }
    ];

    const minIC = 0.03;
    const maxIC = 0.08;
    const position = Math.min(100, Math.max(0, (ic - minIC) / (maxIC - minIC) * 100));

    const resultEl = document.getElementById('result-ic');
    resultEl.innerHTML = `
      <div class="ic-display">
        <div class="ic-value">${ic.toFixed(4)}</div>
        <div class="ic-bar-container">
          <span class="ic-marker" style="left: ${position}%">▼</span>
        </div>
        <div class="ic-labels">
          <span>${ui('ランダム', 'Random')} (0.038)</span>
          <span>${ui('英語', 'English')} (0.067)</span>
        </div>
      </div>
      <div class="ic-references">
        <h3 style="font-size: 0.9rem; margin-bottom: 0.5rem;">${ui('参照値', 'Reference values')}</h3>
        ${references.map(ref => `
          <div class="ic-ref-item">
            <span>${ref.name}: ${ref.value}</span>
            <span style="color: #666; font-size: 0.8rem;">${ref.desc}</span>
          </div>
        `).join('')}
      </div>
      <div class="ic-disclaimer">
        ${ui('注意: IC値は文字頻度の集中度を示す観察指標です。短文では大きく変動し、単一の値だけで暗号種別を断定できません。', 'Caution: IC measures letter-count concentration. It varies widely for short samples and cannot determine a cipher type by itself.')}
      </div>
    `;
  }

  // Word Spacing Analysis
  function analyzeSpacing(text) {
    const hasSpaces = text.includes(' ');
    const consecutiveSpaces = (text.match(/ {2,}/g) || []).length;

    let words = [];
    if (hasSpaces) {
      words = text.split(/\s+/).filter(w => w.length > 0 && /[A-Za-z]/.test(w));
    }

    const wordLengths = {};
    words.forEach(w => {
      const len = w.replace(/[^A-Za-z]/g, '').length;
      wordLengths[len] = (wordLengths[len] || 0) + 1;
    });

    const avgLength = words.length > 0
      ? (words.reduce((sum, w) => sum + w.replace(/[^A-Za-z]/g, '').length, 0) / words.length).toFixed(1)
      : 0;

    const maxCount = Math.max(...Object.values(wordLengths), 1);
    const chartBars = Object.entries(wordLengths)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([len, count]) => {
        const height = (count / maxCount * 100).toFixed(0);
        return `<div class="word-length-bar" style="height: ${height}%" data-length="${len}" title="${len} ${ui('文字', 'letters')}: ${count} ${ui('語', 'words')}"></div>`;
      }).join('');

    highlightState.spacing = {
      showHighlights: true
    };

    const resultTableEl = document.querySelector('#result-spacing .result-table');
    resultTableEl.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${hasSpaces ? ui('あり', 'Yes') : ui('なし', 'No')}</div>
          <div class="stat-label">${ui('スペースの存在', 'Spaces present')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${words.length}</div>
          <div class="stat-label">${ui('単語数', 'Words')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${avgLength}</div>
          <div class="stat-label">${ui('平均単語長', 'Average word length')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${consecutiveSpaces}</div>
          <div class="stat-label">${ui('連続スペース', 'Repeated spaces')}</div>
        </div>
      </div>
      ${hasSpaces ? `
        <h3 style="font-size: 0.9rem; margin: 1rem 0 0.5rem;">${ui('単語長分布', 'Word-length distribution')}</h3>
        <div class="word-length-chart">
          ${chartBars || `<p class="placeholder">${ui('データなし', 'No data')}</p>`}
        </div>
        <table class="seq-table">
          <thead>
            <tr><th>${ui('単語長', 'Length')}</th><th>${ui('出現数', 'Count')}</th><th>${ui('割合', 'Share')}</th></tr>
          </thead>
          <tbody>
            ${Object.entries(wordLengths)
              .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
              .map(([len, count]) => `
                <tr>
                  <td>${len} ${ui('文字', 'letters')}</td>
                  <td>${count}</td>
                  <td>${(count / words.length * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      ` : `<p style="margin-top: 1rem;">${ui('スペースが検出されませんでした。単語の区切りは観察できません。', 'No spaces were found, so word boundaries cannot be observed.')}</p>`}
    `;

    updateViewerWithHighlights('spacing');
  }

  // Repeated Sequences Analysis
  function analyzeRepeated(text) {
    const letters = text.replace(/[^A-Za-z]/g, '');
    const minLength = 3;
    const sequences = {};

    for (let len = minLength; len <= Math.min(15, letters.length / 2); len++) {
      for (let i = 0; i <= letters.length - len; i++) {
        const seq = letters.substring(i, i + len);
        if (!sequences[seq]) {
          sequences[seq] = [];
        }
        sequences[seq].push(i);
      }
    }

    const repeated = Object.entries(sequences)
      .filter(([_, positions]) => positions.length > 1)
      .map(([seq, positions]) => ({
        pattern: seq,
        length: seq.length,
        count: positions.length,
        positions: positions
      }))
      .sort((a, b) => b.length - a.length || b.count - a.count)
      .slice(0, 50);

    highlightState.repeated = {
      sequences: repeated,
      currentIndex: 0,
      selected: null,
      showHighlights: true
    };

    const tableEl = document.querySelector('#result-repeated .result-table');
    if (repeated.length === 0) {
      tableEl.innerHTML = `<p class="placeholder">${ui('繰り返しパターンが見つかりませんでした。', 'No repeated sequence was found.')}</p>`;
      return;
    }

    tableEl.innerHTML = `
      <table class="seq-table">
        <thead>
          <tr><th>${ui('パターン', 'Sequence')}</th><th>${ui('長さ', 'Length')}</th><th>${ui('出現回数', 'Count')}</th></tr>
        </thead>
        <tbody>
          ${repeated.map((seq, idx) => `
            <tr class="clickable" data-seq-idx="${idx}">
              <td class="seq-pattern" style="font-family: monospace;">${seq.pattern}</td>
              <td>${seq.length}</td>
              <td>${seq.count}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    tableEl.querySelectorAll('.clickable').forEach(row => {
      row.addEventListener('click', () => {
        const idx = parseInt(row.dataset.seqIdx);
        selectSequence('repeated', idx);
      });
    });

    updateViewerWithHighlights('repeated');
  }

  // Word Hints Analysis
  function analyzeWordHints(text) {
    const hasSpaces = text.includes(' ');
    const words = hasSpaces ? text.split(/\s+/).filter(w => w.length > 0 && /[A-Za-z]/.test(w)) : [];

    const oneLetterWords = words.filter(w => w.replace(/[^A-Za-z]/g, '').length === 1);
    const twoLetterWords = words.filter(w => w.replace(/[^A-Za-z]/g, '').length === 2);
    const threeLetterWords = words.filter(w => w.replace(/[^A-Za-z]/g, '').length === 3);

    const wordFreq = {};
    words.forEach(w => {
      const clean = w.replace(/[^A-Za-z]/g, '');
      wordFreq[clean] = (wordFreq[clean] || 0) + 1;
    });

    const sortedWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    const languageConstraintsEl = document.getElementById('languageConstraints');
    languageConstraintsEl.innerHTML = `
      <div class="hint-item">
        <strong>${ui('1文字単語:', 'One-letter words:')}</strong> ${oneLetterWords.length > 0 ? [...new Set(oneLetterWords.map(w => escapeHtml(w.replace(/[^A-Za-z]/g, ''))))].join(', ') : ui('なし', 'none')}
        <p style="font-size: 0.8rem; color: #666; margin-top: 0.25rem;">${ui('英語では通常 a, I のみ', 'Normally a or I in English')}</p>
      </div>
      <div class="hint-item">
        <strong>${ui('2文字単語（上位5）:', 'Two-letter words (top 5):')}</strong> ${[...new Set(twoLetterWords.map(w => escapeHtml(w.replace(/[^A-Za-z]/g, ''))))].slice(0, 5).join(', ') || ui('なし', 'none')}
        <p style="font-size: 0.8rem; color: #666; margin-top: 0.25rem;">${ui('よくある例:', 'Common examples:')} to, of, in, it, is, be, as, at, by, or, on</p>
      </div>
      <div class="hint-item">
        <strong>${ui('3文字単語（上位5）:', 'Three-letter words (top 5):')}</strong> ${[...new Set(threeLetterWords.map(w => escapeHtml(w.replace(/[^A-Za-z]/g, ''))))].slice(0, 5).join(', ') || ui('なし', 'none')}
        <p style="font-size: 0.8rem; color: #666; margin-top: 0.25rem;">${ui('よくある例:', 'Common examples:')} the, and, for, are, but, not, you</p>
      </div>
    `;

    const statisticalHintsEl = document.getElementById('statisticalHints');
    if (hasSpaces && sortedWords.length > 0) {
      statisticalHintsEl.innerHTML = `
        <div class="hint-item">
          <strong>${ui('頻出単語 Top 10:', 'Frequent words, top 10:')}</strong>
          <table class="seq-table" style="margin-top: 0.5rem;">
            <thead><tr><th>${ui('単語', 'Word')}</th><th>${ui('出現回数', 'Count')}</th></tr></thead>
            <tbody>
              ${sortedWords.slice(0, 10).map(([word, count]) => `
                <tr><td style="font-family: monospace;">${escapeHtml(word)}</td><td>${count}</td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="hint-item">
          <strong>${ui('平均単語長:', 'Average word length:')}</strong> ${(words.reduce((sum, w) => sum + w.replace(/[^A-Za-z]/g, '').length, 0) / words.length).toFixed(1)} ${ui('文字', 'letters')}
          <p style="font-size: 0.8rem; color: #666; margin-top: 0.25rem;">${ui('コーパスや数え方で値は変わります。', 'The value depends on the corpus and tokenization.')}</p>
        </div>
      `;
    } else {
      statisticalHintsEl.innerHTML = `<p class="placeholder">${ui('スペースがないため単語の統計は利用できません。', 'Word statistics are unavailable because there are no spaces.')}</p>`;
    }

    highlightState.wordHints = {
      words: oneLetterWords,
      showHighlights: true
    };

    updateViewerWithHighlights('wordHints');
  }

  // Frequency Analysis with comparison
  function analyzeFrequency(text) {
    const analysis = Core.analyzeFrequency(text, mapping);
    const n = analysis.total;

    if (n === 0) {
      document.getElementById('result-frequency').innerHTML = `<p class="placeholder">${ui('英字が見つかりませんでした。', 'No letters were found.')}</p>`;
      return;
    }
    const sorted = analysis.rows;
    const freq = Object.fromEntries(sorted.map(row => [row.letter, row.count]));

    const maxPercent = Math.max(sorted[0]?.percent || 0, 15);
    const high = sorted.filter(x => x.percent > 8);
    const mid = sorted.filter(x => x.percent > 2 && x.percent <= 8);
    const low = sorted.filter(x => x.percent <= 2 && x.count > 0);

    // Build comparison chart (cipher letters vs English reference)
    const chartHeight = 150; // pixels
    const comparisonBars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => {
      const cipherPercent = freq[letter] / n * 100;
      const englishPercent = ENGLISH_FREQ[letter];
      const cipherHeight = Math.round(cipherPercent / maxPercent * chartHeight);
      const englishHeight = Math.round(englishPercent / maxPercent * chartHeight);

      return `
        <div class="freq-bar-group">
          <div class="freq-bar-container">
            <div class="freq-bar-cipher" style="height: ${cipherHeight}px;" title="${letter}: ${cipherPercent.toFixed(1)}%"></div>
            <div class="freq-bar-english-marker" style="bottom: ${englishHeight}px;" title="${letter.toLowerCase()}: ${englishPercent.toFixed(1)}%"></div>
          </div>
          <span class="freq-bar-label">${letter}</span>
        </div>
      `;
    }).join('');

    const resultEl = document.getElementById('result-frequency');
    resultEl.innerHTML = `
      <div class="freq-comparison">
        <div class="freq-comparison-header">
          <span class="freq-legend"><span class="freq-legend-box cipher"></span> ${ui('暗号文', 'Ciphertext')}</span>
          <span class="freq-legend"><span class="freq-legend-box english"></span> ${ui('英語参照', 'English reference')}</span>
        </div>
        <div class="frequency-chart" style="padding-bottom: 1.5rem;">
          ${comparisonBars}
        </div>
      </div>
      <div class="freq-groups">
        <div class="freq-group">
          <div class="freq-group-label" style="color: #e74c3c;">${ui('高頻度', 'High')} (&gt;8%)</div>
          <div class="freq-group-letters">${high.map(x => x.letter).join(' ') || '-'}</div>
          <p style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">${ui('英語参照', 'English reference')}: e t a o i n</p>
        </div>
        <div class="freq-group">
          <div class="freq-group-label" style="color: #f39c12;">${ui('中頻度', 'Medium')} (2-8%)</div>
          <div class="freq-group-letters">${mid.map(x => x.letter).join(' ') || '-'}</div>
          <p style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">${ui('英語参照', 'English reference')}: s h r d l c u m w f g y p</p>
        </div>
        <div class="freq-group">
          <div class="freq-group-label" style="color: #3498db;">${ui('低頻度', 'Low')} (&lt;2%)</div>
          <div class="freq-group-letters">${low.map(x => x.letter).join(' ') || '-'}</div>
          <p style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">${ui('英語参照', 'English reference')}: b v k j x q z</p>
        </div>
      </div>
      <table class="seq-table" style="margin-top: 1rem;">
        <thead>
          <tr><th>${ui('暗号文字', 'Cipher')}</th><th>${ui('出現数', 'Count')}</th><th>${ui('頻度', 'Frequency')}</th><th>${ui('状態', 'Status')}</th><th>→${ui('平文', 'Plain')}</th><th>${ui('参照頻度', 'Reference')}</th><th>${ui('差分', 'Difference')}</th></tr>
        </thead>
        <tbody>
          ${sorted.map(x => {
            const mappedTo = mapping[x.letter];
            const hasMapped = mappedTo && /^[a-z]$/.test(mappedTo);
            const expectedFreq = hasMapped ? ENGLISH_FREQ[mappedTo.toUpperCase()] : null;
            const diff = hasMapped ? (x.percent - expectedFreq).toFixed(1) : null;
            const diffColor = diff > 0 ? '#e74c3c' : diff < 0 ? '#3498db' : '#666';
            const diffAbs = hasMapped ? Math.abs(parseFloat(diff)) : 0;
            const isGoodMatch = diffAbs < 2;
            const statusText = hasMapped ? ui('対応済', 'Mapped') : (x.count === 0 ? ui('未出現', 'Absent') : ui('未対応', 'Unmapped'));
            const statusColor = hasMapped ? '#2e7d32' : (x.count === 0 ? '#999' : '#333');
            const rowStyle = x.count === 0 ? 'opacity: 0.5;' : (hasMapped ? 'background: #f1f8e9;' : '');
            return `
              <tr style="${rowStyle}">
                <td style="font-family: monospace; font-weight: bold;">${x.letter}</td>
                <td>${x.count}</td>
                <td>${x.percent.toFixed(2)}%</td>
                <td style="font-size: 0.75rem; color: ${statusColor};">${statusText}</td>
                <td style="font-family: monospace; font-weight: bold; color: ${hasMapped ? '#2e7d32' : '#999'};">${hasMapped ? mappedTo : '-'}</td>
                <td>${hasMapped ? `${expectedFreq.toFixed(2)}%` : '-'}</td>
                <td style="color: ${hasMapped ? diffColor : '#999'}; ${hasMapped && isGoodMatch ? 'background: #e8f5e9;' : ''}">
                  ${hasMapped ? `${diff > 0 ? '+' : ''}${diff}%` : '-'}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      <p style="font-size: 0.75rem; color: #666; margin-top: 0.5rem;">
        ${ui('※ 割合の分母は、対応済みかどうかに関係なく暗号文中の全英字です。差分が小さいことは仮説を支持する一要素ですが、対応の正しさを証明しません。短文・固有名詞・文体・分野で頻度は大きく変わります。', 'The denominator is every letter in the ciphertext, whether mapped or not. A small difference is only one supporting observation; it does not prove a mapping. Short samples, names, style, and subject matter can change frequencies substantially.')}
      </p>
    `;
  }

  // N-grams Analysis
  function analyzeNgrams(text) {
    const letters = text.replace(/[^A-Za-z]/g, '');
    const n = ngramMode;
    const limit = n === 2 ? 25 : (n === 3 ? 15 : 10);

    if (letters.length < n) {
      const tableEl = document.querySelector('#result-ngrams .result-table');
      tableEl.innerHTML = `<p class="placeholder">${ui(`${n}-gramの分析には${n}文字以上の英字が必要です。`, `${n}-gram analysis requires at least ${n} letters.`)}</p>`;
      return;
    }

    const ngrams = {};
    for (let i = 0; i <= letters.length - n; i++) {
      const gram = letters.substring(i, i + n);
      if (!ngrams[gram]) {
        ngrams[gram] = { count: 0, positions: [] };
      }
      ngrams[gram].count++;
      ngrams[gram].positions.push(i);
    }

    const sorted = Object.entries(ngrams)
      .map(([gram, data]) => ({ gram, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    highlightState.ngrams = {
      sequences: sorted.map(x => ({ pattern: x.gram, positions: x.positions, count: x.count })),
      currentIndex: 0,
      selected: null,
      showHighlights: true
    };

    const english2grams = ['th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd'];
    const english3grams = ['the', 'and', 'ing', 'ent', 'ion', 'her', 'for', 'tha', 'nth', 'int'];
    const english4grams = ['that', 'ther', 'with', 'tion', 'here', 'ould', 'ight', 'have', 'hich', 'whic'];
    const englishRef = n === 2 ? english2grams : (n === 3 ? english3grams : english4grams);

    const tableEl = document.querySelector('#result-ngrams .result-table');
    tableEl.innerHTML = `
      <p style="font-size: 0.8rem; color: #666; margin-bottom: 0.5rem;">
        ${ui(`英語での頻出${n}-gram`, `Common English ${n}-grams`)}: ${englishRef.join(', ')}
      </p>
      <table class="seq-table">
        <thead>
          <tr><th>${ui('順位', 'Rank')}</th><th>${n}-gram</th><th>${ui('出現回数', 'Count')}</th></tr>
        </thead>
        <tbody>
          ${sorted.map((x, idx) => `
            <tr class="clickable" data-seq-idx="${idx}">
              <td>${idx + 1}</td>
              <td class="seq-pattern" style="font-family: monospace;">${x.gram}</td>
              <td>${x.count}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="ic-disclaimer" style="margin-top: 1rem;">
        ${ui('注意: これは観察指標です。N-gram頻度だけで文字の対応を断定できません。', 'Caution: this is an observation. N-gram frequency alone cannot determine a letter mapping.')}
      </div>
    `;

    tableEl.querySelectorAll('.clickable').forEach(row => {
      row.addEventListener('click', () => {
        const idx = parseInt(row.dataset.seqIdx);
        selectSequence('ngrams', idx);
      });
    });

    updateViewerWithHighlights('ngrams');
  }

  // Pattern Analysis with position classification and reversible pairs
  function analyzePattern(text) {
    const hasSpaces = text.includes(' ');
    const words = hasSpaces ? text.split(/\s+/).filter(w => w.length > 0 && /[A-Za-z]/.test(w)) : [];
    const sourceWords = cipherInput.value.split(/\s+/).filter(w => w.length > 0 && /[A-Za-z]/.test(w));

    if (words.length === 0) {
      document.getElementById('patternWords').innerHTML = `<p class="placeholder">${ui('スペースがないため単語パターンの分析ができません。', 'Word-pattern analysis requires spaces.')}</p>`;
      document.getElementById('nonPatternWords').innerHTML = '<p class="placeholder">-</p>';
      document.getElementById('extraObservations').innerHTML = '<p class="placeholder">-</p>';
      return;
    }

    // Analyze word patterns with position
    const patterns = [];
    words.forEach((w, wordIndex) => {
      const clean = w.replace(/[^A-Za-z]/g, '');
      const pattern = Core.wordPattern(clean);
      const cipherWord = (sourceWords[wordIndex] || clean).replace(/[^A-Za-z]/g, '').toUpperCase();

      // Determine position (start/middle/end)
      let position = 'middle';
      if (wordIndex === 0) position = 'start';
      else if (wordIndex === words.length - 1) position = 'end';

      const isPattern = pattern !== [...Array(clean.length)].map((_, i) => i + 1).join('-');
      patterns.push({ word: clean, cipherWord, pattern, isPattern, position, wordIndex });
    });

    // Group by pattern
    const patternGroups = {};
    patterns.forEach(({ word, cipherWord, pattern, isPattern, position }) => {
      if (isPattern) {
        if (!patternGroups[pattern]) {
          patternGroups[pattern] = { words: [], cipherWords: [], positions: { start: 0, middle: 0, end: 0 } };
        }
        patternGroups[pattern].words.push(word);
        patternGroups[pattern].cipherWords.push(cipherWord);
        patternGroups[pattern].positions[position]++;
      }
    });

    const sortedPatterns = Object.entries(patternGroups)
      .map(([pattern, data]) => ({
        pattern,
        words: [...new Set(data.words)],
        cipherWords: [...new Set(data.cipherWords)],
        count: data.words.length,
        positions: data.positions
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    // Non-pattern words
    const nonPatternWords = patterns
      .filter(p => !p.isPattern)
      .map(p => p.word);
    const uniqueNonPattern = [...new Set(nonPatternWords)];

    // Extra observations
    const letters = text.replace(/[^A-Za-z]/g, '');

    // Double letters
    const doubleLetters = {};
    for (let i = 0; i < letters.length - 1; i++) {
      if (letters[i] === letters[i + 1]) {
        const double = letters.substring(i, i + 2);
        doubleLetters[double] = (doubleLetters[double] || 0) + 1;
      }
    }

    // Reversible pairs (AB and BA)
    const bigrams = {};
    for (let i = 0; i < letters.length - 1; i++) {
      const bigram = letters.substring(i, i + 2);
      bigrams[bigram] = (bigrams[bigram] || 0) + 1;
    }

    const reversiblePairs = [];
    const checkedPairs = new Set();
    Object.keys(bigrams).forEach(bigram => {
      const reverse = bigram[1] + bigram[0];
      if (bigram !== reverse && bigrams[reverse] && !checkedPairs.has(reverse)) {
        reversiblePairs.push({
          pair: bigram,
          reverse: reverse,
          countA: bigrams[bigram],
          countB: bigrams[reverse]
        });
        checkedPairs.add(bigram);
      }
    });
    reversiblePairs.sort((a, b) => (b.countA + b.countB) - (a.countA + a.countB));

    highlightState.pattern = {
      words: sortedPatterns.length > 0 ? sortedPatterns[0].words : [],
      currentIndex: 0,
      selected: null,
      showHighlights: true
    };

    // Render pattern words with position badges
    document.getElementById('patternWords').innerHTML = sortedPatterns.length > 0 ? `
      <p style="font-size: 0.8rem; color: #666; margin-bottom: 0.5rem;">${ui('クリックでハイライト表示', 'Select to highlight')}</p>
      ${sortedPatterns.map((p, idx) => {
        const positionBadges = [];
        if (p.positions.start > 0) positionBadges.push(`<span class="position-badge start">${ui('頭', 'start ')}${p.positions.start}</span>`);
        if (p.positions.middle > 0) positionBadges.push(`<span class="position-badge middle">${ui('中', 'middle ')}${p.positions.middle}</span>`);
        if (p.positions.end > 0) positionBadges.push(`<span class="position-badge end">${ui('末', 'end ')}${p.positions.end}</span>`);

        return `
          <button type="button" class="pattern-word" data-pattern-idx="${idx}" data-words="${escapeHtml(p.words.join(','))}" data-cipher-word="${escapeHtml(p.cipherWords[0])}" title="${ui('パターン', 'Pattern')}: ${escapeHtml(p.pattern)}">
            ${escapeHtml(p.words[0])} <span style="font-size: 0.7rem; color: #666;">(${escapeHtml(p.pattern)})</span>
            ${positionBadges.join('')}
          </button>
        `;
      }).join('')}
    ` : `<p class="placeholder">${ui('パターンワードが見つかりませんでした。', 'No repeated-letter word pattern was found.')}</p>`;

    document.getElementById('nonPatternWords').innerHTML = uniqueNonPattern.length > 0 ? `
      <p style="font-size: 0.8rem; color: #666; margin-bottom: 0.5rem;">${ui('すべて異なる文字で構成（注目候補）', 'Every letter is distinct (observation candidates)')}</p>
      ${patterns.filter(p => !p.isPattern).filter((p, index, rows) => rows.findIndex(row => row.word === p.word) === index).slice(0, 20).map(p => `<button type="button" class="pattern-word" data-cipher-word="${escapeHtml(p.cipherWord)}">${escapeHtml(p.word)}</button>`).join('')}
      ${uniqueNonPattern.length > 20 ? `<span style="color: #666;">... ${ui(`他${uniqueNonPattern.length - 20}語`, `${uniqueNonPattern.length - 20} more`)}</span>` : ''}
    ` : `<p class="placeholder">${ui('非パターンワードが見つかりませんでした。', 'No all-distinct word was found.')}</p>`;

    const sortedDoubles = Object.entries(doubleLetters).sort((a, b) => b[1] - a[1]);
    document.getElementById('extraObservations').innerHTML = `
      <div class="hint-item">
        <strong>${ui('二重文字:', 'Double letters:')}</strong>
        ${sortedDoubles.length > 0 ? sortedDoubles.slice(0, 10).map(([d, c]) => `${d}(${c})`).join(', ') : ui('なし', 'none')}
        <p style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">${ui('英語でよくある例', 'Common English examples')}: LL, SS, EE, OO, TT, FF, RR, NN, PP, CC</p>
      </div>
      <div class="hint-item">
        <strong>${ui('可逆ペア:', 'Reversible pairs:')}</strong>
        ${reversiblePairs.length > 0 ? `
          <div class="reversible-pairs">
            ${reversiblePairs.slice(0, 10).map(p => `
              <span class="reversible-pair" data-pair="${p.pair}" data-reverse="${p.reverse}">
                ${p.pair}<span class="arrow">⇄</span>${p.reverse}
                <span style="font-size: 0.7rem; color: #666;">(${p.countA}/${p.countB})</span>
              </span>
            `).join('')}
          </div>
        ` : ui('なし', 'none')}
        <p style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">${ui('英語でよくある例', 'Common English examples')}: ER-RE, ON-NO, TO-OT, IN-NI, ES-SE</p>
      </div>
    `;

    // Add click handlers
    document.querySelectorAll('#patternWords .pattern-word').forEach(el => {
      el.addEventListener('click', () => {
        const words = el.dataset.words.split(',');
        highlightState.pattern.words = words;
        highlightState.pattern.currentIndex = 0;
        document.querySelectorAll('#patternWords .pattern-word').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');
        wordCandidateCipher.value = el.dataset.cipherWord || words[0].toUpperCase();
        updateWordCandidatePattern();
        updateViewerWithHighlights('pattern');
      });
    });

    document.querySelectorAll('#nonPatternWords .pattern-word').forEach(el => {
      el.addEventListener('click', () => {
        wordCandidateCipher.value = el.dataset.cipherWord || el.textContent.trim().toUpperCase();
        updateWordCandidatePattern();
        wordCandidateCipher.focus();
      });
    });

    updateViewerWithHighlights('pattern');
  }

  // Kasiski Test for polyalphabetic ciphers
  function analyzeKasiski(text) {
    const letters = text.replace(/[^A-Za-z]/g, '');

    if (letters.length < 20) {
      document.getElementById('result-kasiski').innerHTML = `<p class="placeholder">${ui('Kasiskiテストには20文字以上の暗号文が必要です。', 'The Kasiski examination requires at least 20 letters.')}</p>`;
      return;
    }

    // Find repeated sequences and their distances
    const sequences = {};
    for (let len = 3; len <= 6; len++) {
      for (let i = 0; i <= letters.length - len; i++) {
        const seq = letters.substring(i, i + len);
        if (!sequences[seq]) {
          sequences[seq] = [];
        }
        sequences[seq].push(i);
      }
    }

    // Calculate distances between occurrences
    const distances = [];
    Object.entries(sequences).forEach(([seq, positions]) => {
      if (positions.length > 1) {
        for (let i = 1; i < positions.length; i++) {
          distances.push({
            sequence: seq,
            distance: positions[i] - positions[i - 1]
          });
        }
      }
    });

    if (distances.length === 0) {
      document.getElementById('result-kasiski').innerHTML = `
        <div class="ic-disclaimer">
          ${ui('3〜6文字の繰り返しが見つかりませんでした。暗号種別を示す結果ではありません。標本が短い場合や反復が少ない場合にも起こります。', 'No repeated sequence of 3–6 letters was found. This does not identify the cipher type; it can also occur in a short sample or one with few repeats.')}
        </div>
      `;
      return;
    }

    // Find factors of distances
    const factorCounts = {};
    distances.forEach(({ distance }) => {
      for (let f = 2; f <= Math.min(distance, 20); f++) {
        if (distance % f === 0) {
          factorCounts[f] = (factorCounts[f] || 0) + 1;
        }
      }
    });

    const sortedFactors = Object.entries(factorCounts)
      .map(([factor, count]) => ({ factor: parseInt(factor), count }))
      .sort((a, b) => b.count - a.count);

    const maxCount = sortedFactors.length > 0 ? sortedFactors[0].count : 1;
    const recommendedKeyLength = sortedFactors.length > 0 ? sortedFactors[0].factor : null;

    // Render results
    const resultEl = document.getElementById('result-kasiski');
    resultEl.innerHTML = `
      <div class="kasiski-results">
        <div class="kasiski-section">
          <h3>${ui('鍵長の候補因数', 'Candidate key-length factors')}</h3>
          <p style="font-size: 0.8rem; color: #666; margin-bottom: 0.5rem;">
            ${ui('繰り返し位置の距離を2〜20の因数で集計', 'Counts factors from 2 to 20 for distances between repeated positions')}
          </p>
          <div class="factor-chart">
            ${sortedFactors.slice(0, 12).map(({ factor, count }) => {
              const height = (count / maxCount * 100).toFixed(0);
              const isRecommended = factor === recommendedKeyLength;
              return `<div class="factor-bar ${isRecommended ? 'recommended' : ''}" style="height: ${height}%" data-factor="${factor}" title="${ui('因数', 'Factor')} ${factor}: ${count}"></div>`;
            }).join('')}
          </div>
          ${recommendedKeyLength ? `
            <p style="margin-top: 1.5rem;">
              <strong>${ui('最多の候補因数:', 'Most frequent candidate factor:')}</strong>
              <span style="font-size: 1.5rem; font-weight: bold; color: #27ae60;">${recommendedKeyLength}</span>
            </p>
          ` : ''}
        </div>
        <div class="kasiski-section">
          <h3>${ui('繰り返しパターン（上位10）', 'Repeated sequences (top 10)')}</h3>
          <table class="seq-table">
            <thead>
              <tr><th>${ui('パターン', 'Sequence')}</th><th>${ui('距離', 'Distance')}</th><th>${ui('因数', 'Factors')}</th></tr>
            </thead>
            <tbody>
              ${distances.slice(0, 10).map(({ sequence, distance }) => {
                const factors = [];
                for (let f = 2; f <= Math.min(distance, 20); f++) {
                  if (distance % f === 0) factors.push(f);
                }
                return `
                  <tr>
                    <td style="font-family: monospace;">${escapeHtml(sequence)}</td>
                    <td>${distance}</td>
                    <td>${factors.join(', ')}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="kasiski-section">
          <h3>${ui('因数の出現頻度', 'Factor frequencies')}</h3>
          <table class="seq-table">
            <thead>
              <tr><th>${ui('因数', 'Factor')}</th><th>${ui('出現回数', 'Count')}</th><th>${ui('距離数に対する割合', 'Share of distances')}</th></tr>
            </thead>
            <tbody>
              ${sortedFactors.slice(0, 10).map(({ factor, count }) => `
                <tr>
                  <td style="font-weight: bold;">${factor}</td>
                  <td>${count}</td>
                  <td>${(count / distances.length * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="ic-disclaimer" style="margin-top: 1rem;">
        ${ui('注意: Kasiskiテストは多表式暗号の鍵長候補を絞る観察手法です。単一換字式には適用しません。偶然の反復、倍数・約数、短い標本の影響があるため、最多因数を正解とみなさず、候補ごとの列ICなどで追加検証してください。', 'Caution: the Kasiski examination narrows candidate periods for polyalphabetic ciphers and does not apply to monoalphabetic substitution. Coincidental repeats, multiples, divisors, and short samples can mislead. Do not treat the most frequent factor as the answer; test candidates with column IC and other evidence.')}
      </div>
    `;
  }

  // Highlight functions
  function selectSequence(tabName, idx) {
    const state = highlightState[tabName];
    if (!state || !state.sequences) return;

    state.selected = idx;
    state.currentIndex = 0;

    document.querySelectorAll(`#result-${tabName} .clickable`).forEach((row, i) => {
      row.classList.toggle('selected', i === idx);
    });

    updateViewerWithHighlights(tabName);
    updateNavigationButtons(tabName);
  }

  function updateViewerWithHighlights(tabName) {
    const viewer = document.getElementById(`viewerText-${tabName}`);
    if (!viewer) return;

    const text = getWorkingText();
    const state = highlightState[tabName];

    if (!state || !state.showHighlights) {
      viewer.innerHTML = formatCiphertext(text, tabName === 'spacing');
      return;
    }

    let positions = [];
    let patternLength = 0;

    if (tabName === 'repeated' || tabName === 'ngrams') {
      if (state.selected !== null && state.sequences && state.sequences[state.selected]) {
        const seq = state.sequences[state.selected];
        positions = seq.positions;
        patternLength = seq.pattern.length;
      }
    } else if (tabName === 'pattern' || tabName === 'wordHints') {
      const words = state.words || [];
      const textUpper = text.toUpperCase();
      words.forEach(word => {
        let idx = 0;
        while ((idx = textUpper.indexOf(word.toUpperCase(), idx)) !== -1) {
          positions.push(idx);
          idx++;
        }
      });
      patternLength = words[0]?.length || 0;
    } else if (tabName === 'spacing') {
      viewer.innerHTML = formatCiphertext(text, true);
      return;
    }

    if (positions.length === 0) {
      viewer.innerHTML = formatCiphertext(text, tabName === 'spacing');
      return;
    }

    // Build highlighted text
    const lettersOnly = text.replace(/[^A-Za-z]/g, '').toUpperCase();
    let result = '';
    let letterIdx = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (/[A-Za-z]/.test(char)) {
        const isHighlight = positions.some(p => letterIdx >= p && letterIdx < p + patternLength);
        const isCurrent = positions[state.currentIndex] !== undefined &&
          letterIdx >= positions[state.currentIndex] &&
          letterIdx < positions[state.currentIndex] + patternLength;

        if (isHighlight) {
          const colorClass = `color-${highlightColor}`;
          const cls = isCurrent ? `highlight ${colorClass} current` : `highlight ${colorClass}`;
          result += `<span class="${cls}">${char}</span>`;
        } else if (/[A-Z]/.test(char)) {
          result += `<span class="upper">${char}</span>`;
        } else {
          result += `<span class="lower">${char}</span>`;
        }
        letterIdx++;
      } else if (char === ' ' && tabName === 'spacing') {
        result += `<span class="space-marker"> </span>`;
      } else {
        result += escapeHtml(char);
      }
    }

    viewer.innerHTML = result;
    updateNavigationButtons(tabName);
  }

  function navigateHighlight(tabName, direction) {
    const state = highlightState[tabName];
    if (!state) return;

    let positions = [];
    if (tabName === 'repeated' || tabName === 'ngrams') {
      if (state.selected !== null && state.sequences && state.sequences[state.selected]) {
        positions = state.sequences[state.selected].positions;
      }
    } else if (tabName === 'pattern' || tabName === 'wordHints') {
      const words = state.words || [];
      const text = getWorkingText().toUpperCase();
      words.forEach(word => {
        let idx = 0;
        while ((idx = text.indexOf(word.toUpperCase(), idx)) !== -1) {
          positions.push(idx);
          idx++;
        }
      });
    }

    if (positions.length === 0) return;

    state.currentIndex += direction;
    if (state.currentIndex < 0) state.currentIndex = positions.length - 1;
    if (state.currentIndex >= positions.length) state.currentIndex = 0;

    updateViewerWithHighlights(tabName);
  }

  function toggleHighlights(tabName) {
    const state = highlightState[tabName];
    if (!state) {
      highlightState[tabName] = { showHighlights: true };
    } else {
      state.showHighlights = !state.showHighlights;
    }

    const btn = document.getElementById(`btnToggle${capitalize(tabName)}`);
    if (btn) {
      btn.classList.toggle('active', highlightState[tabName].showHighlights);
    }

    updateViewerWithHighlights(tabName);
  }

  function updateNavigationButtons(tabName) {
    const state = highlightState[tabName];
    const counter = document.getElementById(`matchCounter-${tabName}`);
    const btnPrev = document.getElementById(`btnPrev${capitalize(tabName)}`);
    const btnNext = document.getElementById(`btnNext${capitalize(tabName)}`);

    if (!state || !counter) return;

    let positions = [];
    if (tabName === 'repeated' || tabName === 'ngrams') {
      if (state.selected !== null && state.sequences && state.sequences[state.selected]) {
        positions = state.sequences[state.selected].positions;
      }
    }

    if (positions.length > 0) {
      counter.textContent = `${state.currentIndex + 1} / ${positions.length}`;
      if (btnPrev) btnPrev.disabled = false;
      if (btnNext) btnNext.disabled = false;
    } else {
      counter.textContent = '-';
      if (btnPrev) btnPrev.disabled = true;
      if (btnNext) btnNext.disabled = true;
    }
  }

})();
