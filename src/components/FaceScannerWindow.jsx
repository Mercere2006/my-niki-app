import DesktopWindow from './DesktopWindow';
import CctvImage from './CctvImage';
import { cameraPerson, cardHolderProfile } from '../services/caseFiles';
import { dashcamPerson } from '../services/caseEnding';

export default function FaceScannerWindow({ isOpen, isMinimized, isActive, onActivate, onMinimize, onClose, evidence, stage, subject = 'suspect', onOpenHumanDB }) {
  const person = subject === 'dashcam' ? dashcamPerson : subject === 'victim' ? cardHolderProfile : cameraPerson;
  const status = {
    scanning: 'กำลังตรวจจับใบหน้า...',
    'low-quality': 'คุณภาพต่ำ // ภาพไม่ชัด',
    analyzing: 'NIKI กำลังวิเคราะห์...',
    complete: 'พบชื่อบุคคล',
  }[stage] || 'เตรียมสแกน';

  return (
    <DesktopWindow title={`เครื่องสแกนใบหน้า // ${subject === 'dashcam' ? 'กล้องหน้ารถ' : 'กล้อง 02'}`} windowLabel="Face Scanner" isOpen={isOpen} isMinimized={isMinimized} isActive={isActive} onActivate={onActivate} onMinimize={onMinimize} onClose={onClose} compact>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#020d18] font-sans text-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-900/70 bg-[#09283b] px-4 py-3">
          <div className="text-sm font-bold text-cyan-100">◉ เครื่องสแกนใบหน้า // {subject === 'dashcam' ? 'กล้องหน้ารถ' : 'กล้อง 02'}</div>
          <div role="status" aria-live="polite" className={`font-mono text-xs ${stage === 'low-quality' ? 'text-rose-400' : 'text-emerald-300'}`}>{status}</div>
        </div>
        {evidence?.ok && (
          <div className="mx-auto grid w-full max-w-6xl items-start gap-4 p-4 md:grid-cols-[minmax(0,1.4fr)_minmax(200px,1fr)]">
            <div>
              <div className="mb-2 text-xs text-cyan-300">{subject === 'dashcam' ? 'กล้องหน้ารถ // หลักฐานเพิ่มเติม' : subject === 'victim' ? 'CAM 02 // ผู้เสียชีวิต' : 'CAM 02 // บุคคลก่อนเกิดเหตุ'}</div>
              <div className="relative mx-auto max-w-[320px] overflow-hidden border border-cyan-800 bg-black">
                <CctvImage src={evidence.cctv.imageUrl} subject={subject} focused />
                <div className={`absolute left-[25%] top-[15%] h-[55%] w-[50%] border-2 ${stage === 'low-quality' ? 'border-rose-500 bg-rose-500/20' : 'border-emerald-400 bg-emerald-500/10'}`}>
                  {(stage === 'scanning' || stage === 'analyzing') && <div className="face-scan-sweep absolute inset-x-0 h-1 bg-emerald-300 shadow-[0_0_12px_#34d399]" />}
                  {stage === 'low-quality' && <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-rose-600 px-1 py-2 text-center font-mono text-xs font-bold text-black">ภาพไม่ชัด</div>}
                  {(stage === 'analyzing' || stage === 'complete') && <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full"><path d="M12 24 L44 16 L83 22 L70 47 L88 65 L52 87 L18 65 L31 46 Z M12 24 L70 47 L18 65 M44 16 L31 46 L52 87 M83 22 L31 46 L88 65 M31 46 L70 47 L52 87" fill="none" stroke="#4ade80" strokeWidth="1.2" /></svg>}
                </div>
                <div className="absolute left-2 top-2 font-mono text-[10px] text-white/80">● REC &nbsp; {subject === 'dashcam' ? 'DASHCAM' : 'CAM 02'}</div>
              </div>
              <div className="mt-2 font-mono text-[10px] text-slate-500">แหล่งภาพ: {subject === 'dashcam' ? 'กล้องหน้ารถ' : 'กล้อง 02'} &nbsp; // &nbsp; คุณภาพ: {subject === 'dashcam' ? 'ชัด' : subject === 'victim' ? 'พอมองเห็น' : 'ต่ำ'} &nbsp; // &nbsp; {subject === 'victim' || subject === 'dashcam' ? '22:14' : '22:13'}</div>
            </div>
            <div className="min-w-0 border border-cyan-900 bg-[#061927] p-3">
              {stage === 'scanning' && <p className="text-sm leading-relaxed text-emerald-300">กำลังค้นหาตำแหน่งใบหน้าในภาพจากกล้อง...</p>}
              {stage === 'low-quality' && <div className="space-y-3"><div className="font-mono text-sm font-bold text-rose-400">⚠ ภาพคุณภาพต่ำ</div><p className="text-xs leading-relaxed text-slate-300">ภาพจากกล้องมีความละเอียดต่ำเกินไป จึงยังระบุตัวบุคคลไม่ได้</p></div>}
              {stage === 'analyzing' && <div className="space-y-3"><div className="font-mono text-sm font-bold text-emerald-300">NIKI // กำลังวิเคราะห์</div><p className="text-xs leading-relaxed text-slate-300">กำลังจำลองการวิเคราะห์ภาพและค้นหาแฟ้มที่เกี่ยวข้อง...</p><div className="h-1 overflow-hidden bg-slate-800"><div className="h-full w-2/3 animate-pulse bg-emerald-400" /></div></div>}
              {stage === 'complete' && <div className="space-y-3" role="status"><div className="border-b border-cyan-900 pb-2 font-mono text-xs font-bold text-cyan-300">HUMANDB // ผลตรวจสอบเบื้องต้น</div>{subject === 'dashcam' ? <div className="w-full max-w-64 border border-cyan-900"><CctvImage src={person.imageUrl} subject="dashcam" focused /></div> : <img src={person.imageUrl} alt="ภาพบุคคลในแฟ้มคดีสมมติ" className="block h-auto w-full max-w-64 border border-cyan-900" />}<div className="text-base font-bold text-white">{person.name}</div><p className="text-xs leading-relaxed text-slate-300">{subject === 'victim' ? `ระบบพบชื่อ ${person.name} ค้นใน HumanDB แล้วส่งชื่อให้เจ้าหน้าที่` : `ผลตรวจเบื้องต้นชี้ว่าบุคคลในภาพอาจเป็น ${person.name} ค้นใน HumanDB แล้วส่งเบาะแสให้เจ้าหน้าที่ตรวจสอบต่อ`}</p><button type="button" onClick={onOpenHumanDB} className="rounded border border-cyan-500 bg-cyan-950 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-900">เปิด HumanDB</button></div>}
            </div>
          </div>
        )}
        <div className="mt-auto border-t border-cyan-950 px-4 py-2 text-xs text-slate-500">การวิเคราะห์และข้อมูลบุคคลเป็นส่วนจำลองของเรื่องราวในเกม</div>
      </div>
    </DesktopWindow>
  );
}
