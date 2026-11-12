import { useState, useEffect, useRef, useCallback } from 'react';
import { getBrainConfig, askCapriBrain, askEvidenceBrainResult, askTimelineBrain } from '../services/capriBrain';
import { POLICE_PREFIX } from '../services/policeConversation';
import { initialAttachment, advanceAttachment } from '../services/callAttachment';
import { initialNikiMessage, callGreeting, callChoices, getCallBriefing, callbackGreeting, callbackChoice, missedCallbackGreeting, missedCallbackChoice, getCallbackContinuation, getRingDeadline, isRingExpired, splitCallText, stripPolicePrefix } from '../services/policeCall';
import { playIncomingCaseSound } from '../services/incomingCaseSound';
import { caseFiles, cameraPerson, cardHolderProfile } from '../services/caseFiles';
import { prepareFaceScan, interpretAnalysisReply } from '../services/caseAnalysis';
import { getOpenedEvidence } from '../services/evidenceAnalysis';
import { initialGuidedSequence, advanceGuidedSequence } from '../services/guidedEvidence';
import { interpretEvidenceOffer, getManualEvidence, getManualEvidenceResult } from '../services/evidenceInteraction';
import { FOLLOWUP_DELAY_MS, INTERTITLE_MS, nextFollowupPhase, followupIntroduction, followupFiles, followupQuestions as guidedEvidenceQuestions, followupAcknowledgements, formatTimelineReply, inspectSimulatedDocuments } from '../services/caseFollowup';
import { dashcamFiles, dashcamPerson, endingQueue, endingReply, advanceEnding, END_SCREEN_DELAY_MS } from '../services/caseEnding';
import { nextFaceScanStage } from '../services/faceScanFlow';
import { initialReportConversation, advanceReportConversation, canMatchReportTarget, canOfferVictimReply, getNikiConversationState, isReportProfileEligible, shouldCloseCallAfterMessage, REPORT_END_MESSAGE, REPORT_SUSPECT_REQUEST } from '../services/reportConversation';
import { useGameState } from '../hooks/useGameState';
import { readGameValue, writeGameValue, scheduleAtDeadline } from '../services/gamePersistence';
import { desktopFolders, folderLocation, moveFolderToTrash, restoreFolder, deleteFolderPermanently, TRASH_FOLDER_DRAG } from '../services/trash';
import { isGuidanceRequest, getNextStepGuidance } from '../services/nikiGuidance';
import { playNikiGuidanceSound } from '../services/nikiGuidanceSound';
import DesktopTopBar from './DesktopTopBar';
import DesktopTaskbar from './DesktopTaskbar';
import PoliceCallWindow from './PoliceCallWindow';
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
import TrashWindow from './TrashWindow';

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

const INTERTITLE_TEXT = 'สำนักงานตำรวจแห่งชาติ\nกรุงเทพมหานคร\n15:45 น.';
const INTERTITLE_CHARACTERS = splitCallText(INTERTITLE_TEXT);
const INTERTITLE_TYPING_INTERVAL_MS = 65;
const restoreAttachment = (value) => value.stage === 'checking' ? { ...value, stage: 'error' } : value;
const restoreNikiMessage = (value) => /กำลังประมวลผลผ่าน Relic Biochip|ฉันกำลังตรวจเอกสารตามคำถาม/.test(value) ? 'การวิเคราะห์ก่อนรีเฟรชหยุดไปแล้ว ลองส่งคำถามอีกครั้งนะชูม' : value;
const restoreEvidenceMode = (value) => value === 'assisting' ? 'offer' : value;

