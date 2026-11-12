import { useEffect, useRef, useState } from 'react';
import { moveWindow } from '../services/windowSizing';

export default function DesktopCompanion({
  isPerchedOnWindow,
  isCallPanelVisible,
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
  onOpenCall,
  setIsMainframeOpen,
  setMainframeTab,
  brainConfig,
  handlePokeCapri,
  getCapriSprite,
  analysisPromptVisible,
  downloadPromptVisible,
  awaitingDownloadReply,
  guidedEvidenceVisible,
  isFollowupCallActive,
  onDismissGuidedEvidence,
  closingChoiceVisible,
  onClosingChoice,
}) {
  const [offset, setOffset] = useState(null);
  const companionRef = useRef(null);
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const layoutBesideCall = offset ? offset.besideCall : isCallPanelVisible;

  useEffect(() => {
    const keepOnScreen = () => {
      if (!companionRef.current || dragRef.current) return;
      const rect = companionRef.current.getBoundingClientRect();
      const clamped = moveWindow({ rect, deltaX: 0, deltaY: 0, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight });
      if (clamped.left === rect.left && clamped.top === rect.top) return;
      setOffset((current) => {
        const position = current || { x: 0, y: 0, besideCall: isCallPanelVisible };
        return { ...position, x: position.x + clamped.left - rect.left, y: position.y + clamped.top - rect.top };
      });
    };
    const frame = window.requestAnimationFrame(keepOnScreen);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(keepOnScreen);
    if (companionRef.current) observer?.observe(companionRef.current);
    window.addEventListener('resize', keepOnScreen);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', keepOnScreen);
    };
  }, [isCallPanelVisible, isPerchedOnWindow, isTerminalOpen, isTerminalMinimized, showBubble]);

  const startDrag = (event) => {
    if (event.button !== 0 || !companionRef.current) return;
    suppressClickRef.current = false;
    const rect = companionRef.current.getBoundingClientRect();
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, rect, offset: offset || { x: 0, y: 0, besideCall: isCallPanelVisible }, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 5) return;
    drag.moved = true;
    const next = moveWindow({ rect: drag.rect, deltaX, deltaY, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight });
    setOffset({ ...drag.offset, x: drag.offset.x + next.left - drag.rect.left, y: drag.offset.y + next.top - drag.rect.top });
  };

  const endDrag = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    suppressClickRef.current = drag.moved;
    dragRef.current = null;
  };

  return (
    <>
      {(!isPerchedOnWindow || !isTerminalOpen || isTerminalMinimized) && (
        <div
          ref={companionRef}
          style={offset ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : undefined}
          className={`absolute bottom-6 right-8 md:bottom-12 ${layoutBesideCall ? 'md:right-[376px] md:max-w-[calc(100vw-400px)]' : 'md:right-28'} ${isCallPanelVisible || analysisPromptVisible || downloadPromptVisible ? 'z-[45]' : 'z-20'} ${showBubble ? 'w-[34rem]' : 'w-auto'} flex max-w-[calc(100vw-4rem)] flex-col items-center`}
        >
          
          {/* NIKI CYBER SPEECH BUBBLE */}
          {showBubble && (
            <div className="relative mb-3 w-full animate-fade-in select-text">
              <div className="relative bg-[#070d18]/95 border-2 border-cyan-400/90 rounded-xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.65)] backdrop-blur-md">
                
                {/* แถบสีแดงประดับด้านซ้าย */}
                <div className="flex items-start gap-2.5">
                  <div className="w-1 self-stretch bg-rose-500 rounded-full shrink-0 shadow-[0_0_8px_#f43f5e]"></div>
                  
                  <div className="flex-1 font-mono text-xs leading-relaxed space-y-1.5">
                    {/* บรรทัดคำสั่งของผู้เล่นสไตล์ NIKI (> คุณ: ...) */}
                    {lastPlayerInput && (
                      <div className="text-slate-400 font-mono text-xs break-words">
                        &gt; คุณ: {lastPlayerInput}
                      </div>
                    )}

                    {/* ข้อความตอบกลับของ NIKI */}
                    <div className="text-sky-200 flex items-start gap-1.5 font-sans leading-relaxed">
                      <span className="text-rose-400 font-bold font-mono tracking-wider shrink-0">NIKI:</span>
                      <span className="max-h-[min(12rem,25vh)] overflow-y-auto whitespace-pre-wrap font-medium text-sm break-words">
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

                {guidedEvidenceVisible && <div className="mt-2 flex items-center justify-between gap-2 rounded border border-cyan-800 bg-cyan-950/40 px-2 py-1 text-xs text-cyan-200"><span>คำถามจากสายสืบภัทรวัฒน์ อนันต์กุล</span>{!isFollowupCallActive && <button type="button" onClick={onDismissGuidedEvidence} className="cursor-pointer text-cyan-300 underline hover:text-white">กลับไปคุยเล่น</button>}</div>}
                {/* ช่องพิมพ์ตอบ NIKI */}
                {closingChoiceVisible ? <button type="button" onClick={onClosingChoice} className="mt-3 w-full rounded border border-amber-600/70 bg-slate-950 px-3 py-2 text-left text-sm text-amber-200 hover:bg-amber-950/40">ไม่เป็นไร NIKI</button> : <form onSubmit={handlePlayerSubmit} className="mt-3 pt-2 border-t border-cyan-900/60 flex gap-2">
                  <div className="flex-1 relative flex items-center">
                    <span className="absolute left-2.5 text-xs text-cyan-400 font-mono">&gt; คุณ:</span>
                    <input
                      ref={inputRef}
                      type="text"
                      value={playerInput}
                      onChange={(e) => setPlayerInput(e.target.value)}
                      placeholder={
                        awaitingDownloadReply
                          ? "พิมพ์ 'ตกลง' หรือ 'ไม่เป็นไร'..."
                          : hasIncomingCase && gameState === 'PROMPT_CHOICE'
                          ? "กดรับสายจากหน้าต่างสายสนทนา..."
                          : "คุยกับ NIKI เช่น 'สวัสดี', 'กินข้าวยัง' หรือชวนคุยเรื่องทั่วไป..."
                      }
                      className="w-full bg-slate-950/90 border border-cyan-500/60 rounded px-2.5 pl-18 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isThinking || !playerInput.trim()}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm font-bold transition disabled:opacity-40 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                  >
                    ส่ง
                  </button>
                </form>}

                {/* ให้ผู้เล่นเป็นคนรับสายด้วยตัวเอง */}
                {hasIncomingCase && gameState === 'PROMPT_CHOICE' && (
                  <button type="button" onClick={onOpenCall} className="mt-2 w-full rounded border border-cyan-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-950">เปิดสายเรียกเข้า</button>
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
          <button
            type="button"
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={() => { dragRef.current = null; suppressClickRef.current = false; }}
            onClick={() => {
              if (suppressClickRef.current) { suppressClickRef.current = false; return; }
              handlePokeCapri();
            }}
            className="relative z-10 flex touch-none cursor-grab select-none flex-col items-center transition-transform duration-200 hover:scale-105 active:cursor-grabbing active:scale-95 focus-visible:outline-2 focus-visible:outline-cyan-400"
            title="ลากเพื่อย้าย NIKI หรือคลิกเพื่อคุย"
            aria-label="ลากเพื่อย้าย NIKI หรือคลิกเพื่อคุย"
          >
            <img
              src={getCapriSprite()}
              alt="NIKI Desktop Companion"
              draggable={false}
              className="h-[min(10rem,25vh)] md:h-[min(13rem,30vh)] w-auto object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* ฐานเรืองแสง Cyberpunk */}
            <div className="w-28 h-3 bg-cyan-500/25 border border-cyan-400/50 rounded-[100%] shadow-[0_0_15px_#06b6d4] -mt-1 flex items-center justify-center">
              <div className="w-14 h-1 bg-cyan-400/60 rounded-full animate-pulse"></div>
            </div>

            <div className="text-[10px] font-mono text-cyan-300 mt-1 font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-500/40 shadow flex items-center gap-1">
              <img src="/capri/chip.png" alt="Chip" className="w-3 h-3 object-contain" />
              NIKI
            </div>
          </button>

        </div>
      )}
    </>
  );
}
