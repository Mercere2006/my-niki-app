import { useRef, useState } from 'react';
import { moveWindow, resizeWindow } from '../services/windowSizing';

const investigationPlacements = {
  'case-files': { left: 32, top: 72 },
  'face-scanner': { left: 260, top: 120 },
  'human-db': { left: 440, top: 168 },
};

export default function DesktopWindow({ title, windowLabel, isOpen, isMinimized, isActive, onActivate, onMinimize, onClose, children, decoration, compact = false, initialSize = null, initialPlacement = 'left' }) {
  const [maximized, setMaximized] = useState(false);
  const [size, setSize] = useState(initialSize);
  const [position, setPosition] = useState(null);
  const windowRef = useRef(null);
  const moveStart = useRef(null);
  const resizeStart = useRef(null);
  const investigationPlacement = investigationPlacements[initialPlacement];

  const updatePosition = (rect, deltaX, deltaY) => {
    setSize({ width: rect.width, height: rect.height });
    setPosition(moveWindow({ rect, deltaX, deltaY, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight }));
  };

  const updateSize = (rect, deltaX, deltaY) => setSize(resizeWindow({
    width: rect.width, height: rect.height, deltaX, deltaY,
    maxWidth: Math.max(1, window.innerWidth - rect.left - 12),
    maxHeight: Math.max(1, window.innerHeight - rect.top - 52),
  }));

  const startPointer = (event, ref) => {
    if (event.button !== 0 || (ref === moveStart && (maximized || event.target.closest('button')))) return;
    event.preventDefault();
    onActivate();
    ref.current = { rect: windowRef.current.getBoundingClientRect(), x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const movePointer = (event, ref, update) => {
    const start = ref.current;
    if (start) update(start.rect, event.clientX - start.x, event.clientY - start.y);
  };

  const handleKeys = (event, update) => {
    if (maximized || event.target.closest('button')) return;
    const direction = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }[event.key];
    if (!direction) return;
    event.preventDefault();
    update(windowRef.current.getBoundingClientRect(), ...direction);
  };

  if (!isOpen || isMinimized) return null;

  return (
    <section
      ref={windowRef}
      data-desktop-window="true"
      aria-label={windowLabel}
      onPointerDown={onActivate}
      style={{
        zIndex: isActive ? 42 : 40,
        ...(maximized && { right: 'calc(var(--call-sidebar-space, 0px) + 0.5rem)' }),
        ...(!maximized && size && { width: size.width, height: size.height }),
        ...(!maximized && !position && initialPlacement === 'right' && { left: 'auto', right: 16, top: 48 }),
        ...(!maximized && !position && investigationPlacement && {
          left: `min(${investigationPlacement.left}px, max(16px, calc(100vw - var(--call-sidebar-space, 0px) - min(720px, max(0px, calc(100vw - var(--call-sidebar-space, 0px) - 32px))) - 16px)))`,
          top: investigationPlacement.top,
          ...(!size && { width: 'min(720px, max(0px, calc(100vw - var(--call-sidebar-space, 0px) - 32px)))', height: `min(480px, max(0px, calc(100dvh - ${investigationPlacement.top + 56}px)))` }),
        }),
        ...(!maximized && position && { left: position.left, top: position.top }),
      }}
      className={`absolute flex flex-col shadow-[0_0_35px_rgba(0,0,0,0.9)] border border-slate-700/80 rounded-xl overflow-hidden bg-slate-950/95 backdrop-blur-lg ${
        maximized ? 'inset-x-2 top-10 bottom-12' : `left-6 top-12 md:left-16 md:top-14 lg:left-24 max-w-[calc(100%-3rem)] md:max-w-[calc(100%-5rem)] lg:max-w-[calc(100%-7rem)] max-h-[calc(100%-7rem)] ${size ? '' : compact ? 'w-[min(720px,calc(100%-3rem))] h-[min(480px,calc(100%-7rem))] md:left-28 md:top-24 lg:left-40' : 'right-6 bottom-14 md:right-16 lg:right-24'}`
      }`}
    >
      {decoration}
      <div
        onPointerDown={(event) => startPointer(event, moveStart)}
        onPointerMove={(event) => movePointer(event, moveStart, updatePosition)}
        onPointerUp={() => { moveStart.current = null; }}
        onPointerCancel={() => { moveStart.current = null; }}
        onLostPointerCapture={() => { moveStart.current = null; }}
        onKeyDown={(event) => handleKeys(event, updatePosition)}
        className={`h-9 bg-slate-900 border-b border-slate-800 flex items-center justify-between pl-3 text-xs select-none shrink-0 touch-none ${maximized ? '' : 'cursor-move'}`}
      >
        <span role="button" tabIndex={maximized ? -1 : 0} aria-label={`ย้ายหน้าต่าง ${windowLabel} ด้วยปุ่มลูกศร`} title="ลากเพื่อย้ายหน้าต่าง" className="min-w-0 truncate text-slate-300 font-mono font-semibold focus-visible:outline-2 focus-visible:outline-cyan-400">{title}</span>
        <div className="flex h-full items-center shrink-0">
          <button type="button" onClick={onMinimize} className="w-11 h-full hover:bg-slate-700 text-slate-200 transition cursor-pointer text-base" title={`ย่อหน้าต่าง ${windowLabel}`} aria-label={`ย่อหน้าต่าง ${windowLabel}`}>−</button>
          <button type="button" onClick={() => setMaximized((value) => !value)} className="w-11 h-full hover:bg-slate-700 text-slate-200 transition cursor-pointer text-sm" title={`${maximized ? 'คืนขนาด' : 'ขยาย'}หน้าต่าง ${windowLabel}`} aria-label={`${maximized ? 'คืนขนาด' : 'ขยาย'}หน้าต่าง ${windowLabel}`}>{maximized ? '❐' : '□'}</button>
          <button type="button" onClick={onClose} className="w-11 h-full hover:bg-rose-600 text-slate-200 transition cursor-pointer text-sm" title={`ปิดหน้าต่าง ${windowLabel}`} aria-label={`ปิดหน้าต่าง ${windowLabel}`}>✕</button>
        </div>
      </div>
      {children}
      {!maximized && (
        <button
          type="button"
          aria-label={`ปรับขนาดหน้าต่าง ${windowLabel}`}
          title="ลากเพื่อปรับขนาดหน้าต่าง"
          onPointerDown={(event) => startPointer(event, resizeStart)}
          onPointerMove={(event) => movePointer(event, resizeStart, updateSize)}
          onPointerUp={() => { resizeStart.current = null; }}
          onPointerCancel={() => { resizeStart.current = null; }}
          onLostPointerCapture={() => { resizeStart.current = null; }}
          onKeyDown={(event) => {
            const direction = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }[event.key];
            if (!direction) return;
            event.preventDefault();
            updateSize(windowRef.current.getBoundingClientRect(), ...direction);
          }}
          className="absolute bottom-0 right-0 z-10 h-6 w-6 cursor-nwse-resize touch-none text-slate-400 hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-cyan-400"
        >
          <span aria-hidden="true" className="absolute bottom-0.5 right-1 text-base leading-none">◢</span>
        </button>
      )}
    </section>
  );
}
