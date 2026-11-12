const invalidResponse = 'ฉันตรวจสอบแหล่งอ้างอิงไม่ได้ ลองถามใหม่อีกครั้งนะชูม';

export function getOpenedEvidence(files, openedNames) {
  const opened = new Set(openedNames);
  return files.filter((file) => file.kind === 'document' && typeof file.content === 'string' && opened.has(file.name)).map(({ name, content }) => ({ name, content }));
}

export function parseEvidenceResult(response, files) {
  try {
    const parsed = JSON.parse(response.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
    if (typeof parsed.answer !== 'string' || !parsed.answer.trim() || !Array.isArray(parsed.citations)) return { ok: false, message: invalidResponse };
    if (!parsed.citations.length) return { ok: false, message: 'ข้อมูลจากเอกสารที่เปิดแล้วยังไม่เพียงพอให้ฉันตอบคำถามนี้นะชูม' };
    const citations = parsed.citations.map((citation) => {
      const file = files.find((item) => item.name === citation.file);
      if (!file || typeof citation.quote !== 'string' || !citation.quote.trim() || !file.content.includes(citation.quote.trim())) throw new Error('invalid citation');
      return `• ${file.name}: “${citation.quote.trim()}”`;
    });
    const answer = parsed.answer.trim();
    return { ok: true, answer, message: `${answer}\n\nอ้างอิง:\n${citations.join('\n')}` };
  } catch {
    return { ok: false, message: invalidResponse };
  }
}

export function parseEvidenceResponse(response, files) {
  return parseEvidenceResult(response, files).message;
}
