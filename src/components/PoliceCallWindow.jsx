import { useEffect, useRef } from 'react';
import { callChoices, callbackChoice, missedCallbackChoice, isOfficerOffline, stripPolicePrefix } from '../services/policeCall';
import { REPORT_SUSPECT_REQUEST, REPORT_ADDRESS_REQUEST } from '../services/reportConversation';

export default function PoliceCallWindow({ isOpen, isMinimized, isActive, onActivate, onMinimize, phase, callEndReason, messages, typingText, isTyping, onAnswer, onDecline, onChoice, onCallbackChoice, attachment, uploadProgress, onOpenPhoto, reportStage, onSelectReportRequest, victimReplyReady, onSendVictimReply, isFollowupCall, onOpenDocuments, documentsAttachment, documentsUploadProgress, currentQuestion, questionPhase, manualProgress, guidedAnswer, answerInFile, onSendGuidedAnswer, onSelectQuestion, dashcamAttachment, dashcamUploadProgress, onOpenDashcam, endingStage, onSendDashcamName, isThinking }) {
  const scrollRef = useRef(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, typingText, phase]);
  const ringing = phase === 'ringing';
  const declined = phase === 'declined';
  const closed = ['departed', 'apology', 'complete'].includes(endingStage) || isOfficerOffline(reportStage, isFollowupCall, phase);
  if (!isOpen || isMinimized) return null;
  return (
    <aside aria-label="สายของสายสืบภัทรวัฒน์ อนันต์กุล" onPointerDown={onActivate} className={`absolute bottom-11 right-0 top-8 z-[44] flex w-[var(--call-sidebar-width)] flex-col overflow-hidden border-l border-cyan-700/70 bg-[#031522] shadow-[-8px_0_25px_rgba(0,0,0,0.35)] ${isActive ? '' : 'max-sm:hidden'}`}>
      <div className="flex min-h-0 flex-1 flex-col bg-[#031522] text-slate-200">
        <div className="flex shrink-0 items-center justify-between border-b border-cyan-800 bg-[#09283b] px-4 py-2.5 text-sm font-bold text-cyan-100">
          <span>☎ สายของสายสืบภัทรวัฒน์ อนันต์กุล</span>
          <button type="button" onClick={onMinimize} aria-label="ซ่อนสายของสายสืบภัทรวัฒน์ อนันต์กุล" title="ซ่อนสายสนทนา" className="rounded px-2 py-1 text-lg leading-none text-cyan-200 hover:bg-cyan-900 focus-visible:outline-2 focus-visible:outline-cyan-300">−</button>
        </div>
        <div className="flex gap-3 border-b border-cyan-950 p-4">
          <img src="/cases/record-room/inspector_phat.png" alt="ภาพสายสืบภัทรวัฒน์ อนันต์กุล" className={`h-24 w-24 shrink-0 border border-cyan-900 object-cover ${closed ? 'grayscale' : ''}`} />
          <div className="min-w-0 flex-1"><div className="text-base font-bold text-white">ภัทรวัฒน์ อนันต์กุล</div><div className="mt-1 text-xs text-cyan-300">เจ้าหน้าที่สืบสวน</div><dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs"><dt className="text-slate-400">สถานะ</dt><dd className={closed ? 'text-rose-400' : 'text-emerald-300'}>{closed ? 'ออฟไลน์' : 'ออนไลน์'}</dd><dt className="text-slate-400">ช่องทาง</dt><dd>การสื่อสารปลอดภัย</dd></dl></div>
        </div>
        {ringing ? <div className="shrink-0">
          <p className="bg-[#062538] px-4 py-3 text-center text-sm font-semibold text-cyan-300">สายเรียกเข้า...</p>
          <div className="grid grid-cols-2 text-sm font-bold">
            <button type="button" onClick={onAnswer} className="flex items-center justify-center gap-2 bg-emerald-950 px-4 py-3 text-emerald-400 hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-emerald-300"><span aria-hidden="true">☎</span>รับสาย</button>
            <button type="button" onClick={onDecline} className="flex items-center justify-center gap-2 bg-rose-950 px-4 py-3 text-rose-400 hover:bg-rose-900 focus-visible:outline-2 focus-visible:outline-rose-300"><span aria-hidden="true">☎</span>วางสาย</button>
          </div>
        </div> : declined ? <div className="space-y-3 px-4 py-5 text-center text-sm text-slate-300"><p>{callEndReason === 'missed' ? 'ไม่ได้รับสาย' : 'วางสายแล้ว'}</p><button type="button" onClick={onAnswer} className="rounded border border-cyan-700 bg-cyan-950 px-4 py-2 font-semibold text-cyan-200 hover:bg-cyan-900">โทรกลับหาสายสืบ</button></div> : <>
          <div ref={scrollRef} role="log" aria-label="บทสนทนาสายสืบภัทรวัฒน์ อนันต์กุล" aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => {
              if (message.speaker === 'dashcam') {
                const busy = ['uploading', 'checking', 'scanning', 'cleaning'].includes(dashcamAttachment.stage);
                const label = { uploading: `กำลังอัปโหลด ${dashcamUploadProgress}%`, checking: 'กำลังรับไฟล์...', scanning: 'NIKI กำลังตรวจไฟล์...', cleaning: 'NIKI กำลังล้างไวรัส...', ready: 'คลิกเพื่อรับและตรวจไฟล์', error: 'รับไฟล์ไม่สำเร็จ · คลิกเพื่อลองอีกครั้ง', complete: 'ตรวจไฟล์แล้ว · คลิกเพื่อเปิดโฟลเดอร์' }[dashcamAttachment.stage];
                return <div key={index} className="w-full max-w-64 rounded border border-cyan-700 bg-cyan-950/50 p-3 text-sm text-cyan-100"><button type="button" disabled={busy} onClick={onOpenDashcam} className="flex w-full items-center gap-3 rounded p-1 text-left hover:bg-cyan-900/60 disabled:cursor-wait disabled:opacity-80"><span aria-hidden="true" className="text-3xl">📁</span><span><span className="block font-semibold">Dashcam_Files</span><span className="mt-1 block text-xs text-cyan-300">{label}</span></span></button>{dashcamAttachment.stage === 'uploading' && <progress aria-label="ความคืบหน้าการอัปโหลดภาพจากกล้องหน้ารถ" max="100" value={dashcamUploadProgress} className="mt-2 h-2 w-full accent-emerald-400" />}</div>;
              }
              if (message.speaker === 'documents') {
                const busy = ['uploading', 'checking', 'scanning', 'cleaning'].includes(documentsAttachment.stage);
                const label = { uploading: `กำลังอัปโหลด ${documentsUploadProgress}%`, checking: 'กำลังรับเอกสาร...', scanning: 'NIKI กำลังตรวจเอกสาร...', cleaning: 'NIKI กำลังล้างไวรัส...', ready: 'คลิกเพื่อรับและตรวจเอกสาร', error: 'รับเอกสารไม่สำเร็จ · คลิกเพื่อลองอีกครั้ง', complete: 'ตรวจเอกสารแล้ว · คลิกเพื่อเปิดโฟลเดอร์' }[documentsAttachment.stage];
                return <div key={index} className="w-full max-w-64 rounded border border-cyan-700 bg-cyan-950/50 p-3 text-sm text-cyan-100">
                  <button type="button" disabled={busy} onClick={onOpenDocuments} className="flex w-full items-center gap-3 rounded p-1 text-left hover:bg-cyan-900/60 focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-wait disabled:opacity-80"><span aria-hidden="true" className="text-3xl">📁</span><span><span className="block font-semibold">Case_Documents (3 ไฟล์)</span><span className="mt-1 block text-xs text-cyan-300">{label}</span></span></button>
                  {documentsAttachment.stage === 'uploading' && <progress aria-label="ความคืบหน้าการอัปโหลดเอกสาร" max="100" value={documentsUploadProgress} className="mt-2 h-2 w-full accent-emerald-400" />}
                </div>;
              }
              if (message.speaker === 'attachment') {
                const busy = ['uploading', 'checking', 'scanning', 'cleaning'].includes(attachment.stage);
                const label = { uploading: `กำลังอัปโหลด ${uploadProgress}%`, checking: 'กำลังรับไฟล์...', scanning: 'NIKI กำลังตรวจไฟล์...', cleaning: 'NIKI กำลังล้างไวรัส...', ready: 'คลิกเพื่อรับและตรวจไฟล์', error: 'รับไฟล์ไม่สำเร็จ · คลิกเพื่อลองอีกครั้ง', complete: 'ตรวจไฟล์แล้ว · คลิกเพื่อเปิดโฟลเดอร์' }[attachment.stage];
                return <div key={index} className="w-full max-w-64 rounded border border-cyan-800 bg-cyan-950/50 p-3 text-sm text-cyan-100">
                  <button type="button" disabled={busy} onClick={onOpenPhoto} aria-label="เปิดโฟลเดอร์ Case_Files" className="flex w-full items-center gap-3 rounded p-1 text-left hover:bg-cyan-900/60 focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-wait disabled:opacity-80">
                    <span aria-hidden="true" className="text-3xl">📁</span><span className="min-w-0"><span className="block break-all font-semibold">Case_Files</span><span className="mt-1 block text-xs text-cyan-300">{label}</span></span>
                  </button>
                  {attachment.stage === 'uploading' && <progress aria-label="ความคืบหน้าการอัปโหลดภาพ" max="100" value={uploadProgress} className="mt-2 h-2 w-full accent-emerald-400" />}
                </div>;
              }
              if (currentQuestion && message.raw === currentQuestion.line && ['ready', 'review', 'complete'].includes(questionPhase)) return <button key={index} type="button" onClick={onSelectQuestion} disabled={questionPhase === 'complete' || isThinking} className="block w-full rounded border border-cyan-400 bg-cyan-950/70 px-3 py-2 text-left text-sm leading-relaxed text-cyan-100 hover:bg-cyan-900 disabled:cursor-default">{message.text}</button>;
              const requestType = reportStage === 'awaiting-suspect' && message.raw === REPORT_SUSPECT_REQUEST ? 'name' : message.raw === REPORT_ADDRESS_REQUEST && reportStage === 'awaiting-address' ? 'address' : null;
              if (requestType) return <button key={index} type="button" onClick={() => onSelectReportRequest(requestType)} draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('text/plain', `case-report:${requestType}`); onSelectReportRequest(requestType); }} className="block w-full cursor-grab rounded border border-cyan-400 bg-cyan-950/70 px-3 py-2 text-left text-sm leading-relaxed text-cyan-100 hover:bg-cyan-900"><span>{stripPolicePrefix(message.text)}</span><span className="mt-1 block text-xs text-cyan-300">เลือกคำถาม แล้วเลือกข้อมูลใน HumanDB</span></button>;
              return <div key={index} className={`max-w-[95%] rounded px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${message.speaker === 'you' ? 'ml-auto border border-amber-700/60 bg-amber-950/30 text-amber-100' : message.speaker === 'system' ? 'text-center text-xs text-slate-400' : 'border border-cyan-950 bg-cyan-950/55 text-cyan-100'}`}>{stripPolicePrefix(message.text)}</div>;
            })}
            {isTyping && <div className="rounded border border-cyan-950 bg-cyan-950/55 px-3 py-2 text-sm leading-relaxed text-cyan-100"><span aria-hidden="true">{typingText}<span className="ml-0.5 animate-pulse">▌</span></span><span className="sr-only">สายสืบกำลังพิมพ์ข้อความ</span></div>}
          </div>
          {phase === 'choosing' && <div className="space-y-2 border-t border-cyan-950 p-3">{callChoices.map((choice) => <button key={choice.id} type="button" onClick={() => onChoice(choice.id)} className="block w-full rounded border border-amber-600/70 bg-slate-950 px-3 py-2 text-left text-sm text-amber-200 hover:bg-amber-950/40">{choice.label}</button>)}</div>}
          {phase === 'callback-choosing' && <div className="border-t border-cyan-950 p-3"><button type="button" onClick={onCallbackChoice} className="block w-full rounded border border-amber-600/70 bg-slate-950 px-3 py-2 text-left text-sm text-amber-200 hover:bg-amber-950/40">{callEndReason === 'missed' ? missedCallbackChoice : callbackChoice}</button></div>}
          {victimReplyReady && reportStage === 'awaiting-victim' && <div className="border-t border-cyan-950 p-3"><button type="button" onClick={onSendVictimReply} className="block w-full rounded border border-amber-600/70 bg-slate-950 px-3 py-2 text-left text-sm text-amber-200 hover:bg-amber-950/40">นายธันวา วรากร</button></div>}
          {endingStage === 'awaiting-name' && <div className="border-t border-cyan-950 p-3"><button type="button" onClick={onSendDashcamName} className="block w-full rounded border border-amber-600/70 bg-slate-950 px-3 py-2 text-left text-sm text-amber-200 hover:bg-amber-950/40">นายอัศวกร พรหมพิทักษ์</button></div>}
          {manualProgress && questionPhase === 'ready' && manualProgress.total > 1 && <div role="status" className="border-t border-cyan-950 px-3 py-2 text-xs text-cyan-200">เลือกหลักฐานแล้ว {manualProgress.selectedCount} / {manualProgress.total} ข้อความ</div>}
          {questionPhase === 'review' && guidedAnswer && !answerInFile && <div className="border-t border-cyan-950 p-3"><button type="button" onClick={onSendGuidedAnswer} disabled={isThinking} aria-label="ส่งคำตอบให้เจ้าหน้าที่ภัทรวัฒน์" className="block max-h-36 w-full overflow-y-auto whitespace-pre-wrap rounded border border-amber-600/70 bg-slate-950 px-3 py-2 text-left text-sm leading-relaxed text-amber-200 hover:bg-amber-950/40 focus-visible:outline-2 focus-visible:outline-amber-300 disabled:opacity-50"><span className="mb-1 block text-xs font-semibold text-amber-400">ส่งคำตอบให้เจ้าหน้าที่</span>{guidedAnswer}</button></div>}
        </>}
      </div>
    </aside>
  );
}
