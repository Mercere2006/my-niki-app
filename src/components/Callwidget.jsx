import { useState } from 'react';
import { POLICE_PREFIX } from '../services/policeConversation';

export default function CallWidget({
  gameState = 'IDLE',
  onAcceptMission = () => {},
}) {
  const [isMuted, setIsMuted] = useState(false);
  const isAccepted = gameState === 'ACTIVE' || gameState === 'CASE_CLOSED';
  const isAborted = gameState === 'CASE_ABORTED';
  const isPrompt = gameState === 'PROMPT_CHOICE';

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-3 flex flex-col gap-2 relative overflow-hidden shadow-md">
      <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-1.5">
        <span className={`flex items-center gap-1.5 font-bold ${
          isAborted 
            ? 'text-slate-500' 
            : isAccepted 
            ? 'text-emerald-400' 
            : isPrompt
            ? 'text-rose-400 animate-pulse'
            : 'text-cyan-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            isAborted ? 'bg-slate-600' : isAccepted ? 'bg-emerald-500 animate-ping' : isPrompt ? 'bg-rose-500 animate-pulse' : 'bg-cyan-500'
          }`}></span>
          {isAborted 
            ? 'DISCONNECTED' 
            : isAccepted 
            ? 'CALL CONNECTED // IN PROGRESS' 
            : isPrompt
            ? 'INCOMING ENCRYPTED CALL'
            : 'FREQUENCY MONITOR // STANDBY'}
        </span>
        <span className="font-mono text-[10px] text-slate-500">SECURE CHANNEL #09</span>
      </div>

      <div className="flex items-center gap-3 my-1">
        <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-400 font-bold text-xl relative shrink-0">
          ภ
          <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
            isAborted ? 'bg-slate-600' : isAccepted ? 'bg-emerald-500' : isPrompt ? 'bg-rose-500 animate-ping' : 'bg-cyan-500'
          }`}></span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-emerald-400">{POLICE_PREFIX}</div>
          <div className="text-xs text-emerald-300 italic mt-0.5 line-clamp-2">
            {isAborted 
              ? '"สายถูกตัดการเชื่อมต่อ..."'
              : isAccepted
              ? '"ขอบคุณมาก Shoom! ช่วยตรวจภาพจากกล้องวงจรปิดให้ผมที"'
              : isPrompt
              ? '"Shoom! เอกสารหลักฐานหายไป ผมส่งภาพจากกล้องให้แล้ว ให้ NIKI ช่วยตรวจสอบที!"'
              : '"สถานีตำรวจกองปราบปราม... สแตนด์บายมอนิเตอร์คลื่นวิทยุฉุกเฉิน"'}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-1">
        {isAccepted ? (
          <div className="flex-1 bg-emerald-950/40 border border-emerald-600/40 text-emerald-400 py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            CONNECTED & RECEIVING LOGS
          </div>
        ) : isPrompt ? (
          <button 
            type="button"
            disabled={isAborted}
            onClick={onAcceptMission}
            className="flex-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/50 py-1.5 rounded text-xs font-semibold transition shadow-[0_0_10px_rgba(34,197,94,0.3)] disabled:opacity-50 cursor-pointer animate-pulse"
          >
            [✓] ACCEPT FILE & TALK
          </button>
        ) : (
          <div className="flex-1 bg-slate-950/40 border border-slate-800 text-slate-500 py-1.5 px-3 rounded text-xs font-mono text-center">
            CHANNEL IDLE // NO INCIDENT
          </div>
        )}
        <button 
          type="button"
          onClick={() => setIsMuted(!isMuted)}
          className={`px-3 border py-1.5 rounded text-xs transition cursor-pointer ${
            isMuted 
              ? 'bg-rose-950/50 border-rose-700/60 text-rose-300' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
          }`}
        >
          {isMuted ? 'MUTED' : 'MUTE'}
        </button>
      </div>
    </div>
  );
}
