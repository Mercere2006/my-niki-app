import { useState } from 'react';
import DesktopWindow from './DesktopWindow';

const NOTE_KEY = 'niki_desktop_notepad';

function loadNote() {
  try { return window.localStorage.getItem(NOTE_KEY) || ''; }
  catch { return ''; }
}

export default function NotepadWindow({ isOpen, isMinimized, isActive, onActivate, onMinimize, onClose }) {
  const [note, setNote] = useState(loadNote);
  const [saveFailed, setSaveFailed] = useState(false);
  const updateNote = (event) => {
    const value = event.target.value;
    setNote(value);
    try { window.localStorage.setItem(NOTE_KEY, value); setSaveFailed(false); }
    catch { setSaveFailed(true); }
  };

  return (
    <DesktopWindow title="NOTEPAD // สมุดบันทึก" windowLabel="Notepad" isOpen={isOpen} isMinimized={isMinimized} isActive={isActive} onActivate={onActivate} onMinimize={onMinimize} onClose={onClose} compact>
      <div className="flex min-h-0 flex-1 flex-col bg-[#031522] font-sans text-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-900/70 bg-[#09283b] px-4 py-3 text-xs"><span className="font-mono font-bold tracking-wider text-cyan-100">NOTEPAD // บันทึกการสืบสวน</span><span role="status" className={saveFailed ? 'text-rose-300' : 'text-slate-400'}>{saveFailed ? 'บันทึกในเบราว์เซอร์ไม่ได้' : 'บันทึกอัตโนมัติในเบราว์เซอร์'}</span></div>
        <textarea aria-label="ข้อความบันทึก" value={note} onChange={updateNote} placeholder="จดเบาะแสและรายละเอียดที่นี่..." spellCheck={false} className="min-h-0 w-full flex-1 resize-none bg-transparent p-4 text-base leading-relaxed text-slate-100 outline-none placeholder:text-slate-600" />
        <div className="border-t border-cyan-950 px-4 py-2 text-xs text-slate-500">{note.length} ตัวอักษร</div>
      </div>
    </DesktopWindow>
  );
}
