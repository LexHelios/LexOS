import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Text, Environment, Float, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

interface LexHeadProps {
  isTalking: boolean;
  message?: string;
}

const RobotHead: React.FC<LexHeadProps> = ({ isTalking, message }) => {
  const headRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const [mouthOpen, setMouthOpen] = useState(0);
  const [eyeGlow, setEyeGlow] = useState(1);

  // Simulate talking animation
  useEffect(() => {
    if (isTalking) {
      const interval = setInterval(() => {
        setMouthOpen(Math.random() * 0.3);
        setEyeGlow(1 + Math.random() * 0.5);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setMouthOpen(0);
      setEyeGlow(1);
    }
  }, [isTalking]);

  useFrame((state) => {
    if (headRef.current) {
      // Subtle floating animation
      headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      headRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group ref={headRef}>
      {/* Head Base */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color="#2a2a2a"
          metalness={0.8}
          roughness={0.2}
          envMapIntensity={1}
        />
      </mesh>

      {/* Face Plate */}
      <mesh position={[0, 0, 0.9]}>
        <sphereGeometry args={[0.95, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Eyes */}
      <group position={[0, 0.2, 0.8]}>
        {/* Left Eye */}
        <mesh position={[-0.3, 0, 0]}>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={eyeGlow}
          />
        </mesh>
        {/* Right Eye */}
        <mesh position={[0.3, 0, 0]}>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={eyeGlow}
          />
        </mesh>
      </group>

      {/* Mouth */}
      <mesh position={[0, -0.3, 0.8]}>
        <boxGeometry args={[0.4, mouthOpen, 0.1]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Decorative Elements */}
      <group position={[0, 0.5, 0.8]}>
        <mesh>
          <boxGeometry args={[0.6, 0.05, 0.05]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      {/* Holographic Display */}
      {message && (
        <group position={[0, -0.8, 0.8]}>
          <Text
            color="#00ffff"
            fontSize={0.2}
            maxWidth={1.5}
            textAlign="center"
            font="/fonts/Orbitron-Regular.ttf"
          >
            {message}
          </Text>
        </group>
      )}
    </group>
  );
};

const LexHead: React.FC<LexHeadProps> = (props) => {
  return (
    <div className="w-full h-[400px] relative">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <PresentationControls
          global
          rotation={[0, 0, 0]}
          polar={[-Math.PI / 4, Math.PI / 4]}
          azimuth={[-Math.PI / 4, Math.PI / 4]}
        >
          <Float
            speed={1.5}
            rotationIntensity={0.2}
            floatIntensity={0.5}
          >
            <RobotHead {...props} />
          </Float>
        </PresentationControls>
        <Environment preset="city" />
        <ambientLight intensity={0.5} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={1}
          castShadow
        />
      </Canvas>
    </div>
  );
};

export default LexHead; 