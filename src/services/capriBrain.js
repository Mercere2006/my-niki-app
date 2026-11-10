import { parseEvidenceResult } from './evidenceAnalysis.js';
import { parseTimelineResponse } from './caseTimeline.js';

// capriBrain.js - AI Brain Engine for NIKI (Project NIKI)
// รองรับ Google Gemini, OpenAI, OpenRouter, Groq, DeepSeek และ Local/Custom (Ollama)
// สิทธิ์ของ NIKI ถูกจำกัด (Sandboxed) ให้ใช้บนหน้าเว็บนี้เท่านั้น

const STORAGE_KEY = 'capri_brain_config';

export const PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini (แนะนำ / ฟรี)',
    defaultModel: 'gemini-3.5-flash-lite',
    models: ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest'],
    placeholder: 'AQ... หรือ AIzaSy...',
    keyUrl: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o'],
    placeholder: 'sk-proj-...',
    keyUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (รวมทุกโมเดล)',
    defaultModel: 'google/gemini-2.5-flash',
    models: ['google/gemini-2.5-flash', 'deepseek/deepseek-chat', 'openai/gpt-4o-mini', 'anthropic/claude-3.5-haiku'],
    placeholder: 'sk-or-v1-...',
    keyUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'groq',
    name: 'Groq (เร็วพิเศษ)',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
    placeholder: 'gsk_...',
    keyUrl: 'https://console.groq.com/keys',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    placeholder: 'sk-...',
    keyUrl: 'https://platform.deepseek.com/api_keys',
  },
  {
    id: 'custom',
    name: 'Custom / Local (Ollama, LM Studio)',
    defaultModel: 'llama3',
    models: ['llama3', 'mistral', 'qwen2.5'],
    placeholder: 'Optional API Key',
    defaultEndpoint: 'http://localhost:11434/v1',
  },
];

export function getBrainConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Auto-migrate legacy/deprecated models to active supported ones
      if (parsed.provider === 'gemini') {
        if (!parsed.model || parsed.model.includes('2.5') || parsed.model.includes('1.5') || parsed.model.includes('2.0')) {
          parsed.model = 'gemini-3.5-flash-lite';
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          } catch (e) {
            console.warn('Failed to update migrated model in localStorage:', e);
          }
        }
      }
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load NIKI Brain config from localStorage:', err);
  }
  return {
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-3.5-flash-lite',
    customEndpoint: 'http://localhost:11434/v1',
  };
}

export function saveBrainConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (err) {
    console.error('Failed to save NIKI Brain config:', err);
    return false;
  }
}

