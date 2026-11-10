import DesktopWindow from './DesktopWindow';
import { choices, followUpChoices, POLICE_PREFIX } from '../services/policeConversation';
import { REPORT_NAME_REQUEST, REPORT_ADDRESS_REQUEST } from '../services/reportConversation';
import { guidedEvidenceQuestions } from '../services/guidedEvidence';

export default function TerminalWindow({
  isTerminalOpen,
  isTerminalMinimized,
  activeWindow,
  setActiveWindow,
  hideTerminal,
  isPerchedOnWindow,
  showBubble,
  capriMessage,
  handlePokeCapri,
  getCapriSprite,
  cliScrollRef,
  cliHistory,
  policeConversation,
  handlePoliceChoice,
  handlePoliceFollowUp,
  handleCliSubmit,
  cliInputRef,
  cliInput,
  setCliInput,
  hasDownloadedCaseFiles,
  reportStage,
  onSelectReportRequest,
  onAskGuidedEvidence,
  activeGuidedQuestion,
  isThinking,
}) {
  return (
      <DesktopWindow
        title="shoom@cyber-arch: ~/cases (bash)"
        windowLabel="Terminal"
        initialSize={{ width: 720, height: 480 }}
        isOpen={isTerminalOpen}
        isMinimized={isTerminalMinimized}
        isActive={activeWindow === 'terminal'}
        onActivate={() => setActiveWindow('terminal')}
        onMinimize={() => hideTerminal()}
        onClose={() => hideTerminal(true)}
        decoration={isPerchedOnWindow && (
            <div className="absolute -top-32 right-10 z-50 flex flex-col items-center pointer-events-auto select-none">
              {showBubble && (
                <div className="relative mb-2 max-w-xs bg-[#070d18]/95 border-2 border-cyan-400/90 rounded-xl p-2.5 shadow-[0_0_15px_rgba(6,182,212,0.65)] text-xs text-sky-200 font-sans">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-rose-400 font-bold mb-1">
                    <img src="/capri/chip.png" alt="Chip" className="w-3 h-3" />
                    NIKI SAYS:
                  </div>
                  <div>{capriMessage}</div>
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#070d18] border-r border-b border-cyan-400 rotate-45"></div>
                </div>
              )}
              <div
                onClick={handlePokeCapri}
                className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                title="NIKI กำลังนั่งเกาะขอบหน้าต่าง Terminal ของคุณ!"
              >
                <img
                  src={getCapriSprite()}
                  alt="NIKI Perched on Terminal"
                  className="h-32 w-auto object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            </div>
          )}
      >
        <div className="flex-1 min-h-0 p-3 flex flex-col overflow-hidden bg-slate-950/95 text-slate-200 font-mono text-xs">
              <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
                <div
                  ref={cliScrollRef}
                  className="flex-1 overflow-y-auto space-y-1 pr-2 text-[20px] leading-relaxed font-mono select-text break-words"
                >
                  {cliHistory.map((line, idx) => {
                    const evidenceQuestion = guidedEvidenceQuestions.find((item) => item.line === line);
                    if (evidenceQuestion && evidenceQuestion.id === activeGuidedQuestion) return (
                      <button key={idx} type="button" disabled={isThinking} onClick={() => onAskGuidedEvidence(evidenceQuestion)} aria-label={`ให้ NIKI วิเคราะห์: ${evidenceQuestion.question}`} className="block w-full rounded border border-cyan-500 bg-cyan-950/40 px-3 py-2 text-left text-emerald-400 hover:bg-cyan-900/50 focus-visible:outline-2 focus-visible:outline-cyan-400 disabled:opacity-50">
                        <span className="whitespace-pre-wrap">{line}</span><span className="mt-1 block font-sans text-xs text-cyan-200">คลิกเพื่อให้ NIKI ตรวจเอกสารตามคำถาม</span>
                      </button>
                    );
                    const requestType = line === REPORT_NAME_REQUEST && reportStage === 'awaiting-name' ? 'name' : line === REPORT_ADDRESS_REQUEST && reportStage === 'awaiting-address' ? 'address' : null;
                    if (requestType) return (
                      <button key={idx} type="button" draggable onClick={() => onSelectReportRequest(requestType)} onDragStart={(event) => { event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('text/plain', `case-report:${requestType}`); onSelectReportRequest(requestType); }} aria-label={requestType === 'name' ? 'เลือกคำร้องขอชื่อจากสารวัตร' : 'เลือกคำร้องขอที่อยู่จากสารวัตร'} className="block w-full cursor-grab rounded border border-cyan-500 bg-cyan-950/40 px-3 py-2 text-left text-emerald-400 hover:bg-cyan-900/50 focus-visible:outline-2 focus-visible:outline-cyan-400 active:cursor-grabbing">
                        <span className="whitespace-pre-wrap">{line}</span><span className="mt-1 block font-sans text-xs text-cyan-200">คลิกหรือลากคำร้องไปยังข้อมูลใน HumanDB</span>
                      </button>
                    );
                    return (
                    <div
                      key={idx}
                      className={
                        'whitespace-pre-wrap ' + (line.startsWith(POLICE_PREFIX)
                          ? 'text-emerald-400'
                          : line.startsWith('shoom@')
                          ? 'text-cyan-400 font-bold'
                          : line.includes('[+]') || line.includes('[✓]')
                          ? 'text-emerald-400 font-semibold'
                          : line.includes('[!]') || line.includes('CRITICAL')
                          ? 'text-rose-400 font-semibold'
                          : line.startsWith('Available Commands:')
                          ? 'text-amber-300'
                          : line.startsWith('"') || line.includes('INSP. PHATTARA')
                          ? 'text-amber-300 font-sans'
                          : 'text-slate-300')
                      }
                    >
                      {line}
                    </div>
                  ); })}
                  {['choosing', 'follow-up-choosing'].includes(policeConversation) && (
                    <div className="space-y-2 py-3 font-sans" aria-label="เลือกคำตอบให้สารวัตรภัทร">
                      {(policeConversation === 'choosing' ? choices : followUpChoices).map((choice) => (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => policeConversation === 'choosing' ? handlePoliceChoice(choice.id) : handlePoliceFollowUp(choice.id)}
                          className="block w-full rounded border border-cyan-700/60 bg-slate-900 px-3 py-2 text-left text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-950 focus-visible:outline-2 focus-visible:outline-cyan-400"
                        >
                          {choice.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* CLI Command Input Prompt */}
                {!['choosing', 'briefing', 'follow-up-choosing', 'follow-up-reply', 'download-offer'].includes(policeConversation) && <form onSubmit={handleCliSubmit} className="mt-2 pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 text-[20px]">
                  <span className="text-cyan-400 font-bold shrink-0">shoom@cyber-arch:~$</span>
                  <input
                    ref={cliInputRef}
                    type="text"
                    value={cliInput}
                    onChange={(e) => setCliInput(e.target.value)}
                    placeholder={
                      !hasDownloadedCaseFiles
                        ? "รัน 'wget https://police.gov/case_files' เพื่อดาวน์โหลดหลักฐาน หรือพิมพ์ 'help'..."
                        : "พิมพ์ 'ls' เพื่อดูไฟล์ภาพหลักฐาน..."
                    }
                    className="min-w-0 flex-1 bg-transparent border-none text-white focus:outline-none font-mono text-[20px] placeholder-slate-600"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs transition cursor-pointer"
                  >
                    Enter
                  </button>
                </form>}
              </div>
        </div>
      </DesktopWindow>
  );
}
