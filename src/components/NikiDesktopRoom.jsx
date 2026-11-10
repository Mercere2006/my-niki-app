import { useState, useEffect, useRef, useCallback } from 'react';

const VOICE_CLIPS = [
  '/niki/hello-morning.wav',
  '/niki/hello-late.wav',
  '/niki/hello-miss.wav',
];

export default function NikiDesktopRoom({
  screenState = 'ROAMING', // 'ROAMING' | 'INCOMING_CALL' | 'DECLINED' | 'WORKSPACE'
  onAcceptCase = () => {},
  onDeclineCase = () => {},
  onTriggerCall = () => {},
  onOpenWorkspace = () => {},
}) {
  const [posX, setPosX] = useState(50); // percentage 20% to 80%
  const [direction, setDirection] = useState('right'); // 'left' | 'right'
  const [isWalking, setIsWalking] = useState(false);
  const [playerInput, setPlayerInput] = useState('');
  const [customBubble, setCustomBubble] = useState('');
  const [countdown, setCountdown] = useState(6);
  const inputRef = useRef(null);

  // เล่นเสียงพากย์ NIKI
  const playVoice = useCallback((index = 0) => {
    try {
      const audio = new Audio(VOICE_CLIPS[index % VOICE_CLIPS.length]);
      audio.volume = 0.65;
      audio.play().catch((err) => {
        console.warn('Audio play prevented:', err.message);
      });
    } catch (err) {
      console.warn('Audio error:', err);
    }
  }, []);

  // คำนวณว่าเดินจริงหรือไม่ (ถ้าไม่ใช่ ROAMING จะไม่เดิน)
  const effectivelyWalking = isWalking && screenState === 'ROAMING';

  // การเดินไปมาของ NIKI ในโหมด ROAMING (ตอนที่ยังไม่มีคดี)
  useEffect(() => {
    if (screenState !== 'ROAMING') return;

    const roamInterval = setInterval(() => {
      const shouldWalk = Math.random() > 0.35;
      if (shouldWalk) {
        setPosX((prevX) => {
          const nextX = Math.floor(Math.random() * 60) + 20;
          setDirection(nextX > prevX ? 'right' : 'left');
          return nextX;
        });
        setIsWalking(true);

        setTimeout(() => {
          setIsWalking(false);
        }, 2500);
      } else {
        setIsWalking(false);
      }
    }, 4500);

    return () => clearInterval(roamInterval);
  }, [screenState]);

  // นับถอยหลังให้สารวัตรภัทรโทรเข้าอัตโนมัติ (หรือผู้ใช้กดโทรทันทีได้)
  useEffect(() => {
    if (screenState === 'ROAMING' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (screenState === 'ROAMING' && countdown === 0) {
      onTriggerCall();
    }
  }, [screenState, countdown, onTriggerCall]);

  // เมื่อสารวัตรภัทรโทรเข้า ให้เล่นเสียงและโฟกัสช่องพิมพ์
  useEffect(() => {
    if (screenState === 'INCOMING_CALL') {
      playVoice(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(timer);
    }
  }, [screenState, playVoice]);

  // ข้อความใน Speech Bubble คำนวณตามสถานะ
  const getDefaultBubble = () => {
    if (screenState === 'INCOMING_CALL') {
      return 'Shoom! สารวัตรภัทรมีคดีด่วนมาขอให้เราช่วยวิเคราะห์ค่ะ คุณจะรับทำคดีนี้มั้ยคะ? (พิมพ์ ตอบ "รับ" หรือ "ไม่รับ")';
    }
    if (screenState === 'DECLINED') {
      return 'รับทราบค่ะ... งั้น NIKI ปิดสัญญาณแล้วไปนอนพักต่อนะคะ ฝันดีค่ะ Shoom... Zzz';
    }
    return '';
  };

  const bubbleMessage = customBubble || getDefaultBubble();
  const showBubble = Boolean(bubbleMessage);

  // จัดการการพิมพ์ตอบของผู้เล่น
  const handleSubmitResponse = (e) => {
    e?.preventDefault();
    const cleanText = playerInput.trim().toLowerCase();
    if (!cleanText) return;

    const acceptKeywords = ['รับ', 'ตกลง', 'ช่วย', 'ทำ', 'yes', 'ok', 'accept', 'ลุย', 'ได้', 'เอาสิ', 'จัดไป'];
    const declineKeywords = ['ไม่', 'ปฏิเสธ', 'นอน', 'พัก', 'no', 'decline', 'ไม่รับ', 'ขี้เกียจ', 'บาย'];

    const isAccept = acceptKeywords.some((k) => cleanText.includes(k));
    const isDecline = declineKeywords.some((k) => cleanText.includes(k));

    if (isAccept) {
      playVoice(1);
      setCustomBubble('');
      onAcceptCase(playerInput);
    } else if (isDecline) {
      setCustomBubble('');
      onDeclineCase(playerInput);
    } else {
      setCustomBubble(`เอ๊ะ? "${playerInput}" หมายถึงรับคดีหรือให้ NIKI ไปนอนต่อดีคะ? (พิมพ์ 'รับ' หรือ 'ไม่รับ')`);
    }
    setPlayerInput('');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#020617] text-slate-100 flex flex-col justify-between select-none">
      
      {/* Background Ambience: Deep dark navy-black with subtle cyberpunk grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0a1526_0%,_#020617_75%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

      {/* Top Ambient Bar */}
      <header className="relative z-10 p-4 flex justify-between items-center text-xs text-slate-500 font-mono">
        <div className="flex items-center gap-2">
          <img src="/niki/chip.png" alt="Chip" className="w-5 h-5 object-contain opacity-80" />
          <span className="text-sky-400 font-bold tracking-wider">NIKI PROTOCOL // NIKI AI</span>
          <span className="text-[10px] text-slate-600">v0.8.3 DESKTOP</span>
        </div>

        {/* State Indicator & Action Triggers */}
        <div className="flex items-center gap-3">
          {screenState === 'ROAMING' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">
                {countdown > 0 ? `สัญญาณเข้าใน ${countdown} วิ...` : 'กำลังเชื่อมต่อ...'}
              </span>
              <button
                type="button"
                onClick={onTriggerCall}
                className="bg-sky-950/80 hover:bg-sky-900 border border-sky-600/50 text-sky-300 px-3 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                🚨 สารวัตรภัทรโทรเข้าเดี๋ยวนี้
              </button>
            </div>
          )}

          {screenState === 'DECLINED' && (
            <button
              type="button"
              onClick={onTriggerCall}
              className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 px-3 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1.5 animate-pulse"
            >
              🔔 ปลุก NIKI / รับสายสารวัตรภัทรอีกครั้ง
            </button>
          )}

          {screenState === 'WORKSPACE' && (
            <button
              type="button"
              onClick={onOpenWorkspace}
              className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1 rounded text-xs transition font-semibold cursor-pointer shadow-[0_0_10px_#38bdf8]"
            >
              🗖 เปิดหน้าต่าง Terminal การสืบสวน
            </button>
          )}
        </div>
      </header>

      {/* Center Event Box: Alert when Inspector Phattara calls */}
      {screenState === 'INCOMING_CALL' && (
        <div className="relative z-20 max-w-xl mx-auto my-auto p-4 w-full">
          <div className="bg-slate-900/90 border-2 border-rose-500/80 rounded-xl p-4 shadow-[0_0_25px_rgba(244,63,94,0.35)] backdrop-blur-md">
            
            {/* Alert Header */}
            <div className="flex justify-between items-center border-b border-rose-900/60 pb-2 mb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm tracking-wide animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                🚨 สายด่วนเข้ารหัสตำรวจ (POLICE EMERGENCY ENCRYPTED CHANNEL)
              </div>
              <span className="text-[10px] font-mono text-slate-400">PRIORITY: CRITICAL</span>
            </div>

            {/* Inspector Phattara message preview */}
            <div className="flex items-start gap-3 bg-slate-950/70 border border-slate-800 rounded-lg p-3 my-2">
              <div className="w-10 h-10 rounded-lg bg-rose-950/60 border border-rose-700/60 flex items-center justify-center text-rose-300 font-bold shrink-0">
                ภ
              </div>
              <div>
                <div className="text-xs font-bold text-rose-300">สารวัตรภัทร (INSP. PHATTARA)</div>
                <div className="text-xs text-slate-300 italic mt-1 leading-relaxed">
                  &quot;Shoom! เอกสารสำคัญหายไปจากห้องเก็บหลักฐาน ผมส่งภาพจากกล้องให้แล้ว ช่วย NIKI ตรวจสอบที!&quot;
                </div>
              </div>
            </div>

            {/* Prompt to player */}
            <div className="text-xs text-sky-300 font-semibold my-2 flex items-center gap-1.5">
              <span>💬 NIKI หันมาถามคุณ:</span>
              <span className="text-slate-300 font-normal">&quot;คุณจะรับทำคดีนี้มั้ยคะ? พิมพ์ตอบ NIKI ได้เลยค่ะ&quot;</span>
            </div>

            {/* Input field for typing response */}
            <form onSubmit={handleSubmitResponse} className="mt-3 flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={playerInput}
                onChange={(e) => setPlayerInput(e.target.value)}
                placeholder="พิมพ์ตอบ เช่น 'รับ', 'ตกลง' หรือ 'ไม่รับ', 'นอนต่อ'..."
                className="flex-1 bg-slate-950 border border-sky-500/70 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
              />
              <button
                type="submit"
                disabled={!playerInput.trim()}
                className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition disabled:opacity-40 cursor-pointer"
              >
                ส่งคำตอบ
              </button>
            </form>

            {/* Quick action buttons for convenience */}
            <div className="flex gap-2 mt-2.5 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  playVoice(1);
                  setCustomBubble('');
                  onAcceptCase('รับทำคดี');
                }}
                className="flex-1 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/60 text-emerald-300 font-bold py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.2)]"
              >
                [✓] รับทำคดี (ACCEPT MISSION)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomBubble('');
                  onDeclineCase('ไม่รับงาน ขอพักก่อน');
                }}
                className="px-4 bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-800 text-slate-400 hover:text-rose-300 py-1.5 rounded-lg text-xs transition cursor-pointer"
              >
                [✕] ไม่รับ / ให้ NIKI นอนต่อ (DECLINE)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Main Floor Area: NIKI (NIKI) on screen */}
      <div className="relative z-10 w-full h-52 mb-6">
        
        {/* NIKI Character Container (Moves along posX) */}
        <div
          className="absolute bottom-2 transition-all duration-1000 ease-in-out flex flex-col items-center select-none"
          style={{
            left: `${posX}%`,
            transform: 'translateX(-50%)',
          }}
        >
          {/* Speech Bubble above NIKI */}
          {showBubble && bubbleMessage && (
            <div className="mb-2 max-w-xs relative z-20">
              <div className="bg-slate-900/95 border border-sky-400/60 rounded-xl p-2.5 text-xs text-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.35)] backdrop-blur-md">
                <div className="text-[10px] text-sky-400 font-bold mb-0.5 flex items-center gap-1">
                  <img src="/niki/chip.png" alt="Chip" className="w-3 h-3 object-contain" />
                  NIKI SAYS:
                </div>
                <div className="leading-relaxed font-sans">{bubbleMessage}</div>
                {/* Pointer tail */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-sky-400/60 rotate-45"></div>
              </div>
            </div>
          )}

          {/* Sleep Zzz Floating Animation */}
          {screenState === 'DECLINED' && (
            <div className="absolute -top-12 left-10 pointer-events-none flex flex-col items-center">
              <span className="text-sky-300 text-sm font-bold animate-zzz-1">Z</span>
              <span className="text-sky-400 text-base font-bold animate-zzz-2 -mt-2 ml-3">Z</span>
              <span className="text-sky-500 text-lg font-bold animate-zzz-3 -mt-2 ml-6">z</span>
            </div>
          )}

          {/* Alert Exclamation Badge */}
          {screenState === 'INCOMING_CALL' && (
            <div className="absolute -top-7 text-rose-400 font-extrabold text-2xl animate-bounce drop-shadow-[0_0_8px_#f43f5e]">
              !
            </div>
          )}

          {/* NIKI Sprite Display */}
          <div
            className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 flex flex-col items-center"
            onClick={() => {
              playVoice(2);
              setCustomBubble('NIKI พร้อมรับคำสั่งเสมอค่ะ Shoom!');
            }}
          >
            {/* If walking: use 12-frame sprite sheet animation */}
            {effectivelyWalking ? (
              <div
                className="capri-sprite-walk drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]"
                style={{
                  transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
                }}
              />
            ) : screenState === 'DECLINED' ? (
              /* Sleeping */
              <img
                src="/niki/sleep.webp"
                alt="NIKI Sleeping"
                className="h-32 w-auto object-contain drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : screenState === 'INCOMING_CALL' ? (
              /* Alert / Talking */
              <img
                src="/niki/talk.webp"
                alt="NIKI Alert"
                className="h-32 w-auto object-contain drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              /* Idling */
              <img
                src="/niki/idle.webp"
                alt="NIKI Idle"
                className="h-32 w-auto object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]"
                style={{
                  imageRendering: 'pixelated',
                  transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
                }}
              />
            )}

            {/* Glowing Ground Pedestal / Shadow */}
            <div className="w-24 h-3 bg-sky-500/20 border border-sky-400/40 rounded-[100%] shadow-[0_0_12px_#38bdf8] -mt-1 flex items-center justify-center">
              <div className="w-12 h-1 bg-sky-400/50 rounded-full animate-pulse"></div>
            </div>

            {/* Name & Mood Tag */}
            <div className="text-[9px] font-mono text-sky-400/80 mt-1 uppercase tracking-widest">
              {effectivelyWalking ? 'WALKING...' : screenState === 'DECLINED' ? 'SLEEPING (Zzz)' : screenState === 'INCOMING_CALL' ? 'ALERT!' : 'IDLE'}
            </div>
          </div>

        </div>

        {/* Floor Line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-900/60 to-transparent"></div>
      </div>

    </div>
  );
}
