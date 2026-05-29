/*
 * Simulátor deterministického Turingovho stroja so zobrazením grafu stavov a pásky.
 * Po načítaní prechodov vygeneruje graf a umožňuje krokovanie alebo spustenie
 * behu, počas ktorého aktualizuje pásku a zvýrazňuje aktuálny stav.
 */

document.addEventListener('DOMContentLoaded', () => {
  const programArea = document.getElementById('tm-program');
  const inputField = document.getElementById('tm-input');
  const acceptField = document.getElementById('tm-accept');
  const loadBtn = document.getElementById('tm-load');
  const stepBtn = document.getElementById('tm-step');
  const runBtn = document.getElementById('tm-run');
  const resetBtn = document.getElementById('tm-reset');
  const currentStateElem = document.getElementById('tm-current-state');
  const svgElem = document.getElementById('tm-svg');
  const tapeElem = document.getElementById('tm-tape');
  const speedSlider = document.getElementById('tm-speed');
  const speedValue = document.getElementById('tm-speed-value');
  const debugStep = document.getElementById('tm-debug-step');
  const debugHead = document.getElementById('tm-debug-head');
  const debugSymbol = document.getElementById('tm-debug-symbol');
  const debugLast = document.getElementById('tm-debug-last');

  // Kľúče pre localStorage
  const LS_PROG = 'tm_program';
  const LS_INPUT = 'tm_input';
  const LS_ACCEPT = 'tm_accept';
  const LS_STATE = 'tm_state';

  let tm = null;
  let runInterval = null;

  /**
   * Uloží program, vstup, akceptačné stavy a aktuálny stav TM do localStorage.
   */
  function saveState() {
    localStorage.setItem(LS_PROG, programArea.value);
    localStorage.setItem(LS_INPUT, inputField.value);
    localStorage.setItem(LS_ACCEPT, acceptField.value);
    if (tm) {
      // len uložiť vlastnosti, ktoré sú potrebné na pokračovanie
      localStorage.setItem(LS_STATE, JSON.stringify({
        transitions: tm.transitions,
        acceptStates: tm.acceptStates,
        tape: tm.tape,
        head: tm.head,
        currentState: tm.currentState,
        blank: tm.blank,
        stepCounter: tm.stepCounter || 0,
        lastTransition: tm.lastTransition || null
      }));
    } else {
      localStorage.removeItem(LS_STATE);
    }
  }

  /**
   * Načíta program a stav TM z localStorage a obnoví simuláciu.
   */
  function loadFromStorage() {
    const savedProg = localStorage.getItem(LS_PROG);
    const savedInput = localStorage.getItem(LS_INPUT);
    const savedAccept = localStorage.getItem(LS_ACCEPT);
    if (savedProg !== null) programArea.value = savedProg;
    if (savedInput !== null) inputField.value = savedInput;
    if (savedAccept !== null) acceptField.value = savedAccept;
    const savedState = localStorage.getItem(LS_STATE);
    if (savedState) {
      try {
        const obj = JSON.parse(savedState);
        tm = {
          transitions: obj.transitions || {},
          acceptStates: obj.acceptStates || [],
          tape: obj.tape || [],
          head: obj.head || 0,
          currentState: obj.currentState || 'q0',
          blank: obj.blank || '_',
          stepLimit: 10000,
          stepCounter: obj.stepCounter || 0,
          lastTransition: obj.lastTransition || null
        };
        // Vykresli graf a pásku
        drawTMGraph(svgElem, tm, tm.acceptStates);
        updateTapeDisplay(tapeElem, tm);
        currentStateElem.textContent = tm.currentState;
        highlightCurrentState(svgElem, tm.currentState);
        updateDebugPanel();
        stepBtn.disabled = false;
        runBtn.disabled = false;
        resetBtn.disabled = false;
      } catch (e) {
        console.warn('Chyba pri načítaní stavu TM:', e);
        tm = null;
      }
    }
  }

  // načítaj stav po načítaní stránok
  loadFromStorage();

  // Handler pre načítanie stroja
  loadBtn.addEventListener('click', () => {
    try {
      const transitions = parseTMTransitions(programArea.value);
      const acceptStates = acceptField.value.trim().split(/\s+/).filter(Boolean);
      const inputString = inputField.value || '';
      tm = createTuringMachine(transitions, acceptStates, inputString);
      drawTMGraph(svgElem, tm, acceptStates);
      updateTapeDisplay(tapeElem, tm);
      currentStateElem.textContent = tm.currentState;
      highlightCurrentState(svgElem, tm.currentState);
        updateDebugPanel();
      stepBtn.disabled = false;
      runBtn.disabled = false;
      resetBtn.disabled = false;
      saveState();
    } catch (e) {
      alert('Chyba: ' + e.message);
    }
  });

  // Handler pre krokovanie
  stepBtn.addEventListener('click', () => {
    if (tm) {
      const running = stepTM(tm);
      updateTapeDisplay(tapeElem, tm);
      currentStateElem.textContent = tm.currentState;
      highlightCurrentState(svgElem, tm.currentState);
        updateDebugPanel();
      saveState();
      if (!running) {
        stepBtn.disabled = true;
        runBtn.disabled = true;
        if (runInterval) {
          clearInterval(runInterval);
          runInterval = null;
        }
      }
    }
  });

  // Handler pre spustenie kontinuálne
  runBtn.addEventListener('click', () => {
    if (tm && !runInterval) {
      runInterval = setInterval(() => {
        const running = stepTM(tm);
        updateTapeDisplay(tapeElem, tm);
        currentStateElem.textContent = tm.currentState;
        highlightCurrentState(svgElem, tm.currentState);
        updateDebugPanel();
        saveState();
        if (!running) {
          clearInterval(runInterval);
          runInterval = null;
          stepBtn.disabled = true;
          runBtn.disabled = true;
        }
      }, getTmDelay());
    }
  });

  // Handler pre resetovanie
  resetBtn.addEventListener('click', () => {
    if (tm) {
      const transitions = parseTMTransitions(programArea.value);
      const acceptStates = acceptField.value.trim().split(/\s+/).filter(Boolean);
      const inputString = inputField.value || '';
      tm = createTuringMachine(transitions, acceptStates, inputString);
      drawTMGraph(svgElem, tm, acceptStates);
      updateTapeDisplay(tapeElem, tm);
      currentStateElem.textContent = tm.currentState;
      highlightCurrentState(svgElem, tm.currentState);
        updateDebugPanel();
      stepBtn.disabled = false;
      runBtn.disabled = false;
      if (runInterval) {
        clearInterval(runInterval);
        runInterval = null;
      }
      saveState();
    }
  });
  if (speedSlider && speedValue) {
    speedSlider.addEventListener('input', () => {
      speedValue.textContent = `${speedSlider.value} ms/krok`;
      if (runInterval) {
        clearInterval(runInterval);
        runInterval = null;
        runBtn.click();
      }
    });
    speedValue.textContent = `${speedSlider.value} ms/krok`;
  }
  updateDebugPanel();

  function getTmDelay() {
    const value = speedSlider ? Number(speedSlider.value) : 300;
    return Number.isFinite(value) ? value : 300;
  }

  function updateDebugPanel() {
    if (!debugStep) return;
    if (!tm) {
      debugStep.textContent = '–';
      debugHead.textContent = '–';
      debugSymbol.textContent = '–';
      debugLast.textContent = '–';
      return;
    }
    const symbol = tm.tape[tm.head] !== undefined ? tm.tape[tm.head] : tm.blank;
    debugStep.textContent = tm.stepCounter || 0;
    debugHead.textContent = tm.head;
    debugSymbol.textContent = symbol;
    debugLast.textContent = tm.lastTransition || '–';
  }
});

