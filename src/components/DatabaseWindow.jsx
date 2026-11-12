import DesktopWindow from './DesktopWindow';
import { findPersonByName } from '../services/caseDatabases';
import { useGameState } from '../hooks/useGameState';
import CctvImage from './CctvImage';

function Details({ rows }) {
  return <dl className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">{rows.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-[11px] font-medium text-cyan-400">{label}</dt><dd className="mt-0.5 break-words text-sm font-semibold text-slate-100">{value}</dd></div>)}</dl>;
}

function KnownFacts({ person, reportStage, reportSelection, isReportTarget, onSendAddress }) {
  const rows = [
    ['วันเกิด', person.dateOfBirth],
    ['สถานที่เกิด', person.placeOfBirth],
    ['ตำหนิและรอยแผลเป็น', person.distinguishingMarks],
    ['ชื่ออื่น', person.aliases],
    ['อาชีพ', person.occupation],
    ['กรุ๊ปเลือด', person.bloodType],
    ['สถานภาพสมรส', person.maritalStatus],
    ['ใบอนุญาตอาวุธปืน', person.firearmLicense],
    ['ที่อยู่ล่าสุด', person.lastKnownAddress],
  ];
  return <section aria-label="ข้อมูลที่ทราบ" className="mt-5"><h3 className="mb-2 text-xs font-bold tracking-wide text-cyan-200">ข้อมูลที่ทราบ</h3><dl className="space-y-0.5">{rows.map(([label, value]) => <div key={label} className="grid grid-cols-[minmax(7.5rem,0.8fr)_minmax(0,1.4fr)] gap-0.5 text-xs leading-relaxed"><dt className="bg-cyan-950/60 px-3 py-2 text-cyan-300">{label}</dt><dd className="whitespace-pre-line break-words bg-slate-800/80 px-3 py-2 font-medium text-slate-100">{label === 'ที่อยู่ล่าสุด' && isReportTarget && reportStage === 'awaiting-address' && reportSelection === 'address' ? <button type="button" onClick={() => onSendAddress(person)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (event.dataTransfer.getData('text/plain') === 'case-report:address') onSendAddress(person); }} aria-label="ส่งที่อยู่ล่าสุดให้สายสืบภัทรวัฒน์ อนันต์กุล" className="w-full cursor-pointer rounded border border-dashed border-cyan-400 bg-cyan-950/50 p-2 whitespace-pre-line text-left text-cyan-200 hover:bg-cyan-900 focus-visible:outline-2 focus-visible:outline-cyan-400">{value}</button> : value}</dd></div>)}</dl></section>;
}

export default function DatabaseWindow({ isOpen, isMinimized, isActive, onActivate, onMinimize, onClose, reportStage, reportSelection, reportPersonId, reportReady, onSendName, onSendAddress, onPersonFound }) {
  const [query, setQuery] = useGameState('humanQuery', '');
  const [result, setResult] = useGameState('humanResult', null);
  const [searched, setSearched] = useGameState('humanSearched', false);
  const isReportTarget = reportReady && result?.id === reportPersonId;
  const search = (event) => {
    event.preventDefault();
    const person = findPersonByName(query);
    setResult(person);
    setSearched(true);
    if (person) onPersonFound?.(person);
  };
  const back = () => { setResult(null); setSearched(false); setQuery(''); };


  return (
    <DesktopWindow title="HUMANDB // ฐานข้อมูลบุคคล" windowLabel="HumanDB" isOpen={isOpen} isMinimized={isMinimized} isActive={isActive} onActivate={onActivate} onMinimize={onMinimize} onClose={onClose} compact>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#031522] text-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-900/70 bg-[#09283b] px-4 py-2.5 font-mono text-xs">
          <span className="font-bold tracking-wider text-cyan-100">HUMAN_DB // THAILAND</span>
          <span className="text-cyan-500">ฐานข้อมูลจำลอง</span>
        </div>
        {result ? (
          <div className="mx-auto w-full max-w-3xl p-4 sm:p-5">
            <button type="button" onClick={back} className="mb-4 rounded border border-cyan-700 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-950">← ค้นหาใหม่</button>
              <div className="flex flex-col gap-4 sm:flex-row">
                {result.id === 'P-038' ? <div className="w-full max-w-48 self-start border border-cyan-900"><CctvImage src={result.imageUrl} subject="dashcam" focused /></div> : <img src={result.imageUrl} alt={`ภาพประจำตัว ${result.name}`} className="h-auto w-full max-w-48 self-start border border-cyan-900" />}
                <div className="min-w-0 flex-1 space-y-4"><div><div className="font-mono text-[10px] tracking-wider text-cyan-500">แฟ้มบุคคล // {result.id}</div><h2 className="mt-1 text-lg font-bold text-white">{isReportTarget && reportStage === 'awaiting-suspect' && reportSelection === 'name' ? <button type="button" onClick={() => onSendName(result)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (event.dataTransfer.getData('text/plain') === 'case-report:name') onSendName(result); }} aria-label={`ส่งชื่อ ${result.name} ให้สายสืบภัทรวัฒน์ อนันต์กุล`} className="cursor-pointer rounded border border-dashed border-cyan-400 bg-cyan-950/50 px-2 py-1 text-left text-cyan-200 hover:bg-cyan-900 focus-visible:outline-2 focus-visible:outline-cyan-400">{result.name}</button> : result.name}</h2>{reportStage === 'greeting' && <p className="mt-2 text-xs text-cyan-300">สายสืบกำลังส่งข้อความเข้ามาในสาย...</p>}</div><Details rows={[[ 'เพศ', result.gender ], [ 'อายุ', `${result.age} ปี` ], [ 'สัญชาติ', result.nationality ], [ 'สีตา', result.eyeColor ], [ 'ส่วนสูง', result.height ]]} /></div>
              </div>
            <KnownFacts person={result} reportStage={reportStage} reportSelection={reportSelection} isReportTarget={isReportTarget} onSendAddress={onSendAddress} />
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-8">
            <div className="mb-8 text-center"><h2 className="font-mono text-2xl font-bold tracking-widest text-white sm:text-3xl">HUMAN_DB</h2><p className="mt-1 text-xs tracking-wide text-cyan-400">ระบบค้นหาข้อมูลบุคคล</p></div>
            <form onSubmit={search} className="space-y-3"><label htmlFor="human-query" className="block text-sm font-semibold text-cyan-200">ชื่อและนามสกุล</label><div className="flex flex-wrap gap-2"><input id="human-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="กรอกชื่อและนามสกุล" className="min-w-0 flex-1 rounded border border-cyan-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400" /><button type="submit" className="rounded border border-cyan-500 bg-cyan-950 px-5 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-900">ค้นหา</button></div></form>
            {searched && <p role="status" className="mt-3 text-xs text-amber-300">{query.trim() ? 'ไม่พบข้อมูล กรุณาตรวจสอบแล้วลองอีกครั้ง' : 'กรุณากรอกชื่อและนามสกุล'}</p>}
          </div>
        )}
        <div className="mt-auto border-t border-cyan-950 px-4 py-2 text-[11px] text-slate-500">ข้อมูลทั้งหมดเป็นข้อมูลสมมติในเกม</div>
      </div>
    </DesktopWindow>
  );
}
