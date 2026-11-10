export default function DesktopCompanion({
  isPerchedOnWindow,
  isTerminalOpen,
  isTerminalMinimized,
  showBubble,
  lastPlayerInput,
  capriMessage,
  isThinking,
  handlePlayerSubmit,
  inputRef,
  playerInput,
  setPlayerInput,
  hasIncomingCase,
  gameState,
  handleAcceptCase,
  handleDeclineCase,
  setIsMainframeOpen,
  setMainframeTab,
  brainConfig,
  handlePokeCapri,
  getCapriSprite,
  analysisPromptVisible,
  downloadPromptVisible,
  awaitingDownloadReply,
  guidedEvidenceVisible,
  onDismissGuidedEvidence,
  canContinueGuidedEvidence,
  onContinueGuidedEvidence,
}) {
  return (
    <>
      {(!isPerchedOnWindow || !isTerminalOpen || isTerminalMinimized) && (
        <div className={`absolute right-8 bottom-6 md:right-28 md:bottom-12 ${analysisPromptVisible || downloadPromptVisible ? 'z-[45]' : 'z-20'} flex flex-col items-center`}>
          
          {/* NIKI CYBER SPEECH BUBBLE */}
          {showBubble && (
            <div className="relative mb-3 max-w-sm md:max-w-md w-full animate-fade-in select-text">
              <div className="relative bg-[#070d18]/95 border-2 border-cyan-400/90 rounded-xl p-3.5 shadow-[0_0_20px_rgba(6,182,212,0.65)] backdrop-blur-md">
                
                {/* แถบสีแดงประดับด้านซ้าย */}
                <div className="flex items-start gap-2.5">
                  <div className="w-1 self-stretch bg-rose-500 rounded-full shrink-0 shadow-[0_0_8px_#f43f5e]"></div>
                  
                  <div className="flex-1 font-mono text-xs leading-relaxed space-y-1.5">
                    {/* บรรทัดคำสั่งของผู้เล่นสไตล์ NIKI (> you: ...) */}
                    {lastPlayerInput && (
                      <div className="text-slate-400 font-mono text-[11px] break-words">
                        &gt; you: {lastPlayerInput}
                      </div>
                    )}

                    {/* ข้อความตอบกลับของ NIKI */}
                    <div className="text-sky-200 flex items-start gap-1.5 font-sans leading-relaxed">
                      <span className="text-rose-400 font-bold font-mono tracking-wider shrink-0">NIKI:</span>
                      <span className="max-h-48 overflow-y-auto whitespace-pre-wrap font-medium text-xs break-words">
                        {capriMessage}
                      </span>
                      {isThinking && (
                        <span className="inline-block w-2 h-3.5 bg-rose-500 animate-ping ml-0.5 shrink-0 mt-0.5"></span>
                      )}
                      {!isThinking && (
                        <span className="inline-block w-2 h-3.5 bg-cyan-400 animate-pulse ml-0.5 shrink-0 mt-0.5"></span>
                      )}
                    </div>
                  </div>
                </div>

                {guidedEvidenceVisible && <div className="mt-2 flex items-center justify-between gap-2 rounded border border-cyan-800 bg-cyan-950/40 px-2 py-1 text-xs text-cyan-200"><span>คำถามจากสารวัตรภัทร</span><button type="button" onClick={onDismissGuidedEvidence} className="cursor-pointer text-cyan-300 underline hover:text-white">กลับไปคุยเล่น</button></div>}
                {guidedEvidenceVisible && canContinueGuidedEvidence && <button type="button" onClick={onContinueGuidedEvidence} className="mt-2 w-full cursor-pointer rounded border border-cyan-500 bg-cyan-950 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-900 focus-visible:outline-2 focus-visible:outline-cyan-300">ไปคำถามถัดไป →</button>}
                {/* ช่องพิมพ์ตอบ NIKI */}
                <form onSubmit={handlePlayerSubmit} className="mt-3 pt-2 border-t border-cyan-900/60 flex gap-2">
                  <div className="flex-1 relative flex items-center">
                    <span className="absolute left-2.5 text-xs text-cyan-400 font-mono">&gt; you:</span>
                    <input
                      ref={inputRef}
                      type="text"
                      value={playerInput}
                      onChange={(e) => setPlayerInput(e.target.value)}
                      placeholder={
                        awaitingDownloadReply
                          ? "พิมพ์ 'ตกลง' หรือ 'ไม่เป็นไร'..."
                          : hasIncomingCase && gameState === 'PROMPT_CHOICE'
                          ? "พิมพ์ 'รับ' / 'ตกลง' หรือ 'ไม่รับ'..."
                          : "คุยกับ NIKI เช่น 'สวัสดี', 'กินข้าวยัง' หรือชวนคุยเรื่องทั่วไป..."
                      }
                      className="w-full bg-slate-950/90 border border-cyan-500/60 rounded px-2.5 pl-18 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isThinking || !playerInput.trim()}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition disabled:opacity-40 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                  >
                    ส่ง
                  </button>
                </form>

                {/* ปุ่มด่วนรับ / ไม่รับคดีเมื่อมีคดีส่งเข้ามา */}
                {hasIncomingCase && gameState === 'PROMPT_CHOICE' && (
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-cyan-800/60 animate-fade-in">
                    <button
                      type="button"
                      onClick={() => handleAcceptCase('รับทำคดี')}
                      className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.5)] cursor-pointer transition border border-emerald-400/80 active:scale-95"
                    >
                      <span>[✓]</span>
                      <span>รับทำคดี (ACCEPT)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeclineCase('ไม่รับงาน ขอพักก่อน')}
                      className="px-3 py-1.5 bg-slate-800/90 hover:bg-rose-950 text-slate-300 hover:text-rose-300 font-mono text-xs font-bold rounded flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-pointer transition border border-slate-700 hover:border-rose-500/80 active:scale-95"
                    >
                      <span>[✕]</span>
                      <span>ไม่รับ [DECLINE]</span>
                    </button>
                  </div>
                )}

                {/* ข้อความบอก ESC STOPS ME & ลิงก์ตั้งค่า API Key */}
                <div className="text-[9px] font-mono text-slate-500 flex justify-between items-center mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMainframeOpen(true);
                      setMainframeTab('brain');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer flex items-center gap-1"
                    title="คลิกเพื่อตั้งค่าหรือเปลี่ยน API Key"
                  >
                    <span>🧠</span>
                    <span>{brainConfig.apiKey ? `BRAIN: ${brainConfig.provider.toUpperCase()} [ONLINE]` : '⚙️ ใส่ API KEY'}</span>
                  </button>
                  <span>NIKI PROTOCOL // ESC STOPS ME</span>
                </div>

                {/* หางลูกศรชี้ลงไปที่ตัว NIKI */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#070d18] border-r-2 border-b-2 border-cyan-400 rotate-45"></div>
              </div>
            </div>
          )}

          {/* ตัวการ์ตูน NIKI บนหน้า Desktop */}
          <div
            onClick={handlePokeCapri}
            className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 flex flex-col items-center group relative z-10"
            title="คลิกเพื่อคุยกับ NIKI!"
          >
            <img
              src={getCapriSprite()}
              alt="NIKI Desktop Companion"
              className="h-36 md:h-44 w-auto object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* ฐานเรืองแสง Cyberpunk */}
            <div className="w-24 h-3 bg-cyan-500/25 border border-cyan-400/50 rounded-[100%] shadow-[0_0_15px_#06b6d4] -mt-1 flex items-center justify-center">
              <div className="w-12 h-1 bg-cyan-400/60 rounded-full animate-pulse"></div>
            </div>

            <div className="text-[10px] font-mono text-cyan-300 mt-1 font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-500/40 shadow flex items-center gap-1">
              <img src="/capri/chip.png" alt="Chip" className="w-3 h-3 object-contain" />
              NIKI
            </div>
          </div>

        </div>
      )}
    </>
  );
}
