/*
 * RAM simulator focused on the TZIV complexity definitions.
 *
 * Important definitions implemented here:
 * 1. Unit time = number of executions of each instruction line.
 * 2. Unit space = number of different registers used during computation, including R0.
 * 3. Logarithmic time = sum of instruction prices for every actual execution.
 *    The prices are exactly the table from the prompt: t(op), l(c(0)), l(i), etc.
 * 4. Logarithmic space = sum of l(x_i) over all used registers, where x_i is the
 *    largest absolute value ever stored in register i during the computation.
 *
 * The symbolic count column is not guessed from totals alone. It is derived from
 * detected backward jumps and the loop counter register whenever the pattern is clear:
 * - bottom-tested loop with JGZERO/JGTZ back to label -> body rows are n
 * - top-tested loop LOAD r; JZERO end; ...; JUMP top -> test rows are n+1, body rows n
 * - nested loops multiply factors, e.g. n·m.
 */

(function () {
  const DEFAULT_VAR_NAMES = ['n', 'm', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w'];
  const MAX_STEPS = 1000000;

  let state = null;
  let runTimer = null;

  document.addEventListener('DOMContentLoaded', () => {
    const els = getElements();
    loadPersisted(els);
    els.loadBtn.addEventListener('click', () => loadProgram(els));
    els.stepBtn.addEventListener('click', () => stepOnceSafe(els));
    els.runBtn.addEventListener('click', () => runProgram(els));
    els.stopBtn.addEventListener('click', () => stopRun(els));
    els.resetBtn.addEventListener('click', () => resetProgram(els));
    if (els.speed && els.speedValue) {
      els.speed.addEventListener('input', () => {
        els.speedValue.textContent = `${els.speed.value} ms/krok`;
        if (runTimer) {
          stopRun(els);
          runProgram(els);
        }
      });
      els.speedValue.textContent = `${els.speed.value} ms/krok`;
    }
  });

  function getElements() {
    return {
      program: document.getElementById('ram-program'),
      input: document.getElementById('ram-input'),
      loadBtn: document.getElementById('ram-load'),
      stepBtn: document.getElementById('ram-step'),
      runBtn: document.getElementById('ram-run'),
      stopBtn: document.getElementById('ram-stop'),
      resetBtn: document.getElementById('ram-reset'),
      output: document.getElementById('ram-output'),
      unitTime: document.getElementById('ram-unit-time'),
      logTime: document.getElementById('ram-log-time'),
      unitSpace: document.getElementById('ram-unit-space'),
      logSpace: document.getElementById('ram-log-space'),
      formulaUnit: document.getElementById('ram-formula-unit'),
      formulaSpace: document.getElementById('ram-formula-space'),
      lineTable: document.getElementById('ram-cost-table').querySelector('tbody'),
      regTable: document.getElementById('ram-reg-table').querySelector('tbody'),
      loopInfo: document.getElementById('ram-loops-info'),
      speed: document.getElementById('ram-speed'),
      speedValue: document.getElementById('ram-speed-value'),
      timeEquations: document.getElementById('ram-time-equations'),
      spaceEquations: document.getElementById('ram-space-equations'),
      debugIp: document.getElementById('ram-debug-ip'),
      debugLast: document.getElementById('ram-debug-last'),
      debugR0: document.getElementById('ram-debug-r0'),
      debugRegisters: document.getElementById('ram-debug-registers')
    };
  }

  function loadProgram(els) {
    try {
      const parsed = parseProgram(els.program.value);
      const inputs = parseInputs(els.input.value);
      const variableNames = DEFAULT_VAR_NAMES.slice(0, inputs.length);
      const inputRegisterVars = buildInputRegisterMap(parsed.instructions, variableNames);
      const loopModel = analyseLoops(parsed.instructions, parsed.labels, inputRegisterVars);

      state = {
        ...parsed,
        inputsOriginal: inputs.slice(),
        inputQueue: inputs.slice(),
        inputRegisterVars,
        variableNames,
        loopModel,
        registers: { 0: 0 },
        ip: 0,
        outputs: [],
        halted: false,
        totalUnitTime: 0,
        totalLogTime: 0,
        lineStats: parsed.instructions.map((instruction, index) => ({
          index,
          instruction,
          count: 0,
          logTime: 0
        })),
        usedRegisters: { 0: true },
        maxAbs: { 0: 0 },
        accessCounts: { 0: 0 },
        lastExecutedIndex: null,
        lastExecutedInstruction: null
      };

      persist(els);
      updateUi(els);
      setButtons(els, true, false);
    } catch (err) {
      alert('Chyba pri načítaní programu: ' + err.message);
    }
  }

  function resetProgram(els) {
    stopRun(els);
    loadProgram(els);
  }

  function runProgram(els) {
    if (!state || state.halted) return;
    stopRun(els);
    els.stepBtn.disabled = true;
    els.runBtn.disabled = true;
    els.stopBtn.disabled = false;
    runTimer = setInterval(() => {
      if (!state || state.halted) {
        stopRun(els);
        return;
      }
      stepOnceSafe(els, true);
    }, getRunDelay(els));
  }

  function stopRun(els) {
    if (runTimer) {
      clearInterval(runTimer);
      runTimer = null;
    }
    if (state && !state.halted) setButtons(els, true, false);
    else setButtons(els, false, false);
  }

  function stepOnceSafe(els, fromRun = false) {
    try {
      stepOnce();
      persist(els);
      updateUi(els);
      if (state && state.halted) setButtons(els, false, false);
    } catch (err) {
      if (runTimer) stopRun(els);
      alert('Chyba počas behu: ' + err.message);
      if (state) state.halted = true;
      updateUi(els);
      setButtons(els, false, false);
    }
  }

  function setButtons(els, active, running) {
    els.stepBtn.disabled = !active || running;
    els.runBtn.disabled = !active || running;
    els.stopBtn.disabled = !running;
    els.resetBtn.disabled = false;
  }

  function getRunDelay(els) {
    if (!els.speed) return 150;
    const value = Number(els.speed.value);
    return Number.isFinite(value) ? value : 150;
  }

  function stepOnce() {
    if (!state || state.halted) return;
    if (state.totalUnitTime >= MAX_STEPS) throw new Error('Prekročený limit krokov. Program môže mať nekonečný cyklus.');
    if (state.ip < 0 || state.ip >= state.instructions.length) {
      state.halted = true;
      return;
    }

    const currentIndex = state.ip;
    const instruction = state.instructions[currentIndex];
    state.lastExecutedIndex = currentIndex;
    state.lastExecutedInstruction = instruction;
    const { op, operand } = splitInstruction(instruction);
    const normalizedOp = normalizeOp(op);

    const logCost = instructionLogCost(normalizedOp, operand);
    state.lineStats[currentIndex].count += 1;
    state.lineStats[currentIndex].logTime += logCost;
    state.totalUnitTime += 1;
    state.totalLogTime += logCost;

    executeInstruction(normalizedOp, operand);
  }

  function executeInstruction(op, operand) {
    switch (op) {
      case 'READ': {
        const nextInput = state.inputQueue.length ? state.inputQueue.shift() : 0;
        const target = resolveWriteTarget(operand);
        writeRegister(target, nextInput);
        state.ip += 1;
        break;
      }
      case 'WRITE': {
        state.outputs.push(readOperandValue(operand));
        state.ip += 1;
        break;
      }
      case 'LOAD': {
        writeRegister(0, readOperandValue(operand));
        state.ip += 1;
        break;
      }
      case 'STORE': {
        const target = resolveWriteTarget(operand);
        writeRegister(target, readRegister(0));
        state.ip += 1;
        break;
      }
      case 'ADD': {
        writeRegister(0, readRegister(0) + readOperandValue(operand));
        state.ip += 1;
        break;
      }
      case 'SUB': {
        writeRegister(0, readRegister(0) - readOperandValue(operand));
        state.ip += 1;
        break;
      }
      case 'MUL': {
        writeRegister(0, readRegister(0) * readOperandValue(operand));
        state.ip += 1;
        break;
      }
      case 'DIV': {
        const divisor = readOperandValue(operand);
        if (divisor === 0) throw new Error('Delenie nulou.');
        writeRegister(0, Math.trunc(readRegister(0) / divisor));
        state.ip += 1;
        break;
      }
      case 'JUMP': {
        state.ip = getLabelTarget(operand);
        break;
      }
      case 'JZERO': {
        state.ip = readRegister(0) === 0 ? getLabelTarget(operand) : state.ip + 1;
        break;
      }
      case 'JGZERO':
      case 'JGTZ': {
        state.ip = readRegister(0) > 0 ? getLabelTarget(operand) : state.ip + 1;
        break;
      }
      case 'HALT': {
        state.halted = true;
        state.ip = state.instructions.length;
        break;
      }
      default:
        throw new Error('Neznáma inštrukcia: ' + op);
    }
  }

  function parseProgram(text) {
    const instructions = [];
    const labels = {};
    const labelsByIndex = {};
    const sourceLineNumbers = [];
    const rawLines = text.split(/\r?\n/);

    rawLines.forEach((raw, rawIndex) => {
      let line = raw.replace(/#.*/, '').trim();
      if (!line) return;

      while (true) {
        const match = line.match(/^([A-Za-z_]\w*):\s*(.*)$/);
        if (!match) break;
        const labelName = match[1];
        labels[labelName] = instructions.length;
        if (!labelsByIndex[instructions.length]) labelsByIndex[instructions.length] = [];
        labelsByIndex[instructions.length].push({
          name: labelName,
          sourceLine: rawIndex + 1
        });
        line = match[2].trim();
        if (!line) return;
      }

      instructions.push(line);
      sourceLineNumbers.push(rawIndex + 1);
    });

    return { instructions, labels, labelsByIndex, sourceLineNumbers };
  }

  function parseInputs(text) {
    if (!text.trim()) return [];
    return text.trim().split(/\s+/).map(value => {
      const n = Number(value);
      if (!Number.isFinite(n)) throw new Error('Vstup musí obsahovať iba čísla.');
      return Math.trunc(n);
    });
  }

  function splitInstruction(instruction) {
    const parts = instruction.trim().split(/\s+/);
    return { op: parts[0].toUpperCase(), operand: parts.slice(1).join(' ').trim() };
  }

  function normalizeOp(op) {
    const upper = op.toUpperCase();
    if (upper === 'MULT') return 'MUL';
    if (upper === 'JGZ' || upper === 'JGZERO') return 'JGZERO';
    if (upper === 'JGTZ') return 'JGTZ';
    return upper;
  }

  function getLabelTarget(label) {
    const clean = label.trim();
    if (!(clean in state.labels)) throw new Error('Neznáma návesť: ' + clean);
    return state.labels[clean];
  }

  function registerIndexFromOperand(operand) {
    const text = operand.trim();
    if (!/^\d+$/.test(text)) return null;
    return parseInt(text, 10);
  }

  function isConstantOperand(operand) {
    return operand.trim().startsWith('=');
  }

  function constantValue(operand) {
    return parseInt(operand.trim().slice(1), 10) || 0;
  }

  function readRegister(index) {
    const idx = Number(index) || 0;
    markRegisterUsed(idx);
    markRegisterAccess(idx);
    return state.registers[idx] || 0;
  }

  function writeRegister(index, value) {
    const idx = Number(index) || 0;
    const val = Math.trunc(Number(value) || 0);
    state.registers[idx] = val;
    markRegisterUsed(idx);
    markRegisterAccess(idx);
    updateMaxAbs(idx, val);
  }

  function markRegisterUsed(index) {
    state.usedRegisters[index] = true;
    if (!(index in state.maxAbs)) state.maxAbs[index] = Math.abs(state.registers[index] || 0);
  }

  function markRegisterAccess(index) {
    state.accessCounts[index] = (state.accessCounts[index] || 0) + 1;
  }

  function updateMaxAbs(index, value) {
    const abs = Math.abs(value);
    if (!(index in state.maxAbs) || abs > state.maxAbs[index]) state.maxAbs[index] = abs;
  }

  function readOperandValue(operand) {
    const op = operand.trim();
    if (!op) return 0;
    if (op.startsWith('=')) return constantValue(op);
    if (op.startsWith('*')) {
      const firstIndex = parseInt(op.slice(1), 10) || 0;
      const secondIndex = readRegister(firstIndex);
      return readRegister(secondIndex);
    }
    const index = parseInt(op, 10) || 0;
    return readRegister(index);
  }

  function resolveWriteTarget(operand) {
    const op = operand.trim();
    if (!op) throw new Error('Chýba operand cieľového registra.');
    if (op.startsWith('*')) {
      const pointerIndex = parseInt(op.slice(1), 10) || 0;
      return readRegister(pointerIndex);
    }
    if (op.startsWith('=')) throw new Error('Do konštanty sa nedá zapisovať: ' + op);
    return parseInt(op, 10) || 0;
  }

  function bitLength(value) {
    const abs = Math.abs(Math.trunc(Number(value) || 0));
    if (abs === 0) return 1;
    return Math.floor(Math.log2(abs)) + 1;
  }

  function operandTimeCost(operand) {
    const op = operand.trim();
    if (!op) return 0;
    if (op.startsWith('=')) {
      return bitLength(constantValue(op));
    }
    if (op.startsWith('*')) {
      const i = parseInt(op.slice(1), 10) || 0;
      const ci = readRegisterForCost(i);
      const cci = readRegisterForCost(ci);
      return bitLength(i) + bitLength(ci) + bitLength(cci);
    }
    const i = parseInt(op, 10) || 0;
    const ci = readRegisterForCost(i);
    return bitLength(i) + bitLength(ci);
  }

  // Cost reads should affect the mathematical price, not the register access counters.
  function readRegisterForCost(index) {
    return state.registers[index] || 0;
  }

  function instructionLogCost(op, operand) {
    const c0 = readRegisterForCost(0);
    switch (op) {
      case 'LOAD':
        return operandTimeCost(operand);
      case 'STORE': {
        const clean = operand.trim();
        if (clean.startsWith('*')) {
          const i = parseInt(clean.slice(1), 10) || 0;
          const ci = readRegisterForCost(i);
          return bitLength(c0) + bitLength(i) + bitLength(ci);
        }
        const i = parseInt(clean, 10) || 0;
        return bitLength(c0) + bitLength(i);
      }
      case 'ADD':
      case 'SUB':
      case 'MUL':
      case 'DIV':
        return bitLength(c0) + operandTimeCost(operand);
      case 'READ': {
        const input = state.inputQueue.length ? state.inputQueue[0] : 0;
        const clean = operand.trim();
        if (clean.startsWith('*')) {
          const i = parseInt(clean.slice(1), 10) || 0;
          const ci = readRegisterForCost(i);
          return bitLength(input) + bitLength(i) + bitLength(ci);
        }
        const i = parseInt(clean, 10) || 0;
        return bitLength(input) + bitLength(i);
      }
      case 'WRITE':
        return operandTimeCost(operand);
      case 'JUMP':
        return 1;
      case 'JZERO':
      case 'JGZERO':
      case 'JGTZ':
        return bitLength(c0);
      case 'HALT':
        return 1;
      default:
        return 1;
    }
  }

  function buildInputRegisterMap(instructions, variableNames) {
    const result = {};
    let inputIndex = 0;
    instructions.forEach(instruction => {
      const { op, operand } = splitInstruction(instruction);
      if (normalizeOp(op) === 'READ') {
        const reg = registerIndexFromOperand(operand);
        if (reg !== null && inputIndex < variableNames.length) {
          result[reg] = variableNames[inputIndex];
        }
        inputIndex += 1;
      }
    });
    return result;
  }

  function analyseLoops(instructions, labels, inputRegisterVars) {
    const loops = [];
    instructions.forEach((instruction, index) => {
      const { op, operand } = splitInstruction(instruction);
      const normalized = normalizeOp(op);
      if (!['JUMP', 'JZERO', 'JGZERO', 'JGTZ'].includes(normalized)) return;
      const target = labels[operand.trim()];
      if (target === undefined || target > index) return;

      if (normalized === 'JUMP') {
        const top = detectTopTestedLoop(instructions, target, index, inputRegisterVars);
        if (top) loops.push(top);
      } else {
        const reg = findDecrementedRegister(instructions, target, index) ?? findConditionRegisterBefore(instructions, index);
        const variable = variableForRegister(reg, inputRegisterVars);
        loops.push({
          type: 'bottom',
          start: target,
          end: index,
          var: variable,
          testRows: [],
          bodyRows: range(target, index)
        });
      }
    });

    // Remove duplicate loops with same start/end/type.
    const unique = [];
    const seen = new Set();
    loops.forEach(loop => {
      const key = `${loop.type}:${loop.start}:${loop.end}:${loop.var}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(loop);
      }
    });
    return unique.sort((a, b) => (b.end - b.start) - (a.end - a.start));
  }

  function detectTopTestedLoop(instructions, target, jumpIndex, inputRegisterVars) {
    // Pattern A:
    // top: LOAD r
    //      JZERO end
    //      body
    //      JUMP top
    const top0 = splitInstruction(instructions[target]);
    const top1 = instructions[target + 1] ? splitInstruction(instructions[target + 1]) : null;
    if (normalizeOp(top0.op) === 'LOAD' && top1 && ['JZERO', 'JGZERO', 'JGTZ'].includes(normalizeOp(top1.op))) {
      const reg = registerIndexFromOperand(top0.operand);
      const variable = variableForRegister(reg, inputRegisterVars);
      return {
        type: 'top',
        start: target,
        end: jumpIndex,
        var: variable,
        testRows: [target, target + 1],
        bodyRows: range(target + 2, jumpIndex)
      };
    }

    // Pattern B:
    // top: JZERO end
    //      body
    //      JUMP top
    const normalized = normalizeOp(top0.op);
    if (['JZERO', 'JGZERO', 'JGTZ'].includes(normalized)) {
      const reg = findDecrementedRegister(instructions, target, jumpIndex) ?? findConditionRegisterBefore(instructions, target);
      const variable = variableForRegister(reg, inputRegisterVars);
      return {
        type: 'top',
        start: target,
        end: jumpIndex,
        var: variable,
        testRows: [target],
        bodyRows: range(target + 1, jumpIndex)
      };
    }
    return null;
  }

  function findConditionRegisterBefore(instructions, condIndex) {
    for (let i = condIndex - 1; i >= Math.max(0, condIndex - 3); i--) {
      const { op, operand } = splitInstruction(instructions[i]);
      if (normalizeOp(op) === 'LOAD') {
        const reg = registerIndexFromOperand(operand);
        if (reg !== null) return reg;
      }
    }
    return null;
  }

  function findDecrementedRegister(instructions, start, end) {
    for (let i = end; i >= start; i--) {
      const current = splitInstruction(instructions[i]);
      if (normalizeOp(current.op) !== 'STORE') continue;
      const reg = registerIndexFromOperand(current.operand);
      if (reg === null) continue;

      // Look backwards for SUB =1 and LOAD reg before the STORE.
      let sawSubOne = false;
      for (let j = i - 1; j >= Math.max(start, i - 6); j--) {
        const instr = splitInstruction(instructions[j]);
        const op = normalizeOp(instr.op);
        if (op === 'SUB' && (instr.operand.trim() === '=1' || instr.operand.trim() === '1')) {
          sawSubOne = true;
        }
        if (sawSubOne && op === 'LOAD' && registerIndexFromOperand(instr.operand) === reg) {
          return reg;
        }
      }
    }
    return null;
  }

  function variableForRegister(reg, inputRegisterVars) {
    if (reg !== null && reg !== undefined && inputRegisterVars[reg]) return inputRegisterVars[reg];
    if (reg !== null && reg !== undefined) return `r${reg}`;
    return 'n';
  }

  function range(start, end) {
    const out = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }

  function symbolicLineFormulas() {
    if (!state || !state.loopModel) return state ? state.lineStats.map(x => String(x.count)) : [];
    return state.lineStats.map((line, index) => {
      if (line.count === 0) return '0';
      const factors = [];
      state.loopModel.forEach(loop => {
        if (index < loop.start || index > loop.end) return;
        if (loop.type === 'top' && loop.testRows.includes(index)) {
          factors.push(`${loop.var} + 1`);
        } else if (loop.bodyRows.includes(index)) {
          factors.push(loop.var);
        } else if (loop.type === 'bottom') {
          factors.push(loop.var);
        }
      });
      if (factors.length === 0) return String(line.count);
      return multiplyFactors(factors);
    });
  }

  function multiplyFactors(factors) {
    const cleaned = factors.filter(Boolean);
    if (cleaned.length === 0) return '1';
    return cleaned.map(f => f.includes('+') ? `(${f})` : f).join('·');
  }

  function sumSymbolic(formulas) {
    return groupedSumSymbolic(formulas);
  }

  function normalizeSymbolicTerm(term) {
    return String(term || '').trim().replace(/\s+/g, ' ');
  }

  function isNumericTerm(term) {
    return /^\d+$/.test(String(term || '').trim());
  }

  function renderCoefficientTerm(coefficient, term) {
    const clean = normalizeSymbolicTerm(term);
    if (!clean || clean === '0' || coefficient === 0) return '';
    if (clean === '1') return String(coefficient);
    if (coefficient === 1) return clean;
    const needsWrap = /\s\+\s/.test(clean);
    return `${coefficient}·${needsWrap ? `(${clean})` : clean}`;
  }

  function groupedSumSymbolic(terms) {
    const order = [];
    const counts = new Map();
    let numericSum = 0;

    (terms || []).forEach(term => {
      const clean = normalizeSymbolicTerm(term);
      if (!clean || clean === '0') return;
      if (isNumericTerm(clean)) {
        numericSum += Number(clean);
        return;
      }
      if (!counts.has(clean)) order.push(clean);
      counts.set(clean, (counts.get(clean) || 0) + 1);
    });

    const result = [];
    if (numericSum > 0) result.push(String(numericSum));
    order.forEach(term => {
      const rendered = renderCoefficientTerm(counts.get(term), term);
      if (rendered) result.push(rendered);
    });
    return result.length ? result.join(' + ') : '0';
  }

  function logSpace() {
    if (!state) return 0;
    return Object.keys(state.usedRegisters).reduce((sum, reg) => {
      const max = state.maxAbs[reg] ?? 0;
      return sum + bitLength(max);
    }, 0);
  }

  function bitLengthExpression(value) {
    const abs = Math.abs(Math.trunc(Number(value) || 0));
    if (abs === 0) return '1';
    return `⌊log₂(${abs})⌋ + 1`;
  }

  function priceExpressionForInstruction(instruction, lineIndex) {
    const { op, operand } = splitInstruction(instruction);
    const normalized = normalizeOp(op);
    const clean = operand.trim();

    switch (normalized) {
      case 'LOAD':
        return operandPriceExpression(clean);
      case 'STORE':
        if (clean.startsWith('*')) {
          const i = clean.slice(1);
          return `l(c(0)) + l(${i}) + l(c(${i}))`;
        }
        return `l(c(0)) + l(${clean || '0'})`;
      case 'ADD':
      case 'SUB':
      case 'MUL':
      case 'DIV':
        return `l(c(0)) + ${operandPriceExpression(clean)}`;
      case 'READ': {
        const inputSymbol = readInputSymbol(lineIndex, clean);
        if (clean.startsWith('*')) {
          const i = clean.slice(1);
          return `l(${inputSymbol}) + l(${i}) + l(c(${i}))`;
        }
        return `l(${inputSymbol}) + l(${clean || '0'})`;
      }
      case 'WRITE':
        return operandPriceExpression(clean);
      case 'JUMP':
        return '1';
      case 'JZERO':
      case 'JGZERO':
      case 'JGTZ':
        return 'l(c(0))';
      case 'HALT':
        return '1';
      default:
        return '1';
    }
  }

  function operandPriceExpression(operand) {
    const clean = operand.trim();
    if (!clean) return '0';
    if (clean.startsWith('=')) {
      return `l(${clean.slice(1)})`;
    }
    if (clean.startsWith('*')) {
      const i = clean.slice(1);
      return `l(${i}) + l(c(${i})) + l(c(c(${i})))`;
    }
    return `l(${clean}) + l(c(${clean}))`;
  }

  function readInputSymbol(lineIndex, operand) {
    const directReg = registerIndexFromOperand(operand);
    if (directReg !== null && state.inputRegisterVars && state.inputRegisterVars[directReg]) {
      return state.inputRegisterVars[directReg];
    }
    // Fallback: count previous READ instructions to infer n, m, p, ...
    let readOrder = 0;
    for (let i = 0; i <= lineIndex; i++) {
      const instr = state.instructions[i];
      if (!instr) continue;
      const parsed = splitInstruction(instr);
      if (normalizeOp(parsed.op) === 'READ') {
        if (i === lineIndex) return state.variableNames[readOrder] || 'input';
        readOrder++;
      }
    }
    return 'input';
  }

  function needsParentheses(expr) {
    return /\s\+\s|·/.test(expr);
  }

  function multiplyEquation(countFormula, priceFormula) {
    const c = String(countFormula || '0');
    const p = String(priceFormula || '1');
    if (c === '0') return '0';
    if (c === '1') return p;
    if (p === '1') return c;
    const left = needsParentheses(c) ? `(${c})` : c;
    const right = needsParentheses(p) ? `(${p})` : p;
    return `${left}·${right}`;
  }

  function variableSignature() {
    if (!state || !state.variableNames || state.variableNames.length === 0) return '';
    return `(${state.variableNames.join(', ')})`;
  }

  function unitTimeEquation(formulas) {
    return `T_j${variableSignature()} = ${sumSymbolic(formulas)}`;
  }

  function logTimeTerms(formulas) {
    if (!state) return [];
    return state.lineStats.map((line, idx) => {
      if (!line || line.count === 0) return '0';
      return multiplyEquation(formulas[idx], priceExpressionForInstruction(line.instruction, idx));
    }).filter(term => term && term !== '0');
  }

  function logTimeEquation(formulas) {
    const terms = logTimeTerms(formulas);
    return `T_l${variableSignature()} = ${groupedSumSymbolic(terms)}`;
  }

  function unitSpaceEquation(usedRegisterKeys) {
    const regs = usedRegisterKeys.map(reg => `R${reg}`).join(', ');
    return `P_j${variableSignature()} = |{${regs}}| = ${usedRegisterKeys.length}`;
  }

  function logSpaceEquation(usedRegisterKeys) {
    const terms = usedRegisterKeys.map(reg => {
      const idx = Number(reg);
      const max = state.maxAbs[idx] ?? 0;
      return bitLengthExpression(max);
    });
    return `P_l${variableSignature()} = ${groupedSumSymbolic(terms)} = ${logSpace()}`;
  }

  function updateUi(els) {
    if (!state) {
      els.output.textContent = '';
      els.unitTime.textContent = '–';
      els.logTime.textContent = '–';
      els.unitSpace.textContent = '–';
      els.logSpace.textContent = '–';
      els.formulaUnit.textContent = '–';
      els.formulaSpace.textContent = '–';
      els.lineTable.innerHTML = '';
      els.regTable.innerHTML = '';
      if (els.timeEquations) els.timeEquations.innerHTML = '';
      if (els.spaceEquations) els.spaceEquations.innerHTML = '';
      if (els.loopInfo) els.loopInfo.innerHTML = '';
      updateRamDebug(els);
      return;
    }

    const formulas = symbolicLineFormulas();
    const usedRegisterKeys = Object.keys(state.usedRegisters).sort((a, b) => Number(a) - Number(b));
    const unitEq = unitTimeEquation(formulas);
    const logEq = logTimeEquation(formulas);
    const unitSpaceEq = unitSpaceEquation(usedRegisterKeys);
    const logSpaceEq = logSpaceEquation(usedRegisterKeys);

    els.output.textContent = state.outputs.join(' ');
    els.unitTime.textContent = unitEq;
    els.logTime.textContent = logEq;
    els.unitSpace.textContent = unitSpaceEq;
    els.logSpace.textContent = logSpaceEq;
    els.formulaUnit.textContent = unitEq;
    els.formulaSpace.textContent = unitSpaceEq;

    els.lineTable.innerHTML = '';
    state.lineStats.forEach((line, idx) => {
      const labelsHere = state.labelsByIndex && state.labelsByIndex[idx] ? state.labelsByIndex[idx] : [];
      labelsHere.forEach(label => {
        const labelRow = document.createElement('tr');
        labelRow.className = 'label-row';
        labelRow.innerHTML = `
          <td>${label.sourceLine}</td>
          <td colspan="3"><strong>${escapeHtml(label.name)}:</strong></td>`;
        els.lineTable.appendChild(labelRow);
      });

      const logTerm = multiplyEquation(formulas[idx], priceExpressionForInstruction(line.instruction, idx));
      const tr = document.createElement('tr');
      if (idx === state.ip && !state.halted) tr.classList.add('current-row');
      if (idx === state.lastExecutedIndex) tr.classList.add('last-row');
      tr.innerHTML = `
        <td>${state.sourceLineNumbers[idx]}</td>
        <td>${escapeHtml(line.instruction)}</td>
        <td>${escapeHtml(formulas[idx])}</td>
        <td>${escapeHtml(logTerm)}</td>`;
      els.lineTable.appendChild(tr);
    });

    if (els.timeEquations) {
      els.timeEquations.innerHTML = `
        <p><strong>Finálna jednotková časová rovnica:</strong> ${escapeHtml(unitEq)}</p>
        <p><strong>Finálna logaritmická časová rovnica:</strong> ${escapeHtml(logEq)}</p>`;
    }

    els.regTable.innerHTML = '';
    usedRegisterKeys.forEach(reg => {
      const idx = Number(reg);
      const max = state.maxAbs[idx] ?? 0;
      const bits = bitLength(max);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>R${idx}</td>
        <td>${max}</td>
        <td>${bitLengthExpression(max)} = ${bits}</td>
        <td>${bitLengthExpression(max)}</td>`;
      els.regTable.appendChild(tr);
    });

    if (els.spaceEquations) {
      els.spaceEquations.innerHTML = `
        <p><strong>Jednotková priestorová rovnica:</strong> ${escapeHtml(unitSpaceEq)}</p>
        <p><strong>Logaritmická priestorová rovnica:</strong> ${escapeHtml(logSpaceEq)}</p>`;
    }

    // Interné informácie o detegovaných cykloch už nezobrazujeme.
    if (els.loopInfo) els.loopInfo.innerHTML = '';
    updateRamDebug(els);
  }

  function updateRamDebug(els) {
    if (!els.debugIp) return;
    if (!state) {
      els.debugIp.textContent = '–';
      els.debugLast.textContent = '–';
      els.debugR0.textContent = '–';
      els.debugRegisters.textContent = '';
      return;
    }
    const last = state.lastExecutedIndex !== null && state.lastExecutedIndex !== undefined
      ? `${state.sourceLineNumbers[state.lastExecutedIndex]}: ${state.lastExecutedInstruction}`
      : '–';
    els.debugIp.textContent = state.ip;
    els.debugLast.textContent = last;
    els.debugR0.textContent = state.registers ? (state.registers[0] ?? 0) : '–';
    const keys = state.registers ? Object.keys(state.registers).map(Number).sort((a,b)=>a-b) : [];
    els.debugRegisters.textContent = keys.map(k => `R${k} = ${state.registers[k]}`).join('\n');
  }

  function persist(els) {
    localStorage.setItem('tziv_ram_program', els.program.value);
    localStorage.setItem('tziv_ram_input', els.input.value);
    if (state) localStorage.setItem('tziv_ram_state', JSON.stringify(state));
    else localStorage.removeItem('tziv_ram_state');
  }

  function loadPersisted(els) {
    const program = localStorage.getItem('tziv_ram_program');
    const input = localStorage.getItem('tziv_ram_input');
    if (program !== null) els.program.value = program;
    if (input !== null) els.input.value = input;
    const saved = localStorage.getItem('tziv_ram_state');
    if (saved) {
      try {
        state = JSON.parse(saved);
        updateUi(els);
        setButtons(els, state && !state.halted, false);
        return;
      } catch (e) {
        state = null;
      }
    }
    updateUi(els);
    setButtons(els, false, false);
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
