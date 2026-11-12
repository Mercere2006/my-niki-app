const PREFIX = 'niki_game_v1:';
const OFFICER_TEXT_KEYS = new Set(['capriMessage', 'chatLogs', 'callMessages', 'callQueue', 'reportConversation', 'cliHistory', 'guidedEvidenceResponse', 'guidedEvidenceAnswer']);

function renameLegacyOfficer(value) {
  if (typeof value === 'string') return value
    .replaceAll('ผมกำลังส่งเอกสารให้ รบกวนคุณช่วยเปิดตรวจสอบ แล้วเราค่อย ๆ เรียงเหตุการณ์ไปด้วยกันนะครับ', 'ผมกำลังส่งเอกสารให้ รบกวนคุณช่วยตรวจสอบแล้วเรียงเหตุการณ์ให้ที')
    .replaceAll('รับสายสารวัตร', 'รับสายจากสายสืบ')
    .replaceAll('สายสารวัตร', 'สายของสายสืบ')
    .replaceAll('สารวัตรภัทรวัฒน์', 'สายสืบภัทรวัฒน์')
    .replaceAll('สารวัตรภัทร', 'สายสืบภัทรวัฒน์')
    .replaceAll('สารวัตร', 'สายสืบ');
  if (Array.isArray(value)) return value.map(renameLegacyOfficer);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, renameLegacyOfficer(entry)]));
  return value;
}

export function readGameValue(key, fallback, storage) {
  try {
    const raw = (storage ?? globalThis.localStorage)?.getItem(PREFIX + key);
    if (raw == null) return fallback;
    const value = JSON.parse(raw);
    if (fallback !== null && (typeof value !== typeof fallback || Array.isArray(value) !== Array.isArray(fallback) || value === null)) return fallback;
    return OFFICER_TEXT_KEYS.has(key) ? renameLegacyOfficer(value) : value;
  } catch {
    return fallback;
  }
}

export function writeGameValue(key, value, storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    if (!target) return false;
    target.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// Tabs can be suspended; check the original wall-clock deadline when they resume.
export function scheduleAtDeadline({ deadline, onDue, now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout, visibilityTarget = globalThis.document, windowTarget = globalThis.window }) {
  let fired = false;
  let cancelled = false;
  let timer;
  const check = () => {
    if (cancelled || fired || now() < deadline) return;
    fired = true;
    if (timer !== undefined) clearTimer(timer);
    onDue();
  };
  const arm = () => {
    timer = setTimer(() => {
      check();
      if (!cancelled && !fired) arm();
    }, Math.max(0, deadline - now()));
  };
  visibilityTarget?.addEventListener('visibilitychange', check);
  windowTarget?.addEventListener('focus', check);
  windowTarget?.addEventListener('pageshow', check);
  arm();
  return () => {
    cancelled = true;
    if (timer !== undefined) clearTimer(timer);
    visibilityTarget?.removeEventListener('visibilitychange', check);
    windowTarget?.removeEventListener('focus', check);
    windowTarget?.removeEventListener('pageshow', check);
  };
}
