const invalid = { ok: false, error: 'ฉันตรวจสอบเวลาและแหล่งอ้างอิงของไทม์ไลน์ไม่ได้ ลองกดคำขออีกครั้งนะชูม' };

export function parseTimelineResponse(response, files) {
  try {
    const parsed = JSON.parse(response.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
    if (!Array.isArray(parsed.events) || !parsed.events.length || parsed.events.length > 20) return invalid;
    const events = parsed.events.map((event) => {
      const file = files.find((item) => item.name === event.file);
      const quote = typeof event.quote === 'string' ? event.quote.trim() : '';
      const description = typeof event.description === 'string' ? event.description.trim() : '';
      if (!file || !quote || !description || !file.content.includes(quote) || !['incident', 'next'].includes(event.day) || typeof event.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(event.time) || !quote.includes(event.time)) throw new Error('invalid event');
      return { day: event.day, time: event.time, description, file: file.name, quote };
    });
    events.sort((a, b) => (a.day === b.day ? a.time.localeCompare(b.time) : a.day === 'incident' ? -1 : 1));
    return { ok: true, events };
  } catch {
    return invalid;
  }
}
