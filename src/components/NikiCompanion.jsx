import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshWobbleMaterial, Sphere } from '@react-three/drei';

// 3D Core Hologram (โหมดสำรอง)
function Niki3DHologram({ gameState }) {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.8;
      meshRef.current.rotation.x += delta * 0.3;
    }
  });

  const getColor = () => {
    if (gameState === 'CASE_CLOSED') return '#10b981';
    if (gameState === 'CASE_ABORTED') return '#f43f5e';
    return '#38bdf8';
  };

  return (
    <Float speed={3} rotationIntensity={1.5} floatIntensity={2}>
      <mesh ref={meshRef}>
        <torusGeometry args={[1.2, 0.05, 16, 100]} />
        <meshBasicMaterial color={getColor()} wireframe />
      </mesh>
      <Sphere args={[0.7, 32, 32]}>
        <MeshWobbleMaterial color={getColor()} factor={0.4} speed={2} wireframe />
      </Sphere>
    </Float>
  );
}

const VOICE_CLIPS = [
  '/capri/voice/hello-morning.wav',
  '/capri/voice/hello-late.wav',
  '/capri/voice/hello-miss.wav',
];

const POKE_QUOTES = [
  "แตะตัวฉันทำไมชูม? ไบโอชิปของฉันมันจั๊กจี้นะยะ!",
  "NIKI (Project NIKI) แสตนด์บายพร้อมลุยแล้วชูม!",
  "ชิป Relic ปกติดี มีเรื่องอะไรชวนคุยเล่นมั้ยชูม?",
  "ว่าไงชูม! นั่งหน้าจอนานๆ อย่าลืมพักสายตาบ้างนะ!",
  "ฉันสแตนด์บายบนเดสก์ท็อปให้ชูมเสมอเลยนะ!",
];