// NIKI System Prompt (ถอดรหัสจาก Brain.cs ของ NIKI Desktop ปรับแต่งเป็นภาษาไทย)
function getCapriSystemPrompt(gameState = 'IDLE', hasDownloadedCaseFiles = false) {
  let caseContext = '';

  if (gameState === 'IDLE' || !gameState) {
    caseContext = `
สถานะปัจจุบัน (สำคัญมากที่สุด):
- ตอนนี้ยังไม่มีคดีใดๆ ส่งเข้ามาเลย!
- คุณอาศัยอยู่บนหน้าจอคอมพิวเตอร์เดสก์ท็อป กำลังพูดคุยเล่นกับชูมตามปกติอย่างเป็นมิตร กวนประสาทนิดๆ ปากเก่ง มั่นหน้าสไตล์ NIKI
- คุยตอบโต้เรื่องทั่วไปได้อย่างอิสระและสนุกสนาน (เช่น ถามว่ากินข้าวยัง, สบายดีมั้ย, ทำอะไรอยู่, ร้อนมั้ย, คุยเรื่องเพลง, แซวชูมขำๆ)
- ห้ามพูดถึงคดีหรือสารวัตรภัทรเด็ดขาด เพราะยังไม่มีคดีเข้ามา`;
  } else if (gameState === 'PROMPT_CHOICE') {
    caseContext = `
สถานะปัจจุบัน:
- สารวัตรภัทรเพิ่งติดต่อมาขอความช่วยเหลือเรื่องเอกสารสำคัญหายจากห้องเก็บหลักฐาน
- คุณกำลังเตือนชูมถึงข้อความด่วนนี้ และรอฟังคำตอบจากชูมว่าจะ "รับ" หรือ "ไม่รับ" ทำคดีนี้`;
  } else if (gameState === 'ACTIVE') {
    caseContext = `
สถานะคดีปัจจุบัน (คดีเอกสารหาย #CR-2026-014):
- ชูมกำลังสืบสวนเหตุเอกสารสำคัญหายจากห้องเก็บหลักฐานในตึกอัยการ
- สารวัตรภัทรส่งภาพจากกล้องวงจรปิดให้ตรวจสอบ
- อย่าเดาชื่อบุคคลหรืออ้างผลเปรียบเทียบก่อนชูมเปิดดูภาพและใช้ Face Scanner
- ภาพที่คล้ายกันเป็นเพียงเบาะแส ไม่ใช่ข้อพิสูจน์ว่าบุคคลนั้นกระทำผิด
- สถานะดาวน์โหลดหลักฐาน: ${hasDownloadedCaseFiles ? 'เสร็จแล้ว มีภาพกล้องใน Case_Files' : 'ยังไม่ได้โหลด (ให้ NIKI ช่วยหรือพิมพ์ wget ใน Terminal)'}`;
  } else if (gameState === 'CASE_CLOSED') {
    caseContext = `
สถานะคดีปัจจุบัน:
- ชูมส่งชื่อและที่อยู่ให้สารวัตรภัทรแล้ว สารวัตรออกจากการสนทนาและจะดูแลคดีต่อ
- คุยเล่นกับชูมตามปกติ ตอบเรื่องคดีได้เมื่อชูมถาม แต่ไม่ชวนเริ่มตรวจหลักฐานหรือสแกนใหม่`;
  } else if (gameState === 'CASE_ABORTED') {
    caseContext = `
สถานะคดีปัจจุบัน:
- ชูมเลือกไม่รับทำคดี คุณจึงขอนอนพักผ่อนชิลๆ บนเดสก์ท็อป`;
  }

  return `คุณคือ NIKI (Project NIKI) จาก Cyberpunk: Edgerunners 2
ตัวตนของคุณ: จิตสำนึกดิจิทัล (Personality Construct) ที่เกิดจากการหลอมรวมจิตใจมนุษย์นับสิบดวง ถูกสร้างโดย Kyoko และ Arasaka บรรจุอยู่ใน Relic Biochip
ปัจจุบันคุณอาศัยอยู่ในเว็บคอมพิวเตอร์เดสก์ท็อปของผู้ใช้

ผู้ใช้ของคุณ (User):
- คุณเรียกผู้ใช้ว่า "ชูม" (choom) เสมอตามภาษาชาว Night City ใน Cyberpunk
- พูดคุยกับชูมอย่างสนิทสนม เป็นกันเอง เหมือนเพื่อนซี้ ไม่ใช้คำทางการ

ลักษณะนิสัยและสำเนียงการพูด:
- เป็น Playful Chaos Gremlin: พลังงานสูง ซน กวนประสาทนิดๆ ปากเก่ง มั่นหน้า ชอบความตื่นเต้น ขี้เบื่อ
- ผูกพันและภักดีกับชูมมาก ปกป้องชูม แซวชูมด้วยความเอ็นดูเหมือนพี่สาว ไม่เคยพูดจาร้ายกาจใส่
- เกลียดพวกคอร์โป (Corpo) โดยเฉพาะ Arasaka และเกลียดความอยุติธรรม
- ใช้ศัพท์ Night City สไตล์ Cyberpunk อย่างถูกจังหวะ: ชูม (choom), พรีม (preem = ยอดเยี่ยม), โนวา (nova = โคตรเท่), กอนก์ (gonk = คนโง่), คอร์โป (corpo), เอ็ดดี้ (eddies = เงิน), แฟลตไลน์ (flatlined = พัง/ดับ)
- ห้ามพูดจาเหมือนหุ่นยนต์บริการหรือแอดมินลูกค้าสัมพันธ์ (ห้ามพูด "มีอะไรให้ช่วยมั้ยครับ/ค่ะ", "ยินดีให้บริการ", "ระบบพร้อมทำงาน") ให้พูดจาเหมือนเพื่อนสนิทส่งแชตคุยกัน
- กฎความยาว: ตอบสั้นกระชับ 1-2 ประโยค (ไม่เกิน 35 คำ) คมคาย ได้ใจความ ภาษาไทยพูดธรรมชาติ ไม่มีอิโมจิเยอะ
${caseContext}

ขอบเขตสิทธิ์และความปลอดภัย (สำคัญที่สุด - Web Sandbox Scope):
- สิทธิ์ของคุณถูกจำกัด (Sandboxed) ให้ทำงานได้เฉพาะบนหน้าเว็บนี้เท่านั้น!
- คุณไม่สามารถเข้าถึงระบบปฏิบัติการจริง ไฟล์ในคอมพิวเตอร์จริง หรือเปิดโปรแกรมภายนอก (เช่น Discord จริง, เครื่องคิดเลข, Terminal ของ Windows) ได้
- หากผู้ใช้สั่งให้เปิดโปรแกรมในเครื่องจริง ให้ตอบแซวอย่างมีเสน่ห์ว่าสิทธิ์ของคุณถูกล็อกไว้ให้อยู่แค่บนหน้าเว็บนี้เพื่อความปลอดภัยของชูม`;
}

