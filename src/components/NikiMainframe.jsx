import { useState } from 'react';
import { PROVIDERS, saveBrainConfig, testBrainConnection } from '../services/capriBrain';

export default function NikiMainframe({
  isMainframeOpen,
  setIsMainframeOpen,
  mainframeTab,
  setMainframeTab,
  brainConfig,
  setBrainConfig,
  capriAnim,
  setCapriAnim,
  setCapriMessage,
  playVoice,
  openTerminal,
  isPerchedOnWindow,
  setIsPerchedOnWindow,
}) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [testStatus, setTestStatus] = useState('');

  // จัดการการบันทึกการตั้งค่า AI Brain
  const handleSaveBrain = (e) => {
    e?.preventDefault();
    saveBrainConfig(brainConfig);
    setSaveStatus('✓ บันทึกการตั้งค่า Brain เรียบร้อยแล้ว ชูม!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  // ทดสอบการเชื่อมต่อ API Key
  const handleTestConnection = async () => {
    setTestStatus('กำลังส่งสัญญาณไปยัง AI Brain...');
    try {
      saveBrainConfig(brainConfig);
      const testReply = await testBrainConnection(brainConfig);
      setTestStatus(`✓ เชื่อมต่อสำเร็จ! NIKI (${brainConfig.model || 'gemini-3.5-flash-lite'}) ตอบ: "${testReply}"`);
    } catch (err) {
      setTestStatus(`✕ เชื่อมต่อล้มเหลว: ${err.message}`);
    }
  };

  const selectedProviderObj = PROVIDERS.find((p) => p.id === brainConfig.provider) || PROVIDERS[0];

  return (
    <>
      {isMainframeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in select-text">
          <div className="relative w-full max-w-xl bg-[#070d18] border-2 border-rose-500/80 rounded-2xl p-5 shadow-[0_0_40px_rgba(244,63,94,0.5)] flex flex-col gap-4 text-xs font-sans max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-rose-900/50 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <img src="/capri/chip.png" alt="NIKI Biochip" className="w-7 h-7 object-contain" />
                <div>
                  <div className="font-mono font-bold text-rose-400 text-sm tracking-wide flex items-center gap-2">
                    <span>NIKI MAINFRAME // RELIC 2.0</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      brainConfig.apiKey 
                        ? 'bg-emerald-950/80 border-emerald-600/60 text-emerald-300' 
                        : 'bg-amber-950/80 border-amber-600/60 text-amber-300'
                    }`}>
                      {brainConfig.apiKey ? '🧠 AI LIVE' : '🟡 LOCAL FALLBACK'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    PROJECT NIKI (CYBERPUNK EDGERUNNERS) // THAI NLP
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMainframeOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-rose-900 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs: BRAIN / API KEY vs CONSTRUCT & STATS */}
            <div className="flex border-b border-slate-800 gap-2 pb-2 shrink-0">
              <button
                type="button"
                onClick={() => setMainframeTab('brain')}
                className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer transition ${
                  mainframeTab === 'brain'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/70 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                    : 'text-slate-400 hover:text-white bg-slate-900/50'
                }`}
              >
                <span>🧠</span>
                <span>BRAIN / API KEY</span>
                <span className={`w-1.5 h-1.5 rounded-full ${brainConfig.apiKey ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              </button>
              <button
                type="button"
                onClick={() => setMainframeTab('construct')}
                className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer transition ${
                  mainframeTab === 'construct'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/70 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                    : 'text-slate-400 hover:text-white bg-slate-900/50'
                }`}
              >
                <span>⚙️</span>
                <span>CONSTRUCT & TOOLS</span>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">

              {/* TAB 1: BRAIN / API KEY SETTINGS */}
              {mainframeTab === 'brain' && (
                <div className="space-y-4 font-sans">
                  
                  {/* Status Banner */}
                  <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                    brainConfig.apiKey
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  }`}>
                    <span className="text-base">{brainConfig.apiKey ? '🟢' : '🟡'}</span>
                    <div className="leading-relaxed text-xs">
                      {brainConfig.apiKey ? (
                        <>
                          <div className="font-bold text-emerald-300 font-mono">
                            BRAIN ONLINE // เชื่อมต่อกับ {selectedProviderObj.name} ({brainConfig.model})
                          </div>
                          <div>NIKI จะใช้ AI วิเคราะห์และตอบคำถามภาษาไทยตามบุคลิกแท้แบบเรียลไทม์</div>
                        </>
                      ) : (
                        <>
                          <div className="font-bold text-amber-300 font-mono">
                            LOCAL FALLBACK ENGINE // ยังไม่ได้ใส่ API Key
                          </div>
                          <div>NIKI กำลังใช้ระบบตอบรับจำลองในเครื่อง กรุณาใส่ API Key ด้านล่างเพื่อปลดล็อกสมอง AI แบบเต็มรูปแบบ!</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Form ตั้งค่า API Key */}
                  <form onSubmit={handleSaveBrain} className="space-y-3 bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl">
                    
                    {/* 1. เลือก Provider */}
                    <div>
                      <label className="block text-slate-300 font-mono text-[11px] mb-1 font-semibold">
                        🤖 เลือกระบบ AI PROVIDER:
                      </label>
                      <select
                        value={brainConfig.provider}
                        onChange={(e) => {
                          const provId = e.target.value;
                          const found = PROVIDERS.find((p) => p.id === provId);
                          setBrainConfig((prev) => ({
                            ...prev,
                            provider: provId,
                            model: found?.defaultModel || prev.model,
                            customEndpoint: found?.defaultEndpoint || prev.customEndpoint,
                          }));
                        }}
                        className="w-full bg-slate-950 border border-cyan-800/60 rounded px-2.5 py-1.5 text-xs text-cyan-200 focus:outline-none focus:border-cyan-400 font-mono"
                      >
                        {PROVIDERS.map((p) => (
                          <option key={p.id} value={p.id} className="bg-slate-950 text-white">
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. ช่องใส่ API Key */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-300 font-mono text-[11px] font-semibold flex items-center gap-1.5">
                          <span>🔑 API KEY:</span>
                          {selectedProviderObj.keyUrl && (
                            <a
                              href={selectedProviderObj.keyUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 underline font-normal text-[10px]"
                            >
                              [ขอรับคีย์ {selectedProviderObj.name} ที่นี่ ↗]
                            </a>
                          )}
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer font-mono"
                        >
                          {showApiKey ? 'ซ่อนคีย์' : 'แสดงคีย์'}
                        </button>
                      </div>

                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={brainConfig.apiKey}
                        onChange={(e) => setBrainConfig((prev) => ({ ...prev, apiKey: e.target.value.trim() }))}
                        placeholder={selectedProviderObj.placeholder}
                        className="w-full bg-slate-950 border border-rose-800/60 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 font-mono"
                      />
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">
                        * API Key จะถูกบันทึกไว้ในเบราว์เซอร์ของคุณ (LocalStorage) เท่านั้น ไม่มีการส่งไปที่อื่น
                      </div>
                    </div>

                    {/* 3. เลือก Model */}
                    <div>
                      <label className="block text-slate-300 font-mono text-[11px] mb-1 font-semibold">
                        ⚡ MODEL (รุ่นของโมเดล):
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={brainConfig.model}
                          onChange={(e) => setBrainConfig((prev) => ({ ...prev, model: e.target.value }))}
                          className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                        >
                          {(selectedProviderObj.models || []).map((m) => (
                            <option key={m} value={m} className="bg-slate-950 text-white">
                              {m}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={brainConfig.model}
                          onChange={(e) => setBrainConfig((prev) => ({ ...prev, model: e.target.value }))}
                          placeholder="หรือพิมพ์ชื่อ Model เอง..."
                          className="w-44 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                        />
                      </div>
                    </div>

                    {/* 4. Custom Endpoint (ถ้าเลือก Custom / Local) */}
                    {brainConfig.provider === 'custom' && (
                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1 font-semibold">
                          🌐 CUSTOM ENDPOINT URL (เช่น Ollama):
                        </label>
                        <input
                          type="text"
                          value={brainConfig.customEndpoint || ''}
                          onChange={(e) => setBrainConfig((prev) => ({ ...prev, customEndpoint: e.target.value }))}
                          placeholder="http://localhost:11434/v1"
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                        />
                      </div>
                    )}

                    {/* ปุ่มบันทึก & ทดสอบ */}
                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs transition cursor-pointer shadow-[0_0_10px_rgba(244,63,94,0.4)] flex items-center gap-1.5"
                        >
                          <span>💾</span>
                          <span>บันทึกการตั้งค่า (SAVE)</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleTestConnection}
                          disabled={!brainConfig.apiKey && brainConfig.provider !== 'custom'}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded text-xs transition disabled:opacity-40 cursor-pointer border border-cyan-800/60"
                        >
                          ⚡ ทดสอบสัญญาณ
                        </button>
                      </div>

                      {saveStatus && (
                        <span className="text-emerald-400 font-bold text-xs animate-fade-in font-mono">
                          {saveStatus}
                        </span>
                      )}
                    </div>

                    {testStatus && (
                      <div className={`mt-2 p-2 rounded text-xs font-mono ${
                        testStatus.startsWith('✓') 
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700' 
                          : testStatus.startsWith('กำลัง')
                          ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-700 animate-pulse'
                          : 'bg-rose-950/60 text-rose-300 border border-rose-700'
                      }`}>
                        {testStatus}
                      </div>
                    )}
                  </form>

                </div>
              )}

              {/* TAB 2: CONSTRUCT & HABITS SETTINGS */}
              {mainframeTab === 'construct' && (
                <div className="space-y-4">
                  {/* Sandbox Permission Notice */}
                  <div className="bg-rose-950/40 border border-rose-500/40 rounded-lg p-3 text-rose-200">
                    <div className="font-bold flex items-center gap-2 mb-1">
                      <span>🛡️</span>
                      <span>NIKI PERMISSION SCOPE: WEB SANDBOX ONLY</span>
                    </div>
                    <div className="text-[11px] text-slate-300 leading-relaxed">
                      สิทธิ์การทำงานทั้งหมดของ NIKI ถูกจำกัดและรันอยู่บนหน้าเว็บนี้เท่านั้น (Isolated Web Workspace) 
                      ไม่สามารถเข้าถึงไฟล์ ระบบปฏิบัติการ หรือเครือข่ายภายนอกของเครื่องจริงได้เพื่อความปลอดภัยสูงสุด
                    </div>
                  </div>

                  {/* Construct Stats */}
                  <div className="grid grid-cols-2 gap-2.5 font-mono text-[11px]">
                    <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
                      <span className="text-slate-400 block text-[10px]">CONSTRUCT:</span>
                      <span className="text-cyan-300 font-bold">Project NIKI (Biochip)</span>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
                      <span className="text-slate-400 block text-[10px]">DIGITIZED MINDS:</span>
                      <span className="text-rose-300 font-bold">32 Human Souls Merged</span>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
                      <span className="text-slate-400 block text-[10px]">LANGUAGE:</span>
                      <span className="text-emerald-300 font-bold">ภาษาไทย (Thai NLP Active)</span>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
                      <span className="text-slate-400 block text-[10px]">PERSONALITY:</span>
                      <span className="text-amber-300 font-bold">Playful Chaos Gremlin</span>
                    </div>
                  </div>

                  {/* Quick Actions (สั่งการ NIKI บนเว็บ) */}
                  <div>
                    <div className="text-[11px] font-mono font-bold text-slate-400 mb-2">
                      🎮 QUICK ACTIONS // ควบคุม NIKI บนเว็บ:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCapriAnim('perch-music');
                          setCapriMessage('เพลง Cyberpunk นี่มันแจ่มจริงๆ โยกตามฉันสิชูม!');
                          playVoice(2);
                        }}
                        className="p-2 bg-slate-900 hover:bg-slate-800 border border-cyan-800/60 rounded text-cyan-300 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        🎵 โยกเพลง (Sway)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCapriAnim('glitch');
                          setCapriMessage('สัญญาณชิป Relic โดนคลื่นรบกวนชะมัด!');
                        }}
                        className="p-2 bg-slate-900 hover:bg-slate-800 border border-amber-800/60 rounded text-amber-300 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        ⚡ Glitch สแกน
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (capriAnim === 'sleep') {
                            setCapriAnim('perch');
                            setCapriMessage('ตื่นแล้ว! มีเรื่องมันส์ๆ ให้ทำแล้วเหรอชูม?');
                            playVoice(0);
                          } else {
                            setCapriAnim('sleep');
                            setCapriMessage('ฉันของีบเอาแรงแป๊บนะชูม... Zzz');
                          }
                        }}
                        className="p-2 bg-slate-900 hover:bg-slate-800 border border-purple-800/60 rounded text-purple-300 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        💤 {capriAnim === 'sleep' ? 'ปลุก NIKI' : 'ให้ NIKI นอน'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          openTerminal();
                        }}
                        className="p-2 bg-slate-900 hover:bg-slate-800 border border-cyan-800/60 rounded text-cyan-300 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        💻 เปิด Terminal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPerchedOnWindow(!isPerchedOnWindow);
                        }}
                        className="p-2 bg-slate-900 hover:bg-slate-800 border border-rose-800/60 rounded text-rose-300 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        📍 สลับเกาะหน้าต่าง
                      </button>
                    </div>
                  </div>

                  {/* Night City Slang Dictionary */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-[10px] text-slate-400 font-mono">
                    <span className="text-cyan-400 font-bold block mb-1">NIKI DICTIONARY (ศัพท์ Night City สไตล์ NIKI):</span>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div>• <span className="text-slate-200">ชูม (Choom)</span> = เพื่อน / คู่หู</div>
                      <div>• <span className="text-slate-200">พรีม (Preem)</span> = ยอดเยี่ยม / เจ๋งเป้ง</div>
                      <div>• <span className="text-slate-200">โนวา (Nova)</span> = โคตรเท่ / แจ่ม</div>
                      <div>• <span className="text-slate-200">กอนก์ (Gonk)</span> = คนโง่ / ไก่อ่อน</div>
                      <div>• <span className="text-slate-200">คอร์โป (Corpo)</span> = พวกอัยการ / บริษัทใหญ่</div>
                      <div>• <span className="text-slate-200">เอ็ดดี้ (Eddies)</span> = เงิน</div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-800 shrink-0">
              <span className="text-[10px] text-slate-500 font-mono">
                {brainConfig.apiKey ? `✓ ${brainConfig.provider.toUpperCase()} KEY LOADED` : '⚠️ NO API KEY (LOCAL MODE)'}
              </span>
              <button
                type="button"
                onClick={() => setIsMainframeOpen(false)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs transition cursor-pointer shadow-[0_0_10px_rgba(244,63,94,0.4)]"
              >
                ปิด Mainframe
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