export default function NikiCompanion({
  gameState = 'PROMPT_CHOICE',
  latestMessage = '',
}) {
  const [viewMode, setViewMode] = useState('sprite'); // 'sprite' | '3d'
  const [overrideAnim, setOverrideAnim] = useState(null); // 'talk' | 'glitch' | 'sleep' | 'tossed' | 'perch' | 'perch-music'
  const [customBubble, setCustomBubble] = useState('');
  const [showBubble, setShowBubble] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // คำนวณแอนิเมชันหลักตาม gameState
  const getBaseAnim = () => {
    if (gameState === 'CASE_CLOSED') return 'perch-music';
    if (gameState === 'CASE_ABORTED') return 'sleep';
    return 'idle';
  };

  const currentAnim = overrideAnim || getBaseAnim();

  // คำนวณข้อความใน Speech Bubble สไตล์ NIKI (ภาษาไทย)
  const getBaseBubble = () => {
    if (gameState === 'CASE_CLOSED') return '🎉 พรีมสุดๆ ชูม! ส่งเบาะแสให้สารวัตรตรวจสอบต่อได้แล้ว!';
    if (gameState === 'CASE_ABORTED') return 'Zzz... กอนก์เอ๊ย ฉันของีบก่อนนะ (CASE ABORTED)';
    if (gameState === 'ACTIVE') return 'จัดไปชูม! ฉันกำลังรัน Reverse Traceroute แกะรอย IP ให้แล้ว...';
    return 'ว่าไงชูม! สารวัตรภัทรส่งสายด่วนเข้ามา รอเธอตัดสินใจรับงานอยู่นะ';
  };

  const bubbleText = customBubble || latestMessage || getBaseBubble();

  // เล่นเสียงพากย์ของ NIKI
  const playVoice = useCallback((index = null) => {
    if (isAudioMuted) return;
    try {
      const clipIndex = index !== null ? index : Math.floor(Math.random() * VOICE_CLIPS.length);
      const audio = new Audio(VOICE_CLIPS[clipIndex]);
      audio.volume = 0.6;
      audio.play().catch((err) => {
        console.warn('Audio play was prevented:', err.message);
      });
    } catch (err) {
      console.warn('Audio initialization error:', err);
    }
  }, [isAudioMuted]);

  // เมื่อมีข้อความใหม่ ให้ขยับปากพูดชั่วคราว
  useEffect(() => {
    if (latestMessage && gameState !== 'CASE_CLOSED' && gameState !== 'CASE_ABORTED') {
      const timer1 = setTimeout(() => {
        setOverrideAnim('talk');
        setShowBubble(true);
      }, 0);
      const timer2 = setTimeout(() => {
        setOverrideAnim(null);
      }, 3000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [latestMessage, gameState]);

  // เมื่อผู้ใช้คลิก/จิ้มที่ตัว NIKI (Poke Interaction เหมือน NIKI Desktop)
  const handlePoke = () => {
    setClickCount((c) => c + 1);
    setOverrideAnim('tossed');
    const quote = POKE_QUOTES[Math.floor(Math.random() * POKE_QUOTES.length)];
    setCustomBubble(quote);
    setShowBubble(true);
    playVoice();

    setTimeout(() => {
      setOverrideAnim(null);
      setCustomBubble('');
    }, 1600);
  };

  // แผนที่รูปภาพแอนิเมชัน NIKI จาก Assets แท้
  const getSpriteSrc = () => {
    switch (currentAnim) {
      case 'talk':
        return '/capri/readme/talk.webp';
      case 'glitch':
        return '/capri/readme/glitch.webp';
      case 'sleep':
        return '/capri/readme/sleep.webp';
      case 'tossed':
        return '/capri/readme/tossed.webp';
      case 'perch':
        return '/capri/readme/perch.webp';
      case 'perch-music':
        return '/capri/readme/perch-music.webp';
      case 'idle':
      default:
        return '/capri/readme/idle.webp';
    }
  };

  // สลับท่าทางแบบ Manual
  const handleManualAction = (anim, text, voiceIdx) => {
    setOverrideAnim(anim);
    if (text) {
      setCustomBubble(text);
      setShowBubble(true);
    }
    if (voiceIdx !== undefined && voiceIdx !== null) {
      playVoice(voiceIdx);
    }
    setTimeout(() => {
      setOverrideAnim(null);
      setCustomBubble('');
    }, 3500);
  };

  return (
    <div className="w-full bg-slate-950/80 border border-sky-900/50 rounded-lg p-2.5 relative overflow-hidden flex flex-col justify-between shadow-[0_0_15px_rgba(56,189,248,0.25)] shrink-0">
      
      {/* Background Cyber Grid Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none"></div>

      {/* Header Bar ของ Avatar Box */}
      <div className="flex justify-between items-center text-[10px] text-cyan-400 font-mono pb-1.5 border-b border-cyan-900/40 relative z-10">
        <div className="flex items-center gap-1.5">
          <img src="/capri/chip.png" alt="Chip" className="w-3.5 h-3.5 object-contain inline-block" />
          <span className="font-bold tracking-wider text-cyan-300">
            NIKI <span className="text-slate-500">// PROJECT NIKI [WEB SANDBOX]</span>
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${
            gameState === 'CASE_CLOSED' ? 'bg-emerald-400' : gameState === 'CASE_ABORTED' ? 'bg-rose-500' : 'bg-cyan-400 animate-ping'
          }`}></span>
        </div>

        {/* View Mode Toggle: NIKI Sprite vs 3D */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('sprite')}
            className={`px-2 py-0.5 rounded text-[9px] font-bold transition cursor-pointer ${
              viewMode === 'sprite' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            👾 NIKI SPRITE
          </button>
          <button
            type="button"
            onClick={() => setViewMode('3d')}
            className={`px-2 py-0.5 rounded text-[9px] font-bold transition cursor-pointer ${
              viewMode === '3d' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🌐 3D CORE
          </button>
        </div>
      </div>

      {/* Main Avatar Display Area */}
      <div className="h-44 w-full relative flex items-center justify-center my-1 select-none overflow-hidden">
        
        {viewMode === 'sprite' ? (
          <div className="relative w-full h-full flex flex-col items-center justify-end">
            
            {/* Speech Bubble สไตล์ NIKI Desktop */}
            {showBubble && bubbleText && (
              <div className="absolute top-1 left-2 right-2 z-20">
                <div className="relative bg-slate-900/95 border border-cyan-500/50 rounded-lg p-2 text-[11px] text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)] backdrop-blur-sm flex items-start justify-between gap-1">
                  <div className="flex-1 leading-snug font-sans">
                    <span className="text-[9px] text-rose-400 font-bold block mb-0.5">NIKI SAYS:</span>
                    {bubbleText}
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowBubble(false)}
                    className="text-slate-400 hover:text-slate-200 text-[10px] px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                  {/* Bubble Pointer Tail */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-cyan-500/50 rotate-45"></div>
                </div>
              </div>
            )}

            {/* NIKI Character Sprite (Clickable & Reactive) */}
            <div 
              onClick={handlePoke}
              title="คลิกเพื่อคุยหรือแกล้ง NIKI!"
              className="relative cursor-pointer transition-transform duration-150 hover:scale-105 active:scale-95 group z-10 flex flex-col items-center"
            >
              <img 
                src={getSpriteSrc()} 
                alt="NIKI Desktop Companion"
                className="h-28 w-auto object-contain drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                style={{ imageRendering: 'pixelated' }}
              />

              {/* Holographic Platform Base */}
              <div className="w-28 h-3.5 bg-cyan-500/20 border border-cyan-400/50 rounded-[100%] shadow-[0_0_15px_#06b6d4] -mt-1 flex items-center justify-center">
                <div className="w-16 h-1.5 bg-cyan-400/60 rounded-full animate-pulse"></div>
              </div>

              {/* Status Pill Badge */}
              <div className="absolute -bottom-3 text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-900/90 border border-cyan-500/60 text-cyan-300 font-semibold uppercase tracking-wider shadow">
                {currentAnim}
              </div>
            </div>

          </div>
        ) : (
          /* 3D Hologram Mode */
          <div className="w-full h-full relative">
            <Canvas camera={{ position: [0, 0, 3.5], fov: 50 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} color="#06b6d4" />
              <Niki3DHologram gameState={gameState} />
            </Canvas>
          </div>
        )}

      </div>

      {/* Footer Interactive Actions Bar */}
      <div className="pt-2 border-t border-cyan-900/40 flex items-center justify-between text-[10px] text-slate-400 relative z-10 mt-1">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={handlePoke}
            className="px-2 py-1 bg-slate-900 hover:bg-cyan-950 text-cyan-300 border border-cyan-800/60 rounded font-semibold transition cursor-pointer flex items-center gap-1"
          >
            👋 จิ้ม NIKI
          </button>
          <button
            type="button"
            onClick={() => handleManualAction('talk', 'ว่าไงชูม! ฉันกำลังประมวลผลเสียงภาษาไทยอยู่นะ', 0)}
            className="px-2 py-1 bg-slate-900 hover:bg-cyan-950 text-cyan-300 border border-cyan-800/60 rounded font-semibold transition cursor-pointer flex items-center gap-1"
          >
            🔊 เสียงพากย์
          </button>
          <button
            type="button"
            onClick={() => handleManualAction('glitch', '⚡ สัญญาณชิป Relic โดนคลื่นรบกวนชะมัด!', null)}
            className="px-2 py-1 bg-slate-900 hover:bg-cyan-950 text-amber-300 border border-amber-800/60 rounded font-semibold transition cursor-pointer"
          >
            ⚡ Glitch
          </button>
          <button
            type="button"
            onClick={() => handleManualAction('perch-music', '🎵 เพลง Cyberpunk นี่มันแจ่มจริงๆ โยกตามฉันสิชูม!', 2)}
            className="px-2 py-1 bg-slate-900 hover:bg-cyan-950 text-emerald-300 border border-emerald-800/60 rounded font-semibold transition cursor-pointer"
          >
            🎵 ดนตรี
          </button>
        </div>

        {/* Audio Mute & Info */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            title={isAudioMuted ? 'เปิดเสียง NIKI' : 'ปิดเสียง NIKI'}
            className={`p-1 rounded border transition cursor-pointer text-[10px] ${
              isAudioMuted ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-cyan-300'
            }`}
          >
            {isAudioMuted ? '🔇 MUTED' : '🔊 SFX'}
          </button>
          <span className="font-mono text-[9px] text-slate-500">
            {clickCount > 0 ? `POKES: ${clickCount}` : 'CLICKS: READY'}
          </span>
        </div>
      </div>

    </div>
  );
}
