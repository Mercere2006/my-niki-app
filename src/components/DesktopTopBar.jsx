export default function DesktopTopBar({
  openTerminal,
  isTerminalOpen,
  isTerminalMinimized,
  setIsMainframeOpen,
  setMainframeTab,
  brainConfig,
  currentDate,
  currentTime,
  isMuted,
  setIsMuted,
}) {
  return (
      <header className="relative z-30 h-8 bg-slate-950/85 backdrop-blur-md border-b border-cyan-500/30 flex items-center justify-between px-3 text-xs text-slate-300 font-mono shadow-md">
        {/* Left: Applications Menu, Terminal Switcher & NIKI Mainframe */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-600/40 text-cyan-300 font-bold hover:bg-cyan-900/60 transition cursor-pointer"
          >
            <span className="text-cyan-400">❖</span>
            <span>Activities</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 border-l border-slate-700/60 pl-3">
            <button
              type="button"
              onClick={openTerminal}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded transition cursor-pointer ${
                isTerminalOpen && !isTerminalMinimized
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>&gt;_</span>
              <span className="font-semibold">Terminal</span>
              {isTerminalOpen && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-1"></span>}
            </button>

            {/* NIKI Mainframe Button (เปิดหน้าต่างสถานะไบโอชิปของ NIKI & ใส่ API Key) */}
            <button
              type="button"
              onClick={() => {
                setIsMainframeOpen(true);
                setMainframeTab('brain');
              }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/70 border border-rose-500/50 text-rose-300 font-bold hover:bg-rose-900/60 transition cursor-pointer shadow-[0_0_8px_rgba(244,63,94,0.3)]"
              title="เปิด NIKI Mainframe เพื่อตั้งค่า API Key และปรับแต่งนิสัย"
            >
              <img src="/capri/chip.png" alt="Chip" className="w-3.5 h-3.5 object-contain" />
              <span>NIKI MAINFRAME</span>
              <span className={`w-1.5 h-1.5 rounded-full ml-0.5 ${brainConfig.apiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            </button>
          </div>
        </div>

        {/* Center: Live Clock & Sandbox Status */}
        <div className="flex items-center gap-3 text-slate-300 font-semibold tracking-wide">
          <div className="hidden lg:flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/50 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            NIKI WEB SANDBOX: ACTIVE [HOST RESTRICTED]
          </div>
          <span>{currentDate}</span>
          <span className="text-cyan-400 font-bold">{currentTime}</span>
        </div>

        {/* Right: System Tray */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <div className="hidden md:flex items-center gap-1 text-slate-400">
            <span className="text-emerald-400">●</span> eth0: 192.168.1.42
          </div>
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="hover:text-cyan-300 cursor-pointer"
            title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <span>100% 🔋</span>
          <span className="text-cyan-400 font-semibold">Shoom</span>
        </div>
      </header>
  );
}