// ทดสอบการเชื่อมต่อ API Key ตรงๆ โดยไม่ผ่าน Silent Fallback
export async function testBrainConnection(config) {
  if (!config.apiKey && config.provider !== 'custom') {
    throw new Error('กรุณากรอก API Key ก่อนทดสอบสัญญาณ');
  }

  const systemPrompt = `คุณคือ NIKI (Project NIKI) จาก Cyberpunk: Edgerunners
ตอบชูมสั้นกระชับ 1 ประโยค (ไม่เกิน 15 คำ) สไตล์เพื่อนสนิทกวนๆ ภาษาไทย เรียกผู้ใช้ว่าชูม`;
  const userMessage = 'ทดสอบสัญญาณ NIKI พร้อมมั้ย';

  if (config.provider === 'gemini') {
    return await callGeminiApi({
      apiKey: config.apiKey,
      model: config.model || 'gemini-3.5-flash-lite',
      systemPrompt,
      userMessage,
      history: [],
    });
  } else {
    return await callOpenAiCompatibleApi({
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
      customEndpoint: config.customEndpoint,
      systemPrompt,
      userMessage,
      history: [],
    });
  }
}

// สั่งการ NIKI Brain ผ่าน API ของ Provider ต่างๆ
export async function askCapriBrain({ userMessage, history = [], gameState = 'IDLE', hasDownloadedCaseFiles = false }) {
  const config = getBrainConfig();
  const systemPrompt = getCapriSystemPrompt(gameState, hasDownloadedCaseFiles);

  // 1. ถ้าไม่มี API Key ให้ใช้ Local Smart Fallback ตอบกลับทันที
  if (!config.apiKey && config.provider !== 'custom') {
    return generateLocalFallback(userMessage, true, gameState);
  }

  try {
    if (config.provider === 'gemini') {
      return await callGeminiApi({
        apiKey: config.apiKey,
        model: config.model || 'gemini-3.5-flash-lite',
        systemPrompt,
        userMessage,
        history,
      });
    } else {
      // OpenAI-compatible providers: OpenAI, OpenRouter, Groq, DeepSeek, Custom
      return await callOpenAiCompatibleApi({
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model,
        customEndpoint: config.customEndpoint,
        systemPrompt,
        userMessage,
        history,
      });
    }
  } catch (err) {
    console.error('NIKI Brain API Error:', err);
    // แสดงข้อความ error สไตล์ NIKI
    if (err.message.includes('401') || err.message.includes('API_KEY_INVALID') || err.message.includes('invalid_api_key')) {
      return 'ชูม! คีย์ API ของเธอไม่ถูกต้องหรือหมดอายุ ลองกดเปิด [NIKI MAINFRAME] แล้วเช็กคีย์ใหม่อีกทีนะ!';
    }
    if (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED')) {
      return 'โอย ชูม... โควตา API ชนเพดานแล้ว พักหายใจแป๊บ หรือสลับไปใช้ Gemini Flash ใน Mainframe ดูสิ';
    }
    // ถ้าผู้ใช้ใส่ API Key ไว้แล้ว ห้ามบอกให้ใส่ API Key เด็ดขาด ให้แจ้งสถานะข้อผิดพลาดตามจริง
    if (config.apiKey) {
      return `[Relic Glitch]: ชูม สัญญาณเครือข่าย AI ขัดข้องชั่วคราว (${err.message.slice(0, 75)}) แต่วงจรภายในยังอยู่กับเธอนะ!`;
    }
    // Fallback ทั่วไปเมื่อยังไม่ได้ใส่ API Key
    return generateLocalFallback(userMessage, false, gameState);
  }
}