function parseTMTransitions(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '' && !l.startsWith('#'));
  const transitions = {};
  lines.forEach(line => {
    // format: q0 0 -> q1 1 R
    const arrowIndex = line.indexOf('->');
    if (arrowIndex === -1) throw new Error('Prechod musí obsahovať "->": ' + line);
    const left = line.slice(0, arrowIndex).trim();
    const right = line.slice(arrowIndex + 2).trim();
    const [state, symbol] = left.split(/\s+/);
    const parts = right.split(/\s+/);
    if (parts.length < 3) throw new Error('Pravá strana musí obsahovať nový stav, symbol a smer: ' + line);
    const [newState, writeSymbol, direction] = parts;
    if (!transitions[state]) transitions[state] = {};
    transitions[state][symbol] = { nextState: newState, writeSymbol, dir: direction };
  });
  return transitions;
}

function createTuringMachine(transitions, acceptStates, inputString) {
  const tape = inputString.split('');
  const blank = '_';
  return {
    transitions,
    acceptStates,
    tape,
    head: 0,
    currentState: 'q0',
    blank,
    stepLimit: 10000,
    stepCounter: 0
  };
}

function stepTM(tm) {
  // If accept state reached or no transition, stop
  if (tm.acceptStates.includes(tm.currentState)) {
    return false;
  }
  if (tm.stepCounter++ > tm.stepLimit) return false;
  const symbol = tm.tape[tm.head] !== undefined ? tm.tape[tm.head] : tm.blank;
  const trans = tm.transitions[tm.currentState] && tm.transitions[tm.currentState][symbol];
  if (!trans) {
    return false;
  }
  const beforeState = tm.currentState;
  const beforeHead = tm.head;
  // write symbol
  tm.tape[tm.head] = trans.writeSymbol;
  // move head
  if (trans.dir === 'R' || trans.dir === 'r') {
    tm.head++;
  } else if (trans.dir === 'L' || trans.dir === 'l') {
    tm.head--;
    if (tm.head < 0) {
      tm.tape.unshift(tm.blank);
      tm.head = 0;
    }
  }
  // change state
  tm.currentState = trans.nextState;
  tm.lastTransition = `${beforeState} ${symbol} → ${trans.nextState} ${trans.writeSymbol} ${trans.dir} (pozícia ${beforeHead})`;
  return !(tm.acceptStates.includes(tm.currentState));
}

