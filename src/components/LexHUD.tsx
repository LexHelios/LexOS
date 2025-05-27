import React from "react";
import { motion } from "framer-motion";

export const LexHUD: React.FC<{ mood?: "idle" | "thinking" | "responding" | "alert" }> = ({ mood = "idle" }) => {
  // Mood-based colors
  const ringColor = {
    idle: "#00fff7",
    thinking: "#7f00ff",
    responding: "#00ff99",
    alert: "#ff0055",
  }[mood];

  return (
    <div className="absolute top-6 right-6 z-20">
      {/* Voice Rings */}
      <motion.svg width={120} height={120} className="absolute left-[-12px] top-[-12px]">
        <motion.circle
          cx={60}
          cy={60}
          r={48}
          fill="none"
          stroke={ringColor}
          strokeWidth={3}
          initial={{ opacity: 0.4, scale: 1 }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
            scale: [1, 1.15, 1],
          }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />
        {/* Ripple on response */}
        {mood === "responding" && (
          <motion.circle
            cx={60}
            cy={60}
            r={48}
            fill="none"
            stroke={ringColor}
            strokeWidth={6}
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: [0.5, 0], scale: [1, 1.4] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut" }}
          />
        )}
      </motion.svg>
      {/* Lex Face */}
      <motion.div
        className="w-24 h-24 rounded-full border-4 border-cyan-400 bg-[#0a0020]/80 backdrop-blur-md shadow-xl flex items-center justify-center relative"
        animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      >
        {/* SVG Face */}
        <svg width={60} height={60} viewBox="0 0 60 60">
          {/* Eyes */}
          <motion.ellipse
            cx={20}
            cy={30}
            rx={5}
            ry={mood === "thinking" ? 2 : 5}
            fill="#00fff7"
            animate={{
              ry: mood === "thinking" ? [2, 5, 2] : 5,
            }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          />
          <motion.ellipse
            cx={40}
            cy={30}
            rx={5}
            ry={mood === "thinking" ? 2 : 5}
            fill="#00fff7"
            animate={{
              ry: mood === "thinking" ? [2, 5, 2] : 5,
            }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          />
          {/* Mouth / Voice Bar */}
          <motion.rect
            x={25}
            y={42}
            width={10}
            height={mood === "responding" ? 6 : 3}
            rx={3}
            fill="#00fff7"
            animate={{
              height: mood === "responding" ? [3, 8, 3] : 3,
            }}
            transition={{ repeat: Infinity, duration: 0.7, ease: "easeInOut" }}
          />
        </svg>
      </motion.div>
      <p className="text-xs text-cyan-200 text-center mt-2 tracking-widest font-mono">
        LEX ONLINE
      </p>
    </div>
  );
}; 