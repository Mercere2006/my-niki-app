export default function Header({ gameState = 'ACTIVE' }) {
  const getStatusColor = () => {
    if (gameState === 'CASE_CLOSED') return 'text-emerald-400';
    if (gameState === 'CASE_ABORTED') return 'text-rose-400';
    return 'text-amber-400';
  };

  const getStatusText = () => {
    if (gameState === 'CASE_CLOSED') return 'CASE SOLVED // CLOSED';
    if (gameState === 'CASE_ABORTED') return 'CASE ABORTED';
    return 'OPERATION IOT ZERO';
  };

  return (
    <header className="w-full bg-slate-900/80 border border-slate-700/60 rounded-lg p-2.5 flex justify-between items-center shadow-[0_0_10px_rgba(56,189,248,0.2)] mb-3 shrink-0">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img 
            src="/capri/chip.png" 
            alt="NIKI Relic Chip" 
            className="w-7 h-7 object-contain drop-shadow-[0_0_8px_#38bdf8]" 
          />
          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
            gameState === 'CASE_ABORTED' ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'
          }`}></span>
        </div>
        <div>
          <h1 className="text-base font-bold tracking-wider text-cyan-400 [text-shadow:0_0_8px_currentColor] flex items-center gap-2">
            NIKI // CYBER COMPANION 
            <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-600/50 font-mono">
              PROJECT NIKI [WEB SANDBOX]
            </span>
          </h1>
          <div className="text-[10px] text-slate-400">DESKTOP COMPANION // THAI NLP // WEB DESKTOP SCOPE</div>
        </div>
      </div>
      <div className="hidden sm:flex gap-6 text-xs text-slate-400 font-mono">
        <div>OPERATOR: <span className="text-emerald-400 font-semibold font-sans">SHOOM</span></div>
        <div>CASE: <span className={`${getStatusColor()} font-semibold font-sans`}>{getStatusText()}</span></div>
        <div>TUNNEL: <span className="text-sky-400 font-semibold font-sans">256-BIT SECURE</span></div>
      </div>
    </header>
  );
}