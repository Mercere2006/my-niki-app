import { useEffect, useRef } from 'react';

// Render the evidence at camera-like resolution, rather than exposing a clear portrait.
export default function CctvImage({ src, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled || !canvasRef.current) return;
      const context = canvasRef.current.getContext('2d');
      context.filter = 'grayscale(0.9) contrast(1.2) brightness(0.72)';
      context.drawImage(image, 0, 0, 72, 48);
    };
    image.src = src;
    return () => { cancelled = true; };
  }, [src]);

  return <canvas ref={canvasRef} width="72" height="48" role="img" aria-label="ภาพกล้องวงจรปิดคุณภาพต่ำในคดีสมมติ" className={`block h-auto w-full bg-slate-900 ${className}`} style={{ imageRendering: 'pixelated' }} />;
}
