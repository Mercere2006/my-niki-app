export default function DesktopIcons({ openExplorer, hasDownloadedCaseFiles }) {
  if (!hasDownloadedCaseFiles) return null;
  return (
    <div className="absolute left-4 top-12 z-10 text-slate-200">
      <button type="button" onClick={openExplorer} aria-label="เปิด Case_Files" title="โฟลเดอร์ Case_Files (ดาวน์โหลดเสร็จแล้ว)" className="flex w-20 cursor-pointer flex-col items-center gap-1 rounded-lg p-2 text-center transition hover:bg-slate-900/60">
        <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/90 text-2xl">📂</span>
        <span className="font-mono text-xs font-medium text-amber-300">Case_Files</span>
      </button>
    </div>
  );
}