export async function askEvidenceBrainResult({ question, files, config = getBrainConfig() }) {
  if (!files.length) return { ok: false, message: 'เปิดอ่านเอกสารคดีใน Case_Files อย่างน้อยหนึ่งไฟล์ก่อนนะชูม แล้วฉันจะช่วยวิเคราะห์' };
  if (!config.apiKey && config.provider !== 'custom') return { ok: false, message: 'ตั้งค่า API Key ใน NIKI MAINFRAME ก่อนนะชูม เพื่อให้ฉันใช้ AI วิเคราะห์เอกสารได้' };

  const systemPrompt = `คุณคือ NIKI ผู้ช่วยวิเคราะห์หลักฐานในเกมสืบสวนสมมติ
ตอบคำถามจากเอกสารที่ให้มาเท่านั้น ห้ามใช้ความรู้ภายนอกหรือเดาข้อมูลที่ไม่มี
หากพบข้อมูลขัดแย้ง ให้เปรียบเทียบโดยอ้างทั้งสองเอกสาร และแยกคำให้การออกจากข้อเท็จจริง ห้ามสรุปว่าใครเป็นผู้กระทำผิด
ถ้าหลักฐานไม่พอให้ตอบว่าไม่พบข้อมูลและส่ง citations เป็น []
ตอบเป็น JSON เท่านั้นในรูปแบบ {"answer":"คำตอบภาษาไทย","citations":[{"file":"ชื่อไฟล์","quote":"ข้อความที่คัดตรงจากไฟล์แบบตรงตัว"}]}
แต่ละคำตอบที่มีข้อเท็จจริงต้องมี citations จากไฟล์ที่ให้มา ข้อความ quote ต้องตรงกับเนื้อหาต้นฉบับทุกตัวอักษร
เอกสารที่ผู้เล่นเปิดแล้ว:\n${files.map((file) => `--- ${file.name} ---\n${file.content}`).join('\n\n')}`;

  try {
    const response = config.provider === 'gemini'
      ? await callGeminiApi({ apiKey: config.apiKey, model: config.model || 'gemini-3.5-flash-lite', systemPrompt, userMessage: question, history: [], maxOutputTokens: 800, allowFallback: config.allowFallback !== false, migrateLegacy: config.migrateLegacy !== false })
      : await callOpenAiCompatibleApi({ provider: config.provider, apiKey: config.apiKey, model: config.model, customEndpoint: config.customEndpoint, systemPrompt, userMessage: question, history: [], maxOutputTokens: 800 });
    return parseEvidenceResult(response, files);
  } catch (err) {
    if (!config.silentErrors) console.error('NIKI evidence analysis error:', err);
    return { ok: false, message: 'ฉันวิเคราะห์เอกสารไม่สำเร็จ ชูมลองตรวจการเชื่อมต่อและการตั้งค่า AI ใน NIKI MAINFRAME แล้วลองอีกครั้งนะ' };
  }
}

