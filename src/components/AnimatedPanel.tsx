import React from "react";
import { motion } from "framer-motion";

interface AnimatedPanelProps {
  children: React.ReactNode;
  delay?: number;
  pulse?: boolean;
  glowColor?: string;
}

export const AnimatedPanel: React.FC<AnimatedPanelProps> = ({
  children,
  delay = 0,
  pulse = false,
  glowColor = "#00fff7",
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay, ease: "easeOut" }}
    className={`relative rounded-2xl shadow-lg border border-cyan-400 bg-[#0a0020]/80 backdrop-blur-md p-4 ${pulse ? "animate-pulse" : ""}`}
    style={pulse ? { boxShadow: `0 0 24px 2px ${glowColor}` } : {}}
  >
    {children}
  </motion.div>
); 