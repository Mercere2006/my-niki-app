import { useState, useEffect, useRef, useCallback } from 'react';
import { getBrainConfig, askCapriBrain, askEvidenceBrainResult, askTimelineBrain } from '../services/capriBrain';
import { greeting, replyToChoice, nextPoliceMessage, interpretDownloadReply, followUpChoices, replyToFollowUp, isCaseDownloadCommand, DOWNLOAD_COMMAND, NIKI_DOWNLOAD_OFFER } from '../services/policeConversation';
import { playIncomingCaseSound } from '../services/incomingCaseSound';
import { caseFiles, cameraPerson, cardHolderProfile } from '../services/caseFiles';
import { prepareFaceScan, interpretAnalysisReply } from '../services/caseAnalysis';
import { getOpenedEvidence } from '../services/evidenceAnalysis';
import { guidedEvidenceMessages, guidedEvidenceQuestions, getMissingGuidedFiles, initialGuidedSequence, advanceGuidedSequence } from '../services/guidedEvidence';
import { nextFaceScanStage, lowQualityMessage } from '../services/faceScanFlow';
import { interpretCaseChoice } from '../services/caseChoice';
import { initialReportConversation, advanceReportConversation, canMatchReportTarget, getNikiConversationState, isReportProfileEligible } from '../services/reportConversation';
import DesktopTopBar from './DesktopTopBar';
import DesktopTaskbar from './DesktopTaskbar';
import DesktopIcons from './DesktopIcons';
import DesktopCompanion from './DesktopCompanion';
import TerminalWindow from './TerminalWindow';
import CaseFileWindow from './CaseFileWindow';
import NikiMainframe from './NikiMainframe';
import FaceScannerWindow from './FaceScannerWindow';
import DatabaseWindow from './DatabaseWindow';
import CalculatorWindow from './CalculatorWindow';
import NotepadWindow from './NotepadWindow';
import CaseTimelineWindow from './CaseTimelineWindow';

const VOICE_CLIPS = [
  '/capri/voice/hello-morning.wav',
  '/capri/voice/hello-late.wav',
  '/capri/voice/hello-miss.wav',
];

const CAPRI_POKE_QUOTES = [
  'แตะตัวฉันทำไมชูม? ไบโอชิปของฉันมันจั๊กจี้นะยะ!',
  'NIKI ตัวแม่แห่งไซเบอร์สเปซอยู่นี่แล้วชูม!',
  'ชิป Relic ปกติดี มีเรื่องอะไรชวนคุยเล่นมั้ยชูม?',
  'ว่าไงชูม! นั่งหน้าจอนานๆ อย่าลืมพักสายตาบ้างนะ!',
  'ฉันสแตนด์บายบนเดสก์ท็อปให้ชูมเสมอเลยนะ!',
];

