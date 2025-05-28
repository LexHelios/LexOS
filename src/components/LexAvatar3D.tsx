import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { motion } from "framer-motion";

export const LexAvatar3D: React.FC = () => (
  <div style={{ width: 180, height: 180, position: "absolute", top: 24, right: 24, zIndex: 20 }}>
    <Canvas camera={{ position: [0, 0, 4] }}>
      {/* Glowing sphere as placeholder for Lex's head */}
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial emissive="#00fff7" color="#222" emissiveIntensity={2} />
      </mesh>
      {/* Animated halo */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.1, 0.04, 16, 100]} />
        <meshStandardMaterial emissive="#ff9900" color="#222" emissiveIntensity={1.5} />
      </mesh>
      <ambientLight intensity={0.7} />
      <pointLight position={[2, 2, 2]} intensity={1.2} color="#00fff7" />
      <OrbitControls enableZoom={false} enablePan={false} />
      {/* Optional: Overlay label */}
      <Html center>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{ color: "#00fff7", fontWeight: 700, fontSize: 14, textShadow: "0 0 8px #00fff7" }}
        >
          LEX
        </motion.div>
      </Html>
    </Canvas>
  </div>
); 