import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
}

export const Tooltip = ({
  content,
  children,
  position = 'top',
  delay = 0.2,
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const trigger = triggerRef.current.getBoundingClientRect();
    const tooltip = tooltipRef.current.getBoundingClientRect();

    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = trigger.left + (trigger.width - tooltip.width) / 2;
        y = trigger.top - tooltip.height - 8;
        break;
      case 'right':
        x = trigger.right + 8;
        y = trigger.top + (trigger.height - tooltip.height) / 2;
        break;
      case 'bottom':
        x = trigger.left + (trigger.width - tooltip.width) / 2;
        y = trigger.bottom + 8;
        break;
      case 'left':
        x = trigger.left - tooltip.width - 8;
        y = trigger.top + (trigger.height - tooltip.height) / 2;
        break;
    }

    setTooltipPosition({ x, y });
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, position]);

  const variants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0,
      x: position === 'left' ? 10 : position === 'right' ? -10 : 0,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
    },
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      className="inline-block"
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={variants}
            transition={{ duration: 0.2, delay }}
            style={{
              position: 'fixed',
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              zIndex: 50,
            }}
            className="px-3 py-2 text-sm bg-popover text-popover-foreground rounded-md shadow-lg"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 