export default function LinuxDesktop({
  gameState = 'IDLE',
  chatLogs,
  onIncomingCase,
  onAcceptMission,
  onDeclineMission,
  onSendMessage,
}) {
  // Desktop Window States
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isTerminalMinimized, setIsTerminalMinimized] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [isExplorerMinimized, setIsExplorerMinimized] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScannerMinimized, setIsScannerMinimized] = useState(false);
  const [isPoweredOff, setIsPoweredOff] = useState(false);
  const [utilityWindows, setUtilityWindows] = useState({ human: { open: false, minimized: false }, calculator: { open: false, minimized: false }, notepad: { open: false, minimized: false }, timeline: { open: false, minimized: false } });
  const [activeWindow, setActiveWindow] = useState('terminal');
  // Time & System Tray States
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  // NIKI Companion States (Project NIKI - Thai & Sandboxed to Web)
  const [capriAnim, setCapriAnim] = useState('perch'); // 'perch' | 'idle' | 'talk' | 'glitch' | 'sleep' | 'perch-music' | 'tossed'
  const [hasIncomingCase, setHasIncomingCase] = useState(false);
  const [capriMessage, setCapriMessage] = useState('ไงชูม! ฉัน NIKI ตัวแม่แห่งไซเบอร์สเปซ สแตนด์บายอยู่บนเดสก์ท็อปแล้ว มีอะไรชวนคุยเล่นหรืออยากให้ช่วยมั้ย?');
  const [lastPlayerInput, setLastPlayerInput] = useState('');
  const [playerInput, setPlayerInput] = useState('');
  const [showBubble, setShowBubble] = useState(true);
  const [isPerchedOnWindow, setIsPerchedOnWindow] = useState(false); // สิทธิ์ของ NIKI: นั่งเกาะขอบหน้าต่าง Terminal บนเว็บ
  const [isMainframeOpen, setIsMainframeOpen] = useState(false); // หน้าต่าง NIKI Mainframe & Biochip Status
  const [isThinking, setIsThinking] = useState(false);

  // NIKI Brain / API Key States
  const [brainConfig, setBrainConfig] = useState(getBrainConfig);
  const [mainframeTab, setMainframeTab] = useState('brain'); // 'brain' | 'construct'

  // File System & Download States (ไม่มี Case_Files จนกว่าจะเขียนโค้ดดาวน์โหลด)
  const [hasDownloadedCaseFiles, setHasDownloadedCaseFiles] = useState(false);
  const [selectedCaseFile, setSelectedCaseFile] = useState(null);
  const [viewedCaseFiles, setViewedCaseFiles] = useState([]);
  const [guidedEvidenceVisible, setGuidedEvidenceVisible] = useState(false);
  const [guidedSequence, setGuidedSequence] = useState(initialGuidedSequence);
  const [guidedEvidenceResponse, setGuidedEvidenceResponse] = useState('');
  const [timelineResult, setTimelineResult] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [analysisPrompt, setAnalysisPrompt] = useState('idle');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [scanStage, setScanStage] = useState('idle');
  const [scanOrigin, setScanOrigin] = useState('niki');
  const [cliInput, setCliInput] = useState('');
  const [policeConversation, setPoliceConversation] = useState('idle');
  const [pendingPoliceLines, setPendingPoliceLines] = useState([]);
  const [downloadDialogueVisible, setDownloadDialogueVisible] = useState(false);
  const [reportConversation, setReportConversation] = useState(initialReportConversation);
  const [reportSelection, setReportSelection] = useState(null);
  const [unreadPoliceMessage, setUnreadPoliceMessage] = useState(false);
  const [showPoliceNotice, setShowPoliceNotice] = useState(false);
  const [cliHistory, setCliHistory] = useState([
    'Linux cyber-arch 6.8.9-arch1 (tty1)',
    'Welcome to Cyber Investigation Environment.',
    "Type 'help' to view available commands.",
    '',
  ]);

  const inputRef = useRef(null);
  const cliInputRef = useRef(null);
  const cliScrollRef = useRef(null);
  const cancelCaseSoundRef = useRef(null);
  const openTerminal = () => {
    setUnreadPoliceMessage(false);
    setShowPoliceNotice(false);
    setIsTerminalOpen(true);
    setIsTerminalMinimized(false);
    setActiveWindow('terminal');
  };

  const openExplorer = () => {
    setDownloadDialogueVisible(false);
    setIsExplorerOpen(true);
    setIsExplorerMinimized(false);
    setActiveWindow('explorer');
  };

  const openScanner = () => {
    setIsScannerOpen(true);
    setIsScannerMinimized(false);
    setActiveWindow('scanner');
  };

  const openUtility = (kind) => {
    setUtilityWindows((windows) => ({ ...windows, [kind]: { open: true, minimized: false } }));
    setActiveWindow(kind);
  };

  const activateAvailableWindow = (except) => {
    const available = [
      ['human', utilityWindows.human.open && !utilityWindows.human.minimized],
      ['calculator', utilityWindows.calculator.open && !utilityWindows.calculator.minimized],
      ['notepad', utilityWindows.notepad.open && !utilityWindows.notepad.minimized],
      ['timeline', utilityWindows.timeline.open && !utilityWindows.timeline.minimized],
      ['scanner', isScannerOpen && !isScannerMinimized],
      ['explorer', isExplorerOpen && !isExplorerMinimized],
      ['terminal', isTerminalOpen && !isTerminalMinimized],
    ];
    setActiveWindow(available.find(([name, visible]) => name !== except && visible)?.[0] ?? null);
  };

  const hideUtility = (kind, close = false) => {
    setUtilityWindows((windows) => ({ ...windows, [kind]: close ? { open: false, minimized: false } : { ...windows[kind], minimized: true } }));
    if (activeWindow === kind) activateAvailableWindow(kind);
  };

  const hideTerminal = (close = false) => {
    if (close) setIsTerminalOpen(false);
    else setIsTerminalMinimized(true);
    if (activeWindow === 'terminal') activateAvailableWindow('terminal');
  };

  const hideExplorer = (close = false) => {
    if (close) setIsExplorerOpen(false);
    else setIsExplorerMinimized(true);
    if (activeWindow === 'explorer') activateAvailableWindow('explorer');
  };

  const hideScanner = (close = false) => {
    if (close) setIsScannerOpen(false);
    else setIsScannerMinimized(true);
    if (activeWindow === 'scanner') activateAvailableWindow('scanner');
  };

  const offerAnalysisIfReady = () => {
    if (analysisPrompt === 'idle') {
      setGuidedEvidenceVisible(false);
      setAnalysisPrompt('offered');
      setIsPerchedOnWindow(false);
      setShowBubble(true);
      setLastPlayerInput('');
      setPlayerInput('');
      setCapriAnim('talk');
      setCapriMessage('ชูม จะให้ฉันช่วยสแกนใบหน้าเพื่อค้นหาประวัติคนในภาพไหม?');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleOpenCaseFile = (name) => {
    const file = caseFiles.find((item) => item.name === name);
    if (!file) return;
    setViewedCaseFiles((reviewed) => reviewed.includes(name) ? reviewed : [...reviewed, name]);
    setSelectedCaseFile(file);
    if (file.kind === 'cctv') offerAnalysisIfReady();
  };

  const handleBackToCaseFiles = () => {
    setSelectedCaseFile(null);
  };

  const handleAskGuidedEvidence = async (question) => {
    if (isThinking) return;
    const currentQuestion = guidedEvidenceQuestions[guidedSequence.index];
    const isTimelineRetry = question.mode === 'timeline' && guidedSequence.phase === 'complete';
    if (question.id !== currentQuestion?.id || (!['ready', 'review'].includes(guidedSequence.phase) && !isTimelineRetry)) return;
    setGuidedEvidenceVisible(true);
    setIsPerchedOnWindow(false);
    setShowBubble(true);
    setLastPlayerInput('');
    if (guidedSequence.phase === 'review') {
      setCapriMessage(guidedEvidenceResponse);
      return;
    }
    const missing = getMissingGuidedFiles(question, viewedCaseFiles);
    if (missing.length) {
      setCapriMessage(`ก่อนตอบคำถามของสารวัตร ชูมเปิดอ่านไฟล์ ${missing.join(' และ ')} ใน Case_Files ก่อนนะ แล้วกลับมากดคำถามเดิมใน Terminal ได้เลย`);
      openExplorer();
      return;
    }
    if (question.mode === 'timeline') {
      const files = getOpenedEvidence(caseFiles, viewedCaseFiles).filter((file) => question.requiredFiles.includes(file.name));
      setGuidedEvidenceVisible(false);
      setTimelineResult(null);
      setTimelineLoading(true);
      setIsThinking(true);
      openUtility('timeline');
      try {
        const result = await askTimelineBrain({ files });
        setTimelineResult(result);
        if (result.ok) setGuidedSequence((state) => advanceGuidedSequence(state, 'success'));
      } catch {
        setTimelineResult({ ok: false, error: 'ฉันสร้างไทม์ไลน์ไม่สำเร็จ ลองตรวจการตั้งค่า AI แล้วกดสร้างอีกครั้งนะชูม' });
      } finally {
        setTimelineLoading(false);
        setIsThinking(false);
      }
      return;
    }
    setIsThinking(true);
    setCapriAnim('talk');
    setCapriMessage('ได้เลยชูม ฉันกำลังตรวจเอกสารตามคำถามของสารวัตร...');
    try {
      const files = getOpenedEvidence(caseFiles, viewedCaseFiles).filter((file) => question.requiredFiles.includes(file.name));
      const result = await askEvidenceBrainResult({ question: question.question, files });
      setCapriMessage(result.message);
      if (result.ok) {
        setGuidedEvidenceResponse(result.message);
        setGuidedSequence((state) => advanceGuidedSequence(state, 'success'));
      }
      onSendMessage(`คำถามของสารวัตร: ${question.question}`, result.message);
    } catch {
      setCapriMessage('ฉันวิเคราะห์เอกสารไม่สำเร็จ ลองตรวจการตั้งค่า AI แล้วกดคำถามอีกครั้งนะชูม');
    } finally {
      setIsThinking(false);
    }
  };

  const handleContinueGuidedEvidence = () => {
    if (guidedSequence.phase !== 'review') return;
    setGuidedSequence((state) => advanceGuidedSequence(state, 'continue'));
    setGuidedEvidenceVisible(false);
    setGuidedEvidenceResponse('');
    setCapriMessage('ได้เลยชูม รอคำถามต่อไปจากสารวัตรกัน');
    openTerminal();
  };

  useEffect(() => () => cancelCaseSoundRef.current?.(), [isMuted]);

  // อัปเดตนาฬิกา Linux Top Bar ทุก 1 วินาที
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // เลื่อนหน้าจอ Terminal ลงล่างสุดเมื่อมีข้อความใหม่
  useEffect(() => {
    if (cliScrollRef.current) {
      cliScrollRef.current.scrollTop = cliScrollRef.current.scrollHeight;
    }
  }, [cliHistory, isTerminalOpen, isTerminalMinimized, policeConversation]);

  const showDownloadOffer = useCallback(() => {
    setIsPerchedOnWindow(false);
    setShowBubble(true);
    setLastPlayerInput('');
    setPlayerInput('');
    setDownloadDialogueVisible(true);
    setCapriAnim('talk');
    setCapriMessage(NIKI_DOWNLOAD_OFFER);
    setPoliceConversation('download-offer');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (isPoweredOff || !['briefing', 'follow-up-reply'].includes(policeConversation) || !pendingPoliceLines.length || !isTerminalOpen || isTerminalMinimized) return;
    const timer = setTimeout(() => {
      const next = nextPoliceMessage(pendingPoliceLines);
      setCliHistory((history) => [...history, next.line]);
      setPendingPoliceLines(next.remaining);
      if (next.showFollowUp) {
        setPoliceConversation('follow-up-choosing');
      } else if (!next.remaining.length) {
        if (policeConversation === 'follow-up-reply' && !hasDownloadedCaseFiles) showDownloadOffer();
        else setPoliceConversation('briefed');
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [policeConversation, pendingPoliceLines, isTerminalOpen, isTerminalMinimized, hasDownloadedCaseFiles, showDownloadOffer, isPoweredOff]);

  useEffect(() => {
    if (isPoweredOff || !isScannerOpen || isScannerMinimized || !['scanning', 'low-quality', 'analyzing'].includes(scanStage)) return;
    const timer = setTimeout(() => {
      setScanStage(nextFaceScanStage(scanStage, 'finished'));
      if (scanStage === 'scanning') {
        setAnalysisPrompt('enhancing');
        setIsPerchedOnWindow(false);
        setShowBubble(true);
        setLastPlayerInput('');
        setCapriAnim('talk');
        setCapriMessage(lowQualityMessage(scanOrigin));
      } else if (scanStage === 'analyzing') {
        setAnalysisPrompt('accepted');
        setCapriMessage(`ฉันพบเบาะแสแล้วชูม! คนในภาพอาจเป็น ${cameraPerson.name} ไม่ใช่ ${cardHolderProfile.name} เจ้าของบัตร ลองค้นใน HumanDB แล้วส่งให้สารวัตรตรวจสอบต่อ`);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [scanStage, scanOrigin, isScannerOpen, isScannerMinimized, isPoweredOff]);

  useEffect(() => {
    if (isPoweredOff || !reportConversation.pending.length) return;
    const timer = setTimeout(() => {
      setCliHistory((history) => [...history, reportConversation.pending[0]]);
      setReportConversation((current) => advanceReportConversation(current, 'tick'));
    }, 2500);
    return () => clearTimeout(timer);
  }, [isPoweredOff, reportConversation]);

  useEffect(() => {
    if (isPoweredOff || gameState !== 'ACTIVE' || policeConversation !== 'briefed' || !hasDownloadedCaseFiles || guidedSequence.phase !== 'pending') return;
    const timer = setTimeout(() => {
      setCliHistory((history) => [...history, guidedEvidenceMessages[guidedSequence.index + 1]]);
      setGuidedSequence((state) => advanceGuidedSequence(state, 'delivered'));
      if (!isTerminalOpen || isTerminalMinimized || activeWindow !== 'terminal') {
        setUnreadPoliceMessage(true);
        setShowPoliceNotice(true);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [isPoweredOff, gameState, policeConversation, hasDownloadedCaseFiles, guidedSequence, isTerminalOpen, isTerminalMinimized, activeWindow]);

  // เล่นเสียงพากย์ของ NIKI
  const playVoice = useCallback((idx = 0) => {
    if (isMuted) return;
    try {
      const audio = new Audio(VOICE_CLIPS[idx % VOICE_CLIPS.length]);
      audio.volume = 0.65;
      audio.play().catch((err) => {
        console.warn('Audio play prevented:', err.message);
      });
    } catch (err) {
      console.warn('Audio error:', err);
    }
  }, [isMuted]);

  // ปิด/ย่อ Bubble เมื่อกด ESC (ตรงตาม NIKI ESC STOPS ME)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowBubble(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const caseTimerRef = useRef(null);

  // เมื่อมีคนขอความช่วยเหลือเรื่องคดีมา (สารวัตรภัทรส่งเข้ามา)
  const triggerIncomingCase = useCallback(() => {
    if (isPoweredOff || hasIncomingCase || gameState !== 'IDLE') return;

    setHasIncomingCase(true);
    setCapriAnim('glitch');
    setCapriMessage('ชูม! มีคลื่นด่วนแทรกเข้ามา! สารวัตรภัทรติดต่อมาว่ามีคดีด่วนอยากให้ช่วย ชูมจะรับทำคดีนี้มั้ย?');
    setShowBubble(true);
    cancelCaseSoundRef.current?.();
    cancelCaseSoundRef.current = playIncomingCaseSound({ muted: isMuted, playVoice: () => playVoice(0) });

    onIncomingCase?.();

    setTimeout(() => {
      setCapriAnim('talk');
      inputRef.current?.focus();
    }, 1000);
  }, [hasIncomingCase, gameState, isMuted, playVoice, onIncomingCase, isPoweredOff]);

  // ฟังก์ชันเริ่มหรือรีเซ็ต Inactivity Timer
  // กฎ: ถ้ายังไม่ได้คุย หรือเมื่อชูมหยุดคุยไป 10 วินาที ให้แจ้งเตือนว่ามีคดีส่งมาจากสารวัตรภัทร
  const resetInactivityTimer = useCallback(() => {
    if (caseTimerRef.current) {
      clearTimeout(caseTimerRef.current);
      caseTimerRef.current = null;
    }

    if (!isPoweredOff && gameState === 'IDLE' && !hasIncomingCase) {
      caseTimerRef.current = setTimeout(() => {
        triggerIncomingCase();
      }, 10000); // 10 วินาที
    }
  }, [gameState, hasIncomingCase, triggerIncomingCase, isPoweredOff]);

  // เริ่มจับเวลาเมื่อโหลดหน้าเว็บ
  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (caseTimerRef.current) clearTimeout(caseTimerRef.current);
    };
  }, [resetInactivityTimer]);

  // จัดการเมื่อตอบรับคดี
  const handleAcceptCase = (customText = 'รับทำคดี') => {
    cancelCaseSoundRef.current?.();
    if (caseTimerRef.current) clearTimeout(caseTimerRef.current);
    setHasIncomingCase(false);
    setCapriAnim('talk');
    setCapriMessage('จัดไปชูม! ฉันปลดล็อก Terminal บนเว็บนี้ให้แล้ว สัญญาณของสารวัตรภัทรพร้อม... รีบแกะรอยกันเลย!');
    playVoice(1);

    onAcceptMission(customText);

    setCliHistory((prev) => [...prev, ...greeting]);
    setPoliceConversation('choosing');

    setTimeout(() => {
      openTerminal();
      setCapriAnim('perch');
    }, 700);
  };

  const handlePoliceChoice = (choice) => {
    const reply = replyToChoice(choice);
    setCliHistory((prev) => [...prev, '', reply[1]]);
    setPendingPoliceLines(reply.slice(3).filter(Boolean));
    setPoliceConversation('briefing');
  };

  const handlePoliceFollowUp = (choice) => {
    const selected = followUpChoices.find((item) => item.id === choice);
    if (!selected) return;
    setCliHistory((history) => [...history, choice === 'silent' ? '[คุณไม่ได้ตอบอะไร]' : `คุณ : ${selected.label}`]);
    const reply = replyToFollowUp(choice);
    if (reply.length) {
      setPendingPoliceLines(reply);
      setPoliceConversation('follow-up-reply');
    } else if (hasDownloadedCaseFiles) {
      setPoliceConversation('briefed');
    } else {
      showDownloadOffer();
    }
  };

  const reportAvailable = gameState === 'ACTIVE' && policeConversation === 'briefed' && hasDownloadedCaseFiles && scanStage === 'complete' && reportConversation.stage === 'idle';

  const handleProfileFound = (person) => {
    if (!reportAvailable || !isReportProfileEligible(person.id, cameraPerson.id, scanStage)) return;
    const conversation = advanceReportConversation(reportConversation, 'profile-found');
    setCliHistory((history) => [...history, '', conversation.pending[0]]);
    setReportConversation(advanceReportConversation(conversation, 'tick'));
    if (!isTerminalOpen) {
      setIsTerminalOpen(true);
      setIsTerminalMinimized(true);
    }
    setUnreadPoliceMessage(true);
    setShowPoliceNotice(true);
  };

  const handleSelectReportRequest = (type) => {
    if (!canMatchReportTarget(reportConversation.stage, type, type)) return;
    setReportSelection(type);
    setShowPoliceNotice(false);
    openUtility('human');
  };

  const handleSendReport = (person, type) => {
    if (!canMatchReportTarget(reportConversation.stage, reportSelection, type) || !isReportProfileEligible(person.id, cameraPerson.id, scanStage)) return;
    const value = type === 'name' ? person.name : person.lastKnownAddress;
    setCliHistory((history) => [...history, `คุณ : ${value}`]);
    setReportConversation((current) => advanceReportConversation(current, type === 'name' ? 'send-name' : 'send-address'));
    setReportSelection(null);
    openTerminal();
  };

  const completeCaseDownload = () => {
    setHasDownloadedCaseFiles(true);
    setPendingPoliceLines([]);
    setPoliceConversation('briefed');
    setCapriAnim('talk');
    setCapriMessage('เรียบร้อยชูม! ดาวน์โหลดภาพและเอกสารคดีแล้ว เปิดโฟลเดอร์ Case_Files บนเดสก์ท็อปได้เลย');
  };

  const startFaceScan = (origin) => {
    if (!hasDownloadedCaseFiles) {
      setShowBubble(true);
      setCapriAnim('talk');
      setCapriMessage('ขอให้ชูมดาวน์โหลดภาพจากกล้องก่อนนะ แล้วฉันจะช่วยสแกนให้');
      return;
    }
    const result = prepareFaceScan(origin === 'manual' && selectedCaseFile ? [selectedCaseFile] : caseFiles);
    setAnalysisResult(result);
    setCapriAnim('talk');
    if (result.ok) {
      setScanOrigin(origin);
      setAnalysisPrompt('accepted');
      setScanStage(nextFaceScanStage('idle', 'start'));
      setCapriMessage(origin === 'manual' ? 'กำลังสแกนใบหน้าที่คุณเลือก...' : 'ได้เลยชูม! มาดูกันว่าภาพจากกล้องจะเผยเบาะแสอะไรบ้าง');
      openScanner();
    } else {
      setCapriMessage(result.reason);
    }
  };

  const handleNikiDownloadReply = (text) => {
    const reply = text.trim();
    const decision = interpretDownloadReply(reply);
    if (decision === 'other') {
      setCapriMessage('ตอบ “ตกลง” ให้ฉันช่วยโหลด หรือ “ไม่เป็นไร” ถ้าจะโหลดเองนะชูม');
      return;
    }

    setCapriAnim('talk');
    if (decision === 'accept') {
      completeCaseDownload();
    } else {
      setCapriMessage(`ได้เลยชูม พิมพ์คำสั่งนี้ใน Terminal ได้เลย: ${DOWNLOAD_COMMAND}`);
      setPoliceConversation('download-manual');
    }
  };

  // จัดการเมื่อปฏิเสธคดี
  const handleDeclineCase = (customText = 'ไม่รับงาน ขอพักก่อน') => {
    cancelCaseSoundRef.current?.();
    if (caseTimerRef.current) clearTimeout(caseTimerRef.current);
    setHasIncomingCase(false);
    setCapriAnim('sleep');
    setCapriMessage('รับทราบชูม... งั้นฉันของีบต่อบนเดสก์ท็อปละกันนะ Zzz');
    onDeclineMission(customText);
  };

  // จัดการเมื่อผู้เล่นพิมพ์ตอบ NIKI ในกล่องข้อความ
  const handlePlayerSubmit = async (e) => {
    e?.preventDefault();
    const text = playerInput.trim();
    if (!text) return;

    const lower = text.toLowerCase();
    setLastPlayerInput(text);
    setPlayerInput('');

    // กรณีอยู่ในขั้นตอนตัดสินใจรับคดี
    if (hasIncomingCase && gameState === 'PROMPT_CHOICE') {
      const choice = interpretCaseChoice(text);
      if (choice === 'accept') {
        handleAcceptCase(text);
        return;
      } else if (choice === 'decline') {
        handleDeclineCase(text);
        return;
      } else {
        setCapriMessage('ชูมจะรับทำคดีของสารวัตรภัทรนี้มั้ย? ตอบ "รับ" เพื่อเริ่มแกะรอย หรือ "ไม่รับ" ถ้าอยากพักผ่อน');
        return;
      }
    }

    if (policeConversation === 'download-manual') {
      setCapriMessage(`พิมพ์คำสั่งนี้ใน Terminal ได้เลยนะชูม: ${DOWNLOAD_COMMAND}`);
      return;
    }

    if (policeConversation === 'download-offer') {
      handleNikiDownloadReply(text);
      return;
    }

    const analysisReply = interpretAnalysisReply(text, analysisPrompt === 'offered', reportConversation.stage);
    if (analysisReply === 'decline') {
      setAnalysisPrompt('manual-ready');
      setCapriAnim('talk');
      setCapriMessage('โอเค งั้นคุณคลิกที่ใบหน้าของคนในภาพเพื่อสแกนหาเองได้เลยนะ');
      return;
    }
    if (analysisReply === 'accept') {
      startFaceScan('niki');
      return;
    }

    // คำสั่งควบคุมเว็บเดสก์ท็อปผ่าน NIKI
    if ((lower.includes('เปิด') && lower.includes('terminal')) || lower === 'open terminal') {
      openTerminal();
      setCapriAnim('talk');
      setCapriMessage('จัดไปชูม! เปิดหน้าต่าง Terminal บนเว็บให้เรียบร้อยแล้ว!');
      playVoice(0);
      resetInactivityTimer();
    } else if ((lower.includes('ปิด') || lower.includes('ย่อ')) && (reportConversation.stage !== 'complete' || lower.includes('terminal') || lower.includes('เทอร์มินัล'))) {
      hideTerminal();
      setCapriAnim('talk');
      setCapriMessage('ย่อหน้าต่าง Terminal ให้แล้วชูม! คลิก Activities หรือไอคอน Terminal ได้เสมอนะ');
      resetInactivityTimer();
    } else if (reportConversation.stage !== 'complete' && (lower.includes('โหลด') || lower.includes('download') || lower.includes('wget'))) {
      setHasDownloadedCaseFiles(true);
      setCapriAnim('talk');
      setCapriMessage('เรียบร้อยชูม! ฉันสั่งสคริปต์ wget ดูด Case_Files มาลงหน้าเว็บให้แล้ว!');
      openExplorer();
      playVoice(1);
      resetInactivityTimer();
    } else if (lower.includes('เพลง') || lower.includes('music') || lower.includes('เต้น') || lower.includes('sway')) {
      setCapriAnim('perch-music');
      setCapriMessage('เพลง Cyberpunk นี่มันแจ่มจริงๆ โยกตามฉันสิชูม!');
      playVoice(2);
      resetInactivityTimer();
    } else if (lower.includes('นอน') || lower.includes('งีบ') || lower.includes('sleep')) {
      setCapriAnim('sleep');
      setCapriMessage('ฉันของีบเอาแรงแป๊บนะชูม... Zzz');
      resetInactivityTimer();
    } else if (lower.includes('ตื่น') || lower.includes('wake')) {
      setCapriAnim('perch');
      setCapriMessage('ตื่นแล้ว! มีเรื่องอะไรให้ทำมั้ยชูม?');
      playVoice(0);
      resetInactivityTimer();
    } else if (lower.includes('glitch') || lower.includes('แกล้ง') || lower.includes('ชิป')) {
      setCapriAnim('glitch');
      setCapriMessage('สัญญาณชิป Relic โดนคลื่นรบกวนชะมัด!');
      resetInactivityTimer();
    } else if (
      lower.includes('discord') ||
      lower.includes('calc') ||
      lower.includes('แฮกเครื่อง') ||
      lower.includes('windows') ||
      lower.includes('เครื่องจริง') ||
      lower.includes('คอมพิวเตอร์') ||
      lower.includes('ไฟล์ในเครื่อง')
    ) {
      setCapriAnim('talk');
      setCapriMessage('ฮ่าๆ ชูม! สิทธิ์ของฉันถูกจำกัด (Sandboxed) ให้ซ่าได้แค่บนหน้าเว็บนี้เท่านั้นนะ! ปลอดภัยไว้ก่อน ไม่แตะเครื่องจริงแน่นอนจ้า');
      playVoice(1);
      resetInactivityTimer();
    } else {
      // สื่อสารทั่วไปกับ NIKI ผ่าน AI Brain (คุยเล่นปกติเช่น สวัสดี, กินข้าวยัง ฯลฯ)
      setIsThinking(true);
      setCapriAnim('talk');
      setCapriMessage('กำลังประมวลผลผ่าน Relic Biochip... █');

      try {
        const aiResponse = await askCapriBrain({
          userMessage: text,
          history: chatLogs,
          gameState: getNikiConversationState(gameState, reportConversation.stage),
          hasDownloadedCaseFiles,
        });
        setCapriMessage(aiResponse);
        onSendMessage(text, aiResponse);
        playVoice(0);
      } catch (err) {
        console.error('Brain prompt error:', err);
        setCapriMessage('สัญญาณชิปขัดข้องชั่วคราวชูม! แต่ฉันยังอยู่ตรงนี้นะ');
      } finally {
        setIsThinking(false);
        // รีเซ็ตเวลานับถอยหลังเมื่อคุยจบ เพื่อรอ 10 วินาทีก่อนแจ้งเตือนคดี
        resetInactivityTimer();
      }
    }
  };

  // จัดการการพิมพ์คำสั่ง CLI ใน Terminal
  const handleCliSubmit = (e) => {
    e?.preventDefault();
    const cmd = cliInput.trim();
    if (!cmd) return;

    const lower = cmd.toLowerCase();
    const promptLine = `shoom@cyber-arch:~$ ${cmd}`;
    const newHistory = [...cliHistory, promptLine];

    // คำสั่งดาวน์โหลด Case_Files: wget, curl, download, python download.py, fetch
    if (policeConversation === 'download-manual' && lower.startsWith('wget') && !isCaseDownloadCommand(cmd)) {
      newHistory.push(`ไม่พบไฟล์คดี กรุณาใช้คำสั่ง ${DOWNLOAD_COMMAND}`, '');
    } else if (
      lower.includes('wget') ||
      lower.includes('curl') ||
      lower.includes('download') ||
      lower.includes('python') ||
      lower.includes('fetch')
    ) {
      newHistory.push(
        `--${currentTime}--  https://police.gov/case_files`,
        'Resolving police.gov (police.gov)... 10.200.4.1',
        'Connecting to police.gov (police.gov)|10.200.4.1|:443... connected.',
        'HTTP request sent, awaiting response... 200 OK',
        'Content-Type: application/zip',
        'Saving to: \'case_files.zip\'',
        '',
        'case_files.zip      100%[===================>] download complete',
        '',
        '[+] Extracting archive case_files.zip -> ~/Desktop/Case_Files/',
        ...caseFiles.map((file) => `    -> ${file.name}`),
        '[✓] SUCCESS: Case_Files ดาวน์โหลดและติดตั้งลงหน้า Desktop เรียบร้อยแล้ว!',
        '[+] เปิด Case_Files เพื่อดูไฟล์หลักฐาน',
        ''
      );
      setHasDownloadedCaseFiles(true);
      if (policeConversation === 'download-manual') {
        setPoliceConversation('briefed');
        setCapriMessage('โหลดไฟล์คดีเรียบร้อยแล้วชูม เปิดดูได้ใน Case_Files เลย');
      }
      openExplorer();
      playVoice(1);
    } else if (lower === 'ls' || lower === 'dir') {
      if (hasDownloadedCaseFiles) {
        newHistory.push(
          'Desktop/  Downloads/  Documents/',
          `📁 Case_Files/ [${caseFiles.map((file) => file.name).join('  ')}]`,
          ''
        );
      } else {
        newHistory.push('Desktop/  Downloads/  Documents/', '(โฟลเดอร์ Case_Files ยังไม่มีบนเครื่อง กรุณารัน wget เพื่อดาวน์โหลด)', '');
      }
    } else if (lower === 'clear') {
      setCliHistory([]);
      setCliInput('');
      return;
    } else if (lower === 'whoami') {
      newHistory.push('shoom', '');
    } else if (lower === 'cat' || lower.startsWith('cat ')) {
      if (hasDownloadedCaseFiles) {
        const path = cmd.slice(3).trim();
        const file = caseFiles.find((item) => path.split(/[\\/]/).pop() === item.name);
        if (file) {
          newHistory.push(file.kind === 'document' ? file.content : `${file.name}: เป็นไฟล์ภาพ เปิดดูได้ใน File Explorer`, '');
          if (file.kind === 'document') setViewedCaseFiles((reviewed) => reviewed.includes(file.name) ? reviewed : [...reviewed, file.name]);
        }
        else newHistory.push(path ? `cat: ${path}: No such file or directory` : 'cat: กรุณาระบุชื่อไฟล์', '');
      } else {
        newHistory.push('cat: Case_Files: No such file or directory (ยังไม่ได้ดาวน์โหลดไฟล์ลงเครื่อง)', '');
      }
    } else if (lower === 'help') {
      newHistory.push(
        'Available Commands:',
        '  wget https://police.gov/case_files  - เขียนโค้ดดาวน์โหลดไฟล์คดีลงเครื่อง',
        '  ls                                  - ดูรายชื่อไฟล์ในเครื่อง',
        '  cat <file>                          - ตรวจชนิดไฟล์หลักฐาน',
        '  clear                               - ล้างหน้าจอ Terminal',
        '  help                                - แสดงรายการคำสั่ง',
        ''
      );
    } else {
      newHistory.push(`bash: ${cmd}: command not found. Type 'help' for commands.`, '');
    }

    setCliHistory(newHistory);
    setCliInput('');
  };

  // แอนิเมชันของ Sprite NIKI จาก Assets แท้ใน capri
  const getCapriSprite = () => {
    if (gameState === 'CASE_CLOSED' || capriAnim === 'perch-music') return '/capri/readme/perch-music.webp';
    if (gameState === 'CASE_ABORTED' || capriAnim === 'sleep') return '/capri/readme/sleep.webp';
    if (capriAnim === 'glitch') return '/capri/readme/glitch.webp';
    if (capriAnim === 'talk') return '/capri/readme/talk.webp';
    if (capriAnim === 'tossed') return '/capri/readme/tossed.webp';
    if (capriAnim === 'idle') return '/capri/readme/idle.webp';
    return '/capri/readme/perch.webp';
  };

  // คลิกทักทาย NIKI
  const handlePokeCapri = () => {
    if (['download-offer', 'download-manual'].includes(policeConversation)) {
      setShowBubble(true);
      inputRef.current?.focus();
      return;
    }
    playVoice(Math.floor(Math.random() * VOICE_CLIPS.length));
    setShowBubble(true);
    setCapriAnim('tossed');
    const quote = CAPRI_POKE_QUOTES[Math.floor(Math.random() * CAPRI_POKE_QUOTES.length)];
    setCapriMessage(quote);
    setTimeout(() => {
      setCapriAnim('perch');
    }, 1200);
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none font-['Chakra_Petch',sans-serif] bg-black bg-cover bg-center"
      style={{ backgroundImage: `url('/bg.jpg')` }}
    >
      <div className={isPoweredOff ? 'hidden' : 'contents'}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none"></div>
      <DesktopTopBar
        openTerminal={openTerminal}
        isTerminalOpen={isTerminalOpen}
        isTerminalMinimized={isTerminalMinimized}
        setIsMainframeOpen={setIsMainframeOpen}
        setMainframeTab={setMainframeTab}
        brainConfig={brainConfig}
        currentDate={currentDate}
        currentTime={currentTime}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
      />
      <DesktopTaskbar
        isTerminalOpen={isTerminalOpen}
        isTerminalMinimized={isTerminalMinimized}
        isExplorerOpen={isExplorerOpen}
        isExplorerMinimized={isExplorerMinimized}
        activeWindow={activeWindow}
        openTerminal={openTerminal}
        openExplorer={openExplorer}
        hideTerminal={hideTerminal}
        hideExplorer={hideExplorer}
        isScannerOpen={isScannerOpen}
        isScannerMinimized={isScannerMinimized}
        openScanner={openScanner}
        hideScanner={hideScanner}
        utilityWindows={utilityWindows}
        openUtility={openUtility}
        hideUtility={hideUtility}
        hasDownloadedCaseFiles={hasDownloadedCaseFiles}
        onShutdown={() => { cancelCaseSoundRef.current?.(); setIsPoweredOff(true); }}
        unreadPoliceMessage={unreadPoliceMessage}
      />
      <DesktopIcons
        openExplorer={openExplorer}
        hasDownloadedCaseFiles={hasDownloadedCaseFiles}
      />
      {showPoliceNotice && <div role="status" className="absolute right-4 top-12 z-[60] flex w-[min(22rem,calc(100vw-2rem))] items-start gap-2 rounded-lg border border-cyan-700 bg-slate-950/95 p-3 text-slate-100 shadow-xl"><button type="button" onClick={openTerminal} className="min-w-0 flex-1 cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-cyan-400"><span className="block font-mono text-xs font-bold text-cyan-300">&gt;_ TERMINAL // ข้อความใหม่</span><span className="mt-1 block text-sm">สารวัตรภัทรติดต่อมา คลิกเพื่อเปิด Terminal</span></button><button type="button" onClick={() => setShowPoliceNotice(false)} aria-label="ปิดแจ้งเตือน Terminal" className="cursor-pointer px-1 text-slate-400 hover:text-white">✕</button></div>}
      {reportSelection && <div role="status" draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('text/plain', `case-report:${reportSelection}`); }} className="absolute right-4 top-12 z-[60] flex w-[min(22rem,calc(100vw-2rem))] cursor-grab items-start gap-3 rounded border border-cyan-400 bg-slate-950/95 p-3 text-sm text-cyan-100 shadow-lg active:cursor-grabbing"><div className="min-w-0 flex-1"><div className="font-bold text-emerald-400">สารวัตรภัทร: {reportSelection === 'name' ? 'ได้เรื่องบ้างไหม' : 'ว่าแต่คุณมีที่อยู่ของเขาไหม'}</div><div className="mt-1 text-xs text-cyan-200">คลิกข้อมูลที่ไฮไลต์ใน HumanDB หรือลากกล่องนี้ไปวางบนข้อมูล</div></div><button type="button" onClick={() => setReportSelection(null)} aria-label="ยกเลิกคำร้อง" className="cursor-pointer px-1 text-slate-400 hover:text-white">✕</button></div>}
      <DesktopCompanion
        isPerchedOnWindow={isPerchedOnWindow}
        isTerminalOpen={isTerminalOpen}
        isTerminalMinimized={isTerminalMinimized}
        showBubble={showBubble}
        lastPlayerInput={lastPlayerInput}
        capriMessage={capriMessage}
        isThinking={isThinking}
        handlePlayerSubmit={handlePlayerSubmit}
        inputRef={inputRef}
        playerInput={playerInput}
        setPlayerInput={setPlayerInput}
        hasIncomingCase={hasIncomingCase}
        gameState={gameState}
        handleAcceptCase={handleAcceptCase}
        handleDeclineCase={handleDeclineCase}
        setIsMainframeOpen={setIsMainframeOpen}
        setMainframeTab={setMainframeTab}
        brainConfig={brainConfig}
        handlePokeCapri={handlePokeCapri}
        getCapriSprite={getCapriSprite}
        analysisPromptVisible={(['offered', 'manual-ready', 'enhancing'].includes(analysisPrompt) || guidedEvidenceVisible) && showBubble}
        downloadPromptVisible={downloadDialogueVisible && showBubble && isTerminalOpen && !isTerminalMinimized}
        awaitingDownloadReply={policeConversation === 'download-offer'}
        guidedEvidenceVisible={guidedEvidenceVisible}
        onDismissGuidedEvidence={() => { setGuidedEvidenceVisible(false); setCapriMessage('ได้เลยชูม มาคุยเล่นกันต่อเถอะ'); }}
        canContinueGuidedEvidence={guidedSequence.phase === 'review'}
        onContinueGuidedEvidence={handleContinueGuidedEvidence}
      />
      <TerminalWindow
        isTerminalOpen={isTerminalOpen}
        isTerminalMinimized={isTerminalMinimized}
        activeWindow={activeWindow}
        setActiveWindow={setActiveWindow}
        hideTerminal={hideTerminal}
        isPerchedOnWindow={isPerchedOnWindow}
        showBubble={showBubble}
        capriMessage={capriMessage}
        handlePokeCapri={handlePokeCapri}
        getCapriSprite={getCapriSprite}
        cliScrollRef={cliScrollRef}
        cliHistory={cliHistory}
        policeConversation={policeConversation}
        handlePoliceChoice={handlePoliceChoice}
        handlePoliceFollowUp={handlePoliceFollowUp}
        handleCliSubmit={handleCliSubmit}
        cliInputRef={cliInputRef}
        cliInput={cliInput}
        setCliInput={setCliInput}
        hasDownloadedCaseFiles={hasDownloadedCaseFiles}
        reportStage={reportConversation.stage}
        onSelectReportRequest={handleSelectReportRequest}
        onAskGuidedEvidence={handleAskGuidedEvidence}
        activeGuidedQuestion={['ready', 'review'].includes(guidedSequence.phase) ? guidedEvidenceQuestions[guidedSequence.index]?.id : null}
        isThinking={isThinking}
      />
      <CaseFileWindow
        isExplorerOpen={isExplorerOpen}
        hasDownloadedCaseFiles={hasDownloadedCaseFiles}
        isExplorerMinimized={isExplorerMinimized}
        activeWindow={activeWindow}
        setActiveWindow={setActiveWindow}
        hideExplorer={hideExplorer}
        selectedCaseFile={selectedCaseFile}
        viewedCaseFiles={viewedCaseFiles}
        onOpenCaseFile={handleOpenCaseFile}
        onBackToFiles={handleBackToCaseFiles}
        manualScanReady={analysisPrompt === 'manual-ready'}
        onManualScan={() => startFaceScan('manual')}
        onOpenPoliceQuestions={openTerminal}
        hasPoliceQuestions={guidedSequence.index >= 0 && guidedSequence.phase !== 'pending' && guidedSequence.phase !== 'complete'}
        hasTimelineResult={Boolean(timelineResult?.ok)}
        onOpenTimeline={() => openUtility('timeline')}
      />
      <FaceScannerWindow
        isOpen={isScannerOpen}
        isMinimized={isScannerMinimized}
        isActive={activeWindow === 'scanner'}
        onActivate={() => setActiveWindow('scanner')}
        onMinimize={() => hideScanner()}
        onClose={() => hideScanner(true)}
        evidence={analysisResult}
        stage={scanStage}
        onOpenHumanDB={() => openUtility('human')}
      />
      <DatabaseWindow isOpen={utilityWindows.human.open} isMinimized={utilityWindows.human.minimized} isActive={activeWindow === 'human'} onActivate={() => setActiveWindow('human')} onMinimize={() => hideUtility('human')} onClose={() => hideUtility('human', true)} reportStage={reportConversation.stage} reportSelection={reportSelection} reportAvailable={reportAvailable} reportPersonId={cameraPerson.id} onProfileFound={handleProfileFound} onSendName={(person) => handleSendReport(person, 'name')} onSendAddress={(person) => handleSendReport(person, 'address')} />
      <CalculatorWindow isOpen={utilityWindows.calculator.open} isMinimized={utilityWindows.calculator.minimized} isActive={activeWindow === 'calculator'} onActivate={() => setActiveWindow('calculator')} onMinimize={() => hideUtility('calculator')} onClose={() => hideUtility('calculator', true)} />
      <NotepadWindow isOpen={utilityWindows.notepad.open} isMinimized={utilityWindows.notepad.minimized} isActive={activeWindow === 'notepad'} onActivate={() => setActiveWindow('notepad')} onMinimize={() => hideUtility('notepad')} onClose={() => hideUtility('notepad', true)} />
      <CaseTimelineWindow isOpen={utilityWindows.timeline.open} isMinimized={utilityWindows.timeline.minimized} isActive={activeWindow === 'timeline'} onActivate={() => setActiveWindow('timeline')} onMinimize={() => hideUtility('timeline')} onClose={() => hideUtility('timeline', true)} loading={timelineLoading} result={timelineResult} onRetry={() => handleAskGuidedEvidence(guidedEvidenceQuestions.find((item) => item.mode === 'timeline'))} onOpenSource={(name) => { handleOpenCaseFile(name); openExplorer(); }} />
      <NikiMainframe
        isMainframeOpen={isMainframeOpen}
        setIsMainframeOpen={setIsMainframeOpen}
        mainframeTab={mainframeTab}
        setMainframeTab={setMainframeTab}
        brainConfig={brainConfig}
        setBrainConfig={setBrainConfig}
        capriAnim={capriAnim}
        setCapriAnim={setCapriAnim}
        setCapriMessage={setCapriMessage}
        playVoice={playVoice}
        openTerminal={openTerminal}
        setHasDownloadedCaseFiles={setHasDownloadedCaseFiles}
        openExplorer={openExplorer}
        isPerchedOnWindow={isPerchedOnWindow}
        setIsPerchedOnWindow={setIsPerchedOnWindow}
      />
      </div>
      {isPoweredOff && <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#03070c] px-6 text-center text-slate-300" aria-label="เครื่องปิดอยู่"><div className="font-mono text-xs tracking-[0.25em] text-slate-500">NIKI OS</div><div className="mt-3 text-lg font-semibold text-slate-300">เครื่องปิดอยู่</div><button type="button" autoFocus onClick={() => setIsPoweredOff(false)} className="mt-7 flex cursor-pointer items-center gap-2 rounded border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-cyan-200 hover:border-cyan-700 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-cyan-400"><span aria-hidden="true" className="text-xl">⏻</span>เปิดเครื่อง</button></div>}
    </div>
  );
}