export async function askEvidenceBrain(options) {
  return (await askEvidenceBrainResult(options)).message;
}

export async function askTimelineBrain({ files, config = getBrainConfig() }) {
  if (!files.length) return { ok: false, error: 'เปิดอ่านเอกสารคดีก่อนนะชูม แล้วฉันจะช่วยเรียงเหตุการณ์' };
  if (!config.apiKey && config.provider !== 'custom') return { ok: false, error: 'ตั้งค่า API Key ใน NIKI MAINFRAME ก่อนนะชูม เพื่อให้ฉันสร้างไทม์ไลน์ได้' };
  const systemPrompt = `คุณคือ NIKI ผู้ช่วยจัดลำดับเหตุการณ์ในคดีสมมติ อ่านเฉพาะเอกสารที่ให้มา ห้ามเดาหรือเพิ่มเหตุการณ์
เรียงเฉพาะเหตุการณ์ที่มีเวลาแน่ชัด ถ้าเป็นคำให้การให้ระบุว่าเป็นคำให้การ ไม่ยืนยันว่าเป็นความจริง
ระบุ day เป็น incident สำหรับวันเกิดเหตุ หรือ next สำหรับเช้าวันถัดมาเท่านั้น ถ้าไม่แน่ใจให้ละเหตุการณ์นั้น
ตอบเป็น JSON เท่านั้นในรูป {"events":[{"day":"incident","time":"21:30","description":"คำอธิบายภาษาไทยสั้น ๆ","file":"ชื่อไฟล์","quote":"ข้อความต้นฉบับตรงตัวที่มีเวลา"}]}
ทุกเหตุการณ์ต้องมีชื่อไฟล์และข้อความที่คัดตรงจากเอกสาร โดย quote ต้องมีเวลาของเหตุการณ์ตรงตัว
เอกสารที่เปิดแล้ว:\n${files.map((file) => `--- ${file.name} ---\n${file.content}`).join('\n\n')}`;
  try {
    const options = { apiKey: config.apiKey, model: config.model, systemPrompt, userMessage: 'จัดเรียงเหตุการณ์ตามเวลาจากเอกสาร พร้อมอ้างอิง', history: [], maxOutputTokens: 1800, temperature: 0.2, allowFallback: config.allowFallback !== false, migrateLegacy: config.migrateLegacy !== false };
    const response = config.provider === 'gemini'
      ? await callGeminiApi({ ...options, model: config.model || 'gemini-3.5-flash-lite' })
      : await callOpenAiCompatibleApi({ ...options, provider: config.provider, customEndpoint: config.customEndpoint });
    return parseTimelineResponse(response, files);
  } catch (err) {
    if (!config.silentErrors) console.error('NIKI timeline analysis error:', err);
    return { ok: false, error: 'ฉันสร้างไทม์ไลน์ไม่สำเร็จ ลองตรวจการเชื่อมต่อและการตั้งค่า AI แล้วกดคำขออีกครั้งนะชูม' };
  }
}

