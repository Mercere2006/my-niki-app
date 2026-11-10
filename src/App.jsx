import { useState } from 'react';
import LinuxDesktop from './components/LinuxDesktop';

export default function App() {
  const [gameState, setGameState] = useState('IDLE'); // 'IDLE' | 'PROMPT_CHOICE' | 'ACTIVE' | 'CASE_CLOSED' | 'CASE_ABORTED'

  const [chatLogs, setChatLogs] = useState([
    {
      sender: 'NIKI',
      time: '14:22:00',
      text: 'ไงชูม! ฉัน NIKI ตัวแม่แห่งไซเบอร์สเปซ สแตนด์บายอยู่บนเดสก์ท็อปแล้ว มีอะไรชวนคุยเล่นหรืออยากให้ช่วยมั้ย?',
      isPrompt: false,
    },
  ]);

  const getTimeString = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  };

  // เมื่อมีคดีแจ้งเตือนส่งมาจากสารวัตรภัทร (เมื่อผู้เล่นหยุดคุยหรือไม่ได้เริ่มคุย)
  const handleIncomingCase = () => {
    setGameState('PROMPT_CHOICE');
    setChatLogs((prev) => [
      ...prev,
      {
        sender: 'INSP. PHATTARA',
        time: getTimeString(),
        text: 'Shoom! มีคดีเอกสารสำคัญหายจากห้องเก็บหลักฐาน ผมอยากให้คุณกับ NIKI ช่วยตรวจภาพจากกล้อง คุณจะรับคดีนี้มั้ย?',
        isPrompt: true,
      },
      {
        sender: 'NIKI',
        time: getTimeString(),
        text: 'ชูม! สารวัตรภัทรมีคดีเอกสารสำคัญหาย อยากให้เราช่วยตรวจภาพจากกล้องวงจรปิด ชูมจะรับคดีนี้มั้ย?',
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
        text: typeof playerText === 'string' && playerText ? playerText : 'รับคำขอแล้ว เริ่มตรวจสอบภาพหลักฐานจากกล้องวงจรปิด',
      },
      {
        sender: 'NIKI',
        time: getTimeString(),
        text: 'จัดไปชูม! เปิด Terminal แล้วไปรับภาพหลักฐานจากสารวัตรกันเลย!',
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
        text: 'ส่งผลเปรียบเทียบภาพให้สารวัตรภัทรตรวจสอบต่อแล้ว',
      },
      {
        sender: 'INSP. PHATTARA',
        time: getTimeString(),
        text: 'ขอบคุณ Shoom และ NIKI มาก! ผมจะนำเบาะแสนี้ไปตรวจสอบร่วมกับหลักฐานอื่นต่อ',
      },
      {
        sender: 'NIKI',
        time: getTimeString(),
        text: '🎉 พรีมสุดๆ ชูม! ส่งเบาะแสให้สารวัตรภัทรเรียบร้อยแล้ว! (CASE CLOSED)',
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
