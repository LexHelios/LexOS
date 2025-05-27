import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface SvgGlyphProps {
  size?: number;
  color?: string;
  isActive?: boolean;
  pulseIntensity?: number;
}

export const SvgGlyph: React.FC<SvgGlyphProps> = ({
  size = 48,
  color = '#00ffff',
  isActive = false,
  pulseIntensity = 1,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Animation variants
  const pulseVariants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const circuitVariants = {
    initial: { pathLength: 0 },
    animate: {
      pathLength: 1,
      transition: {
        duration: 2,
        ease: 'easeInOut',
      },
    },
  };

  const glowVariants = {
    initial: { opacity: 0.3 },
    animate: {
      opacity: [0.3, 0.6, 0.3],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <motion.svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      initial="initial"
      animate={isActive ? 'animate' : 'initial'}
      variants={pulseVariants}
    >
      {/* Shield Base */}
      <motion.path
        d="M50 5 L90 25 V65 C90 80 70 90 50 95 C30 90 10 80 10 65 V25 L50 5 Z"
        fill="none"
        stroke={color}
        strokeWidth="2"
        variants={circuitVariants}
      />

      {/* Neural Circuit Pattern */}
      <motion.g variants={circuitVariants}>
        {/* Horizontal Lines */}
        <path
          d="M30 30 H70 M30 50 H70 M30 70 H70"
          fill="none"
          stroke={color}
          strokeWidth="1"
        />
        {/* Vertical Lines */}
        <path
          d="M40 20 V80 M60 20 V80"
          fill="none"
          stroke={color}
          strokeWidth="1"
        />
        {/* Diagonal Lines */}
        <path
          d="M30 30 L70 70 M30 70 L70 30"
          fill="none"
          stroke={color}
          strokeWidth="1"
        />
      </motion.g>

      {/* Circuit Nodes */}
      <motion.g variants={glowVariants}>
        <circle cx="30" cy="30" r="2" fill={color} />
        <circle cx="50" cy="30" r="2" fill={color} />
        <circle cx="70" cy="30" r="2" fill={color} />
        <circle cx="30" cy="50" r="2" fill={color} />
        <circle cx="50" cy="50" r="2" fill={color} />
        <circle cx="70" cy="50" r="2" fill={color} />
        <circle cx="30" cy="70" r="2" fill={color} />
        <circle cx="50" cy="70" r="2" fill={color} />
        <circle cx="70" cy="70" r="2" fill={color} />
      </motion.g>

      {/* Eye */}
      <motion.g variants={circuitVariants}>
        <circle
          cx="50"
          cy="50"
          r="15"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        <circle
          cx="50"
          cy="50"
          r="8"
          fill={color}
          fillOpacity="0.3"
        />
        <circle
          cx="50"
          cy="50"
          r="4"
          fill={color}
        />
      </motion.g>

      {/* Glow Effect */}
      <motion.filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <motion.feGaussianBlur
          stdDeviation={pulseIntensity}
          result="coloredBlur"
        />
        <motion.feMerge>
          <motion.feMergeNode in="coloredBlur" />
          <motion.feMergeNode in="SourceGraphic" />
        </motion.feMerge>
      </motion.filter>
    </motion.svg>
  );
}; 