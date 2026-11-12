import { useEffect, useRef, useState } from 'react';
import { getStartGroups } from '../services/startMenu';

export default function DesktopTaskbar({
  isTerminalOpen,
  isTerminalMinimized,
  isExplorerOpen,
  isExplorerMinimized,
  activeWindow,
  openTerminal,
  openExplorer,
  openCaseFiles,
  openDocuments,
  openDashcam,
  openTrash,
  hideTrash,
  isTrashOpen,
  isTrashMinimized,
  hideTerminal,
  hideExplorer,
  isScannerOpen,
  isScannerMinimized,
  openScanner,
  hideScanner,
  utilityWindows,
  openUtility,
  hideUtility,
  hasDownloadedCaseFiles,
  documentsReleased,
  dashcamReleased,
  onShutdown,
  currentDate,
  currentTime,
  isMuted,
  setIsMuted,
}) {
  const [startOpen, setStartOpen] = useState(false);
  const startRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!startOpen) return;
    const closeOnOutside = (event) => {
      if (!menuRef.current?.contains(event.target) && !startRef.current?.contains(event.target)) setStartOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setStartOpen(false);
        startRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [startOpen]);

  const launch = (id) => {
    setStartOpen(false);
    if (id === 'terminal') openTerminal();
    else if (id === 'case-files') openCaseFiles();
    else if (id === 'case-documents') openDocuments();
    else if (id === 'dashcam-files') openDashcam();
    else if (id === 'trash') openTrash();
    else openUtility(id);
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-50">
      {startOpen && <section ref={menuRef} id="desktop-start-menu" aria-label="เมนู Start" className="absolute bottom-12 left-2 flex max-h-[calc(100vh-4rem)] w-[min(23rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-950/95 text-slate-200 shadow-2xl backdrop-blur-lg">
        <div className="border-b border-slate-800 px-4 py-3"><div className="text-sm font-bold text-cyan-200">แอปพลิเคชัน</div><div className="mt-0.5 font-mono text-[10px] text-slate-500">NIKI OS // START</div></div>
        <div className="space-y-4 overflow-y-auto px-3 py-3" aria-label="รายชื่อแอปพลิเคชัน">
          {getStartGroups(hasDownloadedCaseFiles, documentsReleased, dashcamReleased).map((group) => <section key={group.label} aria-label={group.label}>
            <h2 className="px-1 pb-1 font-mono text-xs font-bold uppercase tracking-wide text-cyan-300">{group.label}</h2>
            <div className="grid grid-cols-3 gap-1">{group.items.map((app) => <button key={app.id} type="button" onClick={() => launch(app.id)} className="flex min-w-0 cursor-pointer flex-col items-center gap-1.5 rounded px-1 py-2 text-center hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-cyan-400"><span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 font-mono text-xl text-cyan-300">{app.icon}</span><span className="max-w-full truncate text-xs text-slate-200">{app.label}</span></button>)}</div>
          </section>)}
        </div>
        <div className="border-t border-slate-800 p-2"><button type="button" onClick={() => { setStartOpen(false); onShutdown(); }} className="flex w-full cursor-pointer items-center gap-3 rounded px-3 py-2 text-left text-sm text-rose-300 hover:bg-rose-950/60 focus-visible:outline-2 focus-visible:outline-rose-400"><span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded border border-rose-900/80 bg-rose-950/40 text-lg">⏻</span><span>ปิดเครื่อง</span></button></div>
      </section>}
      <div role="toolbar" aria-label="แถบงาน" className="flex h-11 items-center gap-2 border-t border-slate-700 bg-slate-900/95 px-3 shadow-lg">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
        <button ref={startRef} type="button" aria-label="Start" aria-haspopup="true" aria-expanded={startOpen} aria-controls="desktop-start-menu" onClick={() => setStartOpen((value) => !value)} className={`flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded border px-3 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-cyan-400 ${startOpen ? 'border-cyan-500 bg-cyan-950 text-cyan-100' : 'border-slate-700 bg-slate-800 text-cyan-200 hover:bg-slate-700'}`}><span aria-hidden="true" className="text-base">❖</span> Start</button>
        {isTerminalOpen && (
          <button type="button" onClick={() => {
            if (isTerminalMinimized || activeWindow !== 'terminal') openTerminal();
            else hideTerminal();
          }} aria-label={`${isTerminalMinimized || activeWindow !== 'terminal' ? 'เรียกคืน' : 'ย่อ'}หน้าต่าง Terminal`} className={`flex h-8 max-w-48 items-center gap-2 rounded px-3 text-xs font-semibold transition cursor-pointer border ${!isTerminalMinimized && activeWindow === 'terminal' ? 'bg-cyan-950 text-cyan-200 border-cyan-600/60' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}>
            <span aria-hidden="true">&gt;_</span><span>Terminal</span>
          </button>
        )}
        {isExplorerOpen && (
          <button type="button" onClick={() => {
            if (isExplorerMinimized || activeWindow !== 'explorer') openExplorer();
            else hideExplorer();
          }} aria-label={`${isExplorerMinimized || activeWindow !== 'explorer' ? 'เรียกคืน' : 'ย่อ'}หน้าต่าง File Explorer`} className={`flex h-8 max-w-48 items-center gap-2 rounded px-3 text-xs font-semibold transition cursor-pointer border ${!isExplorerMinimized && activeWindow === 'explorer' ? 'bg-cyan-950 text-cyan-200 border-cyan-600/60' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}>
            <span aria-hidden="true">📁</span><span>File Explorer</span>
          </button>
        )}
        {isScannerOpen && (
          <button type="button" onClick={() => {
            if (isScannerMinimized || activeWindow !== 'scanner') openScanner();
            else hideScanner();
          }} aria-label={`${isScannerMinimized || activeWindow !== 'scanner' ? 'เรียกคืน' : 'ย่อ'}หน้าต่าง Face Scanner`} className={`flex h-8 max-w-48 items-center gap-2 rounded px-3 text-xs font-semibold transition cursor-pointer border ${!isScannerMinimized && activeWindow === 'scanner' ? 'bg-cyan-950 text-cyan-200 border-cyan-600/60' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}>
            <span aria-hidden="true">◉</span><span>Face Scanner</span>
          </button>
        )}
        {isTrashOpen && <button type="button" onClick={() => isTrashMinimized || activeWindow !== 'trash' ? openTrash() : hideTrash()} aria-label={`${isTrashMinimized || activeWindow !== 'trash' ? 'เรียกคืน' : 'ย่อ'}หน้าต่าง Trash`} className={`flex h-8 max-w-48 shrink-0 cursor-pointer items-center gap-2 rounded border px-3 text-xs font-semibold transition ${!isTrashMinimized && activeWindow === 'trash' ? 'border-cyan-600/60 bg-cyan-950 text-cyan-200' : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'}`}><span aria-hidden="true">🗑️</span>Trash</button>}
        {[{ kind: 'human', name: 'HumanDB', icon: '🪪' }, { kind: 'calculator', name: 'Calculator', icon: '🧮' }, { kind: 'notepad', name: 'Notepad', icon: '📝' }, { kind: 'timeline', name: 'Case Timeline', icon: '◷' }].map(({ kind, name, icon }) => {
          const app = utilityWindows[kind];
          if (!app.open) return null;
          const shouldRestore = app.minimized || activeWindow !== kind;
          return <button key={kind} type="button" onClick={() => shouldRestore ? openUtility(kind) : hideUtility(kind)} aria-label={`${shouldRestore ? 'เรียกคืน' : 'ย่อ'}หน้าต่าง ${name}`} className={`flex h-8 max-w-48 shrink-0 cursor-pointer items-center gap-2 rounded border px-3 text-xs font-semibold transition ${!shouldRestore ? 'border-cyan-600/60 bg-cyan-950 text-cyan-200' : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'}`}><span aria-hidden="true">{icon}</span>{name}</button>;
        })}
        </div>
        <div aria-label="สถานะระบบ วันที่และเวลา" className="flex shrink-0 items-center gap-2 whitespace-nowrap border-l border-slate-700 pl-2 font-mono text-[11px] font-semibold text-slate-300">
          <button type="button" onClick={() => setIsMuted(!isMuted)} aria-label={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'} title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'} className="cursor-pointer hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-cyan-400">{isMuted ? '🔇' : '🔊'}</button>
          <span className="max-sm:hidden">100% 🔋</span>
          <span className="text-cyan-400 max-sm:hidden">Shoom</span>
          <span className="max-sm:hidden">{currentDate}</span>
          <span className="font-bold text-cyan-400">{currentTime}</span>
        </div>
      </div>
    </div>
  );
}
