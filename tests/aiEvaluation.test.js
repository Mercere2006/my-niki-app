import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluationCases, assessEvidenceResponse, assessTimelineResponse } from '../src/services/aiEvaluation.js';
import { caseFiles } from '../src/services/caseFiles.js';
import { existsSync, mkdtempSync, readdirSync, readFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

test('ชุดประเมินมี 10 กรณี รวมคำถามหลายไฟล์และคำถามที่ไม่มีหลักฐาน', () => {
  assert.equal(evaluationCases.length, 10);
  assert.ok(evaluationCases.some((item) => item.files.length > 1));
  assert.ok(evaluationCases.some((item) => item.unanswerable));
  for (const item of evaluationCases) {
    assert.ok(item.expected);
    for (const name of item.files) assert.ok(caseFiles.some((file) => file.name === name && file.content));
  }
});

test('ประเมินไทม์ไลน์ตรวจเวลาและวันถัดมาโดยยังต้องให้คนอ่านเนื้อหา', () => {
  assert.equal(assessTimelineResponse({ ok: false, error: 'API ไม่พร้อม' }).status, 'error');
  assert.equal(assessTimelineResponse({ ok: true, events: [] }).status, 'review');
  const events = ['21:30', '21:40', '21:48', '22:11', '22:14', '22:25'].map((time) => ({ time, day: 'incident' }));
  events.push({ time: '06:35', day: 'next' });
  assert.equal(assessTimelineResponse({ ok: true, events }).status, 'indicators_met');
});

test('เกณฑ์อัตโนมัติแยกคำตอบที่มีตัวบ่งชี้ คำตอบขาดข้อมูล และ API ล้มเหลว', () => {
  const factual = evaluationCases[0];
  assert.equal(assessEvidenceResponse(factual, 'ธันวา วรากร\nอ้างอิง: access_log.txt').status, 'indicators_met');
  assert.equal(assessEvidenceResponse(factual, 'ไม่ทราบข้อมูล').status, 'review');
  assert.equal(assessEvidenceResponse(factual, 'ฉันวิเคราะห์เอกสารไม่สำเร็จ').status, 'error');
  const unknown = evaluationCases.find((item) => item.unanswerable);
  assert.equal(assessEvidenceResponse(unknown, 'ข้อมูลจากเอกสารที่เปิดแล้วยังไม่เพียงพอให้ฉันตอบคำถามนี้นะชูม').status, 'indicators_met');
});

test('ตัวประเมินสร้างรายงานครบโดยไม่บันทึกคีย์ และไม่เปลี่ยนโมเดลที่ระบุ', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'niki-eval-test-'));
  const reportsDir = join(tempDir, 'reports');
  const run = spawnSync(globalThis.process.execPath, ['--import', pathToFileURL(resolve('tests/fixtures/mockGemini.mjs')).href, resolve('scripts/evaluate-ai.mjs')], {
    cwd: tempDir,
    env: { ...globalThis.process.env, NIKI_GEMINI_API_KEY: 'test-private-key', NIKI_GEMINI_MODEL: 'gemini-2.5-test' },
    encoding: 'utf8',
  });
  try {
    assert.equal(run.status, 0, run.stderr);
    assert.doesNotMatch(run.stdout + run.stderr, /test-private-key/);
    assert.match(run.stdout, /E10:/);
    assert.match(run.stdout, /T01:/);
    const reports = readdirSync(reportsDir);
    assert.equal(reports.length, 1);
    const report = readFileSync(join(reportsDir, reports[0]), 'utf8');
    assert.match(report, /gemini-2\.5-test/);
    assert.match(report, /E10/);
    assert.match(report, /T01/);
    assert.match(report, /ผู้ประเมินต้องอ่าน/);
    assert.doesNotMatch(report, /test-private-key/);
  } finally {
    if (existsSync(reportsDir)) {
      for (const name of readdirSync(reportsDir)) unlinkSync(join(reportsDir, name));
      rmdirSync(reportsDir);
    }
    rmdirSync(tempDir);
  }
});
