import { useEffect, useReducer, useRef } from 'react';
import DesktopWindow from './DesktopWindow';
import { initialCalculatorState, pressCalculatorKey } from '../services/calculator';

const keys = ['C', '⌫', '±', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '%', '0', '.', '='];
const labels = { C: 'ล้างค่า', '⌫': 'ลบตัวเลข', '±': 'สลับเครื่องหมาย', '÷': 'หาร', '×': 'คูณ', '−': 'ลบ', '+': 'บวก', '%': 'เปอร์เซ็นต์', '=': 'เท่ากับ', '.': 'จุดทศนิยม' };
const keyboard = { '/': '÷', '*': '×', '-': '−', '+': '+', Enter: '=', '=': '=', Backspace: '⌫', Escape: 'C', '%': '%' };

export default function CalculatorWindow({ isOpen, isMinimized, isActive, onActivate, onMinimize, onClose }) {
  const [state, press] = useReducer(pressCalculatorKey, initialCalculatorState);
  const keypadRef = useRef(null);

  useEffect(() => {
    if (isOpen && !isMinimized && isActive) keypadRef.current?.focus();
  }, [isOpen, isMinimized, isActive]);

  const onKeyDown = (event) => {
    const key = keyboard[event.key] || (/^[0-9.]$/.test(event.key) ? event.key : null);
    if (!key) return;
    event.preventDefault();
    press(key);
  };

  return (
    <DesktopWindow title="CALCULATOR // เครื่องคิดเลข" windowLabel="Calculator" isOpen={isOpen} isMinimized={isMinimized} isActive={isActive} onActivate={onActivate} onMinimize={onMinimize} onClose={onClose} compact initialSize={{ width: 340, height: 460 }}>
      <div ref={keypadRef} tabIndex={0} onKeyDown={onKeyDown} aria-label="เครื่องคิดเลข" className="min-h-0 flex-1 overflow-y-auto bg-[#031522] p-4 font-sans outline-none">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-3 flex justify-between font-mono text-xs text-cyan-400"><span>CALCULATOR</span><span>STANDARD</span></div>
          <div className="mb-3 rounded border border-cyan-900 bg-slate-950 px-4 py-3 text-right">
            <div className="min-h-4 text-xs text-slate-500">{state.operator ? `${state.accumulator} ${state.operator}` : '\u00a0'}</div>
            <output aria-label="ผลลัพธ์" aria-live="polite" className="block min-h-10 overflow-x-auto whitespace-nowrap text-2xl font-semibold text-cyan-100">{state.display}</output>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {keys.map((key) => <button key={key} type="button" onClick={() => press(key)} aria-label={labels[key] || key} className={`h-11 rounded border text-lg font-semibold transition focus-visible:outline-2 focus-visible:outline-cyan-400 ${key === '=' ? 'border-cyan-500 bg-cyan-700 text-white hover:bg-cyan-600' : ['÷', '×', '−', '+'].includes(key) ? 'border-cyan-900 bg-cyan-950 text-cyan-200 hover:bg-cyan-900' : 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-700'}`}>{key}</button>)}
          </div>
        </div>
      </div>
    </DesktopWindow>
  );
}
