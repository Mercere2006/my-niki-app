import { useGameState } from './hooks/useGameState';
import LinuxDesktop from './components/LinuxDesktop';
import { initialNikiMessage } from './services/policeCall';

export default function App() {
  const [gameState, setGameState] = useGameState('gameState', 'IDLE'); // 'IDLE' | 'PROMPT_CHOICE' | 'ACTIVE' | 'CASE_CLOSED' | 'CASE_ABORTED'

  const [chatLogs, setChatLogs] = useGameState('chatLogs', [
    {
      sender: 'NIKI',
      time: '14:22:00',
      text: initialNikiMessage,
      isPrompt: false,
    },
  ]);

  const getTimeString = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  };

  // เมื่อมีคดีแจ้งเตือนส่งมาจากสายสืบภัทรวัฒน์ อนันต์กุล (เมื่อผู้เล่นหยุดคุยหรือไม่ได้เริ่มคุย)
  const handleIncomingCase = () => {
    setGameState('PROMPT_CHOICE');
    setChatLogs((prev) => [
      ...prev,
      {
        sender: 'INSP. PHATTARA',
        time: getTimeString(),
        text: 'สายสืบภัทรวัฒน์ อนันต์กุลกำลังโทรหาเจ้าหน้าที่สายด่วน',
        isPrompt: true,
      },
      {
        sender: 'NIKI',
        time: getTimeString(),
        text: 'ชูม สายสืบภัทรวัฒน์ อนันต์กุลโทรเข้ามาแล้ว กดรับสายได้เลย',
        isPrompt: false,
      },
    ]);
  };

  // เมื่อผู้เล่นพิมพ์ตอบ "รับ"
  const handleAcceptMission = (playerText = 'รับทำคดี') => {
    setGameState('ACTIVE');
    setChatLogs((prev) => [
      ...prev,
      {
        sender: 'SHOOM',
        time: getTimeString(),
        text: typeof playerText === 'string' && playerText ? playerText : 'รับสายจากสายสืบภัทรวัฒน์ อนันต์กุล',
      },
      {
        sender: 'NIKI',
        time: getTimeString(),
        text: 'รับสายแล้วชูม ฉันจะอยู่ตรงนี้ถ้าต้องการความช่วยเหลือ',
      },
    ]);
  };

  // เมื่อผู้เล่นพิมพ์ตอบ "ไม่รับ"
  const handleDeclineMission = (playerText = 'ไม่รับงาน ขอพักก่อน') => {
    setGameState('CASE_ABORTED');
    setChatLogs((prev) => [
      ...prev,
      {
        sender: 'SHOOM',
        time: getTimeString(),
        text: typeof playerText === 'string' && playerText ? playerText : 'ขอปฏิเสธภารกิจนี้ก่อน มีธุระอื่นแทรกเข้ามา',
      },
      {
        sender: 'NIKI',
        time: getTimeString(),
        text: 'รับทราบชูม... งั้นฉันของีบต่อบนเดสก์ท็อปละกันนะ Zzz (CASE ABORTED)',
      },
    ]);
  };

  const handleSendMessage = (text, reply) => {
    const userMsg = {
      sender: 'SHOOM',
      time: getTimeString(),
      text,
    };

    setChatLogs((prev) => [...prev, userMsg]);

    const capriReply = {
      sender: 'NIKI',
      time: getTimeString(),
      text: reply,
    };

    setChatLogs((prev) => [...prev, capriReply]);
  };

  const handleTransmitReport = () => {
    setGameState('CASE_CLOSED');
    setChatLogs((prev) => [
      ...prev,
      {
        sender: 'SHOOM',
        time: getTimeString(),
        text: 'ส่งผลเปรียบเทียบภาพให้สายสืบภัทรวัฒน์ อนันต์กุลตรวจสอบต่อแล้ว',
      },
      {
        sender: 'INSP. PHATTARA',
        time: getTimeString(),
        text: 'ขอบคุณมากครับเจ้าหน้าที่ ผมจะนำเบาะแสนี้ไปตรวจสอบต่อ',
      },
      {
        sender: 'NIKI',
        time: getTimeString(),
        text: '🎉 พรีมสุดๆ ชูม! ส่งเบาะแสให้สายสืบภัทรวัฒน์ อนันต์กุลเรียบร้อยแล้ว! (CASE CLOSED)',
      },
    ]);
  };

  return (
    <LinuxDesktop
      gameState={gameState}
      chatLogs={chatLogs}
      onIncomingCase={handleIncomingCase}
      onAcceptMission={handleAcceptMission}
      onDeclineMission={handleDeclineMission}
      onSendMessage={handleSendMessage}
      onTransmitReport={handleTransmitReport}
    />
  );
}