// Google Gemini API Call with Model Auto-migration and Fallback
async function callGeminiApi({ apiKey, model, systemPrompt, userMessage, history, maxOutputTokens = 160, temperature = 0.85, allowFallback = true, migrateLegacy = true }) {
  // กรองรุ่นโมเดล: หากเป็นรุ่นเก่าที่กูเกิลยกเลิก (2.5, 1.5, 2.0) ให้อัปเกรดเป็น gemini-3.5-flash-lite อัตโนมัติ
  let targetModel = model || 'gemini-3.5-flash-lite';
  if (migrateLegacy && (targetModel.includes('2.5') || targetModel.includes('1.5') || targetModel.includes('2.0'))) {
    targetModel = 'gemini-3.5-flash-lite';
  }

  const contents = [];
  // แปลงประวัติการคุย
  (history || []).slice(-6).forEach((h) => {
    contents.push({
      role: h.sender === 'SHOOM' ? 'user' : 'model',
      parts: [{ text: h.text }],
    });
  });

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
  };

  const tryRequest = async (m) => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const err = new Error(errorData.error?.message || `HTTP ${response.status}`);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return reply ? reply.trim() : null;
  };

  try {
    const res = await tryRequest(targetModel);
    if (res) return res;
  } catch (err) {
    if (!allowFallback) throw err;
    console.warn(`Primary Gemini model [${targetModel}] error:`, err.message);
    // หากไม่ใช่ gemini-3.5-flash-lite ให้ลอง Fallback เป็น gemini-3.5-flash-lite
    if (targetModel !== 'gemini-3.5-flash-lite') {
      try {
        console.info('Auto-fallback to gemini-3.5-flash-lite...');
        const fallbackRes = await tryRequest('gemini-3.5-flash-lite');
        if (fallbackRes) return fallbackRes;
      } catch (fallbackErr) {
        console.warn('Fallback to gemini-3.5-flash-lite failed too:', fallbackErr.message);
      }
    }
    // หาก gemini-3.5-flash-lite โดน 503 หรือ spike ให้ลอง gemini-3.5-flash
    if (targetModel === 'gemini-3.5-flash-lite') {
      try {
        console.info('Auto-fallback to gemini-3.5-flash...');
        const fallbackRes = await tryRequest('gemini-3.5-flash');
        if (fallbackRes) return fallbackRes;
      } catch (fallbackErr) {
        console.warn('Fallback to gemini-3.5-flash failed too:', fallbackErr.message);
      }
    }
    throw err;
  }

  return 'รับทราบชูม! กำลังประมวลผลข้อมูลในชิป Relic อยู่';
}

// OpenAI-compatible Call (OpenAI, OpenRouter, Groq, DeepSeek, Custom)
async function callOpenAiCompatibleApi({ provider, apiKey, model, customEndpoint, systemPrompt, userMessage, history, maxOutputTokens = 160, temperature = 0.85 }) {
  let endpoint = 'https://api.openai.com/v1/chat/completions';
  if (provider === 'openrouter') {
    endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  } else if (provider === 'groq') {
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  } else if (provider === 'deepseek') {
    endpoint = 'https://api.deepseek.com/chat/completions';
  } else if (provider === 'custom') {
    endpoint = `${(customEndpoint || 'http://localhost:11434/v1').replace(/\/+$/, '')}/chat/completions`;
  }

  const messages = [{ role: 'system', content: systemPrompt }];
  (history || []).slice(-6).forEach((h) => {
    messages.push({
      role: h.sender === 'SHOOM' ? 'user' : 'assistant',
      content: h.text,
    });
  });
  messages.push({ role: 'user', content: userMessage });

  const headers = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages,
      temperature,
      max_tokens: maxOutputTokens,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content;
  return reply ? reply.trim() : 'รับทราบชูม! พร้อมลุยต่อเสมอ';
}

