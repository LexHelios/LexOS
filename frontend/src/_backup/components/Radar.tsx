import React, { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Radar: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { darkMode } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set canvas size
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 20;

      // Draw radar background
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = darkMode ? '#00ff00' : '#006400';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw radar lines
      for (let i = 0; i < 4; i++) {
        const lineAngle = (Math.PI / 2) * i;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(lineAngle) * radius,
          centerY + Math.sin(lineAngle) * radius
        );
        ctx.strokeStyle = darkMode ? '#00ff00' : '#006400';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw radar sweep
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      ctx.strokeStyle = darkMode ? '#00ff00' : '#006400';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw radar sweep gradient
      const gradient = ctx.createLinearGradient(
        centerX,
        centerY,
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      gradient.addColorStop(0, darkMode ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 100, 0, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle - 0.1, angle + 0.1);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Update angle
      angle += 0.02;
      if (angle > Math.PI * 2) {
        angle = 0;
      }

      // Draw random blips
      for (let i = 0; i < 5; i++) {
        const blipAngle = Math.random() * Math.PI * 2;
        const blipDistance = Math.random() * radius;
        const blipX = centerX + Math.cos(blipAngle) * blipDistance;
        const blipY = centerY + Math.sin(blipAngle) * blipDistance;

        ctx.beginPath();
        ctx.arc(blipX, blipY, 3, 0, Math.PI * 2);
        ctx.fillStyle = darkMode ? '#00ff00' : '#006400';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [darkMode]);

  return (
    <div className="military-panel">
      <div className="military-heading mb-2">RADAR</div>
      <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ background: 'rgba(0, 0, 0, 0.8)' }}
        />
      </div>
    </div>
  );
};

export default Radar; 