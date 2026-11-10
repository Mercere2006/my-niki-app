import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshWobbleMaterial, Sphere } from '@react-three/drei';

function NikiHologramCore({ gameState }) {
  const meshRef = useRef();

  // หมุนโมเดล 3D ตลอดเวลา
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.8;
      meshRef.current.rotation.x += delta * 0.3;
    }
  });

  // เปลี่ยนสีตามสถานะเกม (เหมือน NIKI Glitch Status)
  const getColor = () => {
    if (gameState === 'CASE_CLOSED') return '#10b981'; // เขียว (Success)
    if (gameState === 'CASE_ABORTED') return '#f43f5e'; // แดง (Shutdown)
    return '#38bdf8'; // ฟ้า Cyber Blue (Normal/Active)
  };

  return (
    <Float speed={3} rotationIntensity={1.5} floatIntensity={2}>
      {/* วงแหวนโฮโลแกรมรอบนอก */}
      <mesh ref={meshRef}>
        <torusGeometry args={[1.2, 0.05, 16, 100]} />
        <meshBasicMaterial color={getColor()} wireframe />
      </mesh>

      {/* แกนพลังงาน NIKI ตรงกลาง */}
      <Sphere args={[0.7, 32, 32]}>
        <MeshWobbleMaterial
          color={getColor()}
          factor={0.4}
          speed={2}
          wireframe
        />
      </Sphere>
    </Float>
  );
}

export default function NikiAvatar3D({ gameState }) {
  return (
    <div className="w-full h-40 bg-slate-950/60 border border-sky-900/40 rounded-lg relative overflow-hidden flex items-center justify-center">
      {/* แถบ Label ด้านบน */}
      <div className="absolute top-2 left-2 text-[10px] text-sky-400 font-mono flex items-center gap-1.5 z-10">
        <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
        NIKI 3D HOLOGRAM AVATAR // LIVE
      </div>

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 0, 3.5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#38bdf8" />
        <NikiHologramCore gameState={gameState} />
      </Canvas>
    </div>
  );
}