import DesktopWindow from './DesktopWindow';
import { caseFiles, formatFileCount } from '../services/caseFiles';
import CctvImage from './CctvImage';

export default function CaseFileWindow({
  isExplorerOpen,
  hasDownloadedCaseFiles,
  isExplorerMinimized,
  activeWindow,
  setActiveWindow,
  hideExplorer,
  selectedCaseFile,
  viewedCaseFiles,
  onOpenCaseFile,
  onBackToFiles,
  manualScanReady,
  onManualScan,
  onOpenPoliceQuestions,
  hasPoliceQuestions,
  hasTimelineResult,
  onOpenTimeline,
}) {
  return (
      <DesktopWindow
        title="FILE EXPLORER"
        windowLabel="File Explorer"
        isOpen={isExplorerOpen && hasDownloadedCaseFiles}
        isMinimized={isExplorerMinimized}
        isActive={activeWindow === 'explorer'}
        onActivate={() => setActiveWindow('explorer')}
        onMinimize={() => hideExplorer()}
        onClose={() => hideExplorer(true)}
        compact
      >
        <div className="flex flex-1 min-h-0 flex-col bg-slate-950 text-slate-200 font-sans">
          <div className="border-b border-slate-800 px-5 py-3 font-mono text-xs text-cyan-300">📁 ~/Desktop/Case_Files/</div>
          {selectedCaseFile ? (
            <>
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 px-5 py-3">
                <button type="button" onClick={onBackToFiles} className="rounded bg-slate-800 px-3 py-1.5 text-xs text-cyan-300 hover:bg-slate-700">← กลับไปยังไฟล์คดี</button>
                <span className="break-all text-sm font-semibold text-slate-100">{selectedCaseFile.name}</span>
              </div>
              <div className="flex-1 min-h-0 overflow-auto px-5 py-4 select-text">
                <p className="mb-3 text-sm leading-relaxed text-slate-300">{selectedCaseFile.description}</p>
                {manualScanReady && selectedCaseFile.kind === 'cctv' && <p className="mb-3 text-sm font-semibold text-cyan-300">คลิกบริเวณใบหน้าในภาพเพื่อเริ่มสแกน</p>}
                {selectedCaseFile.kind === 'cctv' ? <div className="relative mx-auto max-w-3xl overflow-hidden rounded border border-slate-700">
                  <CctvImage src={selectedCaseFile.imageUrl} />
                  {manualScanReady && selectedCaseFile.kind === 'cctv' && <button type="button" aria-label="สแกนใบหน้าในภาพด้วยตัวเอง" title="คลิกใบหน้าเพื่อสแกน" onClick={onManualScan} className="absolute left-[23%] top-[17%] h-[52%] w-[27%] cursor-crosshair rounded-sm border-2 border-dashed border-cyan-300/70 bg-cyan-400/5 transition hover:border-cyan-300 hover:bg-cyan-400/15 focus-visible:outline-2 focus-visible:outline-cyan-200" />}
                </div> : <article aria-label={`เนื้อหา ${selectedCaseFile.name}`} className="mx-auto max-w-3xl rounded border border-slate-700 bg-slate-900/80 p-5 text-sm leading-7 whitespace-pre-wrap text-slate-200">{selectedCaseFile.content}</article>}
              </div>
            </>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto p-5">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3" aria-label="ไฟล์หลักฐานในคดี">
                {caseFiles.map((file) => (
                  <button type="button" key={file.name} onClick={() => onOpenCaseFile(file.name)} className="flex min-w-0 flex-col items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-center hover:border-cyan-500 focus-visible:outline-2 focus-visible:outline-cyan-400">
                    <div className="flex h-20 w-full items-center justify-center overflow-hidden rounded bg-slate-950">{file.kind === 'cctv' ? <CctvImage src={file.imageUrl} /> : <span aria-hidden="true" className="text-4xl">{file.icon}</span>}</div>
                    <span className="w-full break-all text-xs font-semibold leading-relaxed text-slate-200">{file.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{file.type}{viewedCaseFiles.includes(file.name) ? ' · เปิดดูแล้ว' : ''}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 px-5 py-2 text-xs text-slate-400"><span aria-label="จำนวนไฟล์">{formatFileCount(caseFiles)} · เปิดดูแล้ว {viewedCaseFiles.length} ไฟล์</span><div className="flex flex-wrap gap-2">{hasTimelineResult && <button type="button" onClick={onOpenTimeline} className="rounded border border-cyan-700 px-3 py-1.5 font-semibold text-cyan-200 hover:bg-cyan-950 focus-visible:outline-2 focus-visible:outline-cyan-400">เปิดไทม์ไลน์</button>}{hasPoliceQuestions && <button type="button" onClick={onOpenPoliceQuestions} className="rounded border border-cyan-700 px-3 py-1.5 font-semibold text-cyan-200 hover:bg-cyan-950 focus-visible:outline-2 focus-visible:outline-cyan-400">ดูคำถามของสารวัตร</button>}</div></div>
        </div>
      </DesktopWindow>
  );
}
