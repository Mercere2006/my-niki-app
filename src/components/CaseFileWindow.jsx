import DesktopWindow from './DesktopWindow';
import { caseFiles, formatFileCount } from '../services/caseFiles';
import CctvImage from './CctvImage';

function EvidenceText({ content, evidence, selectedIds, onSelectEvidence }) {
  const matches = evidence.map((item) => ({ ...item, start: content.indexOf(item.quote) })).filter((item) => item.start >= 0).sort((a, b) => a.start - b.start);
  const parts = [];
  let position = 0;
  for (const item of matches) {
    if (item.start < position) continue;
    parts.push(content.slice(position, item.start));
    const selected = selectedIds.includes(item.id);
    parts.push(<button key={item.id} type="button" onClick={() => onSelectEvidence(item.id)} aria-label={`เลือกหลักฐาน: ${item.quote}`} aria-pressed={selected} className={`inline cursor-pointer whitespace-pre-wrap rounded border px-1 text-left leading-inherit transition focus-visible:outline-2 focus-visible:outline-cyan-300 ${selected ? 'border-emerald-400 bg-emerald-950/70 text-emerald-100' : 'border-cyan-500/80 bg-cyan-950/50 text-cyan-100 hover:bg-cyan-900/70'}`}>{item.quote}</button>);
    position = item.start + item.quote.length;
  }
  parts.push(content.slice(position));
  return parts;
}

export default function CaseFileWindow({
  files = caseFiles,
  folderName = 'Case_Files',
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
  manualEvidence = [],
  selectedEvidenceIds = [],
  onSelectEvidence = () => {},
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
          <div className="border-b border-slate-800 px-5 py-3 font-mono text-xs text-cyan-300">📁 ~/Desktop/{folderName}/</div>
          {selectedCaseFile ? (
            <>
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 px-5 py-3">
                <button type="button" onClick={onBackToFiles} className="rounded bg-slate-800 px-3 py-1.5 text-xs text-cyan-300 hover:bg-slate-700">← กลับไปยังไฟล์คดี</button>
                <span className="break-all text-sm font-semibold text-slate-100">{selectedCaseFile.name}</span>
              </div>
              <div className={`flex-1 min-h-0 px-5 py-4 select-text ${selectedCaseFile.kind === 'cctv' ? 'flex flex-col' : 'overflow-auto'}`}>
                {selectedCaseFile.kind === 'cctv' ? <div className="flex min-h-0 w-full flex-1 items-center justify-center" style={{ containerType: 'size' }}><div className="relative aspect-[30/17] overflow-hidden rounded border border-slate-700" style={{ width: 'min(100cqw, 176.470588cqh, 48rem)' }}>
                  <CctvImage src={selectedCaseFile.imageUrl} subject={selectedCaseFile.subject} className="!h-full" />
                  {manualScanReady && selectedCaseFile.kind === 'cctv' && <button type="button" aria-label="สแกนใบหน้าในภาพด้วยตัวเอง" title="คลิกใบหน้าเพื่อสแกน" onClick={onManualScan} className={`absolute ${selectedCaseFile.subject === 'dashcam' ? 'left-[39%] top-[7%] h-[23%] w-[11%]' : selectedCaseFile.subject === 'victim' ? 'left-[14%] top-[51%] h-[19%] w-[11%]' : 'left-[37%] top-[24%] h-[17%] w-[10%]'} cursor-crosshair rounded-sm border-2 border-dashed border-cyan-300/70 bg-cyan-400/5 transition hover:border-cyan-300 hover:bg-cyan-400/15 focus-visible:outline-2 focus-visible:outline-cyan-200`} />}
                </div></div> : <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col"><p className="mb-3 shrink-0 text-sm leading-relaxed text-slate-300">{selectedCaseFile.description}</p><article aria-label={`เนื้อหา ${selectedCaseFile.name}`} className="flex-1 rounded border border-slate-700 bg-slate-900/80 p-5 text-base leading-8 whitespace-pre-wrap text-slate-200 sm:p-6"><EvidenceText content={selectedCaseFile.content} evidence={manualEvidence.filter((item) => item.file === selectedCaseFile.name)} selectedIds={selectedEvidenceIds} onSelectEvidence={onSelectEvidence} /></article></div>}
              </div>
            </>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto p-5">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3" aria-label="ไฟล์หลักฐานในคดี">
                {files.map((file) => (
                  <button type="button" key={file.name} onClick={() => onOpenCaseFile(file.name)} className="flex min-w-0 flex-col items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-center hover:border-cyan-500 focus-visible:outline-2 focus-visible:outline-cyan-400">
                    <div className="flex h-20 w-full items-center justify-center overflow-hidden rounded bg-slate-950">{file.kind === 'cctv' ? <CctvImage src={file.imageUrl} subject={file.subject} /> : <span aria-hidden="true" className="text-4xl">{file.icon}</span>}</div>
                    <span className="w-full break-all text-xs font-semibold leading-relaxed text-slate-200">{file.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{file.type}{viewedCaseFiles.includes(file.name) ? ' · เปิดดูแล้ว' : ''}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 px-5 py-2 text-xs text-slate-400"><span aria-label="จำนวนไฟล์">{formatFileCount(files)} · เปิดดูแล้ว {files.filter((file) => viewedCaseFiles.includes(file.name)).length} ไฟล์</span><div className="flex flex-wrap gap-2">{hasTimelineResult && <button type="button" onClick={onOpenTimeline} className="rounded border border-cyan-700 px-3 py-1.5 font-semibold text-cyan-200 hover:bg-cyan-950 focus-visible:outline-2 focus-visible:outline-cyan-400">เปิดไทม์ไลน์</button>}{hasPoliceQuestions && <button type="button" onClick={onOpenPoliceQuestions} className="rounded border border-cyan-700 px-3 py-1.5 font-semibold text-cyan-200 hover:bg-cyan-950 focus-visible:outline-2 focus-visible:outline-cyan-400">ดูคำถามของสายสืบ</button>}</div></div>
        </div>
      </DesktopWindow>
  );
}