// Graph drawing functions
function drawTMGraph(svg, tm, acceptStates) {
  // Clear previous
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const statesSet = new Set(Object.keys(tm.transitions));
  // include states that appear as targets but not sources
  Object.values(tm.transitions).forEach(obj => {
    Object.values(obj).forEach(trans => {
      statesSet.add(trans.nextState);
    });
  });
  const states = Array.from(statesSet);
  const edges = [];
  states.forEach(state => {
    const transMap = tm.transitions[state] || {};
    Object.keys(transMap).forEach(symbol => {
      const { nextState, writeSymbol, dir } = transMap[symbol];
      edges.push({ from: state, to: nextState, label: `${symbol}/${writeSymbol},${dir}` });
    });
  });
  // Dimensions
  // Determine drawing dimensions. Some browsers return 0 for clientWidth
  // if the element is not yet rendered. Provide sensible defaults.
  let width = svg.clientWidth;
  let height = svg.clientHeight;
  if (!width || width <= 0) {
    width = (svg.parentElement && svg.parentElement.clientWidth) || 600;
  }
  if (!height || height <= 0) {
    height = 400;
  }
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  const radius = Math.min(width, height) / 2 - 50;
  const centerX = width / 2;
  const centerY = height / 2;
  // Create arrow marker
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', 'arrow');
  marker.setAttribute('viewBox', '0 0 10 10');
  marker.setAttribute('refX', '10');
  marker.setAttribute('refY', '5');
  marker.setAttribute('markerWidth', '6');
  marker.setAttribute('markerHeight', '6');
  marker.setAttribute('orient', 'auto-start-reverse');
  const markerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  markerPath.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
  markerPath.setAttribute('fill', '#555');
  marker.appendChild(markerPath);
  defs.appendChild(marker);
  svg.appendChild(defs);
  // Position map
  const pos = {};
  states.forEach((state, i) => {
    const angle = (2 * Math.PI * i) / states.length;
    pos[state] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });
  // Draw edges
  edges.forEach(edge => {
    const from = pos[edge.from];
    const to = pos[edge.to];
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    // For loop, draw curved circle
    let d;
    if (edge.from === edge.to) {
      // loop: small circle above the state
      const loopR = 25;
      const cx = from.x;
      const cy = from.y - loopR - 10;
      d = `M ${cx} ${cy} m -${loopR}, 0 a ${loopR},${loopR} 0 1,1 ${loopR * 2},0 a ${loopR},${loopR} 0 1,1 -${loopR * 2},0`;
    } else {
      // line with slight curvature if multiple edges between same nodes (not handled separately)
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      // offset start and end to avoid overlapping the circle
      const offset = 30;
      const startX = from.x + (dx / distance) * offset;
      const startY = from.y + (dy / distance) * offset;
      const endX = to.x - (dx / distance) * offset;
      const endY = to.y - (dy / distance) * offset;
      // compute control point for quadratic curve for slight curvature
      const mx = (startX + endX) / 2;
      const my = (startY + endY) / 2;
      // perpendicular offset
      const curveOffset = 30;
      const nx = -dy / distance;
      const ny = dx / distance;
      const cxPoint = { x: mx + nx * curveOffset, y: my + ny * curveOffset };
      d = `M ${startX} ${startY} Q ${cxPoint.x} ${cxPoint.y} ${endX} ${endY}`;
    }
    path.setAttribute('d', d);
    path.setAttribute('class', 'edge');
    svg.appendChild(path);
    // label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('class', 'edge-label');
    // Position label at mid point; approximate for loops
    let lx, ly;
    if (edge.from === edge.to) {
      lx = from.x;
      ly = from.y - 50;
    } else {
      lx = (pos[edge.from].x + pos[edge.to].x) / 2;
      ly = (pos[edge.from].y + pos[edge.to].y) / 2;
    }
    label.setAttribute('x', lx);
    label.setAttribute('y', ly);
    label.textContent = edge.label;
    svg.appendChild(label);
  });
  // Initial-state marker: a triangular arrow entering q0.
  if (pos['q0']) {
    const p = pos['q0'];
    const startPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    startPath.setAttribute('d', `M ${p.x - 82} ${p.y} L ${p.x - 30} ${p.y}`);
    startPath.setAttribute('class', 'start-edge');
    svg.appendChild(startPath);
  }

  // Draw states. Final states are shown as two circles.
  states.forEach(state => {
    const { x, y } = pos[state];
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', 25);
    circle.setAttribute('class', 'state');
    if (acceptStates.includes(state)) {
      circle.classList.add('accept');
    }
    circle.setAttribute('data-state', state);
    svg.appendChild(circle);
    if (acceptStates.includes(state)) {
      const inner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      inner.setAttribute('cx', x);
      inner.setAttribute('cy', y);
      inner.setAttribute('r', 19);
      inner.setAttribute('class', 'final-inner');
      svg.appendChild(inner);
    }
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('class', 'state-label');
    text.textContent = state;
    svg.appendChild(text);
  });
  // Highlight initial state
  highlightCurrentState(svg, 'q0');
}

