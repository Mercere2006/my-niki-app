export const initialCalculatorState = {
  display: '0', accumulator: null, operator: null, waiting: false,
  lastOperator: null, lastOperand: null, error: false,
};

const operations = {
  '+': (a, b) => a + b,
  '−': (a, b) => a - b,
  '×': (a, b) => a * b,
  '÷': (a, b) => a / b,
};

function resultFor(left, operator, right) {
  if (operator === '÷' && right === 0) return null;
  const result = operations[operator](left, right);
  return Number.isFinite(result) ? String(Number(result.toPrecision(12))) : null;
}

export function pressCalculatorKey(state, key) {
  if (key === 'C') return { ...initialCalculatorState };
  if (/^\d$/.test(key) || key === '.') {
    const replacing = state.waiting || state.error;
    const base = replacing ? '0' : state.display;
    let display = base;
    if (key === '.' && !base.includes('.')) display = `${base}.`;
    else if (key !== '.' && base.length < 15) display = base === '0' ? key : `${base}${key}`;
    return { ...state, ...(state.error ? initialCalculatorState : {}), display, waiting: false, error: false, ...(replacing && !state.operator ? { lastOperator: null, lastOperand: null } : {}) };
  }
  if (state.error) return state;
  if (key === '⌫') {
    if (state.waiting) return state;
    const next = state.display.slice(0, -1);
    return { ...state, display: !next || next === '-' ? '0' : next };
  }
  if (key === '±') return { ...state, display: String(Number(state.display) * -1) };
  if (key === '%') return { ...state, display: String(Number((Number(state.display) / 100).toPrecision(12))) };
  if (operations[key]) {
    let display = state.display;
    if (state.operator && !state.waiting) {
      display = resultFor(state.accumulator, state.operator, Number(state.display));
      if (display === null) return { ...initialCalculatorState, display: 'ไม่สามารถหารด้วยศูนย์', error: true };
    }
    return { ...state, display, accumulator: Number(display), operator: key, waiting: true, lastOperator: null, lastOperand: null };
  }
  if (key === '=') {
    const operator = state.operator || state.lastOperator;
    if (!operator) return state;
    const left = state.operator ? state.accumulator : Number(state.display);
    const right = state.operator ? (state.waiting ? state.accumulator : Number(state.display)) : state.lastOperand;
    const display = resultFor(left, operator, right);
    if (display === null) return { ...initialCalculatorState, display: 'ไม่สามารถหารด้วยศูนย์', error: true };
    return { ...state, display, accumulator: null, operator: null, waiting: true, lastOperator: operator, lastOperand: right };
  }
  return state;
}
