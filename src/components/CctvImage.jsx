import { useEffect, useRef } from 'react';

// Fictional stills from the same low-resolution camera.
export default function CctvImage({ src, subject = 'suspect', focused = false, className = '' }) {
  const canvasRef = useRef(null);
  const width = subject === 'dashcam' ? (focused ? 320 : 960) : focused ? (subject === 'victim' ? 48 : 32) : 120;
  const height = focused ? width : Math.round(width * 9 / 16);

  useEffect(() => {
    let cancelled = false;
    const picture = new Image();
    picture.onload = () => {
      if (cancelled || !canvasRef.current) return;
      const context = canvasRef.current.getContext('2d');
      context.filter = 'grayscale(0.85) contrast(1.12) brightness(0.9)';
      if (focused) {
        const crop = subject === 'dashcam' ? { x: 0.37, y: 0.03, w: 0.16, h: 0.285 } : subject === 'victim' ? { x: 0.11, y: 0.49, w: 0.16, h: 0.285 } : { x: 0.35, y: 0.20, w: 0.14, h: 0.25 };
        context.drawImage(picture, picture.width * crop.x, picture.height * crop.y, picture.width * crop.w, picture.height * crop.h, 0, 0, width, height);
      } else context.drawImage(picture, 0, 0, width, height);
    };
    picture.src = src;
    return () => { cancelled = true; };
  }, [src, subject, focused, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} role="img" aria-label={subject === 'dashcam' ? 'ภาพบุคคลจากกล้องหน้ารถในคดีสมมติ' : subject === 'victim' ? 'ภาพผู้เสียชีวิตจากกล้องวงจรปิดในคดีสมมติ' : 'ภาพบุคคลจากกล้องวงจรปิดคุณภาพต่ำในคดีสมมติ'} className={`block h-auto w-full bg-slate-900 ${className}`} style={{ imageRendering: 'pixelated' }} />;
}
