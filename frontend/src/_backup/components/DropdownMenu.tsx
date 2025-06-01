import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export const DropdownMenu = ({
  trigger,
  items,
  align = 'left',
}: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < items.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && items[selectedIndex].onClick) {
            items[selectedIndex].onClick?.();
            setIsOpen(false);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, items, selectedIndex]);

  const updatePosition = () => {
    if (!menuRef.current || !triggerRef.current) return;

    const trigger = triggerRef.current.getBoundingClientRect();
    const menu = menuRef.current.getBoundingClientRect();

    if (align === 'right') {
      menuRef.current.style.right = '0';
    } else {
      menuRef.current.style.left = '0';
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen, align]);

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-56 rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5"
          >
            <div className="py-1" role="menu">
              {items.map((item, index) => (
                <motion.button
                  key={item.label}
                  whileHover={{ backgroundColor: 'var(--muted)' }}
                  className={`w-full px-4 py-2 text-left text-sm ${
                    item.disabled
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer'
                  } ${
                    item.danger
                      ? 'text-destructive hover:bg-destructive/10'
                      : 'text-foreground'
                  }`}
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick?.();
                      setIsOpen(false);
                    }
                  }}
                  role="menuitem"
                  disabled={item.disabled}
                >
                  <div className="flex items-center">
                    {item.icon && (
                      <span className="mr-2 h-4 w-4">{item.icon}</span>
                    )}
                    {item.label}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 