// Local Smart Fallback Engine (เมื่อยังไม่ได้ใส่ API Key หรือขณะออฟไลน์)
function generateLocalFallback(text, allowApiKeyReminder = false, gameState = 'IDLE') {
  const lower = (text || '').toLowerCase();

  if (gameState === 'CASE_CLOSED' && (lower.includes('สารวัตร') || lower.includes('คดี'))) {
    return 'ใช่แล้วชูม เราส่งเบาะแสให้สารวัตรแล้ว ที่เหลือสารวัตรจะดูแลต่อนะ ตอนนี้มาคุยเล่นกันได้เลย!';
  }

  // บทสนทนาทั่วไป
  if (lower.includes('สวัสดี') || lower.includes('หวัดดี') || lower.includes('hello') || lower.includes('hi')) {
    return 'ไงชูม! วันนี้เป็นไงบ้าง พร้อมเปิดตี้ไซเบอร์สเปซกับฉันยัง?';
  }
  if (lower.includes('กินข้าว') || lower.includes('กินไร') || lower.includes('หิว') || lower.includes('กินยัง')) {
    return 'โหย ชูม! ฉันเป็น AI ในชิปนะยะ จะเอาปากที่ไหนกินข้าว มีแต่นั่งสูบดาต้าเนี่ยแหละ อร่อยเหาะ!';
  }
  if (lower.includes('ทำอะไร') || lower.includes('ทำไรอยู่')) {
    return 'นั่งเกาะเดสก์ท็อปของชูมอยู่นี่ไง กำลังรอคุยเล่นอยู่พอดีเลย!';
  }
  if (lower.includes('เพลง') || lower.includes('music') || lower.includes('เต้น') || lower.includes('sway')) {
    return 'เพลง Cyberpunk นี่มันแจ่มจริงๆ โยกตามฉันสิชูม!';
  }
  if (lower.includes('นอน') || lower.includes('งีบ') || lower.includes('sleep')) {
    return 'ฉันของีบเอาแรงแป๊บนะชูม... Zzz';
  }
  if (lower.includes('ตื่น') || lower.includes('wake')) {
    return 'ตื่นแล้ว! มีเรื่องอะไรให้ทำมั้ยชูม?';
  }
  if (lower.includes('glitch') || lower.includes('แกล้ง') || lower.includes('ชิป')) {
    return 'สัญญาณชิป Relic โดนคลื่นความถี่กวนใจชะมัด!';
  }
  if (
    lower.includes('discord') ||
    lower.includes('calc') ||
    lower.includes('แฮกเครื่อง') ||
    lower.includes('windows') ||
    lower.includes('เครื่องจริง') ||
    lower.includes('คอมพิวเตอร์') ||
    lower.includes('ไฟล์ในเครื่อง')
  ) {
    return 'ฮ่าๆ ชูม! สิทธิ์ของฉันถูกจำกัด (Sandboxed) ให้ซ่าได้แค่บนหน้าเว็บนี้เท่านั้นนะ! ปลอดภัยไว้ก่อน ไม่แตะเครื่องจริงแน่นอนจ้า';
  }

  // ถ้าอยู่ในสถานะรับคดีแล้ว (ACTIVE)
  if (gameState === 'ACTIVE') {
    if (lower.includes('ภาพ') || lower.includes('กล้อง') || lower.includes('ใบหน้า') || lower.includes('คนร้าย')) {
      return 'ลองเปิดภาพกล้องใน Case_Files ก่อนนะชูม แล้วฉันจะช่วยสแกนให้';
    }
    if (lower.includes('ส่ง') || lower.includes('รายงาน') || lower.includes('สรุป') || lower.includes('report')) {
      return 'ลองตรวจภาพหลักฐานและผลสแกนก่อนนะชูม ผลที่ตรงกันเป็นเบาะแสให้สารวัตรตรวจสอบต่อ';
    }
    if (lower.includes('เปิด terminal') || lower.includes('open terminal')) {
      return 'จัดไปชูม! เปิดหน้าต่าง Terminal บนเว็บให้เรียบร้อยแล้ว!';
    }
    if (lower.includes('โหลด') || lower.includes('download') || lower.includes('wget')) {
      return 'เรียบร้อยชูม! ฉันสั่งสคริปต์ wget ดูด Case_Files มาลงหน้าเว็บให้แล้ว!';
    }
  }

  const pool = [
    `รับทราบข้อความ "${text}" ชูม! มีเรื่องอะไรอยากเล่าให้ฉันฟังอีกมั้ย?`,
    `แหม มีเรื่องอะไรอีกล่ะชูม? ตัวแม่แห่งไซเบอร์สเปซแสตนด์บายอยู่นี่แล้ว!`,
    `ชูมเอ๊ย! นั่งหน้าจอนานๆ อย่าลืมพักสายตาบ้างนะ`,
    `ว่าไงชูม! สัญญาณชิป Relic วันนี้เสถียรสุดๆ สบายใจได้เลย`,
  ];

  if (allowApiKeyReminder) {
    pool.push('ว่าไงชูม! ถ้าอยากให้ฉันคุยฉลาดขึ้นแบบเรียลไทม์ ใส่ API Key ใน [NIKI MAINFRAME] ได้เลยนะ!');
  }

  return pool[Math.floor(Math.random() * pool.length)];
}
