// Substitution Cipher Analysis Workbench
// Manual cryptanalysis support tool

(function() {
  'use strict';

  // State
  let currentPhase = 1;
  let currentTab = 'statistics';
  let ngramMode = 2;
  let highlightState = {};
  let highlightColor = 'yellow';
  let mapping = {};
  let originalCiphertext = ''; // マッピングリセット用に元の暗号文を保持

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
          <li>平均単語長: 約6.2文字</li>
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
          <li>IC ≈ 0.067 → 単一換字式の可能性が高い</li>
          <li>IC ≈ 0.038〜0.045 → 多表式暗号の可能性</li>
          <li>短い暗号文ではICの信頼性が低下</li>
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
          <tr><td>英語</td><td>6.2文字</td><td>スペイン語</td><td>5.8文字</td></tr>
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
        <h3>頻出2-gram（バイグラム/連字）ベスト25</h3>
        <p style="font-size: 0.9rem;"><strong>th, he, in, er, an, re, nd, at, on, nt, ha, es, st, en, ed, to, it, ou, ea, hi, is, or, ti, as, te</strong></p>

        <h3>頻出3-gram（トライグラム/3連字）ベスト10</h3>
        <p style="font-size: 0.9rem;"><strong>the, and, tha, ent, ing, ion, tio, for, nde, has</strong></p>

        <h3>先頭文字別の連字・3連字</h3>
        <table class="ref-table">
          <tr><th>先頭</th><th>連字</th><th>3連字</th></tr>
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
          <li>THは最も頻出するバイグラム</li>
          <li>THEは最も頻出するトライグラム</li>
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
          <li>最も多く出現する因数が推定鍵長</li>
        </ol>

        <h3>注意点</h3>
        <ul>
          <li>短い暗号文では精度が低下</li>
          <li>偶然の一致による誤検出の可能性</li>
          <li>複数の候補がある場合は各候補でIC分析を実施</li>
        </ul>

        <h3>IC値との併用</h3>
        <p>Kasiskiで鍵長候補を絞り、その鍵長で暗号文を分割してIC値を計算。IC ≈ 0.067 なら正しい鍵長の可能性が高い。</p>

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
  const btnApplyMapping = document.getElementById('btnApplyMapping');
  const btnClearMapping = document.getElementById('btnClearMapping');
  const toast = document.getElementById('toast');
  const highlightColorSelect = document.getElementById('highlightColor');

  // Initialize
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    generateMappingGrid();
    setupEventListeners();
    setupKeyboardShortcuts();
    updateCharCount();
    updateViewers();
    loadFromStorage();
  }

  function generateMappingGrid() {
    mappingGrid.innerHTML = '';
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      const div = document.createElement('div');
      div.className = 'mapping-item';
      div.innerHTML = `
        <span class="mapping-label">${letter}</span>
        <input type="text" class="mapping-input" data-letter="${letter}" maxlength="1" autocomplete="off">
      `;
      mappingGrid.appendChild(div);
    }

    // Add input handlers
    mappingGrid.querySelectorAll('.mapping-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        if (val && !/^[a-z]$/.test(val)) {
          e.target.value = '';
          return;
        }
        e.target.value = val;
        e.target.classList.toggle('has-value', val.length > 0);
        mapping[e.target.dataset.letter] = val;
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
      updateViewers();
    });

    btnNormalize.addEventListener('click', normalizeCiphertext);
    btnClear.addEventListener('click', clearCiphertext);
    btnCopy.addEventListener('click', copyCiphertext);

    // Save/Load
    btnSave.addEventListener('click', saveToStorage);
    btnLoad.addEventListener('click', loadFromStorage);

    // Mapping
    btnApplyMapping.addEventListener('click', applyMapping);
    btnClearMapping.addEventListener('click', clearMapping);

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
    const data = REFERENCE_DATA[refType];
    if (!data) return;

    refModalTitle.textContent = data.title;
    refModalBody.innerHTML = data.content;
    refModal.classList.remove('hidden');
  }

  // Storage functions
  function saveToStorage() {
    const data = {
      ciphertext: cipherInput.value,
      originalCiphertext: originalCiphertext,
      mapping: mapping,
      phase: currentPhase,
      tab: currentTab
    };
    try {
      localStorage.setItem('cipher-workbench-state', JSON.stringify(data));
      showToast('作業状態を保存しました', 'success');
    } catch (e) {
      showToast('保存に失敗しました', 'error');
    }
  }

  function loadFromStorage() {
    try {
      const saved = localStorage.getItem('cipher-workbench-state');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.ciphertext) {
          cipherInput.value = data.ciphertext;
          updateCharCount();
          updateViewers();
        }
        if (data.originalCiphertext) {
          originalCiphertext = data.originalCiphertext;
        }
        if (data.mapping) {
          mapping = data.mapping;
          Object.entries(mapping).forEach(([letter, value]) => {
            const input = mappingGrid.querySelector(`[data-letter="${letter}"]`);
            if (input && value) {
              input.value = value;
              input.classList.add('has-value');
            }
          });
        }
        if (data.phase) {
          switchPhase(data.phase);
        }
        if (data.tab) {
          switchTab(data.tab);
        }
        showToast('作業状態を復元しました', 'success');
      }
    } catch (e) {
      // Ignore load errors
    }
  }

  // Mapping functions
  function applyMapping() {
    let text = cipherInput.value;
    let applied = false;

    // 初回適用時に元の暗号文を保存（まだ保存されていない場合）
    if (!originalCiphertext) {
      // 現在のテキストを大文字に変換して保存
      originalCiphertext = text.toUpperCase();
    }

    Object.entries(mapping).forEach(([upper, lower]) => {
      if (lower && lower.length === 1) {
        const regex = new RegExp(upper, 'g');
        if (text.includes(upper)) {
          text = text.replace(regex, lower);
          applied = true;
        }
      }
    });

    if (applied) {
      cipherInput.value = text;
      updateCharCount();
      updateViewers();
      showToast('マッピングを適用しました', 'success');
    } else {
      showToast('適用する文字がありません', '');
    }
  }

  function clearMapping() {
    mapping = {};
    mappingGrid.querySelectorAll('.mapping-input').forEach(input => {
      input.value = '';
      input.classList.remove('has-value');
    });

    // 元の暗号文があれば復元
    if (originalCiphertext) {
      cipherInput.value = originalCiphertext;
      updateCharCount();
      updateViewers();
      showToast('マッピングをリセットし、元の暗号文に戻しました', 'success');
    } else {
      showToast('マッピングをリセットしました', '');
    }
  }

  // Input functions
  function updateCharCount() {
    charCount.textContent = cipherInput.value.length;
  }

  function normalizeCiphertext() {
    let text = cipherInput.value;
    text = text.toUpperCase();
    text = text.replace(/[^A-Z\s\n]/g, '');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n+/g, '\n');
    text = text.trim();
    cipherInput.value = text;
    // 正規化後のテキストを元の暗号文として保存
    originalCiphertext = text;
    updateCharCount();
    updateViewers();
    showToast('正規化しました', 'success');
  }

  function clearCiphertext() {
    cipherInput.value = '';
    updateCharCount();
    updateViewers();
    document.querySelectorAll('.panel-body').forEach(panel => {
      const placeholder = panel.querySelector('.placeholder');
      if (!placeholder) {
        panel.innerHTML = '<p class="placeholder">「分析実行」ボタンを押して解析を開始してください。</p>';
      }
    });
    document.querySelectorAll('.last-run').forEach(el => {
      el.textContent = '未実行';
    });
  }

  function copyCiphertext() {
    navigator.clipboard.writeText(cipherInput.value).then(() => {
      showToast('クリップボードにコピーしました', 'success');
    }).catch(() => {
      showToast('コピーに失敗しました', 'error');
    });
  }

  function updateViewers() {
    const text = cipherInput.value;
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
  function runAnalysis(type) {
    const text = cipherInput.value;
    if (!text.trim()) {
      showToast('暗号文を入力してください', 'error');
      return;
    }

    const timestamp = new Date().toLocaleTimeString('ja-JP');
    const lastRunEl = document.getElementById(`lastRun-${type}`);
    if (lastRunEl) {
      lastRunEl.textContent = `最終実行: ${timestamp}`;
    }

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
        analyzeFrequency(text);
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
    features.push(stats.spaces > 0 ? '✓ スペースあり（単語区切り可能）' : '✗ スペースなし');
    features.push(stats.digits > 0 ? '✓ 数字を含む' : '✗ 数字なし');
    features.push(stats.symbols > 0 ? `✓ 記号を含む (${stats.symbols}個)` : '✗ 記号なし');
    if (unresolvedLetters.size === 26) {
      features.push('● 全26文字使用');
    } else if (unresolvedLetters.size < 10) {
      features.push(`● 使用文字が少ない (${unresolvedLetters.size}種) - 短い暗号文または特殊な暗号の可能性`);
    }

    // 3. マッピング状況グリッド (26文字)
    const mappingGridHtml = allLetters.map(letter => {
      const isResolved = [...resolvedLetters].some(r => r.toUpperCase() === letter);
      const isUnresolved = unresolvedLetters.has(letter);
      const mappedTo = mapping[letter] || '';

      let statusClass = 'unused';
      let statusLabel = '';
      if (isResolved || mappedTo) {
        statusClass = 'resolved';
        statusLabel = mappedTo || '?';
      } else if (isUnresolved) {
        statusClass = 'unresolved';
      }

      return `<div class="mapping-status-cell ${statusClass}" title="${letter}${mappedTo ? ' → ' + mappedTo : ''}">
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
      : '<span class="no-mapping">マッピング未設定</span>';

    const resultEl = document.getElementById('result-statistics');
    resultEl.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">総文字数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.uppercase}</div>
          <div class="stat-label">大文字（未解読）</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.lowercase}</div>
          <div class="stat-label">小文字（解読済み）</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.spaces}</div>
          <div class="stat-label">スペース</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.newlines}</div>
          <div class="stat-label">改行</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.words}</div>
          <div class="stat-label">単語数</div>
        </div>
      </div>

      <div class="stats-section">
        <h3 class="stats-section-title">暗号文の特徴</h3>
        <div class="feature-list">
          ${features.map(f => `<div class="feature-item">${escapeHtml(f)}</div>`).join('')}
        </div>
      </div>

      <div class="stats-section">
        <h3 class="stats-section-title">出現頻度ランキング（未解読文字）</h3>
        <div class="freq-ranking">
          ${freqRanking.length > 0
            ? freqRanking.map((item, idx) => `<span class="freq-rank-item ${idx < 3 ? 'top' : ''}">${escapeHtml(item.letter)}<small>(${item.count})</small></span>`).join('')
            : '<span class="no-data">未解読文字なし</span>'}
        </div>
      </div>

      <div class="stats-section">
        <h3 class="stats-section-title">マッピング状況</h3>
        <div class="mapping-status-legend">
          <span><span class="legend-dot unresolved"></span>未解読</span>
          <span><span class="legend-dot resolved"></span>解読済み</span>
          <span><span class="legend-dot unused"></span>未使用</span>
        </div>
        <div class="mapping-status-grid">${mappingGridHtml}</div>
      </div>

      <div class="stats-section">
        <h3 class="stats-section-title">適用中のマッピング</h3>
        <div class="applied-mappings">${mappingListHtml}</div>
      </div>

      <div class="stats-section">
        <h3 class="stats-section-title">解読進捗</h3>
        <div class="progress-chart-container">
          <div class="pie-chart" style="background: conic-gradient(
            #27ae60 0deg ${stats.lowercase / stats.letters * 360 || 0}deg,
            #e74c3c ${stats.lowercase / stats.letters * 360 || 0}deg ${(stats.lowercase + stats.uppercase) / stats.letters * 360 || 0}deg,
            #95a5a6 ${(stats.lowercase + stats.uppercase) / stats.letters * 360 || 0}deg 360deg
          );">
            <div class="pie-center">
              <span class="pie-percent">${progress}%</span>
              <span class="pie-label">解読済</span>
            </div>
          </div>
          <div class="pie-legend">
            <div class="pie-legend-item"><span class="pie-dot resolved"></span>解読済み (${stats.lowercase})</div>
            <div class="pie-legend-item"><span class="pie-dot unresolved"></span>未解読 (${stats.uppercase})</div>
            <div class="pie-legend-item"><span class="pie-dot other"></span>その他 (${stats.spaces + stats.newlines + stats.symbols})</div>
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
      document.getElementById('result-ic').innerHTML = '<p class="placeholder">IC計算には2文字以上の英字が必要です。</p>';
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
      { name: 'ランダム', value: 0.0385, desc: '完全にランダムな文字列' },
      { name: '英語平文', value: 0.0667, desc: '標準的な英語テキスト' },
      { name: '単一換字式', value: 0.0667, desc: '単純換字式暗号' }
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
          <span>ランダム (0.038)</span>
          <span>英語 (0.067)</span>
        </div>
      </div>
      <div class="ic-references">
        <h3 style="font-size: 0.9rem; margin-bottom: 0.5rem;">参照値</h3>
        ${references.map(ref => `
          <div class="ic-ref-item">
            <span>${ref.name}: ${ref.value}</span>
            <span style="color: #666; font-size: 0.8rem;">${ref.desc}</span>
          </div>
        `).join('')}
      </div>
      <div class="ic-disclaimer">
        注意: IC値は暗号の種類を推測するためのヒントです。単一の値だけで暗号の種類を断定することはできません。
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
        return `<div class="word-length-bar" style="height: ${height}%" data-length="${len}" title="${len}文字: ${count}語"></div>`;
      }).join('');

    highlightState.spacing = {
      showHighlights: true
    };

    const resultTableEl = document.querySelector('#result-spacing .result-table');
    resultTableEl.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${hasSpaces ? 'あり' : 'なし'}</div>
          <div class="stat-label">スペースの存在</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${words.length}</div>
          <div class="stat-label">単語数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${avgLength}</div>
          <div class="stat-label">平均単語長</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${consecutiveSpaces}</div>
          <div class="stat-label">連続スペース</div>
        </div>
      </div>
      ${hasSpaces ? `
        <h3 style="font-size: 0.9rem; margin: 1rem 0 0.5rem;">単語長分布</h3>
        <div class="word-length-chart">
          ${chartBars || '<p class="placeholder">データなし</p>'}
        </div>
        <table class="seq-table">
          <thead>
            <tr><th>単語長</th><th>出現数</th><th>割合</th></tr>
          </thead>
          <tbody>
            ${Object.entries(wordLengths)
              .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
              .map(([len, count]) => `
                <tr>
                  <td>${len}文字</td>
                  <td>${count}</td>
                  <td>${(count / words.length * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      ` : '<p style="margin-top: 1rem;">スペースが検出されませんでした。単語の区切りが不明確です。</p>'}
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
      tableEl.innerHTML = '<p class="placeholder">繰り返しパターンが見つかりませんでした。</p>';
      return;
    }

    tableEl.innerHTML = `
      <table class="seq-table">
        <thead>
          <tr><th>パターン</th><th>長さ</th><th>出現回数</th></tr>
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
        <strong>1文字単語:</strong> ${oneLetterWords.length > 0 ? [...new Set(oneLetterWords.map(w => escapeHtml(w.replace(/[^A-Za-z]/g, ''))))].join(', ') : 'なし'}
        <p style="font-size: 0.8rem; color: #666; margin-top: 0.25rem;">英語では通常 a, I のみ</p>
      </div>
      <div class="hint-item">
        <strong>2文字単語（上位5）:</strong> ${[...new Set(twoLetterWords.map(w => escapeHtml(w.replace(/[^A-Za-z]/g, ''))))].slice(0, 5).join(', ') || 'なし'}
        <p style="font-size: 0.8rem; color: #666; margin-top: 0.25rem;">よくある例: to, of, in, it, is, be, as, at, so, we, he, by, or, on, do, if, me, my, up, an, go, no, us, am</p>
      </div>
      <div class="hint-item">
        <strong>3文字単語（上位5）:</strong> ${[...new Set(threeLetterWords.map(w => escapeHtml(w.replace(/[^A-Za-z]/g, ''))))].slice(0, 5).join(', ') || 'なし'}
        <p style="font-size: 0.8rem; color: #666; margin-top: 0.25rem;">よくある例: the, and, for, are, but, not, you, all, can, had, her, was, one, our, out</p>
      </div>
    `;

    const statisticalHintsEl = document.getElementById('statisticalHints');
    if (hasSpaces && sortedWords.length > 0) {
      statisticalHintsEl.innerHTML = `
        <div class="hint-item">
          <strong>頻出単語 Top 10:</strong>
          <table class="seq-table" style="margin-top: 0.5rem;">
            <thead><tr><th>単語</th><th>出現回数</th></tr></thead>
            <tbody>
              ${sortedWords.slice(0, 10).map(([word, count]) => `
                <tr><td style="font-family: monospace;">${escapeHtml(word)}</td><td>${count}</td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="hint-item">
          <strong>平均単語長:</strong> ${(words.reduce((sum, w) => sum + w.replace(/[^A-Za-z]/g, '').length, 0) / words.length).toFixed(1)}文字
          <p style="font-size: 0.8rem; color: #666; margin-top: 0.25rem;">英語の平均は約4.5文字</p>
        </div>
      `;
    } else {
      statisticalHintsEl.innerHTML = '<p class="placeholder">スペースがないため単語の統計は利用できません。</p>';
    }

    highlightState.wordHints = {
      words: oneLetterWords,
      showHighlights: true
    };

    updateViewerWithHighlights('wordHints');
  }

  // Frequency Analysis with comparison
  function analyzeFrequency(text) {
    // Analyze only uppercase (ciphertext) letters for comparison with English frequencies
    const allLetters = text.replace(/[^A-Za-z]/g, '');
    const cipherLetters = text.replace(/[^A-Z]/g, '');
    const resolvedLetters = text.replace(/[^a-z]/g, '');
    const n = allLetters.length;
    const nCipher = cipherLetters.length;

    if (n === 0) {
      document.getElementById('result-frequency').innerHTML = '<p class="placeholder">英字が見つかりませんでした。</p>';
      return;
    }

    // Count frequencies for uppercase (cipher) letters
    const freq = {};
    for (const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      freq[char] = 0;
    }
    for (const char of cipherLetters) {
      freq[char]++;
    }

    // Count resolved letters separately
    const resolvedFreq = {};
    for (const char of 'abcdefghijklmnopqrstuvwxyz') {
      resolvedFreq[char] = 0;
    }
    for (const char of resolvedLetters) {
      resolvedFreq[char]++;
    }

    const sorted = Object.entries(freq)
      .map(([letter, count]) => ({ letter, count, percent: nCipher > 0 ? (count / nCipher * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    const maxPercent = Math.max(sorted[0]?.percent || 0, 15);

    const high = sorted.filter(x => x.percent > 8);
    const mid = sorted.filter(x => x.percent > 2 && x.percent <= 8);
    const low = sorted.filter(x => x.percent <= 2 && x.count > 0);

    // Build comparison chart (cipher letters vs English reference)
    const chartHeight = 150; // pixels
    const comparisonBars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => {
      const cipherPercent = nCipher > 0 ? (freq[letter] / nCipher * 100) : 0;
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

    // Resolved letters summary
    const resolvedSorted = Object.entries(resolvedFreq)
      .filter(([_, count]) => count > 0)
      .map(([letter, count]) => ({ letter, count, percent: (count / n * 100) }))
      .sort((a, b) => b.count - a.count);

    const resolvedSummary = resolvedSorted.length > 0
      ? `<div class="freq-group" style="margin-top: 1rem; background: #e8f5e9; border-left: 3px solid #4caf50;">
          <div class="freq-group-label" style="color: #2e7d32;">解読済み文字</div>
          <div class="freq-group-letters">${resolvedSorted.map(x => x.letter).join(' ')}</div>
          <p style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">
            ${resolvedSorted.map(x => `${x.letter}:${x.count}`).join(' ')}
          </p>
        </div>`
      : '';

    const resultEl = document.getElementById('result-frequency');
    resultEl.innerHTML = `
      <div class="freq-comparison">
        <div class="freq-comparison-header">
          <span class="freq-legend"><span class="freq-legend-box cipher"></span> 暗号文（大文字）</span>
          <span class="freq-legend"><span class="freq-legend-box english"></span> 英語標準（平文）</span>
        </div>
        <div class="frequency-chart" style="padding-bottom: 1.5rem;">
          ${comparisonBars}
        </div>
      </div>
      <div class="freq-groups">
        <div class="freq-group">
          <div class="freq-group-label" style="color: #e74c3c;">高頻度 (&gt;8%)</div>
          <div class="freq-group-letters">${high.map(x => x.letter).join(' ') || '-'}</div>
          <p style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">英語参照: e t a o i n</p>
        </div>
        <div class="freq-group">
          <div class="freq-group-label" style="color: #f39c12;">中頻度 (2-8%)</div>
          <div class="freq-group-letters">${mid.map(x => x.letter).join(' ') || '-'}</div>
          <p style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">英語参照: s h r d l c u m w f g y p</p>
        </div>
        <div class="freq-group">
          <div class="freq-group-label" style="color: #3498db;">低頻度 (&lt;2%)</div>
          <div class="freq-group-letters">${low.map(x => x.letter).join(' ') || '-'}</div>
          <p style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">英語参照: b v k j x q z</p>
        </div>
        ${resolvedSummary}
      </div>
      <table class="seq-table" style="margin-top: 1rem;">
        <thead>
          <tr><th>暗号文字</th><th>出現数</th><th>頻度</th><th>→平文</th><th>期待頻度</th><th>差分</th></tr>
        </thead>
        <tbody>
          ${sorted.filter(x => x.count > 0).map(x => {
            const mappedTo = mapping[x.letter];
            const hasMapped = mappedTo && /^[a-z]$/.test(mappedTo);
            const expectedFreq = hasMapped ? ENGLISH_FREQ[mappedTo.toUpperCase()] : null;
            const diff = hasMapped ? (x.percent - expectedFreq).toFixed(1) : null;
            const diffColor = diff > 0 ? '#e74c3c' : diff < 0 ? '#3498db' : '#666';
            const diffAbs = hasMapped ? Math.abs(parseFloat(diff)) : 0;
            const isGoodMatch = diffAbs < 2;
            return `
              <tr>
                <td style="font-family: monospace; font-weight: bold;">${x.letter}</td>
                <td>${x.count}</td>
                <td>${x.percent.toFixed(2)}%</td>
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
        ※ マッピングを設定すると、その平文文字の期待頻度との差分を表示します。差分が小さいほど妥当な推測です。
      </p>
      ${nCipher === 0 ? '<p class="ic-disclaimer" style="margin-top: 1rem;">すべての文字が解読済みのため、暗号文字の頻度分析はできません。</p>' : ''}
    `;
  }

  // N-grams Analysis
  function analyzeNgrams(text) {
    const letters = text.replace(/[^A-Za-z]/g, '');
    const n = ngramMode;
    const limit = n === 2 ? 25 : 10;

    if (letters.length < n) {
      const tableEl = document.querySelector('#result-ngrams .result-table');
      tableEl.innerHTML = `<p class="placeholder">${n}-gramの分析には${n}文字以上の英字が必要です。</p>`;
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
    const englishRef = n === 2 ? english2grams : english3grams;

    const tableEl = document.querySelector('#result-ngrams .result-table');
    tableEl.innerHTML = `
      <p style="font-size: 0.8rem; color: #666; margin-bottom: 0.5rem;">
        英語での頻出${n}-gram: ${englishRef.join(', ')}
      </p>
      <table class="seq-table">
        <thead>
          <tr><th>順位</th><th>${n}-gram</th><th>出現回数</th></tr>
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
        注意: これは傾向のみを示します。N-gram頻度だけで文字の対応を断定することはできません。
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

    if (words.length === 0) {
      document.getElementById('patternWords').innerHTML = '<p class="placeholder">スペースがないため単語パターンの分析ができません。</p>';
      document.getElementById('nonPatternWords').innerHTML = '<p class="placeholder">-</p>';
      document.getElementById('extraObservations').innerHTML = '<p class="placeholder">-</p>';
      return;
    }

    // Analyze word patterns with position
    const patterns = [];
    words.forEach((w, wordIndex) => {
      const clean = w.replace(/[^A-Za-z]/g, '');
      const seen = {};
      let num = 1;
      let pattern = '';
      for (const char of clean) {
        if (!seen[char]) {
          seen[char] = num++;
        }
        pattern += seen[char];
      }

      // Determine position (start/middle/end)
      let position = 'middle';
      if (wordIndex === 0) position = 'start';
      else if (wordIndex === words.length - 1) position = 'end';

      const isPattern = pattern !== [...Array(clean.length)].map((_, i) => i + 1).join('');
      patterns.push({ word: clean, pattern, isPattern, position, wordIndex });
    });

    // Group by pattern
    const patternGroups = {};
    patterns.forEach(({ word, pattern, isPattern, position }) => {
      if (isPattern) {
        if (!patternGroups[pattern]) {
          patternGroups[pattern] = { words: [], positions: { start: 0, middle: 0, end: 0 } };
        }
        patternGroups[pattern].words.push(word);
        patternGroups[pattern].positions[position]++;
      }
    });

    const sortedPatterns = Object.entries(patternGroups)
      .map(([pattern, data]) => ({
        pattern,
        words: [...new Set(data.words)],
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
      <p style="font-size: 0.8rem; color: #666; margin-bottom: 0.5rem;">クリックでハイライト表示</p>
      ${sortedPatterns.map((p, idx) => {
        const positionBadges = [];
        if (p.positions.start > 0) positionBadges.push(`<span class="position-badge start">頭${p.positions.start}</span>`);
        if (p.positions.middle > 0) positionBadges.push(`<span class="position-badge middle">中${p.positions.middle}</span>`);
        if (p.positions.end > 0) positionBadges.push(`<span class="position-badge end">末${p.positions.end}</span>`);

        return `
          <span class="pattern-word" data-pattern-idx="${idx}" data-words="${escapeHtml(p.words.join(','))}" title="パターン: ${escapeHtml(p.pattern)}">
            ${escapeHtml(p.words[0])} <span style="font-size: 0.7rem; color: #666;">(${escapeHtml(p.pattern)})</span>
            ${positionBadges.join('')}
          </span>
        `;
      }).join('')}
    ` : '<p class="placeholder">パターンワードが見つかりませんでした。</p>';

    document.getElementById('nonPatternWords').innerHTML = uniqueNonPattern.length > 0 ? `
      <p style="font-size: 0.8rem; color: #666; margin-bottom: 0.5rem;">すべて異なる文字で構成（注目候補）</p>
      ${uniqueNonPattern.slice(0, 20).map(w => `<span class="pattern-word">${escapeHtml(w)}</span>`).join('')}
      ${uniqueNonPattern.length > 20 ? `<span style="color: #666;">... 他${uniqueNonPattern.length - 20}語</span>` : ''}
    ` : '<p class="placeholder">非パターンワードが見つかりませんでした。</p>';

    const sortedDoubles = Object.entries(doubleLetters).sort((a, b) => b[1] - a[1]);
    document.getElementById('extraObservations').innerHTML = `
      <div class="hint-item">
        <strong>二重文字:</strong>
        ${sortedDoubles.length > 0 ? sortedDoubles.slice(0, 10).map(([d, c]) => `${d}(${c})`).join(', ') : 'なし'}
        <p style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">英語でよくある二重文字: LL, SS, EE, OO, TT, FF, RR, NN, PP, CC</p>
      </div>
      <div class="hint-item">
        <strong>可逆ペア:</strong>
        ${reversiblePairs.length > 0 ? `
          <div class="reversible-pairs">
            ${reversiblePairs.slice(0, 10).map(p => `
              <span class="reversible-pair" data-pair="${p.pair}" data-reverse="${p.reverse}">
                ${p.pair}<span class="arrow">⇄</span>${p.reverse}
                <span style="font-size: 0.7rem; color: #666;">(${p.countA}/${p.countB})</span>
              </span>
            `).join('')}
          </div>
        ` : 'なし'}
        <p style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">英語でよくある可逆ペア: ER-RE, ON-NO, TO-OT, IN-NI, ES-SE</p>
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
        updateViewerWithHighlights('pattern');
      });
    });

    updateViewerWithHighlights('pattern');
  }

  // Kasiski Test for polyalphabetic ciphers
  function analyzeKasiski(text) {
    const letters = text.replace(/[^A-Za-z]/g, '');

    if (letters.length < 20) {
      document.getElementById('result-kasiski').innerHTML = '<p class="placeholder">Kasiskiテストには20文字以上の暗号文が必要です。</p>';
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
          繰り返しパターンが見つかりませんでした。この暗号文は単一換字式か、または十分な長さがない可能性があります。
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
          <h3>推定鍵長</h3>
          <p style="font-size: 0.8rem; color: #666; margin-bottom: 0.5rem;">
            繰り返しパターン間の距離の公約数を分析
          </p>
          <div class="factor-chart">
            ${sortedFactors.slice(0, 12).map(({ factor, count }) => {
              const height = (count / maxCount * 100).toFixed(0);
              const isRecommended = factor === recommendedKeyLength;
              return `<div class="factor-bar ${isRecommended ? 'recommended' : ''}" style="height: ${height}%" data-factor="${factor}" title="因数${factor}: ${count}回"></div>`;
            }).join('')}
          </div>
          ${recommendedKeyLength ? `
            <p style="margin-top: 1.5rem;">
              <strong>最も可能性の高い鍵長:</strong>
              <span style="font-size: 1.5rem; font-weight: bold; color: #27ae60;">${recommendedKeyLength}</span>
            </p>
          ` : ''}
        </div>
        <div class="kasiski-section">
          <h3>繰り返しパターン (上位10)</h3>
          <table class="seq-table">
            <thead>
              <tr><th>パターン</th><th>距離</th><th>因数</th></tr>
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
          <h3>因数の出現頻度</h3>
          <table class="seq-table">
            <thead>
              <tr><th>因数</th><th>出現回数</th><th>割合</th></tr>
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
        注意: Kasiskiテストは多表式暗号（ヴィジュネル暗号など）の鍵長推定に使用します。
        単一換字式暗号の場合、この分析は適用されません。
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

    const text = cipherInput.value;
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
      const text = cipherInput.value.toUpperCase();
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
