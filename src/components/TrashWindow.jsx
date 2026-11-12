import DesktopWindow from './DesktopWindow';
import { DESKTOP_FOLDER_DRAG, TRASH_FOLDER_DRAG } from '../services/trash';

export default function TrashWindow({ isOpen, isMinimized, isActive, onActivate, onMinimize, onClose, folders, onRestore, onDelete, onTrashFolder }) {
  return <DesktopWindow title="TRASH // ถังขยะ" windowLabel="Trash" isOpen={isOpen} isMinimized={isMinimized} isActive={isActive} onActivate={onActivate} onMinimize={onMinimize} onClose={onClose} compact initialSize={{ width: 620, height: 420 }}>
    <div onDragOver={(event) => { if (Array.from(event.dataTransfer.types).includes(DESKTOP_FOLDER_DRAG)) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } }} onDrop={(event) => { const id = event.dataTransfer.getData(DESKTOP_FOLDER_DRAG); if (id) { event.preventDefault(); event.stopPropagation(); onTrashFolder(id); } }} className="flex min-h-0 flex-1 flex-col bg-[#031522] text-slate-200">
      <div className="border-b border-cyan-900/70 bg-[#09283b] px-4 py-3"><h2 className="text-sm font-bold text-cyan-100">🗑️ ถังขยะ</h2><p className="mt-1 text-xs text-cyan-400">ลากรายการออกไปวางบน Desktop เพื่อกู้คืน</p></div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4" aria-label="รายการในถังขยะ">
        {folders.length === 0 ? <p className="py-12 text-center text-sm text-slate-400">ถังขยะว่างเปล่า</p> : folders.map((folder) => <div key={folder.id} draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData(TRASH_FOLDER_DRAG, folder.id); }} className="flex flex-wrap items-center gap-3 rounded border border-slate-700 bg-slate-900/80 px-3 py-3 text-sm">
          <span aria-hidden="true" className="text-2xl">{folder.icon}</span><span className="min-w-0 flex-1 cursor-grab break-all font-semibold text-slate-100" title="ลากไปวางบน Desktop">{folder.id}</span>
          <button type="button" onClick={() => onRestore(folder.id)} aria-label={`กู้คืน ${folder.id}`} className="rounded border border-cyan-700 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-950 focus-visible:outline-2 focus-visible:outline-cyan-400">กู้คืน</button>
          <button type="button" onClick={() => onDelete(folder.id)} aria-label={`ลบ ${folder.id} ถาวร`} className="rounded border border-rose-800 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-950 focus-visible:outline-2 focus-visible:outline-rose-400">ลบถาวร</button>
        </div>)}
      </div>
      <div className="border-t border-cyan-950 px-4 py-2 text-xs text-slate-400">{folders.length} รายการ</div>
    </div>
  </DesktopWindow>;
}
