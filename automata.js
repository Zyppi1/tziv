/* Automaty a gramatiky – analýza, generovanie a overovanie slov.
 * Podporované automaty okrem Turingovho stroja:
 * - konečný automat DKA/NKA/ε-NKA
 * - zásobníkový automat DPDA/NPDA
 * - lineárne ohraničený automat LOA/LBA
 */

document.addEventListener('DOMContentLoaded', () => {
  const EPS = 'ε';
  const BLANK = '_';

  const els = {
    mode: () => document.querySelector('input[name="input-mode"]:checked')?.value || 'grammar',
    grammarPanel: document.getElementById('grammar-panel'),
    automatonPanel: document.getElementById('automaton-panel'),
    grammarInput: document.getElementById('grammar-input'),
    grammarStart: document.getElementById('grammar-start'),
    grammarAnalyze: document.getElementById('grammar-analyze'),
    grammarToAutomaton: document.getElementById('grammar-to-automaton'),
    kind: document.getElementById('automaton-kind'),
    transitions: document.getElementById('automaton-transitions'),
    start: document.getElementById('automaton-start'),
    finals: document.getElementById('automaton-finals'),
    stackStart: document.getElementById('stack-start'),
    stackStartLabel: document.getElementById('stack-start-label'),
    automatonLoad: document.getElementById('automaton-load'),
    word: document.getElementById('word-input'),
    check: document.getElementById('word-check'),
    maxLen: document.getElementById('max-length'),
    generateWords: document.getElementById('generate-words'),
    result: document.getElementById('word-result'),
    generated: document.getElementById('generated-words'),
    analysis: document.getElementById('analysis-output'),
    svg: document.getElementById('fa-svg')
  };

  let grammar = null;
  let automaton = null;

  document.querySelectorAll('input[name="input-mode"]').forEach(r => {
    r.addEventListener('change', () => {
      els.grammarPanel.classList.toggle('hidden-panel', els.mode() !== 'grammar');
      els.automatonPanel.classList.toggle('hidden-panel', els.mode() !== 'automaton');
      els.result.classList.add('hidden-panel');
      els.generated.innerHTML = '';
    });
  });

  if (els.kind) {
    els.kind.addEventListener('change', () => {
      updateAutomatonHelp();
      els.result.classList.add('hidden-panel');
      els.generated.innerHTML = '';
    });
  }

  els.grammarAnalyze.addEventListener('click', () => analyzeGrammar(false));
  els.grammarToAutomaton.addEventListener('click', () => analyzeGrammar(true));
  els.automatonLoad.addEventListener('click', analyzeAutomaton);
  els.check.addEventListener('click', checkWord);
  els.generateWords.addEventListener('click', listGeneratedWords);

  loadSaved();
  updateAutomatonHelp();

  function updateAutomatonHelp() {
    const isPda = els.kind?.value === 'pda';
    if (els.stackStart) els.stackStart.classList.toggle('hidden-panel', !isPda);
    if (els.stackStartLabel) els.stackStartLabel.classList.toggle('hidden-panel', !isPda);

    if (!els.transitions || !els.kind) return;
    if (els.transitions.value.trim()) return;
    if (els.kind.value === 'fa') {
      els.transitions.placeholder = 'q0 a -> q1\nq1 b -> q1\nq1 3 -> q2';
    } else if (els.kind.value === 'pda') {
      els.transitions.placeholder = 'q0 a Z -> q0 AZ\nq0 b A -> q1 3\nq1 b A -> q1 3\nq1 3 Z -> qf Z';
    } else if (els.kind.value === 'lba') {
      els.transitions.placeholder = 'q0 a -> q0 a R\nq0 b -> q1 b N';
    }
  }

  function loadSaved() {
    const saved = localStorage.getItem('tziv_automata_state_v3');
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      if (data.grammarText) els.grammarInput.value = data.grammarText;
      if (data.grammarStart) els.grammarStart.value = data.grammarStart;
      if (data.kind && els.kind) els.kind.value = data.kind;
      if (data.transitions) els.transitions.value = data.transitions;
      if (data.start) els.start.value = data.start;
      if (data.finals) els.finals.value = data.finals;
      if (data.stackStart) els.stackStart.value = data.stackStart;
    } catch (_) {}
  }

  function save() {
    localStorage.setItem('tziv_automata_state_v3', JSON.stringify({
      grammarText: els.grammarInput.value,
      grammarStart: els.grammarStart.value,
      kind: els.kind?.value || 'fa',
      transitions: els.transitions.value,
      start: els.start.value,
      finals: els.finals.value,
      stackStart: els.stackStart?.value || 'Z'
    }));
  }

  function showError(msg) {
    els.analysis.innerHTML = `<p class="error"><strong>Chyba:</strong> ${escapeHtml(msg)}</p>`;
  }

  /* ----------------------------- Grammar ----------------------------- */

  function analyzeGrammar(convert) {
    try {
      grammar = parseGrammar(els.grammarInput.value, els.grammarStart.value.trim() || 'S');
      automaton = null;
      const info = classifyGrammar(grammar);
      grammar.info = info;

      let html = renderGrammarInfo(info, grammar);
      if (convert) {
        if (info.isRegular && info.regularSide === 'right') {
          automaton = rightLinearGrammarToAutomaton(grammar);
          html += '<p class="ok"><strong>Automat bol vygenerovaný z pravolineárnej regulárnej gramatiky.</strong></p>';
          drawGraph(automaton.graph);
        } else if (info.isRegular && info.regularSide === 'left') {
          html += '<p class="warn"><strong>Gramatika je ľavolineárna regulárna.</strong> Je regulárna, ale tento generátor kreslí priamo iba pravolineárny tvar.</p>';
          clearGraph();
        } else if (info.type2) {
          html += '<p class="warn"><strong>Bezkontextová gramatika zodpovedá zásobníkovému automatu.</strong> Automatické zostrojenie PDA pre ľubovoľnú CFG je možné teoreticky, ale v tejto stránke zatiaľ nekreslíme generovaný PDA z celej CFG.</p>';
          clearGraph();
        } else if (info.type1) {
          html += '<p class="warn"><strong>Kontextová gramatika zodpovedá lineárne ohraničenému automatu.</strong> Generovanie LOA z ľubovoľnej kontextovej gramatiky nie je implementované ako jednoduchý generátor.</p>';
          clearGraph();
        } else {
          html += '<p class="warn"><strong>Frázová gramatika zodpovedá Turingovmu stroju.</strong> Turingov stroj je mimo tejto sekcie.</p>';
          clearGraph();
        }
      } else {
        clearGraph();
      }

      els.analysis.innerHTML = html;
      save();
    } catch (e) {
      showError(e.message);
    }
  }

  function parseGrammar(text, start) {
    const rules = [];
    const byLeft = {};
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    if (!lines.length) throw new Error('Zadajte aspoň jedno pravidlo gramatiky.');

    lines.forEach(line => {
      const i = line.indexOf('->');
      if (i < 0) throw new Error(`Pravidlo musí obsahovať -> : ${line}`);
      const left = line.slice(0, i).trim().replace(/\s+/g, '');
      const right = line.slice(i + 2).trim();
      if (!left) throw new Error(`Prázdna ľavá strana pravidla: ${line}`);
      const alternatives = right.split('|').map(x => x.trim()).filter(Boolean);
      alternatives.forEach(alt => {
        const rhs = normalizeEpsilon(alt.replace(/\s+/g, ''));
        const rule = {
          left,
          rhs,
          leftSymbols: splitSymbols(left),
          rhsSymbols: rhs === EPS ? [] : splitSymbols(rhs)
        };
        rules.push(rule);
        if (!byLeft[left]) byLeft[left] = [];
        byLeft[left].push(rule);
      });
    });

    const nonterminals = new Set();
    const terminals = new Set();
    rules.forEach(r => {
      r.leftSymbols.concat(r.rhsSymbols).forEach(s => {
        if (isNonterminal(s)) nonterminals.add(s);
        else if (s !== EPS) terminals.add(s);
      });
    });
    nonterminals.add(start);
    return { start, rules, byLeft, nonterminals: [...nonterminals], terminals: [...terminals] };
  }

  function splitSymbols(str) {
    if (!str || normalizeEpsilon(str) === EPS) return [];
    return [...str];
  }

  function normalizeEpsilon(s) {
    if (s === undefined || s === null) return '';
    const x = String(s).trim();
    return (x === '3' || x === 'ε' || x.toLowerCase() === 'eps' || x.toLowerCase() === 'epsilon') ? EPS : x;
  }

  function isNonterminal(s) {
    return /^[A-Z]$/.test(s);
  }

  function isTerminal(s) {
    return s !== EPS && !isNonterminal(s);
  }

  function classifyGrammar(g) {
    const startAppearsRight = g.rules.some(r => r.rhsSymbols.includes(g.start));
    const type0 = g.rules.every(r => r.leftSymbols.some(isNonterminal));
    const type1 = type0 && g.rules.every(r => {
      const epsStart = r.left === g.start && r.rhs === EPS && !startAppearsRight;
      return epsStart || (r.rhs !== EPS && r.leftSymbols.length <= r.rhsSymbols.length);
    });
    const type2 = g.rules.every(r => r.leftSymbols.length === 1 && isNonterminal(r.leftSymbols[0]));

    let regularSide = null;
    let isRegular = type2;
    for (const r of g.rules) {
      const rhs = r.rhsSymbols;
      if (r.rhs === EPS) continue;
      if (rhs.length === 1 && isTerminal(rhs[0])) continue;
      if (rhs.length === 2) {
        const right = isTerminal(rhs[0]) && isNonterminal(rhs[1]);
        const left = isNonterminal(rhs[0]) && isTerminal(rhs[1]);
        if (!right && !left) { isRegular = false; break; }
        const side = right ? 'right' : 'left';
        if (regularSide && regularSide !== side) { isRegular = false; break; }
        regularSide = side;
        continue;
      }
      isRegular = false;
      break;
    }
    if (isRegular && !regularSide) regularSide = 'right';

    const isCNF = type2 && g.rules.every(r => {
      const rhs = r.rhsSymbols;
      return (r.left === g.start && r.rhs === EPS) ||
        (rhs.length === 1 && isTerminal(rhs[0])) ||
        (rhs.length === 2 && rhs.every(isNonterminal));
    });

    const isGNF = type2 && g.rules.every(r => {
      const rhs = r.rhsSymbols;
      return (r.left === g.start && r.rhs === EPS) ||
        (rhs.length >= 1 && isTerminal(rhs[0]) && rhs.slice(1).every(isNonterminal));
    });

    let typeName = 'Typ 0 – frázová gramatika';
    if (isRegular) typeName = 'Typ 3 – regulárna gramatika';
    else if (type2) typeName = 'Typ 2 – bezkontextová gramatika';
    else if (type1) typeName = 'Typ 1 – kontextová gramatika';
    else if (type0) typeName = 'Typ 0 – frázová gramatika';
    else typeName = 'Neplatná gramatika podľa základnej definície';

    const generatedSmall = generateWordsFromGrammar(g, 5, 6000, true);
    const ambiguousWords = [...generatedSmall.derivationCounts.entries()].filter(([, count]) => count > 1).slice(0, 5);
    return { type0, type1, type2, isRegular, regularSide, isCNF, isGNF, typeName, startAppearsRight, ambiguousWords };
  }

  function renderGrammarInfo(info, g) {
    const regularText = info.isRegular
      ? `Áno, ${info.regularSide === 'right' ? 'pravolineárna' : 'ľavolineárna'} regulárna gramatika.`
      : 'Nie.';
    const pairedAutomaton = info.isRegular ? 'konečný automat' : (info.type2 ? 'zásobníkový automat' : (info.type1 ? 'lineárne ohraničený automat' : 'Turingov stroj'));
    const amb = info.ambiguousWords.length
      ? `<span class="warn">Možno viacznačná: do dĺžky 5 boli nájdené viaceré derivácie pre ${info.ambiguousWords.map(([w,c]) => `${w || 'ε'} (${c}×)`).join(', ')}.</span>`
      : 'Do dĺžky 5 nebola zistená viacznačnosť. Toto nie je dôkaz jednoznačnosti.';
    return `
      <p><strong>Typ:</strong> ${escapeHtml(info.typeName)}</p>
      <p><strong>Zodpovedajúci automat:</strong> ${escapeHtml(pairedAutomaton)}</p>
      <p><strong>Regulárna:</strong> ${regularText}</p>
      <p><strong>Chomského normálny tvar:</strong> ${info.isCNF ? 'áno' : 'nie'}</p>
      <p><strong>Greibachovej normálny tvar:</strong> ${info.isGNF ? 'áno' : 'nie'}</p>
      <p><strong>Neterminály:</strong> ${g.nonterminals.join(', ') || '–'}</p>
      <p><strong>Terminály:</strong> ${g.terminals.join(', ') || '–'}</p>
      <p><strong>Viacznačnosť:</strong> ${amb}</p>`;
  }

  function rightLinearGrammarToAutomaton(g) {
    const transitions = {};
    const final = 'F';
    const finals = new Set([final]);
    g.nonterminals.concat([final]).forEach(s => transitions[s] = {});
    g.rules.forEach(r => {
      const rhs = r.rhsSymbols;
      if (r.rhs === EPS) {
        finals.add(r.left);
      } else if (rhs.length === 1 && isTerminal(rhs[0])) {
        addTransition(transitions, r.left, rhs[0], final);
      } else if (rhs.length === 2 && isTerminal(rhs[0]) && isNonterminal(rhs[1])) {
        addTransition(transitions, r.left, rhs[0], rhs[1]);
      }
    });
    const fa = normalizeFiniteAutomaton({ transitions, start: g.start, finals: [...finals], source: 'grammar' });
    fa.kind = 'fa';
    fa.graph = graphFromFiniteAutomaton(fa);
    return fa;
  }

  function generateWordsFromGrammar(g, maxLen, maxSteps = 8000, countDerivations = false) {
    const results = new Set();
    const derivationCounts = new Map();
    const queue = [{ sentential: [g.start], steps: 0 }];
    let safety = 0;
    while (queue.length && safety++ < maxSteps) {
      const item = queue.shift();
      const terminalLen = item.sentential.filter(isTerminal).length;
      if (terminalLen > maxLen) continue;
      const firstNtIndex = item.sentential.findIndex(isNonterminal);
      if (firstNtIndex === -1) {
        const word = item.sentential.join('');
        if (word.length <= maxLen) {
          results.add(word);
          derivationCounts.set(word, (derivationCounts.get(word) || 0) + 1);
        }
        continue;
      }
      if (item.steps > maxLen * 4 + 14) continue;
      const nt = item.sentential[firstNtIndex];
      const rules = g.byLeft[nt] || [];
      rules.forEach(r => {
        const next = item.sentential.slice(0, firstNtIndex).concat(r.rhs === EPS ? [] : r.rhsSymbols, item.sentential.slice(firstNtIndex + 1));
        queue.push({ sentential: next, steps: item.steps + 1 });
      });
    }
    return countDerivations ? { words: [...results].sort(wordSort), derivationCounts } : [...results].sort(wordSort);
  }

  /* ----------------------------- Automata parsers ----------------------------- */

  function analyzeAutomaton() {
    try {
      const kind = els.kind?.value || 'fa';
      if (kind === 'fa') automaton = parseFiniteAutomaton(els.transitions.value, els.start.value.trim() || 'q0', splitWords(els.finals.value));
      else if (kind === 'pda') automaton = parsePDA(els.transitions.value, els.start.value.trim() || 'q0', splitWords(els.finals.value), (els.stackStart?.value || 'Z').trim() || 'Z');
      else if (kind === 'lba') automaton = parseLBA(els.transitions.value, els.start.value.trim() || 'q0', splitWords(els.finals.value));
      else throw new Error('Neznámy typ automatu.');

      const info = classifyAnyAutomaton(automaton);
      automaton.info = info;
      els.analysis.innerHTML = renderAnyAutomatonInfo(info, automaton);
      drawGraph(automaton.graph);
      save();
    } catch (e) {
      showError(e.message);
    }
  }

  function parseFiniteAutomaton(text, start, finals) {
    const transitions = {};
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    if (!lines.length) throw new Error('Zadajte aspoň jeden prechod automatu.');
    lines.forEach(line => {
      const i = line.indexOf('->');
      if (i < 0) throw new Error(`Prechod musí obsahovať -> : ${line}`);
      const left = line.slice(0, i).trim().split(/\s+/);
      if (left.length < 2) throw new Error(`Ľavá strana má tvar: stav symbol. Chybný riadok: ${line}`);
      const from = left[0];
      const symbol = normalizeSymbol(left.slice(1).join(''));
      const targets = line.slice(i + 2).trim().split(',').map(x => x.trim()).filter(Boolean);
      if (!targets.length) throw new Error(`Chýba cieľový stav: ${line}`);
      targets.forEach(to => addTransition(transitions, from, symbol, to));
    });
    const fa = normalizeFiniteAutomaton({ kind: 'fa', transitions, start, finals, source: 'manual' });
    fa.graph = graphFromFiniteAutomaton(fa);
    return fa;
  }

  function addTransition(transitions, from, symbol, to) {
    const sym = normalizeSymbol(symbol);
    if (!transitions[from]) transitions[from] = {};
    if (!transitions[from][sym]) transitions[from][sym] = [];
    if (!transitions[from][sym].includes(to)) transitions[from][sym].push(to);
    if (!transitions[to]) transitions[to] = {};
  }

  function normalizeSymbol(s) {
    return normalizeEpsilon(s) === EPS ? EPS : s;
  }

  function normalizeFiniteAutomaton(a) {
    const states = new Set([a.start, ...a.finals]);
    const alphabet = new Set();
    Object.keys(a.transitions).forEach(from => {
      states.add(from);
      Object.keys(a.transitions[from]).forEach(sym => {
        if (sym !== EPS) alphabet.add(sym);
        a.transitions[from][sym].forEach(to => states.add(to));
      });
    });
    states.forEach(s => { if (!a.transitions[s]) a.transitions[s] = {}; });
    return { ...a, states: [...states], alphabet: [...alphabet].sort(), finals: [...new Set(a.finals)] };
  }

  function parsePDA(text, start, finals, stackStart) {
    const transitions = [];
    const states = new Set([start, ...finals]);
    const alphabet = new Set();
    const stackAlphabet = new Set([stackStart]);
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    if (!lines.length) throw new Error('Zadajte aspoň jeden prechod zásobníkového automatu.');
    lines.forEach(line => {
      const i = line.indexOf('->');
      if (i < 0) throw new Error(`Prechod PDA musí obsahovať -> : ${line}`);
      const left = line.slice(0, i).trim().split(/\s+/);
      const right = line.slice(i + 2).trim().split(/\s+/);
      if (left.length < 3 || right.length < 2) {
        throw new Error(`PDA formát: q vstup vrch -> p zápis. Chybný riadok: ${line}`);
      }
      const from = left[0];
      const input = normalizeSymbol(left[1]);
      const pop = normalizeStack(left[2]);
      const to = right[0];
      const push = normalizeStack(right.slice(1).join(''));
      states.add(from); states.add(to);
      if (input !== EPS) alphabet.add(input);
      if (pop !== EPS) stackAlphabet.add(pop);
      if (push !== EPS) [...push].forEach(ch => stackAlphabet.add(ch));
      transitions.push({ from, input, pop, to, push, raw: line });
    });
    const pda = { kind: 'pda', start, finals: [...new Set(finals)], stackStart, transitions, states: [...states], alphabet: [...alphabet].sort(), stackAlphabet: [...stackAlphabet].sort() };
    pda.graph = graphFromGeneralTransitions(start, pda.finals, pda.states, transitions.map(t => ({ from: t.from, to: t.to, label: `${t.input}, ${t.pop} → ${t.push}` })));
    return pda;
  }

  function normalizeStack(s) {
    const x = normalizeSymbol(s);
    return x === EPS ? EPS : x;
  }

  function parseLBA(text, start, finals) {
    const transitions = [];
    const states = new Set([start, ...finals]);
    const alphabet = new Set();
    const tapeAlphabet = new Set([BLANK]);
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    if (!lines.length) throw new Error('Zadajte aspoň jeden prechod LOA/LBA.');
    lines.forEach(line => {
      const i = line.indexOf('->');
      if (i < 0) throw new Error(`Prechod LBA musí obsahovať -> : ${line}`);
      const left = line.slice(0, i).trim().split(/\s+/);
      const right = line.slice(i + 2).trim().split(/\s+/);
      if (left.length < 2 || right.length < 3) {
        throw new Error(`LBA formát: q čítaj -> p zapíš smer. Chybný riadok: ${line}`);
      }
      const from = left[0];
      const read = normalizeBlank(left[1]);
      const to = right[0];
      const write = normalizeBlank(right[1]);
      const dir = right[2].toUpperCase();
      if (!['L', 'R', 'N', 'S'].includes(dir)) throw new Error(`Smer musí byť L, R alebo N: ${line}`);
      states.add(from); states.add(to);
      if (read !== BLANK) alphabet.add(read);
      tapeAlphabet.add(read); tapeAlphabet.add(write);
      transitions.push({ from, read, to, write, dir: dir === 'S' ? 'N' : dir, raw: line });
    });
    const lba = { kind: 'lba', start, finals: [...new Set(finals)], transitions, states: [...states], alphabet: [...alphabet].sort(), tapeAlphabet: [...tapeAlphabet].sort() };
    lba.graph = graphFromGeneralTransitions(start, lba.finals, lba.states, transitions.map(t => ({ from: t.from, to: t.to, label: `${t.read} → ${t.write}, ${t.dir}` })));
    return lba;
  }

  function normalizeBlank(s) {
    const x = normalizeSymbol(s);
    return x === EPS ? BLANK : x;
  }

  /* ----------------------------- Classification ----------------------------- */

  function classifyAnyAutomaton(a) {
    if (a.kind === 'fa') return classifyFiniteAutomaton(a);
    if (a.kind === 'pda') return classifyPDA(a);
    if (a.kind === 'lba') return classifyLBA(a);
    return { type: 'Neznámy automat' };
  }

  function classifyFiniteAutomaton(a) {
    const hasEpsilon = Object.values(a.transitions).some(map => map[EPS] && map[EPS].length > 0);
    const hasMultiple = Object.values(a.transitions).some(map => Object.entries(map).some(([, arr]) => arr.length > 1));
    const deterministic = !hasEpsilon && !hasMultiple;
    const complete = deterministic && a.states.every(s => a.alphabet.every(sym => (a.transitions[s][sym] || []).length === 1));
    const ambiguous = findAmbiguousWordFA(a, 5);
    const type = deterministic ? 'DKA – deterministický konečný automat' : (hasEpsilon ? 'ε-NKA – nedeterministický konečný automat s epsilon prechodmi' : 'NKA – nedeterministický konečný automat');
    return { kindName: 'Konečný automat', hasEpsilon, hasMultiple, deterministic, complete, type, ambiguous };
  }

  function classifyPDA(a) {
    const hasEpsilon = a.transitions.some(t => t.input === EPS);
    const map = new Map();
    let deterministic = true;
    for (const t of a.transitions) {
      const key = `${t.from}|${t.input}|${t.pop}`;
      if (map.has(key)) deterministic = false;
      map.set(key, true);
      if (t.input === EPS) {
        // if epsilon and non-epsilon transitions share state+stack top, deterministic PDA condition fails
        const hasInputTransition = a.transitions.some(x => x.from === t.from && x.pop === t.pop && x.input !== EPS);
        if (hasInputTransition) deterministic = false;
      }
    }
    const type = deterministic ? 'DPDA – deterministický zásobníkový automat' : 'NPDA – nedeterministický zásobníkový automat';
    return { kindName: 'Zásobníkový automat', type, deterministic, hasEpsilon, stackAlphabet: a.stackAlphabet };
  }

  function classifyLBA(a) {
    const map = new Map();
    let deterministic = true;
    for (const t of a.transitions) {
      const key = `${t.from}|${t.read}`;
      if (map.has(key)) deterministic = false;
      map.set(key, true);
    }
    const type = deterministic ? 'DLOA / DLBA – deterministický lineárne ohraničený automat' : 'NLOA / NLBA – nedeterministický lineárne ohraničený automat';
    return { kindName: 'Lineárne ohraničený automat', type, deterministic, tapeAlphabet: a.tapeAlphabet };
  }

  function renderAnyAutomatonInfo(info, a) {
    if (a.kind === 'fa') return renderFiniteAutomatonInfo(info, a);
    if (a.kind === 'pda') return renderPDAInfo(info, a);
    if (a.kind === 'lba') return renderLBAInfo(info, a);
    return '<p>Neznámy automat.</p>';
  }


  function setNotation(items) {
    return `{${items && items.length ? items.map(escapeHtml).join(', ') : '∅'}}`;
  }

  function transitionNotationFinite(a) {
    if (a.info && a.info.deterministic) {
      return `δ : Q × Σ → Q`;
    }
    return `δ : Q × (Σ ∪ {ε}) → 2^Q`;
  }

  function formalFiniteAutomaton(a) {
    return `M = (Q, Σ, δ, q₀, F), kde Q = ${setNotation(a.states)}, Σ = ${setNotation(a.alphabet)}, q₀ = ${escapeHtml(a.start)}, F = ${setNotation(a.finals)}, ${transitionNotationFinite(a)}.`;
  }

  function formalPDA(a) {
    return `M = (Q, Σ, Γ, δ, q₀, Z₀, F), kde Q = ${setNotation(a.states)}, Σ = ${setNotation(a.alphabet)}, Γ = ${setNotation(a.stackAlphabet)}, q₀ = ${escapeHtml(a.start)}, Z₀ = ${escapeHtml(a.stackStart)}, F = ${setNotation(a.finals)}, δ ⊆ Q × (Σ ∪ {ε}) × Γ → 2^(Q × Γ*).`;
  }

  function formalLBA(a) {
    return `M = (Q, Σ, Γ, δ, q₀, F), kde Q = ${setNotation(a.states)}, Σ = ${setNotation(a.alphabet)}, Γ = ${setNotation(a.tapeAlphabet)}, q₀ = ${escapeHtml(a.start)}, F = ${setNotation(a.finals)}, δ ⊆ Q × Γ → 2^(Q × Γ × {L, R, N}); páska je lineárne ohraničená vstupom.`;
  }

  function renderFiniteAutomatonInfo(info, a) {
    const amb = info.ambiguous
      ? `<span class="warn">Áno alebo pravdepodobne áno: slovo „${escapeHtml(info.ambiguous.word || 'ε')}“ má viac akceptačných výpočtov (${info.ambiguous.count}).</span>`
      : 'Do dĺžky 5 nebol nájdený viacnásobný akceptačný výpočet.';
    return `
      <p><strong>Typ automatu:</strong> ${escapeHtml(info.type)}</p>
      <p><strong>Formálny zápis:</strong> ${formalFiniteAutomaton(a)}</p>
      <p><strong>Deterministický:</strong> ${info.deterministic ? 'áno' : 'nie'}</p>
      <p><strong>Úplný DKA:</strong> ${info.complete ? 'áno' : 'nie'}</p>
      <p><strong>Stavy:</strong> ${a.states.join(', ') || '–'}</p>
      <p><strong>Abeceda:</strong> ${a.alphabet.join(', ') || '–'}</p>
      <p><strong>Počiatočný stav:</strong> ${a.start}</p>
      <p><strong>Akceptačné stavy:</strong> ${a.finals.join(', ') || '–'}</p>
      <p><strong>Viacznačnosť / viac výpočtov:</strong> ${amb}</p>`;
  }

  function renderPDAInfo(info, a) {
    return `
      <p><strong>Typ automatu:</strong> ${escapeHtml(info.type)}</p>
      <p><strong>Formálny zápis:</strong> ${formalPDA(a)}</p>
      <p><strong>Deterministický:</strong> ${info.deterministic ? 'áno' : 'nie'}</p>
      <p><strong>Epsilon prechody:</strong> ${info.hasEpsilon ? 'áno' : 'nie'}</p>
      <p><strong>Stavy:</strong> ${a.states.join(', ') || '–'}</p>
      <p><strong>Vstupná abeceda:</strong> ${a.alphabet.join(', ') || '–'}</p>
      <p><strong>Zásobníková abeceda:</strong> ${a.stackAlphabet.join(', ') || '–'}</p>
      <p><strong>Počiatočný stav:</strong> ${a.start}</p>
      <p><strong>Počiatočný symbol zásobníka:</strong> ${escapeHtml(a.stackStart)}</p>
      <p><strong>Akceptačné stavy:</strong> ${a.finals.join(', ') || '–'}</p>
      <p><strong>Akceptovanie:</strong> koncovým stavom.</p>`;
  }

  function renderLBAInfo(info, a) {
    return `
      <p><strong>Typ automatu:</strong> ${escapeHtml(info.type)}</p>
      <p><strong>Formálny zápis:</strong> ${formalLBA(a)}</p>
      <p><strong>Deterministický:</strong> ${info.deterministic ? 'áno' : 'nie'}</p>
      <p><strong>Stavy:</strong> ${a.states.join(', ') || '–'}</p>
      <p><strong>Vstupná abeceda:</strong> ${a.alphabet.join(', ') || '–'}</p>
      <p><strong>Pásková abeceda:</strong> ${a.tapeAlphabet.join(', ') || '–'}</p>
      <p><strong>Počiatočný stav:</strong> ${a.start}</p>
      <p><strong>Akceptačné stavy:</strong> ${a.finals.join(', ') || '–'}</p>
      <p><strong>Ohraničenie pásky:</strong> hlava sa v simulácii nesmie pohnúť mimo dĺžku vstupného slova.</p>`;
  }

  /* ----------------------------- Graph drawing ----------------------------- */

  function graphFromFiniteAutomaton(a) {
    const edges = [];
    Object.entries(a.transitions).forEach(([from, map]) => {
      Object.entries(map).forEach(([sym, targets]) => targets.forEach(to => edges.push({ from, to, label: sym })));
    });
    return { states: a.states, start: a.start, finals: a.finals, edges };
  }

  function graphFromGeneralTransitions(start, finals, states, edges) {
    return { states: [...new Set(states)], start, finals: [...new Set(finals)], edges };
  }

  function clearGraph() {
    while (els.svg.firstChild) els.svg.removeChild(els.svg.firstChild);
  }

  function drawGraph(graph) {
    const svg = els.svg;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (!graph) return;

    const states = graph.states;
    let width = svg.clientWidth || svg.parentElement.clientWidth || 900;
    let height = Math.max(540, 140 + states.length * 58);
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrow');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '10');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '6');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('orient', 'auto-start-reverse');
    const mpath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    mpath.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    mpath.setAttribute('fill', '#555');
    marker.appendChild(mpath);
    defs.appendChild(marker);
    svg.appendChild(defs);

    const radius = Math.max(180, Math.min(width, height) / 2 - 92);
    const cx = width / 2;
    const cy = height / 2;
    const pos = {};
    states.forEach((s, i) => {
      const angle = (-Math.PI / 2) + (2 * Math.PI * i / Math.max(states.length, 1));
      pos[s] = { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
    });

    const edgeMap = new Map();
    graph.edges.forEach(e => {
      const key = `${e.from}->${e.to}`;
      if (!edgeMap.has(key)) edgeMap.set(key, { from: e.from, to: e.to, labels: [] });
      edgeMap.get(key).labels.push(e.label);
    });

    [...edgeMap.values()].forEach((edge, edgeIndex) => {
      const from = pos[edge.from], to = pos[edge.to];
      if (!from || !to) return;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let d;
      if (edge.from === edge.to) {
        const r = 25;
        d = `M ${from.x} ${from.y - 36} m -${r},0 a ${r},${r} 0 1,1 ${2*r},0 a ${r},${r} 0 1,1 -${2*r},0`;
      } else {
        const dx = to.x - from.x, dy = to.y - from.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        const sx = from.x + dx / dist * 32;
        const sy = from.y + dy / dist * 32;
        const ex = to.x - dx / dist * 32;
        const ey = to.y - dy / dist * 32;
        const mx = (sx + ex) / 2, my = (sy + ey) / 2;
        const nx = -dy / dist, ny = dx / dist;
        d = `M ${sx} ${sy} Q ${mx + nx*34} ${my + ny*34} ${ex} ${ey}`;
      }
      path.setAttribute('d', d);
      path.setAttribute('class', 'edge');
      svg.appendChild(path);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('class', 'edge-label');
      const labelText = edge.labels.join(', ');
      let labelX, labelY;
      if (edge.from === edge.to) {
        labelX = from.x;
        labelY = from.y - 78 - (edgeIndex % 3) * 14;
      } else {
        const dx = to.x - from.x, dy = to.y - from.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        const nx = -dy / dist, ny = dx / dist;
        labelX = (from.x + to.x) / 2 + nx * 52;
        labelY = (from.y + to.y) / 2 + ny * 52;
      }
      label.setAttribute('x', labelX);
      label.setAttribute('y', labelY);
      const chunks = labelText.match(/.{1,18}/g) || [labelText];
      chunks.forEach((chunk, i) => {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttribute('x', labelX);
        tspan.setAttribute('dy', i === 0 ? '0' : '1.15em');
        tspan.textContent = chunk;
        label.appendChild(tspan);
      });
      svg.appendChild(label);
    });

    // Start marker: triangle/arrow entering start state
    if (pos[graph.start]) {
      const p = pos[graph.start];
      const startPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      startPath.setAttribute('d', `M ${p.x - 86} ${p.y} L ${p.x - 33} ${p.y}`);
      startPath.setAttribute('class', 'start-edge');
      svg.appendChild(startPath);
    }

    states.forEach(s => {
      const p = pos[s];
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', p.x);
      circle.setAttribute('cy', p.y);
      circle.setAttribute('r', 27);
      circle.setAttribute('class', 'state');
      svg.appendChild(circle);

      if (graph.finals.includes(s)) {
        const inner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        inner.setAttribute('cx', p.x);
        inner.setAttribute('cy', p.y);
        inner.setAttribute('r', 20);
        inner.setAttribute('class', 'final-inner');
        svg.appendChild(inner);
      }

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', p.x);
      text.setAttribute('y', p.y);
      text.setAttribute('class', 'state-label');
      text.textContent = s;
      svg.appendChild(text);
    });
  }

  /* ----------------------------- Word checking ----------------------------- */

  function checkWord() {
    const word = els.word.value.trim();
    let accepted = false;
    let method = '';
    if (automaton) {
      const res = acceptsAnyAutomaton(automaton, word);
      accepted = res.accepted;
      method = res.method;
    } else if (grammar) {
      const max = Math.max(word.length, Number(els.maxLen.value) || word.length);
      accepted = generateWordsFromGrammar(grammar, max, 12000).includes(word);
      method = 'gramatika (generovanie do zvolenej dĺžky)';
    } else {
      els.result.classList.remove('hidden-panel');
      els.result.innerHTML = '<p class="warn">Najprv zadajte gramatiku alebo automat.</p>';
      return;
    }
    els.result.classList.remove('hidden-panel');
    els.result.innerHTML = `<p class="${accepted ? 'ok' : 'error'}"><strong>${accepted ? 'Akceptované / generované' : 'Neakceptované / negenerované'}:</strong> slovo „${escapeHtml(word || 'ε')}“ podľa ${method}.</p>`;
  }

  function listGeneratedWords() {
    if (els.result) {
      els.result.classList.add('hidden-panel');
      els.result.innerHTML = '';
    }
    const maxLen = Number(els.maxLen.value) || 0;
    let words = [];
    if (automaton) words = generateWordsFromAnyAutomaton(automaton, maxLen);
    else if (grammar) words = generateWordsFromGrammar(grammar, maxLen, 14000);
    else {
      els.generated.innerHTML = '<p class="warn">Najprv zadajte gramatiku alebo automat.</p>';
      return;
    }
    els.generated.innerHTML = `<p><strong>Slová do dĺžky ${maxLen}:</strong></p><div class="word-list">${words.map(w => `<span>${escapeHtml(w || 'ε')}</span>`).join('') || '<em>žiadne</em>'}</div>`;
  }

  function acceptsAnyAutomaton(a, word) {
    if (a.kind === 'fa') return { accepted: acceptsFA(a, word).accepted, method: 'konečný automat' };
    if (a.kind === 'pda') return { accepted: acceptsPDA(a, word).accepted, method: 'zásobníkový automat' };
    if (a.kind === 'lba') return { accepted: acceptsLBA(a, word).accepted, method: 'lineárne ohraničený automat' };
    return { accepted: false, method: 'automat' };
  }

  function generateWordsFromAnyAutomaton(a, maxLen) {
    const alphabet = a.alphabet || [];
    const words = [];
    const queue = [''];
    while (queue.length) {
      const w = queue.shift();
      if (w.length > maxLen) continue;
      if (acceptsAnyAutomaton(a, w).accepted) words.push(w);
      if (w.length < maxLen) alphabet.forEach(sym => queue.push(w + sym));
    }
    return words.sort(wordSort);
  }

  function acceptsFA(a, word) {
    let states = epsilonClosureFA(a, [a.start]);
    for (const ch of word) {
      const next = new Set();
      states.forEach(s => (a.transitions[s]?.[ch] || []).forEach(t => next.add(t)));
      states = epsilonClosureFA(a, [...next]);
    }
    const accepted = [...states].some(s => a.finals.includes(s));
    return { accepted, states: [...states] };
  }

  function epsilonClosureFA(a, states) {
    const stack = [...states];
    const seen = new Set(states);
    while (stack.length) {
      const s = stack.pop();
      (a.transitions[s]?.[EPS] || []).forEach(t => {
        if (!seen.has(t)) { seen.add(t); stack.push(t); }
      });
    }
    return seen;
  }

  function acceptsPDA(a, word) {
    const startConfig = { state: a.start, pos: 0, stack: [a.stackStart] };
    const queue = [startConfig];
    const seen = new Set();
    let steps = 0;
    const maxSteps = 6000;

    while (queue.length && steps++ < maxSteps) {
      const c = queue.shift();
      const key = `${c.state}|${c.pos}|${c.stack.join('')}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (a.finals.includes(c.state) && c.pos === word.length) return { accepted: true };

      const top = c.stack.length ? c.stack[c.stack.length - 1] : EPS;
      a.transitions.forEach(t => {
        if (t.from !== c.state) return;
        if (t.pop !== EPS && t.pop !== top) return;
        const inputOk = t.input === EPS || (c.pos < word.length && word[c.pos] === t.input);
        if (!inputOk) return;

        const newStack = c.stack.slice();
        if (t.pop !== EPS && newStack.length) newStack.pop();
        if (t.push !== EPS) {
          // push in reverse so first symbol becomes top after the whole string is pushed
          [...t.push].reverse().forEach(ch => newStack.push(ch));
        }
        const newPos = c.pos + (t.input === EPS ? 0 : 1);
        if (newStack.length <= Math.max(20, word.length * 4 + 8)) {
          queue.push({ state: t.to, pos: newPos, stack: newStack });
        }
      });
    }
    return { accepted: false };
  }

  function acceptsLBA(a, word) {
    const tape = word.length ? [...word] : [BLANK];
    const startConfig = { state: a.start, head: 0, tape };
    const queue = [startConfig];
    const seen = new Set();
    let steps = 0;
    const maxSteps = 5000;

    while (queue.length && steps++ < maxSteps) {
      const c = queue.shift();
      const key = `${c.state}|${c.head}|${c.tape.join('')}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (a.finals.includes(c.state)) return { accepted: true };
      const read = c.tape[c.head] || BLANK;

      a.transitions.forEach(t => {
        if (t.from !== c.state || t.read !== read) return;
        const nextTape = c.tape.slice();
        nextTape[c.head] = t.write;
        let nextHead = c.head;
        if (t.dir === 'L') nextHead -= 1;
        else if (t.dir === 'R') nextHead += 1;
        if (nextHead < 0 || nextHead >= nextTape.length) return;
        queue.push({ state: t.to, head: nextHead, tape: nextTape });
      });
    }
    return { accepted: false };
  }

  function findAmbiguousWordFA(a, maxLen) {
    const words = generateWordsRaw(a.alphabet, maxLen);
    for (const w of words) {
      const count = countAcceptingPathsFA(a, w);
      if (count > 1) return { word: w, count };
    }
    return null;
  }

  function generateWordsRaw(alphabet, maxLen) {
    const out = [];
    const queue = [''];
    while (queue.length) {
      const w = queue.shift();
      if (w.length > maxLen) continue;
      out.push(w);
      if (w.length < maxLen) alphabet.forEach(a => queue.push(w + a));
    }
    return out;
  }

  function countAcceptingPathsFA(a, word) {
    let configs = new Map([[a.start, 1]]);
    configs = epsilonClosureCountFA(a, configs);
    for (const ch of word) {
      const next = new Map();
      configs.forEach((count, s) => {
        (a.transitions[s]?.[ch] || []).forEach(t => next.set(t, (next.get(t) || 0) + count));
      });
      configs = epsilonClosureCountFA(a, next);
    }
    let total = 0;
    configs.forEach((count, s) => { if (a.finals.includes(s)) total += count; });
    return total;
  }

  function epsilonClosureCountFA(a, map) {
    const out = new Map(map);
    const queue = [...map.keys()];
    const guard = new Set();
    while (queue.length) {
      const s = queue.shift();
      (a.transitions[s]?.[EPS] || []).forEach(t => {
        const key = s + '->' + t;
        if (guard.has(key)) return;
        guard.add(key);
        const add = out.get(s) || 0;
        out.set(t, (out.get(t) || 0) + add);
        queue.push(t);
      });
    }
    return out;
  }

  /* ----------------------------- Utils ----------------------------- */

  function splitWords(text) {
    return text.trim() ? text.trim().split(/\s+/).filter(Boolean) : [];
  }

  function wordSort(a, b) {
    return a.length - b.length || a.localeCompare(b);
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
});
