import { DESKTOP_FOLDER_DRAG } from '../services/trash';

export default function DesktopIcons({ openCaseFiles, openDocuments, openDashcam, openTrash, onTrashFolder, trashCount, hasDownloadedCaseFiles, documentsReleased, dashcamReleased }) {
  const folders = [
    { id: 'Case_Files', icon: '📂', visible: hasDownloadedCaseFiles, open: openCaseFiles },
    { id: 'Case_Documents', icon: '📁', visible: documentsReleased, open: openDocuments },
    { id: 'Dashcam_Files', icon: '📁', visible: dashcamReleased, open: openDashcam },
  ];
  return (
    <div className="absolute left-4 top-12 z-10 flex flex-col gap-2 text-slate-200">
      <button type="button" onClick={openTrash} aria-label="เปิดถังขยะ" title="เปิดถังขยะ หรือลากโฟลเดอร์มาทิ้ง" onDragOver={(event) => { if (Array.from(event.dataTransfer.types).includes(DESKTOP_FOLDER_DRAG)) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } }} onDrop={(event) => { const id = event.dataTransfer.getData(DESKTOP_FOLDER_DRAG); if (!id) return; event.preventDefault(); event.stopPropagation(); onTrashFolder(id); }} className="flex w-20 cursor-pointer flex-col items-center gap-1 rounded-lg p-2 text-center transition hover:bg-slate-900/60 focus-visible:outline-2 focus-visible:outline-cyan-400">
        <svg aria-hidden="true" viewBox="0 0 48 56" className="h-12 w-12" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 10h30l-2.4 39H11.4L9 10Z" fill="#eefbff" stroke="#8acddf" strokeWidth="1.5" />
          <path d="M11 13h3l1.5 33h-2L11 13Zm22 0h3l-2.5 33h-2L33 13Z" fill="#c5e8f0" />
          <path d="M7.5 8.5h33v4h-33zM19 5h10v3H19z" fill="#f5fdff" stroke="#8acddf" strokeWidth="1.2" strokeLinejoin="round" />
          <g fill="#0097d2">
            <path id="trash-arrow" d="M23.7 19.1c4 0 7 1.9 8.7 5l2.3-1-1.1 6-5.5-2.7 1.8-.8a6.6 6.6 0 0 0-6.2-3.9z" />
            <use href="#trash-arrow" transform="rotate(120 24 30.5)" />
            <use href="#trash-arrow" transform="rotate(240 24 30.5)" />
          </g>
          {trashCount > 0 && <path d="M15 44h18" stroke="#83bccc" strokeWidth="1.2" />}
        </svg><span className="text-xs font-medium text-white [text-shadow:0_1px_3px_#000,0_1px_2px_#000]">Trash</span>
      </button>
      {folders.filter((folder) => folder.visible).map((folder) => <div key={folder.id} className="group relative w-20">
        <button type="button" draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData(DESKTOP_FOLDER_DRAG, folder.id); }} onKeyDown={(event) => { if (event.key === 'Delete') { event.preventDefault(); onTrashFolder(folder.id); } }} onClick={folder.open} aria-label={`เปิด ${folder.id}`} title="ลากไปที่ Trash หรือกด Delete เพื่อย้ายลงถังขยะ" className="flex w-full cursor-pointer flex-col items-center gap-1 rounded-lg p-2 text-center transition hover:bg-slate-900/60 focus-visible:outline-2 focus-visible:outline-cyan-400">
          <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/90 text-2xl">{folder.icon}</span><span className="break-all font-mono text-xs font-medium text-amber-300">{folder.id}</span>
        </button>
        <button type="button" onClick={() => onTrashFolder(folder.id)} aria-label={`ย้าย ${folder.id} ไปถังขยะ`} title="ย้ายไปถังขยะ" className="absolute right-0 top-0 rounded border border-slate-600 bg-slate-900 px-1 text-xs text-slate-300 opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:outline-2 focus-visible:outline-cyan-400">✕</button>
      </div>)}
    </div>
  );
}
