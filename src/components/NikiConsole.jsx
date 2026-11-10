import { useState, useRef, useEffect } from 'react';
import NikiCompanion from './NikiCompanion';
import { POLICE_PREFIX } from '../services/policeConversation';

export default function NikiConsole({
  chatLogs = [],
  gameState = 'PROMPT_CHOICE',
  onAcceptMission = () => {},
  onDeclineMission = () => {},
  onSendMessage = () => {},
}) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  // หาข้อความล่าสุดของ NIKI เพื่อส่งให้ Speech Bubble
  const latestCapriLog = [...chatLogs].reverse().find((l) => l.sender === 'NIKI');

  // Auto-scroll เมื่อมีข้อความใหม่
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLogs]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 min-h-0 bg-slate-950/90 border border-sky-900/50 rounded-lg p-3 flex flex-col justify-between shadow-[0_0_10px_rgba(56,189,248,0.2)] overflow-hidden">
      
      {/* 1. NIKI Companion Avatar (NIKI-Desktop Native Adaptation) */}
      <NikiCompanion 
        gameState={gameState} 
        latestMessage={latestCapriLog?.text || ''} 
      />

      <div className="flex justify-between items-center border-b border-sky-900/40 py-1.5 text-xs mt-2 shrink-0">
        <span className="text-cyan-400 font-bold tracking-wide flex items-center gap-1.5">
          <img src="/capri/chip.png" alt="Chip" className="w-3.5 h-3.5 object-contain" />
          _ TERMINAL // NIKI NEURAL CONSOLE
        </span>
        <span className="text-slate-500 font-mono text-[10px]">THAI NLP // NIKI MAINFRAME [SANDBOXED]</span>
      </div>

      {/* 2. ช่องแสดงบทสนทนา */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 text-xs pr-1 mt-2 min-h-0">
        {(chatLogs || []).map((log, index) => (
          <div 
            key={index} 
            className={`p-2.5 rounded-lg border ${
              log.sender === 'SHOOM' 
                ? 'bg-slate-800/60 border-slate-700/50 text-slate-300 self-end max-w-[85%]' 
                : log.sender === 'INSP. PHATTARA'
                ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                : 'bg-sky-950/40 border-sky-800/40 text-sky-200'
            }`}
          >
            <div className={`text-[10px] font-semibold mb-1 flex items-center justify-between ${
              log.sender === 'SHOOM' ? 'text-emerald-400' : log.sender === 'INSP. PHATTARA' ? 'text-emerald-400' : 'text-cyan-400'
            }`}>
              <span className="flex items-center gap-1">
                {log.sender === 'NIKI' && (
                  <img src="/capri/chip.png" alt="Chip" className="w-3.5 h-3.5 object-contain inline" />
                )}
                {log.sender === 'INSP. PHATTARA' ? POLICE_PREFIX : log.sender}
              </span>
              <span className="text-slate-500 font-mono text-[9px]">[{log.time}]</span>
            </div>
            <div className="leading-relaxed">{log.text}</div>

            {log.isPrompt && gameState === 'PROMPT_CHOICE' && (
              <div className="flex gap-2 mt-3 pt-2 border-t border-sky-900/40">
                <button 
                  type="button"
                  onClick={onAcceptMission}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded text-xs transition cursor-pointer"
                >
                  [✓] ตอบรับคำขอ (ACCEPT)
                </button>
                <button 
                  type="button"
                  onClick={onDeclineMission}
                  className="px-3 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 py-1.5 rounded text-xs transition cursor-pointer"
                >
                  [✕] ปฏิเสธงาน
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* 3. ช่องพิมพ์ป้อนคำสั่ง */}
      <form onSubmit={handleSend} className="mt-2 pt-2 border-t border-slate-800 flex gap-2 shrink-0">
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={gameState === 'PROMPT_CHOICE' || gameState === 'CASE_ABORTED'}
          placeholder={
            gameState === 'PROMPT_CHOICE' 
              ? 'กรุณาเลือกตอบรับหรือปฏิเสธคำขอด้านบน...' 
              : gameState === 'CASE_ABORTED'
              ? 'ภารกิจถูกยกเลิก (CASE ABORTED)'
              : 'ป้อนคำสั่งหรือคุยกับ NIKI... (เช่น สรุปผลคดี, ดูภาพจากกล้อง, ช่วยสแกนหน้า)'
          } 
          className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 disabled:opacity-50"
        />
        <button 
          type="submit"
          disabled={gameState === 'PROMPT_CHOICE' || gameState === 'CASE_ABORTED' || !inputText.trim()}
          className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-1.5 rounded text-xs font-bold transition disabled:opacity-50 cursor-pointer"
        >
          ส่งคำสั่ง
        </button>
      </form>

    </div>
  );
}
