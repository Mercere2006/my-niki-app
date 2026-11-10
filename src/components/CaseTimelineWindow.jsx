import DesktopWindow from './DesktopWindow';

export default function CaseTimelineWindow({ isOpen, isMinimized, isActive, onActivate, onMinimize, onClose, loading, result, onRetry, onOpenSource }) {
  return (
    <DesktopWindow title="CASE TIMELINE // ลำดับเหตุการณ์" windowLabel="Case Timeline" isOpen={isOpen} isMinimized={isMinimized} isActive={isActive} onActivate={onActivate} onMinimize={onMinimize} onClose={onClose} compact>
      <div className="flex min-h-0 flex-1 flex-col bg-[#031522] text-slate-200">
        <header className="border-b border-cyan-900 bg-[#09283b] px-5 py-3">
          <h2 className="text-sm font-bold text-cyan-100">CASE TIMELINE // ลำดับเหตุการณ์</h2>
          <p className="mt-1 text-xs text-cyan-300">NIKI เรียงเหตุการณ์จากเอกสารที่เปิดแล้ว</p>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? <p role="status" className="text-sm text-cyan-200">NIKI กำลังเรียงเหตุการณ์และตรวจแหล่งอ้างอิง...</p> : result?.ok ? (
            <ol aria-label="ลำดับเหตุการณ์คดี" className="space-y-4 border-l border-cyan-800 pl-5">
              {result.events.map((event, index) => <li key={`${event.file}-${event.time}-${index}`} className="relative rounded border border-slate-700 bg-slate-900/75 p-3">
                <span aria-hidden="true" className="absolute -left-[1.58rem] top-4 h-3 w-3 rounded-full border border-cyan-300 bg-cyan-700" />
                <div className="flex flex-wrap items-baseline gap-2"><time className="font-mono text-lg font-bold text-cyan-300">{event.time}</time><span className="text-xs text-slate-400">{event.day === 'next' ? 'เช้าวันถัดมา' : 'วันเกิดเหตุ'}</span></div>
                <p className="mt-1 text-sm leading-relaxed text-slate-100">{event.description}</p>
                <button type="button" onClick={() => onOpenSource(event.file)} className="mt-2 cursor-pointer text-left text-xs font-semibold text-cyan-300 underline underline-offset-2 hover:text-white">เปิดหลักฐาน: {event.file}</button>
                <blockquote className="mt-1 border-l border-slate-600 pl-2 text-xs leading-relaxed text-slate-400">“{event.quote}”</blockquote>
              </li>)}
            </ol>
          ) : <div role="status" className="space-y-3 text-sm text-slate-200"><p>{result?.error || 'เลือกคำขอจากสารวัตรเพื่อสร้างไทม์ไลน์'}</p><button type="button" onClick={onRetry} className="rounded border border-cyan-700 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-950">ลองสร้างอีกครั้ง</button></div>}
        </div>
        <footer className="flex items-center justify-between gap-3 border-t border-cyan-950 px-5 py-2 text-[11px] text-slate-400"><span>ตรวจสอบรายละเอียดกับหลักฐานต้นทางก่อนสรุป</span>{result?.ok && <button type="button" disabled={loading} onClick={onRetry} className="cursor-pointer text-cyan-300 underline disabled:opacity-50">สร้างใหม่</button>}</footer>
      </div>
    </DesktopWindow>
  );
}
