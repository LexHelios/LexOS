import React, { useEffect, useRef } from 'react';

const BattleRadar: React.FC = () => {
  const sweepRef = useRef<SVGLinearGradientElement>(null);
  const [angle, setAngle] = React.useState(0);
  const [blips, setBlips] = React.useState([
    { x: 120, y: 60 },
    { x: 80, y: 140 },
    { x: 180, y: 100 },
    { x: 60, y: 80 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAngle((prev) => (prev + 2) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-center items-center my-8">
      <svg width="240" height="240" viewBox="0 0 240 240">
        <circle cx="120" cy="120" r="100" stroke="#00ff99" strokeWidth="2" fill="none" />
        <circle cx="120" cy="120" r="70" stroke="#00ff99" strokeWidth="1" fill="none" opacity="0.5" />
        <circle cx="120" cy="120" r="40" stroke="#00ff99" strokeWidth="1" fill="none" opacity="0.3" />
        {/* Radar sweep */}
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '120px 120px' }}>
          <path d="M120,120 L120,20 A100,100 0 0,1 220,120 Z" fill="url(#sweep)" opacity="0.3" />
        </g>
        <defs>
          <linearGradient id="sweep" x1="120" y1="120" x2="220" y2="120">
            <stop offset="0%" stopColor="#00ff99" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#00ff99" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Blips */}
        {blips.map((blip, i) => (
          <circle key={i} className="radar-blip" cx={blip.x} cy={blip.y} r="6" />
        ))}
      </svg>
    </div>
  );
};

export default BattleRadar; 