function highlightCurrentState(svg, state) {
  // Remove previous highlight
  Array.from(svg.querySelectorAll('circle.state')).forEach(c => {
    c.style.fill = '#fafafa';
  });
  const current = svg.querySelector(`circle[data-state="${state}"]`);
  if (current) {
    current.style.fill = '#e8eaf6';
  }
}

function updateTapeDisplay(container, tm) {
  container.innerHTML = '';

  // Show the whole meaningful tape, not only a small fixed window around the head.
  // This prevents long inputs from being visually cut off. We keep exactly four blank
  // cells on both sides so head movement is easy to see.
  const padding = 4;
  const nonBlank = [];
  for (let i = 0; i < tm.tape.length; i++) {
    if (tm.tape[i] !== undefined && tm.tape[i] !== tm.blank) nonBlank.push(i);
  }

  const firstUsed = nonBlank.length ? Math.min(...nonBlank) : 0;
  const lastUsed = nonBlank.length ? Math.max(...nonBlank) : Math.max(0, tm.tape.length - 1);
  const start = Math.min(firstUsed, tm.head) - padding;
  const end = Math.max(lastUsed, tm.head, 0) + padding;
  let headCell = null;

  for (let i = start; i <= end; i++) {
    const cell = document.createElement('div');
    cell.className = 'tape-cell';
    const symbol = tm.tape[i] !== undefined ? tm.tape[i] : tm.blank;
    cell.textContent = symbol;
    cell.title = `Pozícia ${i}`;
    if (i === tm.head) {
      cell.classList.add('head');
      headCell = cell;
    }
    container.appendChild(cell);
  }

  // Keep current head visible after automatic steps.
  if (headCell && typeof headCell.scrollIntoView === 'function') {
    headCell.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
}