export default function LinuxDesktop({
  gameState = 'IDLE',
  chatLogs,
  onIncomingCase,
  onAcceptMission,
  onSendMessage,
}) {
  // Desktop Window States
  const [isCallOpen, setIsCallOpen] = useGameState('isCallOpen', false);
  const [isCallMinimized, setIsCallMinimized] = useGameState('isCallMinimized', false);
  const [callMessages, setCallMessages] = useGameState('callMessages', []);
  const [callQueue, setCallQueue] = useGameState('callQueue', []);
  const [attachment, setAttachment] = useGameState('attachment', initialAttachment, restoreAttachment);
  const [uploadProgress, setUploadProgress] = useGameState('uploadProgress', 0);
  const [documentsAttachment, setDocumentsAttachment] = useGameState('documentsAttachment', initialAttachment, restoreAttachment);
  const [documentsUploadProgress, setDocumentsUploadProgress] = useGameState('documentsUploadProgress', 0);
  const [dashcamAttachment, setDashcamAttachment] = useGameState('dashcamAttachment', initialAttachment, restoreAttachment);
  const [dashcamUploadProgress, setDashcamUploadProgress] = useGameState('dashcamUploadProgress', 0);
  const [endingStage, setEndingStage] = useGameState('endingStage', 'idle');
  const [showFinalScreen, setShowFinalScreen] = useGameState('showFinalScreen', false);
  const dashcamReleased = dashcamAttachment.stage === 'complete';
  const [followupPhase, setFollowupPhase] = useGameState('followupPhase', 'pending');
  const [intertitleTypedCount, setIntertitleTypedCount] = useGameState('intertitleTypedCount', 0);
  const [incomingDeadline, setIncomingDeadline] = useGameState('incomingDeadline', () => Date.now() + 10000);
  const [callRingDeadline, setCallRingDeadline] = useGameState('callRingDeadline', null);
  const [callEndReason, setCallEndReason] = useGameState('callEndReason', 'declined');
  const documentsReleased = documentsAttachment.stage === 'complete';
  const [typedCount, setTypedCount] = useState(0);
  const [isTerminalOpen, setIsTerminalOpen] = useGameState('isTerminalOpen', false);
  const [isTerminalMinimized, setIsTerminalMinimized] = useGameState('isTerminalMinimized', false);
  const [isExplorerOpen, setIsExplorerOpen] = useGameState('isExplorerOpen', false);
  const [isExplorerMinimized, setIsExplorerMinimized] = useGameState('isExplorerMinimized', false);
  const [isTrashOpen, setIsTrashOpen] = useGameState('isTrashOpen', false);
  const [isTrashMinimized, setIsTrashMinimized] = useGameState('isTrashMinimized', false);
  const [folderLocations, setFolderLocations] = useGameState('folderLocations', {});
  const [isScannerOpen, setIsScannerOpen] = useGameState('isScannerOpen', false);
  const [isScannerMinimized, setIsScannerMinimized] = useGameState('isScannerMinimized', false);
  const [isPoweredOff, setIsPoweredOff] = useGameState('isPoweredOff', false);
  const [utilityWindows, setUtilityWindows] = useGameState('utilityWindows', { human: { open: false, minimized: false }, calculator: { open: false, minimized: false }, notepad: { open: false, minimized: false }, timeline: { open: false, minimized: false } });
  const [activeWindow, setActiveWindow] = useGameState('activeWindow', 'terminal');
  // Time & System Tray States
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isMuted, setIsMuted] = useGameState('isMuted', false);

  // NIKI Companion States (Project NIKI - Thai & Sandboxed to Web)
  const [capriAnim, setCapriAnim] = useState('perch'); // 'perch' | 'idle' | 'talk' | 'glitch' | 'sleep' | 'perch-music' | 'tossed'
  const [hasIncomingCase, setHasIncomingCase] = useGameState('hasIncomingCase', false);
  const [capriMessage, setCapriMessage] = useGameState('capriMessage', initialNikiMessage, restoreNikiMessage);
  const [lastPlayerInput, setLastPlayerInput] = useGameState('lastPlayerInput', '');
  const [playerInput, setPlayerInput] = useState('');
  const [showBubble, setShowBubble] = useGameState('showBubble', true);
  const [isPerchedOnWindow, setIsPerchedOnWindow] = useGameState('isPerchedOnWindow', false); // สิทธิ์ของ NIKI: นั่งเกาะขอบหน้าต่าง Terminal บนเว็บ
  const [isMainframeOpen, setIsMainframeOpen] = useState(false); // หน้าต่าง NIKI Mainframe & Biochip Status
  const [isThinking, setIsThinking] = useState(false);

  // NIKI Brain / API Key States
  const [brainConfig, setBrainConfig] = useState(getBrainConfig);
  const [mainframeTab, setMainframeTab] = useState('brain'); // 'brain' | 'construct'

  // File System & Download States (ไม่มี Case_Files จนกว่าจะเขียนโค้ดดาวน์โหลด)
  const [hasDownloadedCaseFiles, setHasDownloadedCaseFiles] = useGameState('hasDownloadedCaseFiles', false);
  const [explorerFolder, setExplorerFolder] = useGameState('explorerFolder', 'Case_Files');
  const [selectedCaseFile, setSelectedCaseFile] = useGameState('selectedCaseFile', null);
  const [viewedCaseFiles, setViewedCaseFiles] = useGameState('viewedCaseFiles', []);
  const [guidedEvidenceVisible, setGuidedEvidenceVisible] = useGameState('guidedEvidenceVisible', false);
  const [guidedSequence, setGuidedSequence] = useGameState('guidedSequence', initialGuidedSequence);
  const [evidenceMode, setEvidenceMode] = useGameState('evidenceMode', 'idle', restoreEvidenceMode);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useGameState('selectedEvidenceIds', []);
  const [guidedEvidenceResponse, setGuidedEvidenceResponse] = useGameState('guidedEvidenceResponse', '');
  const [guidedEvidenceAnswer, setGuidedEvidenceAnswer] = useGameState('guidedEvidenceAnswer', '');
  const [timelineResult, setTimelineResult] = useGameState('timelineResult', null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [analysisPrompt, setAnalysisPrompt] = useGameState('analysisPrompt', 'idle');
  const [analysisResult, setAnalysisResult] = useGameState('analysisResult', null);
  const [scanStage, setScanStage] = useGameState('scanStage', 'idle');
  const [scanSubject, setScanSubject] = useGameState('scanSubject', null);
  const [cliInput, setCliInput] = useState('');
  const [policeConversation, setPoliceConversation] = useGameState('policeConversation', 'idle');
  const [reportConversation, setReportConversation] = useGameState('reportConversation', initialReportConversation);
  const [reportSelection, setReportSelection] = useGameState('reportSelection', null);
  const [victimReplyReady, setVictimReplyReady] = useGameState('victimReplyReady', false);
  const [unreadPoliceMessage, setUnreadPoliceMessage] = useGameState('unreadPoliceMessage', false);
  const [showPoliceNotice, setShowPoliceNotice] = useGameState('showPoliceNotice', false);
  const [cliHistory, setCliHistory] = useGameState('cliHistory', [
    'Linux cyber-arch 6.8.9-arch1 (tty1)',
    'ยินดีต้อนรับสู่ระบบสืบสวน',
    "พิมพ์ 'help' เพื่อดูคำสั่งที่ใช้ได้",
    '',
  ]);

  const inputRef = useRef(null);
  const cliInputRef = useRef(null);
  const cliScrollRef = useRef(null);
  const cancelCaseSoundRef = useRef(null);
  const cancelGuidanceSoundRef = useRef(null);
  const followupDeadlineRef = useRef(null);
  const intertitleStartedAtRef = useRef(null);
  const finalScreenDeadlineRef = useRef(null);
  const sayGuidance = useCallback((message) => {
    setCapriMessage(message);
    cancelGuidanceSoundRef.current?.();
    cancelGuidanceSoundRef.current = playNikiGuidanceSound({ muted: isMuted || isPoweredOff });
  }, [isMuted, isPoweredOff, setCapriMessage]);

  useEffect(() => {
    if (isMuted || isPoweredOff) cancelGuidanceSoundRef.current?.();
  }, [isMuted, isPoweredOff]);
  useEffect(() => () => cancelGuidanceSoundRef.current?.(), []);
  useEffect(() => {
    if (endingStage !== 'complete' || showFinalScreen || isPoweredOff) return;
    let deadline = finalScreenDeadlineRef.current ?? readGameValue('finalScreenDeadline', null);
    if (typeof deadline !== 'number' || !Number.isFinite(deadline)) {
      deadline = Date.now() + END_SCREEN_DELAY_MS;
      finalScreenDeadlineRef.current = deadline;
      writeGameValue('finalScreenDeadline', deadline);
    }
    return scheduleAtDeadline({ deadline, onDue: () => {
      finalScreenDeadlineRef.current = null;
      writeGameValue('finalScreenDeadline', null);
      writeGameValue('showFinalScreen', true);
      setShowFinalScreen(true);
    } });
  }, [endingStage, showFinalScreen, isPoweredOff, setShowFinalScreen]);
  const handleMissedCall = useCallback(() => {
    cancelCaseSoundRef.current?.();
    writeGameValue('callRingDeadline', null);
    setCallRingDeadline(null);
    setHasIncomingCase(false);
    setCallEndReason('missed');
    setPoliceConversation('declined');
    setCapriAnim('talk');
    setCapriMessage('ชูม ไม่ได้รับสายจากภัทรวัฒน์ ถ้าพร้อมแล้วกดโทรกลับในหน้าสายสนทนาได้เลยนะ');
    setShowBubble(true);
    if (isCallMinimized) { setUnreadPoliceMessage(true); setShowPoliceNotice(true); }
  }, [isCallMinimized, setCallRingDeadline, setHasIncomingCase, setCallEndReason, setPoliceConversation, setCapriMessage, setShowBubble, setUnreadPoliceMessage, setShowPoliceNotice]);

  useEffect(() => {
    if (!hasIncomingCase || isPoweredOff) return;
    const deadline = typeof callRingDeadline === 'number' && Number.isFinite(callRingDeadline) ? callRingDeadline : getRingDeadline(Date.now());
    if (deadline !== callRingDeadline) {
      writeGameValue('callRingDeadline', deadline);
      setCallRingDeadline(deadline);
    }
    return scheduleAtDeadline({ deadline, onDue: handleMissedCall });
  }, [hasIncomingCase, isPoweredOff, callRingDeadline, handleMissedCall, setCallRingDeadline]);
  const openCall = () => {
    setUnreadPoliceMessage(false);
    setShowPoliceNotice(false);
    setIsCallOpen(true);
    setIsCallMinimized(false);
    setActiveWindow('call');
  };

  const openTerminal = () => {
    setIsTerminalOpen(true);
    setIsTerminalMinimized(false);
    setActiveWindow('terminal');
  };

  const openExplorer = () => {
    setIsExplorerOpen(true);
    setIsExplorerMinimized(false);
    setActiveWindow('explorer');
  };

  const isFolderReleased = (folder) => ({ Case_Files: hasDownloadedCaseFiles, Case_Documents: documentsReleased, Dashcam_Files: dashcamReleased })[folder] === true;
  const isFolderAvailable = (folder) => isFolderReleased(folder) && folderLocation(folderLocations, folder) === 'desktop';
  const trashFolders = desktopFolders.filter((folder) => folderLocation(folderLocations, folder.id) === 'trash');

  const openTrash = () => {
    setIsTrashOpen(true);
    setIsTrashMinimized(false);
    setActiveWindow('trash');
  };

  const openFolder = (folder) => {
    if (!isFolderAvailable(folder)) {
      setIsPerchedOnWindow(false);
      setShowBubble(true);
      setCapriMessage(folderLocation(folderLocations, folder) === 'trash' ? `${folder} อยู่ในถังขยะนะชูม กู้คืนก่อนจึงจะเปิดได้` : `${folder} ยังไม่อยู่บนเดสก์ท็อปนะชูม`);
      return;
    }
    setExplorerFolder(folder);
    setSelectedCaseFile(null);
    openExplorer();
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
      ['call', isCallOpen && !isCallMinimized],
      ['trash', isTrashOpen && !isTrashMinimized],
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

  const hideCall = () => {
    setIsCallMinimized(true);
    if (activeWindow === 'call') activateAvailableWindow('call');
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

  const hideTrash = (close = false) => {
    if (close) setIsTrashOpen(false);
    else setIsTrashMinimized(true);
    if (activeWindow === 'trash') activateAvailableWindow('trash');
  };

  const handleTrashFolder = (folder) => {
    if (!isFolderAvailable(folder)) return;
    setFolderLocations((state) => moveFolderToTrash(state, folder));
    if (isExplorerOpen && explorerFolder === folder) {
      setIsExplorerOpen(false);
      setSelectedCaseFile(null);
      if (activeWindow === 'explorer') activateAvailableWindow('explorer');
    }
  };

  const handleRestoreFolder = (folder) => {
    setFolderLocations((state) => restoreFolder(state, folder));
  };

  const handleDeleteTrashFolder = (folder) => {
    setFolderLocations((state) => deleteFolderPermanently(state, folder));
  };

  const handleOpenCaseFile = (name) => {
    const file = [...(isFolderAvailable('Case_Files') ? caseFiles.filter((item) => item.kind === 'cctv') : []), ...(isFolderAvailable('Case_Documents') ? followupFiles : []), ...(isFolderAvailable('Dashcam_Files') ? dashcamFiles : [])].find((item) => item.name === name);
    if (!file) {
      setShowBubble(true);
      setCapriMessage('ไม่พบไฟล์บนเดสก์ท็อป ลองตรวจสอบถังขยะก่อนนะชูม');
      return false;
    }
    setViewedCaseFiles((reviewed) => reviewed.includes(name) ? reviewed : [...reviewed, name]);
    setExplorerFolder(file.kind === 'document' ? 'Case_Documents' : file.subject === 'dashcam' ? 'Dashcam_Files' : 'Case_Files');
    setSelectedCaseFile(file);
    if (file.subject === 'dashcam' && endingStage === 'awaiting-face') {
      setShowBubble(true);
      sayGuidance('ชูม ลองคลิกใบหน้าคนในภาพจากกล้องหน้ารถเพื่อสแกนดูนะ');
    }
    if (file.subject === 'victim' && reportConversation.stage === 'awaiting-victim') {
      setShowBubble(true);
      sayGuidance('ชูม คลิกที่ใบหน้าของผู้เสียชีวิตในภาพเพื่อเริ่มสแกนได้เลย');
    }
    if (file.subject === 'suspect' && reportConversation.stage !== 'awaiting-suspect') {
      if (reportConversation.stage === 'awaiting-victim') sayGuidance('เจ้าหน้าที่ขอชื่อผู้เสียชีวิตก่อนนะชูม ลองเปิดภาพผู้เสียชีวิตแล้วคลิกที่ใบหน้า');
      return true;
    }
    if (file.subject === 'suspect' && reportConversation.stage === 'awaiting-suspect') {
      setShowBubble(true);
      sayGuidance('ลองคลิกใบหน้าของบุคคลในภาพเพื่อสแกนดูนะชูม');
    }
    return true;
  };

  const handleBackToCaseFiles = () => {
    setSelectedCaseFile(null);
  };

  const handleAskGuidedEvidence = async (question, retry = false) => {
    if (isThinking || !question) return;
    const currentQuestion = guidedEvidenceQuestions[guidedSequence.index];
    const isTimelineRetry = question.mode === 'timeline' && guidedSequence.phase === 'complete';
    if (question.id !== currentQuestion?.id || (!['ready', 'review'].includes(guidedSequence.phase) && !isTimelineRetry)) return;
    setGuidedEvidenceVisible(true);
    setIsPerchedOnWindow(false);
    setShowBubble(true);
    if (guidedSequence.phase === 'review' && !(retry && question.mode === 'timeline')) {
      sayGuidance(guidedEvidenceResponse);
      return;
    }
    if (!documentsReleased) {
      setEvidenceMode('offer');
      sayGuidance('รอรับและตรวจเอกสารจากสายสืบให้เรียบร้อยก่อนนะชูม');
      return;
    }
    if (!isFolderAvailable('Case_Documents')) {
      setEvidenceMode('offer');
      sayGuidance(folderLocation(folderLocations, 'Case_Documents') === 'trash' ? 'Case_Documents อยู่ในถังขยะ กู้คืนก่อนแล้วฉันจะช่วยตรวจเอกสารให้นะชูม' : 'ไม่พบ Case_Documents บนเดสก์ท็อป จึงตรวจเอกสารไม่ได้');
      return;
    }
    const files = getOpenedEvidence(followupFiles, question.requiredFiles);
    if (files.length !== question.requiredFiles.length) {
      setEvidenceMode('offer');
      sayGuidance('เอกสารที่ต้องใช้ยังไม่ครบ ลองตรวจสอบไฟล์อีกครั้งนะชูม');
      return;
    }
    setEvidenceMode('assisting');
    if (question.mode === 'timeline') {
      setGuidedEvidenceVisible(false);
      setTimelineResult(null);
      setTimelineLoading(true);
      setIsThinking(true);
      openUtility('timeline');
      try {
        const result = await askTimelineBrain({ files });
        setTimelineResult(result);
        if (result.ok) {
          setSelectedEvidenceIds([]);
          setGuidedEvidenceAnswer(formatTimelineReply(result.events));
          setGuidedEvidenceResponse('ฉันเรียงเหตุการณ์จากเอกสารแล้วชูม ดูรายละเอียดและหลักฐานอ้างอิงในหน้าลำดับเหตุการณ์ได้เลย');
          sayGuidance('ฉันเรียงเหตุการณ์จากเอกสารแล้วชูม ดูรายละเอียดและหลักฐานอ้างอิงในหน้าลำดับเหตุการณ์ แล้วเลือกส่งให้เจ้าหน้าที่ในสายได้เลย');
          setGuidedEvidenceVisible(true);
          setEvidenceMode('review');
          setGuidedSequence((state) => advanceGuidedSequence(state, 'success'));
        } else {
          setEvidenceMode('offer');
          setGuidedEvidenceVisible(true);
          sayGuidance(`${result.error} ถ้าชูมอยากหาเองก็บอกฉันได้เลยนะ`);
        }
      } catch {
        setTimelineResult({ ok: false, error: 'ฉันสร้างไทม์ไลน์ไม่สำเร็จ ลองตรวจการตั้งค่า AI แล้วกดสร้างอีกครั้งนะชูม' });
        setEvidenceMode('offer');
        setGuidedEvidenceVisible(true);
        sayGuidance('ฉันสร้างไทม์ไลน์ไม่สำเร็จ ลองอีกครั้งหรือบอกฉันว่าจะหาเองได้นะชูม');
      } finally {
        setTimelineLoading(false);
        setIsThinking(false);
      }
      return;
    }
    setIsThinking(true);
    setCapriAnim('talk');
    setCapriMessage('ได้เลยชูม ฉันกำลังตรวจเอกสารตามคำถามของสายสืบ...');
    try {
      const result = await askEvidenceBrainResult({ question: question.question, files });
      sayGuidance(result.message);
      if (result.ok) {
        setSelectedEvidenceIds([]);
        setGuidedEvidenceResponse(result.message);
        setGuidedEvidenceAnswer(result.answer);
        setEvidenceMode('review');
        setGuidedSequence((state) => advanceGuidedSequence(state, 'success'));
      } else {
        setEvidenceMode('offer');
      }
      onSendMessage(`คำถามของสายสืบ: ${question.question}`, result.message);
    } catch {
      setEvidenceMode('offer');
      sayGuidance('ฉันวิเคราะห์เอกสารไม่สำเร็จ ลองอีกครั้งหรือบอกฉันว่าจะหาเองได้นะชูม');
    } finally {
      setIsThinking(false);
    }
  };

  const handleSendGuidedAnswer = (manualAnswer = '') => {
    const directManual = evidenceMode === 'manual' && guidedSequence.phase === 'ready' && typeof manualAnswer === 'string' && manualAnswer;
    const answer = directManual || (selectedEvidenceResult.complete ? selectedEvidenceResult.answer : guidedEvidenceAnswer);
    if ((!directManual && guidedSequence.phase !== 'review') || !answer || isThinking) return;
    setCallMessages((messages) => [...messages, { speaker: 'you', text: answer }]);
    setGuidedSequence((state) => advanceGuidedSequence(directManual ? advanceGuidedSequence(state, 'success') : state, 'continue', guidedEvidenceQuestions.length));
    setGuidedEvidenceVisible(false);
    setGuidedEvidenceResponse('');
    setGuidedEvidenceAnswer('');
    setEvidenceMode('idle');
    setSelectedEvidenceIds([]);
    setCapriMessage('ส่งคำตอบให้ภัทรวัฒน์แล้วนะชูม');
    const next = guidedEvidenceQuestions[guidedSequence.index + 1];
    if (next) setCallQueue([{ text: followupAcknowledgements[guidedSequence.index] }, { text: stripPolicePrefix(next.line), raw: next.line, after: 'guided-question' }]);
    else {
      setEndingStage((stage) => advanceEnding(stage, 'questions-complete'));
      setCallQueue(endingQueue);
    }
    openCall();
  };

  const currentGuidedQuestion = guidedEvidenceQuestions[guidedSequence.index];
  const manualEvidence = evidenceMode === 'manual' && guidedSequence.phase === 'ready' ? getManualEvidence(currentGuidedQuestion?.id) : [];
  const selectedEvidenceResult = getManualEvidenceResult(currentGuidedQuestion?.id, selectedEvidenceIds);
  const manualProgress = evidenceMode === 'manual' && currentGuidedQuestion ? selectedEvidenceResult : null;

  const handleSelectManualEvidence = (id) => {
    if (isThinking || !manualEvidence.some((item) => item.id === id && item.file === selectedCaseFile?.name)) return;
    const next = selectedEvidenceIds.includes(id) ? selectedEvidenceIds.filter((item) => item !== id) : [...selectedEvidenceIds, id];
    setSelectedEvidenceIds(next);
    const result = getManualEvidenceResult(currentGuidedQuestion.id, next);
    if (!result.complete) return;
    if (result.total === 1) {
      handleSendGuidedAnswer(result.answer);
      return;
    }
    setGuidedEvidenceAnswer(result.answer);
    setGuidedEvidenceResponse('เลือกหลักฐานครบแล้วชูม ตรวจคำตอบในสายแล้วกดส่งให้ภัทรวัฒน์ได้เลย');
    sayGuidance('เลือกหลักฐานครบแล้วชูม ตรวจคำตอบในสายแล้วกดส่งให้ภัทรวัฒน์ได้เลย');
    setGuidedEvidenceVisible(true);
    setShowBubble(true);
    setEvidenceMode('review');
    setGuidedSequence((state) => advanceGuidedSequence(state, 'success'));
  };

  const handleSelectGuidedQuestion = () => {
    if (guidedSequence.phase === 'review') { setShowBubble(true); sayGuidance(guidedEvidenceResponse); return; }
    if (guidedSequence.phase !== 'ready' || isThinking) return;
    setGuidedEvidenceVisible(true);
    setIsPerchedOnWindow(false);
    setShowBubble(true);
    setLastPlayerInput('');
    if (evidenceMode === 'manual') sayGuidance('ลองเปิด Case_Documents แล้วเลือกข้อความในกรอบที่ตอบคำถามนะชูม');
    else { setEvidenceMode('offer'); sayGuidance('ชูม ให้ฉันช่วยตรวจเอกสารเพื่อหาคำตอบสำหรับสายสืบไหม?'); }
  };

  useEffect(() => {
    if (!hasIncomingCase || isMuted || isPoweredOff || isRingExpired(callRingDeadline)) return;
    const stop = playIncomingCaseSound();
    cancelCaseSoundRef.current = stop;
    return () => {
      stop();
      if (cancelCaseSoundRef.current === stop) cancelCaseSoundRef.current = null;
    };
  }, [hasIncomingCase, isMuted, isPoweredOff, callRingDeadline]);

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

  // แสดงบทสนทนาทีละตัวอักษร และเว้นจังหวะก่อนข้อความถัดไป
  useEffect(() => {
    if (isPoweredOff || isCallMinimized || !callQueue.length) return;
    const entry = callQueue[0];
    const units = splitCallText(entry.text);
    const writing = typedCount < units.length;
    const timer = setTimeout(() => {
      if (writing) { setTypedCount((count) => count + 1); return; }
      setCallMessages((messages) => [...messages, { speaker: entry.speaker || 'officer', text: entry.text, raw: entry.raw }, ...(entry.after === 'photo' ? [{ speaker: 'attachment' }] : []), ...(entry.after === 'documents' ? [{ speaker: 'documents' }] : []), ...(entry.after === 'dashcam' ? [{ speaker: 'dashcam' }] : [])]);
      setCallQueue((queue) => queue.slice(1));
      setTypedCount(0);
      if (shouldCloseCallAfterMessage(entry)) {
        setIsCallOpen(false);
        setIsCallMinimized(false);
        setUnreadPoliceMessage(false);
        setShowPoliceNotice(false);
        setActiveWindow((current) => current === 'call' ? null : current);
      }
      if (entry.after === 'choose') setPoliceConversation('choosing');
      if (entry.after === 'callback-choice') setPoliceConversation('callback-choosing');
      if (entry.after === 'guided-question') {
        setGuidedSequence((state) => advanceGuidedSequence(state, 'delivered'));
        setEvidenceMode('idle');
        setSelectedEvidenceIds([]);
        setGuidedEvidenceVisible(false);
      }
      if (entry.after === 'dashcam') { setDashcamAttachment((state) => advanceAttachment(state, 'upload')); setDashcamUploadProgress(0); }
      if (entry.after === 'ending') {
        setEndingStage((stage) => advanceEnding(stage, 'call-ended'));
        setIsTerminalOpen(false);
        setIsTerminalMinimized(false);
        setIsExplorerOpen(false);
        setIsExplorerMinimized(false);
        setIsTrashOpen(false);
        setIsTrashMinimized(false);
        setIsScannerOpen(false);
        setIsScannerMinimized(false);
        setIsMainframeOpen(false);
        setUtilityWindows((windows) => Object.fromEntries(Object.keys(windows).map((name) => [name, { open: false, minimized: false }])));
        setReportSelection(null);
        setActiveWindow(null);
        setGuidedEvidenceVisible(false);
        setIsPerchedOnWindow(false);
        setLastPlayerInput('');
        setShowBubble(true);
        setCapriMessage('ขอโทษด้วยนะชูม ที่ตอนแรกฉันสแกนหน้าแล้วผิดคน');
      }
      if (entry.after === 'documents') {
        setDocumentsAttachment((state) => advanceAttachment(state, 'upload'));
        setDocumentsUploadProgress(0);
      }
      if (entry.after === 'photo') {
        setPoliceConversation('briefed');
        setAttachment((state) => advanceAttachment(state, 'upload'));
        setUploadProgress(0);
      }
      if (entry.after === 'report') {
        setReportConversation((current) => advanceReportConversation(current, 'tick'));
        if (entry.raw === REPORT_SUSPECT_REQUEST) {
          setShowBubble(true);
          sayGuidance('ชูม กลับไปเปิดภาพบุคคลก่อนเกิดเหตุ แล้วคลิกที่ใบหน้าเพื่อสแกนได้เลย');
        }
      }
    }, writing ? 35 : (entry.delayAfter ?? 2000));
    return () => clearTimeout(timer);
  }, [callQueue, typedCount, isPoweredOff, isCallMinimized, sayGuidance, setActiveWindow, setAttachment, setCallMessages, setCallQueue, setCapriMessage, setDashcamAttachment, setDashcamUploadProgress, setEndingStage, setDocumentsAttachment, setDocumentsUploadProgress, setEvidenceMode, setGuidedEvidenceVisible, setGuidedSequence, setIsCallOpen, setIsCallMinimized, setIsTerminalOpen, setIsTerminalMinimized, setIsExplorerOpen, setIsExplorerMinimized, setIsTrashOpen, setIsTrashMinimized, setIsScannerOpen, setIsScannerMinimized, setIsPerchedOnWindow, setLastPlayerInput, setPoliceConversation, setReportConversation, setReportSelection, setSelectedEvidenceIds, setShowBubble, setShowPoliceNotice, setUnreadPoliceMessage, setUploadProgress, setUtilityWindows]);

  // The transfer and security scan are simulated game events; the image itself is loaded from the app.
  useEffect(() => {
    if (isPoweredOff || attachment.stage !== 'uploading') return;
    const timer = setTimeout(() => {
      const next = Math.min(100, uploadProgress + 10);
      setUploadProgress(next);
      if (next === 100) setAttachment((state) => advanceAttachment(state, 'uploaded'));
    }, 300);
    return () => clearTimeout(timer);
  }, [isPoweredOff, attachment.stage, uploadProgress, setAttachment, setUploadProgress]);

  useEffect(() => {
    if (isPoweredOff || documentsAttachment.stage !== 'uploading') return;
    const timer = setTimeout(() => {
      const next = Math.min(100, documentsUploadProgress + 10);
      setDocumentsUploadProgress(next);
      if (next === 100) setDocumentsAttachment((state) => advanceAttachment(state, 'uploaded'));
    }, 300);
    return () => clearTimeout(timer);
  }, [isPoweredOff, documentsAttachment.stage, documentsUploadProgress, setDocumentsAttachment, setDocumentsUploadProgress]);

  useEffect(() => {
    if (isPoweredOff || dashcamAttachment.stage !== 'uploading') return;
    const timer = setTimeout(() => {
      const next = Math.min(100, dashcamUploadProgress + 10);
      setDashcamUploadProgress(next);
      if (next === 100) setDashcamAttachment((state) => advanceAttachment(state, 'uploaded'));
    }, 300);
    return () => clearTimeout(timer);
  }, [isPoweredOff, dashcamAttachment.stage, dashcamUploadProgress, setDashcamAttachment, setDashcamUploadProgress]);

  useEffect(() => {
    if (isPoweredOff || !['scanning', 'cleaning'].includes(dashcamAttachment.stage)) return;
    const timer = setTimeout(() => {
      if (dashcamAttachment.stage === 'scanning' && dashcamFiles.some((file) => file.simulatedThreat)) {
        setDashcamAttachment((state) => advanceAttachment(state, 'scan-infected'));
        setCapriMessage('พบไวรัสในไฟล์จำลอง เดี๋ยวฉันจัดการล้างให้ก่อนนะชูม');
        return;
      }
      setDashcamAttachment((state) => advanceAttachment(state, state.stage === 'cleaning' ? 'cleaned' : 'scan-clean'));
      setEndingStage((stage) => advanceEnding(stage, 'upload-complete'));
      setIsPerchedOnWindow(false);
      setShowBubble(true);
      sayGuidance('ตรวจไฟล์จากกล้องหน้ารถเรียบร้อยแล้วชูม เปิด Dashcam_Files บนเดสก์ท็อปเพื่อตรวจภาพได้เลย');
    }, 2200);
    return () => clearTimeout(timer);
  }, [isPoweredOff, dashcamAttachment.stage, sayGuidance, setDashcamAttachment, setEndingStage, setIsPerchedOnWindow, setShowBubble, setCapriMessage]);

  const handleOpenDashcam = async () => {
    if (dashcamReleased) { openFolder('Dashcam_Files'); return; }
    if (!['ready', 'error'].includes(dashcamAttachment.stage)) return;
    setDashcamAttachment((state) => advanceAttachment(state, 'open'));
    setIsPerchedOnWindow(false);
    setShowBubble(true);
    setCapriMessage('เดี๋ยวฉันตรวจไฟล์จากกล้องหน้ารถก่อนนะชูม');
    try {
      const response = await fetch(dashcamFiles[0].imageUrl);
      if (!response.ok) throw new Error('Image unavailable');
      const blob = await response.blob();
      if (!blob.size || !blob.type.startsWith('image/')) throw new Error('Invalid image');
      setDashcamAttachment((state) => advanceAttachment(state, 'loaded'));
    } catch {
      setDashcamAttachment((state) => advanceAttachment(state, 'load-failed'));
      setCapriMessage('รับภาพไม่สำเร็จ ลองกดไฟล์แนบอีกครั้งนะชูม');
    }
  };

  // Document transfer, detection and cleaning are simulated game events.
  useEffect(() => {
    if (isPoweredOff || !['scanning', 'cleaning'].includes(documentsAttachment.stage)) return;
    const timer = setTimeout(() => {
      const inspection = inspectSimulatedDocuments(followupFiles);
      if (documentsAttachment.stage === 'scanning' && inspection.hasThreat) {
        setDocumentsAttachment((state) => advanceAttachment(state, 'scan-infected'));
        setCapriMessage('พบไวรัสในเอกสารจำลอง เดี๋ยวฉันจัดการล้างให้ก่อนนะชูม');
        return;
      }
      const cleaned = documentsAttachment.stage === 'cleaning';
      setDocumentsAttachment((state) => advanceAttachment(state, cleaned ? 'cleaned' : 'scan-clean'));
      setGuidedSequence({ index: 0, phase: 'pending' });
      const first = guidedEvidenceQuestions[0];
      setCallQueue([{ text: stripPolicePrefix(first.line), raw: first.line, after: 'guided-question' }]);
      setShowBubble(true);
      sayGuidance(`${cleaned ? 'ล้างไวรัสในเอกสารจำลองเรียบร้อยแล้ว' : 'ตรวจเอกสารแล้วไม่พบไวรัส'} เปิด Case_Documents บนเดสก์ท็อปเพื่ออ่านได้เลยนะชูม`);
    }, 2200);
    return () => clearTimeout(timer);
  }, [isPoweredOff, documentsAttachment.stage, sayGuidance, setCallQueue, setCapriMessage, setDocumentsAttachment, setGuidedSequence, setShowBubble]);

  useEffect(() => {
    if (isPoweredOff || !['scanning', 'cleaning'].includes(attachment.stage)) return;
    const timer = setTimeout(() => {
      if (attachment.stage === 'scanning' && caseFiles.some((item) => item.kind === 'cctv' && item.simulatedThreat)) {
        setAttachment((state) => advanceAttachment(state, 'scan-infected'));
        setCapriMessage('พบไวรัสในไฟล์จำลอง เดี๋ยวฉันจัดการล้างให้ก่อนนะชูม');
        return;
      }
      const cleaned = attachment.stage === 'cleaning';
      setAttachment((state) => advanceAttachment(state, cleaned ? 'cleaned' : 'scan-clean'));
      setHasDownloadedCaseFiles(true);
      setReportConversation((state) => advanceReportConversation(state, 'files-ready'));
      setAnalysisPrompt('idle');
      setIsPerchedOnWindow(false);
      setShowBubble(true);
      setLastPlayerInput('');
      setCapriAnim('talk');
      sayGuidance(`${cleaned ? 'ล้างไวรัสในไฟล์จำลองเรียบร้อยแล้ว' : 'ตรวจไฟล์แล้วไม่พบไวรัส'} ชูม! เราสแกนใบหน้าผู้เสียชีวิตให้สายสืบภัทรวัฒน์กันเถอะ เปิด Case_Files บนเดสก์ท็อป แล้วเลือกภาพผู้เสียชีวิตได้เลย`);
    }, 2200);
    return () => clearTimeout(timer);
  }, [isPoweredOff, attachment.stage, sayGuidance, setAnalysisPrompt, setAttachment, setCapriMessage, setHasDownloadedCaseFiles, setIsPerchedOnWindow, setLastPlayerInput, setReportConversation, setShowBubble]);

  const handleOpenAttachment = async () => {
    if (attachment.stage === 'complete') {
      openFolder('Case_Files');
      return;
    }
    if (!['ready', 'error'].includes(attachment.stage)) return;
    setAttachment((state) => advanceAttachment(state, 'open'));
    setIsPerchedOnWindow(false);
    setShowBubble(true);
    setCapriAnim('talk');
    setCapriMessage('เดี๋ยวฉันตรวจไฟล์ในโฟลเดอร์หาไวรัสก่อนนะชูม');
    try {
      const files = caseFiles.filter((item) => item.kind === 'cctv');
      await Promise.all(files.map(async (item) => {
        const response = await fetch(item.imageUrl);
        if (!response.ok) throw new Error('Image unavailable');
        const blob = await response.blob();
        if (!blob.size || !blob.type.startsWith('image/')) throw new Error('Invalid image');
      }));
      setAttachment((state) => advanceAttachment(state, 'loaded'));
    } catch {
      setAttachment((state) => advanceAttachment(state, 'load-failed'));
      setCapriMessage('เปิดไฟล์ไม่สำเร็จ ลองกดไฟล์แนบอีกครั้งนะชูม');
    }
  };

  useEffect(() => {
    if (isPoweredOff || !isScannerOpen || isScannerMinimized || !['scanning', 'low-quality', 'analyzing'].includes(scanStage)) return;
    const timer = setTimeout(() => {
      if (scanStage === 'scanning' && scanSubject === 'dashcam') {
        setScanStage('complete');
        setShowBubble(true);
        sayGuidance(`ชูม คนในภาพไม่ใช่กฤตภาส ผลตรวจพบชื่อ ${dashcamPerson.name} ลองค้นใน HumanDB แล้วส่งให้ภัทรวัฒน์นะ`);
        return;
      }
      if (scanStage === 'scanning' && scanSubject === 'victim') {
        setScanStage('complete');
        setShowBubble(true);
        sayGuidance(`สแกนเสร็จแล้วชูม ระบบพบชื่อ ${cardHolderProfile.name} ลองค้นใน HumanDB แล้วส่งชื่อให้เจ้าหน้าที่นะ`);
        return;
      }
      setScanStage(nextFaceScanStage(scanStage, 'finished'));
      if (scanStage === 'scanning') {
        setAnalysisPrompt('enhancing');
        setIsPerchedOnWindow(false);
        setShowBubble(true);
        setLastPlayerInput('');
        setCapriAnim('talk');
        sayGuidance('ภาพบุคคลอีกคนไม่ชัดเลยชูม เครื่องมือปกติสแกนไม่ได้ เดี๋ยวฉันลองใช้เครื่องมือที่ชูมเคยแฮกมาช่วยนะ เก็บเป็นความลับล่ะ');
      } else if (scanStage === 'analyzing') {
        setAnalysisPrompt('accepted');
        sayGuidance(`ฉันพบเบาะแสแล้วชูม! คนในภาพอาจเป็น ${cameraPerson.name} แต่ยังยืนยันไม่ได้ ลองค้นใน HumanDB แล้วส่งให้เจ้าหน้าที่ตรวจสอบต่อนะ`);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [scanStage, scanSubject, isScannerOpen, isScannerMinimized, isPoweredOff, sayGuidance, setAnalysisPrompt, setIsPerchedOnWindow, setLastPlayerInput, setScanStage, setShowBubble]);

  useEffect(() => {
    if (isPoweredOff || callQueue.length || !reportConversation.pending.length) return;
    const raw = reportConversation.pending[0];
    const timer = setTimeout(() => setCallQueue([{ text: stripPolicePrefix(raw), raw, speaker: raw.startsWith(POLICE_PREFIX) ? 'officer' : 'system', after: 'report' }]), 0);
    return () => clearTimeout(timer);
  }, [isPoweredOff, callQueue, reportConversation.pending, setCallQueue]);

  useEffect(() => {
    if (isPoweredOff || reportConversation.stage !== 'complete' || followupPhase !== 'pending') return;
    let deadline = followupDeadlineRef.current ?? readGameValue('followupDeadline', null);
    if (typeof deadline !== 'number' || !Number.isFinite(deadline)) {
      deadline = Date.now() + FOLLOWUP_DELAY_MS;
      followupDeadlineRef.current = deadline;
      writeGameValue('followupDeadline', deadline);
    }
    return scheduleAtDeadline({ deadline, onDue: () => {
      followupDeadlineRef.current = null;
      writeGameValue('followupDeadline', null);
      setIsCallOpen(false);
      setIsCallMinimized(false);
      setIsTerminalOpen(false);
      setIsTerminalMinimized(false);
      setIsExplorerOpen(false);
      setIsExplorerMinimized(false);
      setIsTrashOpen(false);
      setIsTrashMinimized(false);
      setIsScannerOpen(false);
      setIsScannerMinimized(false);
      setIsMainframeOpen(false);
      setIsPerchedOnWindow(false);
      setUtilityWindows((windows) => Object.fromEntries(Object.keys(windows).map((name) => [name, { open: false, minimized: false }])));
      setReportSelection(null);
      setShowPoliceNotice(false);
      setActiveWindow(null);
      intertitleStartedAtRef.current = deadline;
      writeGameValue('intertitleStartedAt', intertitleStartedAtRef.current);
      setFollowupPhase((phase) => nextFollowupPhase(phase, 'elapsed'));
    } });
  }, [isPoweredOff, reportConversation.stage, followupPhase, setActiveWindow, setFollowupPhase, setIsCallMinimized, setIsCallOpen, setIsExplorerMinimized, setIsExplorerOpen, setIsTrashOpen, setIsTrashMinimized, setIsPerchedOnWindow, setIsScannerMinimized, setIsScannerOpen, setIsTerminalMinimized, setIsTerminalOpen, setReportSelection, setShowPoliceNotice, setUtilityWindows]);

  useEffect(() => {
    if (isPoweredOff || followupPhase !== 'intertitle') return;
    let startedAt = intertitleStartedAtRef.current ?? readGameValue('intertitleStartedAt', null);
    if (typeof startedAt !== 'number' || !Number.isFinite(startedAt)) {
      startedAt = Date.now();
      writeGameValue('intertitleStartedAt', startedAt);
    }
    intertitleStartedAtRef.current = startedAt;
    const deadline = startedAt + INTERTITLE_CHARACTERS.length * INTERTITLE_TYPING_INTERVAL_MS + INTERTITLE_MS;
    return scheduleAtDeadline({ deadline, onDue: () => {
      intertitleStartedAtRef.current = null;
      writeGameValue('intertitleStartedAt', null);
      setFollowupPhase((phase) => nextFollowupPhase(phase, 'elapsed'));
      const ringDeadline = getRingDeadline(deadline);
      writeGameValue('callRingDeadline', ringDeadline);
      setCallRingDeadline(ringDeadline);
      setHasIncomingCase(true);
      setIsCallOpen(true);
      setIsCallMinimized(false);
      setActiveWindow('call');
      setShowBubble(true);
      setCapriMessage('ชูม ภัทรวัฒน์ติดต่อกลับมาแล้ว');
    } });
  }, [isPoweredOff, followupPhase, setActiveWindow, setCapriMessage, setFollowupPhase, setCallRingDeadline, setHasIncomingCase, setIsCallMinimized, setIsCallOpen, setShowBubble]);

  useEffect(() => {
    if (isPoweredOff || followupPhase !== 'intertitle' || intertitleTypedCount >= INTERTITLE_CHARACTERS.length) return;
    const timer = setTimeout(() => {
      const startedAt = intertitleStartedAtRef.current ?? Date.now();
      const elapsedCount = Math.floor((Date.now() - startedAt) / INTERTITLE_TYPING_INTERVAL_MS);
      setIntertitleTypedCount((count) => Math.min(INTERTITLE_CHARACTERS.length, Math.max(count + 1, elapsedCount)));
    }, INTERTITLE_TYPING_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [isPoweredOff, followupPhase, intertitleTypedCount, setIntertitleTypedCount]);

  const handleOpenFollowupDocuments = () => {
    if (documentsReleased) {
      openFolder('Case_Documents');
      return;
    }
    if (!['ready', 'error'].includes(documentsAttachment.stage)) return;
    setDocumentsAttachment((state) => advanceAttachment(state, 'open'));
    setIsPerchedOnWindow(false);
    setShowBubble(true);
    setLastPlayerInput('');
    setCapriAnim('talk');
    const inspection = inspectSimulatedDocuments(followupFiles);
    if (!inspection.ok) {
      setDocumentsAttachment((state) => advanceAttachment(state, 'load-failed'));
      setCapriMessage('รับเอกสารไม่สำเร็จ ลองกดไฟล์แนบอีกครั้งนะชูม');
      return;
    }
    setCapriMessage('เดี๋ยวฉันตรวจเอกสารใน Case_Documents หาไวรัสก่อนนะชูม');
    setDocumentsAttachment((state) => advanceAttachment(state, 'loaded'));
  };

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
  }, [setShowBubble]);

  // เมื่อมีคนขอความช่วยเหลือเรื่องคดีมา (สายสืบภัทรวัฒน์ อนันต์กุลส่งเข้ามา)
  const triggerIncomingCase = useCallback((startedAt = Date.now()) => {
    if (isPoweredOff || hasIncomingCase || gameState !== 'IDLE') return;

    const deadline = getRingDeadline(startedAt);
    writeGameValue('callRingDeadline', deadline);
    setCallRingDeadline(deadline);
    setHasIncomingCase(true);
    setIsCallOpen(true);
    setIsCallMinimized(false);
    setActiveWindow('call');
    setCapriAnim('glitch');
    setCapriMessage('ชูม สายสืบภัทรวัฒน์ อนันต์กุลโทรเข้ามาแล้ว กดรับสายได้เลย');
    setShowBubble(true);

    onIncomingCase?.();

    setTimeout(() => {
      setCapriAnim('talk');
      inputRef.current?.focus();
    }, 1000);
  }, [hasIncomingCase, gameState, onIncomingCase, isPoweredOff, setActiveWindow, setCapriMessage, setCallRingDeadline, setHasIncomingCase, setIsCallMinimized, setIsCallOpen, setShowBubble]);

  // ฟังก์ชันเริ่มหรือรีเซ็ต Inactivity Timer
  // กฎ: ถ้ายังไม่ได้คุย หรือเมื่อชูมหยุดคุยไป 10 วินาที ให้แจ้งเตือนว่ามีคดีส่งมาจากสายสืบภัทรวัฒน์ อนันต์กุล
  const resetInactivityTimer = useCallback(() => {
    if (!isPoweredOff && gameState === 'IDLE' && !hasIncomingCase) setIncomingDeadline(Date.now() + 10000);
  }, [gameState, hasIncomingCase, isPoweredOff, setIncomingDeadline]);

  useEffect(() => {
    if (isPoweredOff || gameState !== 'IDLE' || hasIncomingCase) return;
    return scheduleAtDeadline({ deadline: incomingDeadline, onDue: () => triggerIncomingCase(incomingDeadline) });
  }, [isPoweredOff, gameState, hasIncomingCase, incomingDeadline, triggerIncomingCase]);

  const handleAcceptCase = () => {
    if (hasIncomingCase && isRingExpired(callRingDeadline)) { handleMissedCall(); return; }
    const returningCall = policeConversation === 'declined';
    cancelCaseSoundRef.current?.();
    writeGameValue('callRingDeadline', null);
    setCallRingDeadline(null);
    setHasIncomingCase(false);
    if (followupPhase === 'ringing') {
      setFollowupPhase((phase) => nextFollowupPhase(phase, 'answer'));
      setPoliceConversation(returningCall ? 'callback-greeting' : 'followup');
      setCallMessages([]);
      setTypedCount(0);
      setCallQueue(returningCall ? [{ text: callEndReason === 'missed' ? missedCallbackGreeting : callbackGreeting, after: 'callback-choice' }] : followupIntroduction.map((text, index) => ({ text, after: index === followupIntroduction.length - 1 ? 'documents' : undefined })));
      setCapriMessage('รับสายแล้วชูม มาดูข้อมูลเพิ่มเติมจากภัทรวัฒน์กัน');
      openCall();
      return;
    }
    onAcceptMission('รับสายจากสายสืบภัทรวัฒน์ อนันต์กุล');
    setCapriAnim('talk');
    setCapriMessage('รับสายแล้วชูม ฉันจะอยู่ตรงนี้ถ้าต้องการความช่วยเหลือ');
    setPoliceConversation(returningCall ? 'callback-greeting' : 'greeting');
    setCallMessages([]);
    setTypedCount(0);
    setCallQueue(returningCall ? [{ text: callEndReason === 'missed' ? missedCallbackGreeting : callbackGreeting, after: 'callback-choice' }] : callGreeting.map((text, index) => ({ text, after: index === callGreeting.length - 1 ? 'choose' : undefined })));
    openCall();
  };

  const handleDeclineCall = () => {
    if (hasIncomingCase && isRingExpired(callRingDeadline)) { handleMissedCall(); return; }
    cancelCaseSoundRef.current?.();
    writeGameValue('callRingDeadline', null);
    setCallRingDeadline(null);
    setHasIncomingCase(false);
    setCallEndReason('declined');
    setPoliceConversation('declined');
    setCapriAnim('talk');
    setCapriMessage('วางสายแล้วนะชูม ถ้าเปลี่ยนใจสามารถโทรกลับหาสายสืบได้');
  };

  const handlePoliceChoice = (choice) => {
    const selected = callChoices.find((item) => item.id === choice);
    if (!selected || policeConversation !== 'choosing') return;
    setCallMessages((messages) => [...messages, { speaker: 'you', text: choice === 'silent' ? '[คุณไม่ได้ตอบอะไร]' : selected.label }]);
    const lines = getCallBriefing(choice);
    setTypedCount(0);
    setCallQueue(lines.map((text, index) => ({ text, after: index === lines.length - 1 ? 'photo' : undefined })));
    setPoliceConversation('briefing');
  };

  const handleCallbackChoice = () => {
    if (policeConversation !== 'callback-choosing') return;
    setCallMessages((messages) => [...messages, { speaker: 'you', text: callEndReason === 'missed' ? missedCallbackChoice : callbackChoice }]);
    const isFollowup = followupPhase === 'active';
    const lines = getCallbackContinuation(isFollowup, callEndReason);
    setTypedCount(0);
    setCallQueue(lines.map((text, index) => ({ text, after: index === lines.length - 1 ? (isFollowup ? 'documents' : 'photo') : undefined })));
    setPoliceConversation(isFollowup ? 'followup' : 'briefing');
  };

  const reportSubject = reportConversation.stage === 'awaiting-victim' ? 'victim' : 'suspect';
  const reportPerson = reportSubject === 'victim' ? cardHolderProfile : cameraPerson;
  const reportReady = scanSubject === reportSubject && scanStage === 'complete';

  const handlePersonFound = (person) => {
    if (endingStage === 'awaiting-face' && scanSubject === 'dashcam' && scanStage === 'complete' && person.id === dashcamPerson.id) {
      setEndingStage((stage) => advanceEnding(stage, 'identified'));
      sayGuidance('พบอัศวกรแล้วชูม เขาเป็นเพื่อนร่วมงานของกฤตภาส เลือกส่งชื่อให้ภัทรวัฒน์ในสายได้เลย');
      setShowBubble(true);
      openCall();
      return;
    }
    if (!canOfferVictimReply(reportConversation.stage, scanSubject, scanStage, person.id)) return;
    setVictimReplyReady(true);
    sayGuidance('พบข้อมูลผู้เสียชีวิตแล้วชูม เลือกส่งชื่อให้สายสืบในสายได้เลย');
    setShowBubble(true);
    openCall();
  };

  const handleSendDashcamName = () => {
    if (endingStage !== 'awaiting-name') return;
    setCallMessages((messages) => [...messages, { speaker: 'you', text: 'ไม่ใช่กฤตภาสครับ คนในภาพคือนายอัศวกร พรหมพิทักษ์' }]);
    setEndingStage((stage) => advanceEnding(stage, 'send-name'));
    setCallQueue([
      { text: 'ขอบคุณมากคุณเจ้าหน้าที่สายด่วน เราได้ตัวคนร้ายเพราะคุณเลย ไว้มีโอกาสผมจะเลี้ยงข้าวนะ' },
      { speaker: 'system', text: REPORT_END_MESSAGE, after: 'ending' },
    ]);
    openCall();
  };

  const handleClosingChoice = () => {
    if (endingStage !== 'apology') return;
    const reply = 'นั่นสินะชูม! ขอบคุณที่ทำงานอย่างหนักนะ';
    finalScreenDeadlineRef.current = Date.now() + END_SCREEN_DELAY_MS;
    writeGameValue('finalScreenDeadline', finalScreenDeadlineRef.current);
    setLastPlayerInput(endingReply);
    setCapriMessage(reply);
    setEndingStage((stage) => advanceEnding(stage, 'comfort'));
    onSendMessage?.(endingReply, reply);
  };

  const handleSendVictimReply = () => {
    if (!victimReplyReady || !canOfferVictimReply(reportConversation.stage, scanSubject, scanStage, cardHolderProfile.id)) return;
    setCallMessages((messages) => [...messages, { speaker: 'you', text: 'ผู้เสียชีวิตคือนายธันวา วรากรครับ' }]);
    setVictimReplyReady(false);
    setReportConversation((current) => advanceReportConversation(current, 'send-name'));
    setCapriMessage('ส่งชื่อผู้เสียชีวิตแล้วชูม รอเจ้าหน้าที่ถามต่อได้เลย');
    openCall();
  };

  const handleSelectReportRequest = (type) => {
    if (!canMatchReportTarget(reportConversation.stage, type, type)) return;
    setReportSelection(type);
    setShowPoliceNotice(false);
    openUtility('human');
  };

  const handleSendReport = (person, type) => {
    if (!canMatchReportTarget(reportConversation.stage, reportSelection, type) || !reportReady || !isReportProfileEligible(person.id, reportPerson.id, scanStage)) return;
    const value = type === 'name' ? person.name : person.lastKnownAddress;
    setCallMessages((messages) => [...messages, { speaker: 'you', text: value }]);
    if (reportConversation.stage === 'awaiting-victim') {
      setCapriMessage('ส่งชื่อผู้เสียชีวิตแล้วชูม รอเจ้าหน้าที่ถามต่อได้เลย');
    }
    setReportConversation((current) => advanceReportConversation(current, type === 'name' ? 'send-name' : 'send-address'));
    setReportSelection(null);
    openCall();
  };

  const startFaceScan = (subject = selectedCaseFile?.subject) => {
    if (!hasDownloadedCaseFiles) {
      setShowBubble(true);
      setCapriAnim('talk');
      setCapriMessage('ขอให้ชูมรับภาพจากกล้องก่อนนะ แล้วค่อยสแกน');
      return;
    }
    if (!isFolderAvailable(subject === 'dashcam' ? 'Dashcam_Files' : 'Case_Files')) {
      setShowBubble(true);
      setCapriMessage('หาไฟล์ภาพบนเดสก์ท็อปไม่เจอ ลองตรวจสอบถังขยะก่อนนะชูม');
      return;
    }
    const requiredStage = subject === 'victim' ? 'awaiting-victim' : subject === 'suspect' ? 'awaiting-suspect' : null;
    const canScan = subject === 'dashcam' ? dashcamReleased && endingStage === 'awaiting-face' : requiredStage && reportConversation.stage === requiredStage;
    if (!canScan) {
      setShowBubble(true);
      setCapriMessage(reportConversation.stage === 'awaiting-victim' ? 'เจ้าหน้าที่ขอชื่อผู้เสียชีวิตก่อนนะชูม' : 'รอคำขอถัดไปจากเจ้าหน้าที่ก่อนนะชูม');
      return;
    }
    const file = [...caseFiles, ...dashcamFiles].find((item) => item.kind === 'cctv' && item.subject === subject);
    const result = prepareFaceScan(file ? [file] : []);
    setAnalysisResult(result);
    setCapriAnim('talk');
    if (result.ok) {
      setScanSubject(subject);
      setAnalysisPrompt('accepted');
      setScanStage(nextFaceScanStage('idle', 'start'));
      setCapriMessage(subject === 'victim' ? 'กำลังสแกนใบหน้าของผู้เสียชีวิต...' : 'กำลังสแกนใบหน้าของบุคคลในภาพ...');
      openScanner();
    } else setCapriMessage(result.reason);
  };

  // จัดการเมื่อผู้เล่นพิมพ์ตอบ NIKI ในกล่องข้อความ
  const handlePlayerSubmit = async (e) => {
    e?.preventDefault();
    const text = playerInput.trim();
    if (!text) return;

    const lower = text.toLowerCase();
    setLastPlayerInput(text);
    setPlayerInput('');

    if (isGuidanceRequest(text)) {
      const reply = getNextStepGuidance({
        gameState, hasIncomingCase, policeConversation, callEndReason, followupPhase,
        callQueueLength: callQueue.length, isCallMinimized, reportStage: reportConversation.stage,
        reportHasPending: reportConversation.pending.length > 0, reportSelection, victimReplyReady,
        attachmentStage: attachment.stage, documentsStage: documentsAttachment.stage, dashcamStage: dashcamAttachment.stage,
        guidedPhase: guidedSequence.phase, guidedQuestionId: currentGuidedQuestion?.id, evidenceMode, endingStage,
        scanStage, scanSubject, isScannerOpen, isScannerMinimized,
        knownPersonName: scanStage === 'complete' ? (scanSubject === 'dashcam' ? dashcamPerson.name : scanSubject === 'victim' ? cardHolderProfile.name : cameraPerson.name) : '',
        caseFilesLocation: folderLocation(folderLocations, 'Case_Files'),
        caseDocumentsLocation: folderLocation(folderLocations, 'Case_Documents'),
        dashcamLocation: folderLocation(folderLocations, 'Dashcam_Files'),
      });
      setCapriAnim('talk');
      sayGuidance(reply);
      onSendMessage?.(text, reply);
      return;
    }

    if (guidedSequence.phase === 'ready' && ['offer', 'manual'].includes(evidenceMode)) {
      const offerReply = interpretEvidenceOffer(text);
      if (offerReply === 'decline') {
        const reply = 'ได้เลยชูม ลองเปิด Case_Documents แล้วคลิกข้อความในกรอบที่ตอบคำถามนะ ถ้ามีหลายข้อมูลให้เลือกครบก่อนส่ง';
        setEvidenceMode('manual');
        setGuidedEvidenceVisible(true);
        setCapriAnim('talk');
        sayGuidance(reply);
        onSendMessage(text, reply);
        return;
      }
      if (offerReply === 'accept' && (evidenceMode === 'offer' || /ช่วย|วิเคราะห์|หาคำตอบ|help|analy/i.test(text))) {
        onSendMessage(text, 'ได้เลยชูม ฉันจะตรวจเอกสารให้');
        await handleAskGuidedEvidence(currentGuidedQuestion);
        return;
      }
    }

    const analysisReply = interpretAnalysisReply(text, analysisPrompt === 'offered', reportConversation.stage);
    if (analysisReply === 'decline') {
      setAnalysisPrompt('manual-ready');
      setCapriAnim('talk');
      sayGuidance('โอเค งั้นคุณคลิกที่ใบหน้าของคนในภาพเพื่อสแกนหาเองได้เลยนะ');
      return;
    }
    if (analysisReply === 'accept' && hasDownloadedCaseFiles) {
      startFaceScan();
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
    } else if (lower.includes('โหลด') || lower.includes('download')) {
      setCapriAnim('talk');
      if (hasDownloadedCaseFiles) { setCapriMessage('ภาพที่สายสืบส่งมาอยู่ใน Case_Files แล้วนะ'); openFolder('Case_Files'); }
      else if (attachment.stage === 'ready') setCapriMessage('กดไฟล์แนบในสายเพื่อให้ฉันตรวจได้เลยชูม');
      else setCapriMessage('รอฟังรายละเอียดจากสายสืบก่อนนะชูม');
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
          gameState: followupPhase === 'active' ? gameState : getNikiConversationState(gameState, reportConversation.stage),
          hasDownloadedCaseFiles,
          policeConversation,
          policeMessages: callMessages.filter((message) => message.speaker === 'officer').map((message) => message.text),
          attachmentStage: attachment.stage,
          scanStage,
          knownPersonName: scanStage === 'complete' ? (scanSubject === 'victim' ? cardHolderProfile.name : cameraPerson.name) : '',
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

    if (lower.includes('wget') || lower.includes('curl') || lower.includes('download') || lower.includes('fetch')) {
      newHistory.push(isFolderAvailable('Case_Files') ? 'ภาพจากสายสืบอยู่ใน Case_Files แล้ว' : hasDownloadedCaseFiles ? 'ไม่พบ Case_Files บน Desktop กรุณาตรวจสอบถังขยะ' : 'ยังไม่มีภาพหลักฐาน กรุณารอสายสืบส่งภาพในสาย', '');
    } else if (lower === 'ls' || lower === 'dir') {
      if (hasDownloadedCaseFiles || documentsReleased || dashcamReleased) {
        newHistory.push(
          'Desktop/  Downloads/  Documents/',
          ...(isFolderAvailable('Case_Files') ? [`📁 Case_Files/ [${caseFiles.filter((file) => file.kind === 'cctv').map((file) => file.name).join('  ')}]`] : []),
          ...(isFolderAvailable('Case_Documents') ? [`📁 Case_Documents/ [${followupFiles.map((file) => file.name).join('  ')}]`] : []),
          ...(isFolderAvailable('Dashcam_Files') ? [`📁 Dashcam_Files/ [${dashcamFiles.map((file) => file.name).join('  ')}]`] : []),
          ''
        );
      } else {
        newHistory.push('Desktop/  Downloads/  Documents/', '(รอสายสืบส่งภาพหลักฐานในสาย)', '');
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
        const file = [...(isFolderAvailable('Case_Files') ? caseFiles.filter((item) => item.kind === 'cctv') : []), ...(isFolderAvailable('Case_Documents') ? followupFiles : []), ...(isFolderAvailable('Dashcam_Files') ? dashcamFiles : [])].find((item) => path.split(/[\\/]/).pop() === item.name);
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
    if (!showBubble) {
      setShowBubble(true);
      return;
    }
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
      style={{ backgroundImage: `url('/bg.jpg')`, '--call-sidebar-width': 'min(360px, 48vw)', '--call-sidebar-space': isCallOpen && !isCallMinimized ? 'var(--call-sidebar-width)' : '0px' }}
      onDragOver={(event) => { if (!event.target.closest('[data-desktop-window]') && Array.from(event.dataTransfer.types).includes(TRASH_FOLDER_DRAG)) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } }}
      onDrop={(event) => { if (event.target.closest('[data-desktop-window]')) return; const id = event.dataTransfer.getData(TRASH_FOLDER_DRAG); if (id) { event.preventDefault(); handleRestoreFolder(id); } }}
    >
      <div className={isPoweredOff || showFinalScreen ? 'hidden' : 'contents'}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none"></div>
      <DesktopTopBar
        openTerminal={openTerminal}
        isTerminalOpen={isTerminalOpen}
        isTerminalMinimized={isTerminalMinimized}
        setIsMainframeOpen={setIsMainframeOpen}
        setMainframeTab={setMainframeTab}
        brainConfig={brainConfig}
        isCallOpen={isCallOpen}
        isCallMinimized={isCallMinimized}
        activeWindow={activeWindow}
        openCall={openCall}
        hideCall={hideCall}
        unreadPoliceMessage={unreadPoliceMessage}
      />
      <DesktopTaskbar
        key={`${followupPhase === 'pending' ? 'before-transition' : 'after-transition'}-${endingStage === 'apology' ? 'ending' : 'playing'}`}
        currentDate={currentDate}
        currentTime={currentTime}
        isTerminalOpen={isTerminalOpen}
        isTerminalMinimized={isTerminalMinimized}
        isExplorerOpen={isExplorerOpen}
        isExplorerMinimized={isExplorerMinimized}
        activeWindow={activeWindow}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        openTerminal={openTerminal}
        openExplorer={openExplorer}
        openCaseFiles={() => openFolder('Case_Files')}
        openDocuments={() => openFolder('Case_Documents')}
        openDashcam={() => openFolder('Dashcam_Files')}
        openTrash={openTrash}
        hideTrash={hideTrash}
        isTrashOpen={isTrashOpen}
        isTrashMinimized={isTrashMinimized}
        hideTerminal={hideTerminal}
        hideExplorer={hideExplorer}
        isScannerOpen={isScannerOpen}
        isScannerMinimized={isScannerMinimized}
        openScanner={openScanner}
        hideScanner={hideScanner}
        utilityWindows={utilityWindows}
        openUtility={openUtility}
        hideUtility={hideUtility}
        hasDownloadedCaseFiles={isFolderAvailable('Case_Files')}
        documentsReleased={isFolderAvailable('Case_Documents')}
        dashcamReleased={isFolderAvailable('Dashcam_Files')}
        onShutdown={() => { cancelCaseSoundRef.current?.(); setIsPoweredOff(true); }}
      />
      <DesktopIcons
        openCaseFiles={() => openFolder('Case_Files')}
        openDocuments={() => openFolder('Case_Documents')}
        openDashcam={() => openFolder('Dashcam_Files')}
        openTrash={openTrash}
        onTrashFolder={handleTrashFolder}
        trashCount={trashFolders.length}
        hasDownloadedCaseFiles={isFolderAvailable('Case_Files')}
        documentsReleased={isFolderAvailable('Case_Documents')}
        dashcamReleased={isFolderAvailable('Dashcam_Files')}
      />
      <TrashWindow isOpen={isTrashOpen} isMinimized={isTrashMinimized} isActive={activeWindow === 'trash'} onActivate={() => setActiveWindow('trash')} onMinimize={() => hideTrash()} onClose={() => hideTrash(true)} folders={trashFolders} onRestore={handleRestoreFolder} onDelete={handleDeleteTrashFolder} onTrashFolder={handleTrashFolder} />
      {showPoliceNotice && <div role="status" className="absolute right-4 top-12 z-[60] flex w-[min(22rem,calc(100vw-2rem))] items-start gap-2 rounded-lg border border-cyan-700 bg-slate-950/95 p-3 text-slate-100 shadow-xl"><button type="button" onClick={openCall} className="min-w-0 flex-1 cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-cyan-400"><span className="block font-mono text-xs font-bold text-cyan-300">☎ สายของสายสืบ // ข้อความใหม่</span><span className="mt-1 block text-sm">สายสืบภัทรวัฒน์ อนันต์กุลติดต่อมา คลิกเพื่อเปิดสาย</span></button><button type="button" onClick={() => setShowPoliceNotice(false)} aria-label="ปิดแจ้งเตือนสายสนทนา" className="cursor-pointer px-1 text-slate-400 hover:text-white">✕</button></div>}
      {reportSelection && <div role="status" draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('text/plain', `case-report:${reportSelection}`); }} className="absolute left-4 top-12 z-[60] flex w-[min(22rem,calc(100vw-2rem))] cursor-grab items-start gap-3 rounded border border-cyan-400 bg-slate-950/95 p-3 text-sm text-cyan-100 shadow-lg active:cursor-grabbing"><div className="min-w-0 flex-1"><div className="font-bold text-emerald-400">สายสืบภัทรวัฒน์ อนันต์กุล: {reportSelection === 'name' ? (reportConversation.stage === 'awaiting-victim' ? 'ช่วยหาชื่อผู้เสียชีวิตให้ผมก่อนนะ' : 'แล้วคนที่ยิงล่ะ คุณพอจะตรวจสอบได้ไหม') : 'ว่าแต่คุณมีที่อยู่ของเขาไหม'}</div><div className="mt-1 text-xs text-cyan-200">คลิกข้อมูลที่ไฮไลต์ใน HumanDB หรือลากกล่องนี้ไปวางบนข้อมูล</div></div><button type="button" onClick={() => setReportSelection(null)} aria-label="ยกเลิกคำร้อง" className="cursor-pointer px-1 text-slate-400 hover:text-white">✕</button></div>}
      <DesktopCompanion
        isCallPanelVisible={isCallOpen && !isCallMinimized}
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
        onOpenCall={openCall}
        setIsMainframeOpen={setIsMainframeOpen}
        setMainframeTab={setMainframeTab}
        brainConfig={brainConfig}
        handlePokeCapri={handlePokeCapri}
        getCapriSprite={getCapriSprite}
        analysisPromptVisible={(['offered', 'manual-ready', 'enhancing'].includes(analysisPrompt) || guidedEvidenceVisible) && showBubble}
        guidedEvidenceVisible={guidedEvidenceVisible}
        isFollowupCallActive={followupPhase === 'active'}
        onDismissGuidedEvidence={() => { setGuidedEvidenceVisible(false); setCapriMessage('ได้เลยชูม มาคุยเล่นกันต่อเถอะ'); }}
        closingChoiceVisible={endingStage === 'apology'}
        onClosingChoice={handleClosingChoice}
        onCloseBubble={() => setShowBubble(false)}
      />
      <PoliceCallWindow
        isOpen={isCallOpen} isMinimized={isCallMinimized}
        onActivate={() => setActiveWindow('call')} onMinimize={hideCall}
        phase={hasIncomingCase ? 'ringing' : policeConversation} callEndReason={callEndReason} messages={callMessages}
        typingText={callQueue.length ? splitCallText(callQueue[0].text).slice(0, typedCount).join('') : ''}
        isTyping={callQueue.length > 0} onAnswer={handleAcceptCase} onDecline={handleDeclineCall} onChoice={handlePoliceChoice}
        onCallbackChoice={handleCallbackChoice}
        attachment={attachment} uploadProgress={uploadProgress} onOpenPhoto={handleOpenAttachment}
        reportStage={reportConversation.stage} onSelectReportRequest={handleSelectReportRequest}
        victimReplyReady={victimReplyReady} onSendVictimReply={handleSendVictimReply}
        isFollowupCall={['ringing', 'active'].includes(followupPhase)} onOpenDocuments={handleOpenFollowupDocuments}
        documentsAttachment={documentsAttachment} documentsUploadProgress={documentsUploadProgress}
        dashcamAttachment={dashcamAttachment} dashcamUploadProgress={dashcamUploadProgress} onOpenDashcam={handleOpenDashcam} endingStage={endingStage} onSendDashcamName={handleSendDashcamName}
        currentQuestion={currentGuidedQuestion} questionPhase={guidedSequence.phase} manualProgress={manualProgress}
        onSelectQuestion={handleSelectGuidedQuestion}
        guidedAnswer={selectedEvidenceResult.complete ? selectedEvidenceResult.answer : guidedEvidenceAnswer} onSendGuidedAnswer={handleSendGuidedAnswer} isThinking={isThinking}
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
        onCloseBubble={() => setShowBubble(false)}
        getCapriSprite={getCapriSprite}
        cliScrollRef={cliScrollRef}
        cliHistory={cliHistory}
        handleCliSubmit={handleCliSubmit}
        cliInputRef={cliInputRef}
        cliInput={cliInput}
        setCliInput={setCliInput}
        hasDownloadedCaseFiles={hasDownloadedCaseFiles}
      />
      <CaseFileWindow
        folderName={explorerFolder}
        files={explorerFolder === 'Dashcam_Files' ? (isFolderAvailable('Dashcam_Files') ? dashcamFiles : []) : explorerFolder === 'Case_Documents' ? (isFolderAvailable('Case_Documents') ? followupFiles : []) : (isFolderAvailable('Case_Files') ? caseFiles.filter((file) => file.kind === 'cctv') : [])}
        isExplorerOpen={isExplorerOpen && isFolderAvailable(explorerFolder)}
        hasDownloadedCaseFiles={hasDownloadedCaseFiles}
        isExplorerMinimized={isExplorerMinimized}
        activeWindow={activeWindow}
        setActiveWindow={setActiveWindow}
        hideExplorer={hideExplorer}
        selectedCaseFile={selectedCaseFile ? ([...caseFiles, ...followupFiles, ...dashcamFiles].find((file) => file.name === selectedCaseFile.name) || selectedCaseFile) : null}
        viewedCaseFiles={viewedCaseFiles}
        onOpenCaseFile={handleOpenCaseFile}
        onBackToFiles={handleBackToCaseFiles}
        manualScanReady={(selectedCaseFile?.subject === 'dashcam' && endingStage === 'awaiting-face') || (selectedCaseFile?.subject === 'victim' && reportConversation.stage === 'awaiting-victim') || (selectedCaseFile?.subject === 'suspect' && reportConversation.stage === 'awaiting-suspect')}
        onManualScan={() => startFaceScan(selectedCaseFile?.subject)}
        onOpenPoliceQuestions={openCall}
        hasPoliceQuestions={explorerFolder === 'Case_Documents' && documentsReleased && guidedSequence.phase !== 'complete'}
        hasTimelineResult={Boolean(timelineResult?.ok)}
        onOpenTimeline={() => openUtility('timeline')}
        manualEvidence={manualEvidence}
        selectedEvidenceIds={selectedEvidenceIds}
        onSelectEvidence={handleSelectManualEvidence}
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
        subject={scanSubject}
        onOpenHumanDB={() => openUtility('human')}
      />
      <DatabaseWindow isOpen={utilityWindows.human.open} isMinimized={utilityWindows.human.minimized} isActive={activeWindow === 'human'} onActivate={() => setActiveWindow('human')} onMinimize={() => hideUtility('human')} onClose={() => hideUtility('human', true)} reportStage={reportConversation.stage} reportSelection={reportSelection} reportPersonId={reportPerson.id} reportReady={reportReady} onSendName={(person) => handleSendReport(person, 'name')} onSendAddress={(person) => handleSendReport(person, 'address')} onPersonFound={handlePersonFound} />
      <CalculatorWindow isOpen={utilityWindows.calculator.open} isMinimized={utilityWindows.calculator.minimized} isActive={activeWindow === 'calculator'} onActivate={() => setActiveWindow('calculator')} onMinimize={() => hideUtility('calculator')} onClose={() => hideUtility('calculator', true)} />
      <NotepadWindow isOpen={utilityWindows.notepad.open} isMinimized={utilityWindows.notepad.minimized} isActive={activeWindow === 'notepad'} onActivate={() => setActiveWindow('notepad')} onMinimize={() => hideUtility('notepad')} onClose={() => hideUtility('notepad', true)} />
      <CaseTimelineWindow isOpen={utilityWindows.timeline.open} isMinimized={utilityWindows.timeline.minimized} isActive={activeWindow === 'timeline'} onActivate={() => setActiveWindow('timeline')} onMinimize={() => hideUtility('timeline')} onClose={() => hideUtility('timeline', true)} loading={timelineLoading} result={timelineResult} onRetry={() => handleAskGuidedEvidence(guidedEvidenceQuestions.find((item) => item.mode === 'timeline'), true)} onOpenSource={(name) => { if (handleOpenCaseFile(name)) openExplorer(); }} />
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
        openExplorer={openExplorer}
        isPerchedOnWindow={isPerchedOnWindow}
        setIsPerchedOnWindow={setIsPerchedOnWindow}
      />
      </div>
      {!isPoweredOff && !showFinalScreen && followupPhase === 'intertitle' && <div role="status" aria-label="เวลาผ่านไป สำนักงานตำรวจแห่งชาติ กรุงเทพมหานคร 15:45 น." className="absolute inset-0 z-[90] bg-black text-white"><p aria-hidden="true" className="absolute bottom-10 left-8 h-[4.875em] whitespace-pre-line text-[24px] leading-relaxed">{INTERTITLE_CHARACTERS.slice(0, intertitleTypedCount).join('')}</p></div>}
      {isPoweredOff && <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#03070c] px-6 text-center text-slate-300" aria-label="เครื่องปิดอยู่"><div className="font-mono text-xs tracking-[0.25em] text-slate-500">NIKI OS</div><div className="mt-3 text-lg font-semibold text-slate-300">เครื่องปิดอยู่</div><button type="button" autoFocus onClick={() => setIsPoweredOff(false)} className="mt-7 flex cursor-pointer items-center gap-2 rounded border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-cyan-200 hover:border-cyan-700 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-cyan-400"><span aria-hidden="true" className="text-xl">⏻</span>เปิดเครื่อง</button></div>}
      {!isPoweredOff && showFinalScreen && <div role="status" className="absolute inset-0 z-[110] flex items-center justify-center bg-black px-6 text-center text-[24px] font-medium text-white">โปรดติดตามตอนต่อไป</div>}
    </div>
  );
}
