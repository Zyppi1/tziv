/*
 * Interaktívny simulátor počítadlového stroja (abacus) s podporou krokovania,
 * kontinuálneho behu, výpočtu skutočnej a symbolickej jednotkovej zložitosti
 * a zachovaním stavu medzi zobrazeniami stránok. Program pozostáva z
 * príkazov a_k (inkrementácia) a s_k (dekrementácia), prípadne cyklov
 * (M)_k, ktoré vykonávajú blok M dovtedy, kým register R_k nie je nulový.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM prvky
  const progArea = document.getElementById('abacus-program');
  const regsInput = document.getElementById('abacus-registers');
  // premenné pre registre sa priraďujú automaticky (n, m, p, …)
  const loadBtn = document.getElementById('abacus-load');
  const stepBtn = document.getElementById('abacus-step');
  const runBtn = document.getElementById('abacus-run');
  const stopBtn = document.getElementById('abacus-stop');
  const resetBtn = document.getElementById('abacus-reset');
  const outElem = document.getElementById('abacus-output');
  const unitTimeElem = document.getElementById('abacus-unit-time');
  const unitSpaceElem = document.getElementById('abacus-unit-space');
  const speedSlider = document.getElementById('abacus-speed');
  const speedValue = document.getElementById('abacus-speed-value');
  const debugLast = document.getElementById('abacus-debug-last');
  const debugAction = document.getElementById('abacus-debug-action');
  const debugBlock = document.getElementById('abacus-debug-block');
  const traceElem = document.getElementById('abacus-trace');
  // pre abacus nezobrazujeme formálne zložitosti ani tabuľku príkazov

  // kľúče pre localStorage
  const LS_PROG = 'abacus_prog';
  const LS_REGS = 'abacus_regs';
  // LS_VARS odstránené – mená premenných sa neukladajú
  const LS_STATE = 'abacus_state';

  let state = null;
  let runInterval = null;

  /**
   * Uloží text programu, registre, mená premenných a stav simulácie.
   */
  function saveState(type) {
    localStorage.setItem(LS_PROG, progArea.value);
    localStorage.setItem(LS_REGS, regsInput.value);
    // neukladáme mená premenných pre abacus
    if (state) {
      localStorage.setItem(LS_STATE, JSON.stringify(state));
    } else {
      localStorage.removeItem(LS_STATE);
    }
  }

  /**
   * Načíta uložené hodnoty z localStorage a podľa potreby obnoví simuláciu.
   */
  function loadFromStorage() {
    const savedProg = localStorage.getItem(LS_PROG);
    const savedRegs = localStorage.getItem(LS_REGS);
    if (savedProg !== null) progArea.value = savedProg;
    if (savedRegs !== null) regsInput.value = savedRegs;
    const savedState = localStorage.getItem(LS_STATE);
    if (savedState) {
      try {
        state = JSON.parse(savedState);
      } catch (e) {
        state = null;
      }
    }
    updateUI();
    // aktivuj tlačidlá ak je stav
    if (state) {
      stepBtn.disabled = false;
      runBtn.disabled = false;
      stopBtn.disabled = state.halted;
    }
  }

  /**
   * Parsuje program počítadla. Vráti zoznam tokenov: inkrementy, dekrementy a cykly.
   * @param {string} program
   * @returns {Array}
   */
  function parseAbacus(program) {
    const cleaned = program.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    const tokens = [];
    let i = 0;
    while (i < cleaned.length) {
      const ch = cleaned[i];
      if (ch === 'a' || ch === 's') {
        let j = i + 1;
        let num = '';
        while (j < cleaned.length && /[0-9]/.test(cleaned[j])) {
          num += cleaned[j];
          j++;
        }
        if (num === '') throw new Error(`Chýba index registra pri operácii ${ch}`);
        tokens.push({ type: ch, reg: parseInt(num, 10) });
        i = j;
      } else if (ch === '(') {
        // parse loop body
        let depth = 1;
        let j = i + 1;
        while (j < cleaned.length && depth > 0) {
          if (cleaned[j] === '(') depth++;
          else if (cleaned[j] === ')') depth--;
          j++;
        }
        if (depth !== 0) throw new Error('Neuzavretá zátvorka v programe');
        const inner = cleaned.slice(i + 1, j - 1);
        let k = j;
        let num = '';
        while (k < cleaned.length && /[0-9]/.test(cleaned[k])) {
          num += cleaned[k];
          k++;
        }
        if (num === '') throw new Error('Chýba index registra pri cykle');
        tokens.push({ type: 'loop', reg: parseInt(num, 10), body: parseAbacus(inner) });
        i = k;
      } else if (ch === ' ') {
        i++;
      } else {
        throw new Error(`Neočakávaný znak v programe: '${ch}'`);
      }
    }
    return tokens;
  }

  /**
   * Vytvorí počiatočný stav simulácie podľa programu a registrov.
   */
  function initState() {
    const progText = progArea.value;
    const regsText = regsInput.value.trim();
    // mená premenných priraďujeme automaticky podľa počtu počiatočných registrov
    const defaultNames = ['n','m','p','q','r','s','t','u','v','w'];
    const varNames = defaultNames.slice(0, regsText === '' ? 0 : regsText.split(/\s+/).length);
    const registers = {};
    const initRegs = [];
    if (regsText !== '') {
      const vals = regsText.split(/\s+/).map(s => parseInt(s, 10));
      vals.forEach((v, i) => {
        const idx = i + 1;
        registers[idx] = isNaN(v) ? 0 : v;
        initRegs[i] = isNaN(v) ? 0 : v;
      });
    }
    let tokens;
    try {
      tokens = parseAbacus(progText);
    } catch (e) {
      alert('Chyba pri parsovaní programu: ' + e.message);
      return;
    }
    // počítadlá operácií
    const opCounts = {}; // napr. 'a1': počet, 's2': počet
    const loopCounts = {}; // počet testov cyklu pre register
    state = {
      tokens,
      stack: [{ tokens, index: 0, loopReg: null }],
      registers,
      initRegs,
      varNames,
      opCounts,
      loopCounts,
      unitTime: 0,
      halted: false,
      lastToken: null,
      lastAction: 'Program načítaný'
    };
    saveState();
    updateUI();
    // povoliť tlačidlá
    stepBtn.disabled = false;
    runBtn.disabled = false;
    stopBtn.disabled = true;
  }

  /**
   * Vykoná jeden krok simulácie. Ak program skončí, nastaví stav na halted.
   */
  function executeStep() {
    if (!state || state.halted) return;
    // bezpečnostný limit
    if (state.unitTime > 1000000) {
      alert('Prekročený limit krokov (možný nekonečný cyklus)');
      state.halted = true;
      updateUI();
      return;
    }
    // ak nie sú žiadne rámce, halt
    if (state.stack.length === 0) {
      state.halted = true;
      updateUI();
      return;
    }
    const frame = state.stack[state.stack.length - 1];
    if (frame.index >= frame.tokens.length) {
      // Ukončili sme aktuálny rámec (blok). Ak ide o cyklus, rozhodneme, či pokračovať.
      if (frame.loopReg !== null) {
        const r = frame.loopReg;
        // zaznamenaj testovanie cyklu
        state.loopCounts['loop' + r] = (state.loopCounts['loop' + r] || 0) + 1;
        // Ak register r je stále nenulový, opakujeme blok od začiatku
        if ((state.registers[r] || 0) > 0) {
          state.lastAction = `Opakovanie cyklu podľa R${r}`;
          // reštart index na začiatok tela cyklu
          frame.index = 0;
          updateUI();
          return;
        } else {
          state.lastAction = `Koniec cyklu, R${r} = 0`;
          // register je nulový – cyklus končí, odstráň rámec a pokračuj vyššie
          state.stack.pop();
          executeStep();
          return;
        }
      } else {
        // najvyšší rámec skončil – program sa končí
        state.stack.pop();
        state.halted = true;
        updateUI();
        return;
      }
    } else {
      const token = frame.tokens[frame.index];
      state.currentToken = tokenToString(token);
      frame.index++;
      if (token.type === 'a') {
        // Inkrementácia registra
        const r = token.reg;
        state.registers[r] = (state.registers[r] || 0) + 1;
        state.unitTime++;
        const key = 'a' + r;
        state.opCounts[key] = (state.opCounts[key] || 0) + 1;
        state.lastToken = key;
        state.lastAction = `Inkrementácia R${r}`;
        updateUI();
        return;
      } else if (token.type === 's') {
        // Dekrementácia registra, iba ak je hodnota > 0
        const r = token.reg;
        if ((state.registers[r] || 0) > 0) {
          state.registers[r]--;
        }
        state.unitTime++;
        const key = 's' + r;
        state.opCounts[key] = (state.opCounts[key] || 0) + 1;
        state.lastToken = key;
        state.lastAction = `Dekrementácia R${r}`;
        updateUI();
        return;
      } else if (token.type === 'loop') {
        // Začatie cyklu – ak register > 0, vstúp do tela cyklu
        const r = token.reg;
        // zaznamenaj test cyklu
        state.loopCounts['loop' + r] = (state.loopCounts['loop' + r] || 0) + 1;
        if ((state.registers[r] || 0) > 0) {
          state.lastToken = `(${formatTokens(token.body)})${r}`;
          state.lastAction = `Vstup do cyklu podľa R${r}`;
          // vlož nový rámec pre telo cyklu, loopReg nastav na r
          state.stack.push({ tokens: token.body, index: 0, loopReg: r });
          updateUI();
          return;
        } else {
          state.lastToken = `(${formatTokens(token.body)})${r}`;
          state.lastAction = `Preskočenie cyklu, R${r} = 0`;
          // register je nulový – cyklus preskočíme
          updateUI();
          return;
        }
      }
    }
  }

  /**
   * Spustí kontinuálne vykonávanie.
   */
  function runContinuous() {
    if (!state || state.halted) return;
    if (runInterval) return;
    runInterval = setInterval(() => {
      if (!state || state.halted) {
        clearInterval(runInterval);
        runInterval = null;
        return;
      }
      executeStep();
    }, getAbacusDelay());
    stepBtn.disabled = true;
    runBtn.disabled = true;
    stopBtn.disabled = false;
  }

  /**
   * Zastaví kontinuálne vykonávanie.
   */
  function stopRunning() {
    if (runInterval) {
      clearInterval(runInterval);
      runInterval = null;
    }
    if (state && !state.halted) {
      stepBtn.disabled = false;
      runBtn.disabled = false;
    }
    stopBtn.disabled = true;
  }

  /**
   * Resetuje simuláciu – znovu inicializuje stav podľa rovnakého programu a
   * registrov, ale vynuluje počítadlá a stav.
   */
  function resetSimulation() {
    if (!state) return;
    initState();
    stopRunning();
  }

  /**
   * Aktualizuje UI podľa aktuálneho stavu: zobrazí registre, zložitosť, tabuľku.
   */
  function updateUI() {
    if (!state) {
      outElem.textContent = '';
      unitTimeElem.textContent = '–';
      unitSpaceElem.textContent = '–';
      updateDebug();
      return;
    }
    // zobraziť registre (len tie, ktoré existujú)
    const keys = Object.keys(state.registers).map(k => parseInt(k, 10)).sort((a, b) => a - b);
    let regOut = '';
    keys.forEach(k => {
      regOut += `R${k} = ${state.registers[k]}\n`;
    });
    outElem.textContent = regOut.trim();
    // nastav aktuálny počet krokov a počet použitých registrov
    unitTimeElem.textContent = state.unitTime;
    unitSpaceElem.textContent = keys.length;
    updateDebug();
    // ulož stav
    saveState();
  }

  /**
   * Vytvorí symbolické vyjadrenie počtov príkazov na základe varNames a počiatočných
   * registrov. Pre každý príkaz vypočíta výraz v tvare k·n alebo n + 1.
   */
  function computeFormulas() {
    const formulas = { perCommand: {}, total: '' };
    if (!state || !state.varNames || state.varNames.length === 0 || !state.initRegs) {
      // žiadne premeny – použijeme skutočné počty
      let sum = 0;
      Object.keys(state.opCounts).forEach(cmd => { sum += state.opCounts[cmd]; });
      formulas.total = sum.toString();
      Object.keys(state.opCounts).forEach(cmd => {
        formulas.perCommand[cmd] = state.opCounts[cmd].toString();
      });
      return formulas;
    }
    // Pre každý príkaz vypočítaj výraz. Predpokladáme, že a_k a s_k sú vykonávané
    // lineárne v závislosti od príslušnej premennej (hodnoty registra). Použijeme
    // heuristiku podobnú RAM: ratio = count / v alebo count / (v+1).
    const varNames = state.varNames;
    const initRegs = state.initRegs;
    // preložíme register index na meno premennej
    const regToVar = {};
    varNames.forEach((name, i) => {
      regToVar[i + 1] = name;
    });
    let coeffs = {};
    let constant = 0;
    Object.keys(state.opCounts).forEach(cmd => {
      const count = state.opCounts[cmd];
      let formula = count.toString();
      // extrahuj register číslo z cmd (a1 alebo s2)
      const match = cmd.match(/^[as](\d+)/);
      if (match) {
        const regIndex = parseInt(match[1], 10);
        const varName = regToVar[regIndex];
        const initVal = initRegs[regIndex - 1];
        if (varName && initVal !== undefined && initVal !== 0) {
          // ratio príkazov na jeden cyklus
          const ratio = count / initVal;
          const diff = Math.abs(ratio - Math.round(ratio));
          if (diff < 0.1) {
            const k = Math.round(ratio);
            formula = (k === 1 ? '' : k + '·') + varName;
            // pripočítaj do koeficientov
            coeffs[varName] = (coeffs[varName] || 0) + k;
            return;
          }
          // ratio na (v+1) pre dekrementy v cykle (s_k)
          const ratioPlus = count / (initVal + 1);
          const diffPlus = Math.abs(ratioPlus - Math.round(ratioPlus));
          if (diffPlus < 0.1) {
            const k = Math.round(ratioPlus);
            formula = (k === 1 ? '' : k + '·') + varName + ' + 1';
            coeffs[varName] = (coeffs[varName] || 0) + k;
            constant += k;
            return;
          }
        }
      }
      // inak ostáva formula ako číslo
      constant += count;
      formula = count.toString();
      formulas.perCommand[cmd] = formula;
    });
    // naplň perCommand pre tie príkazy, ktoré boli priradené cez varName
    Object.keys(state.opCounts).forEach(cmd => {
      if (!formulas.perCommand[cmd]) {
        // príkaz, ktorý bol priradený cez varName – vyhľadaj register
        const match = cmd.match(/^[as](\d+)/);
        const regIndex = match ? parseInt(match[1], 10) : null;
        const varName = regIndex ? regToVar[regIndex] : null;
        const initVal = regIndex ? initRegs[regIndex - 1] : null;
        const count = state.opCounts[cmd];
        if (varName && initVal !== undefined && initVal !== 0) {
          const ratio = count / initVal;
          const diff = Math.abs(ratio - Math.round(ratio));
          if (diff < 0.1) {
            const k = Math.round(ratio);
            formulas.perCommand[cmd] = (k === 1 ? '' : k + '·') + varName;
          } else {
            const ratioPlus = count / (initVal + 1);
            const diffPlus = Math.abs(ratioPlus - Math.round(ratioPlus));
            if (diffPlus < 0.1) {
              const k = Math.round(ratioPlus);
              formulas.perCommand[cmd] = (k === 1 ? '' : k + '·') + varName + ' + 1';
            } else {
              formulas.perCommand[cmd] = count.toString();
            }
          }
        } else {
          formulas.perCommand[cmd] = count.toString();
        }
      }
    });
    // vytvor celkový výraz
    const parts = [];
    Object.keys(coeffs).forEach(name => {
      const k = coeffs[name];
      parts.push((k === 1 ? '' : k.toString()) + name);
    });
    if (constant > 0) parts.push(constant.toString());
    formulas.total = parts.length > 0 ? parts.join(' + ') : '0';
    return formulas;
  }


  function getAbacusDelay() {
    const value = speedSlider ? Number(speedSlider.value) : 200;
    return Number.isFinite(value) ? value : 200;
  }

  function tokenToString(token) {
    if (!token) return '–';
    if (token.type === 'a' || token.type === 's') return token.type + token.reg;
    if (token.type === 'loop') return `(${formatTokens(token.body)})${token.reg}`;
    return '?';
  }

  function formatTokens(tokens) {
    return (tokens || []).map(tokenToString).join(' ');
  }

  function nextTokenString() {
    if (!state || state.halted || !state.stack || state.stack.length === 0) return 'HALT / koniec';
    const frame = state.stack[state.stack.length - 1];
    if (frame.index >= frame.tokens.length) {
      return frame.loopReg !== null ? `test cyklu R${frame.loopReg}` : 'koniec programu';
    }
    return tokenToString(frame.tokens[frame.index]);
  }

  function currentFrame() {
    if (!state || !state.stack || state.stack.length === 0) return null;
    return state.stack[state.stack.length - 1];
  }

  function currentFrameTokens() {
    const frame = currentFrame();
    return frame ? frame.tokens : (state ? state.tokens : []);
  }

  function currentBlockLabel() {
    const frame = currentFrame();
    if (!frame) return '–';
    if (frame.loopReg === null) return 'hlavný program';
    return `cyklus podľa R${frame.loopReg}`;
  }

  function currentTokenIndex() {
    const frame = currentFrame();
    if (!frame) return -1;
    // frame.index ukazuje na ďalší token. Ak sa práve vykonal token, je to index-1.
    return Math.max(0, Math.min(frame.index, frame.tokens.length - 1));
  }

  function addTraceSpan(container, label, className) {
    const span = document.createElement('span');
    span.className = className || 'trace-token';
    span.textContent = label;
    container.appendChild(span);
    return span;
  }

  function renderTrace(tokens, container) {
    if (!container) return;
    container.innerHTML = '';

    const frame = currentFrame();
    const help = document.createElement('div');
    help.className = 'trace-help';
    help.textContent = frame && frame.loopReg !== null
      ? `Zobrazený je aktuálne vykonávaný cyklus: ( ... )${frame.loopReg}.`
      : 'Zobrazený je aktuálny blok programu.';
    container.appendChild(help);

    const tokenWrap = document.createElement('div');
    tokenWrap.className = 'trace-token-wrap';
    container.appendChild(tokenWrap);

    const active = nextTokenString();
    const last = state ? state.lastToken : null;
    const insideLoop = frame && frame.loopReg !== null;

    if (insideLoop) {
      addTraceSpan(tokenWrap, '(', 'trace-token trace-bracket loop-open');
    }

    (tokens || []).forEach((token, index) => {
      const span = addTraceSpan(tokenWrap, tokenToString(token), 'trace-token');
      const label = tokenToString(token);
      if (label === active || index === currentTokenIndex()) span.classList.add('current-token');
      if (label === last) span.classList.add('last-token');
    });

    if (insideLoop) {
      const close = addTraceSpan(tokenWrap, `)${frame.loopReg}`, 'trace-token trace-bracket loop-close');
      if (frame.index >= frame.tokens.length) {
        close.classList.add('current-token');
      }
    }
  }

  function updateDebug() {
    if (!debugLast) return;
    if (!state) {
      debugLast.textContent = '–';
      debugAction.textContent = '–';
      if (debugBlock) debugBlock.textContent = '–';
      if (traceElem) traceElem.innerHTML = '';
      return;
    }
    debugLast.textContent = state.lastToken || '–';
    debugAction.textContent = state.lastAction || '–';
    if (debugBlock) debugBlock.textContent = currentBlockLabel();
    renderTrace(currentFrameTokens(), traceElem);
  }

  // udalosti
  loadBtn.addEventListener('click', () => {
    initState();
  });
  stepBtn.addEventListener('click', () => {
    executeStep();
  });
  runBtn.addEventListener('click', () => {
    runContinuous();
  });
  stopBtn.addEventListener('click', () => {
    stopRunning();
  });
  resetBtn.addEventListener('click', () => {
    stopRunning();
    initState();
  });
  if (speedSlider && speedValue) {
    speedSlider.addEventListener('input', () => {
      speedValue.textContent = `${speedSlider.value} ms/krok`;
      if (runInterval) {
        stopRunning();
        runContinuous();
      }
    });
    speedValue.textContent = `${speedSlider.value} ms/krok`;
  }

  // pomôcka pre Array: pushIfMissing
  Array.prototype.pushIfMissing = function (elem) {
    if (!this.includes(elem)) this.push(elem);
  };

  // načítaj stav z localStorage pri načítaní stránky
  loadFromStorage();
});