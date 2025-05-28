import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Shortcut {
  key: string;
  description: string;
  category: string;
}

interface KeyboardShortcutsProps {
  shortcuts: Shortcut[];
  onClose: () => void;
}

export const KeyboardShortcuts = ({ shortcuts, onClose }: KeyboardShortcutsProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === '?') {
        e.preventDefault();
        setIsVisible(true);
      } else if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-2xl rounded-lg bg-background p-6 shadow-xl"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
              <button
                onClick={() => {
                  setIsVisible(false);
                  onClose();
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {categories.map(category => (
                <div key={category}>
                  <h3 className="mb-3 text-lg font-semibold text-muted-foreground">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {shortcuts
                      .filter(s => s.category === category)
                      .map(shortcut => (
                        <div
                          key={shortcut.key}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-muted-foreground">
                            {shortcut.description}
                          </span>
                          <kbd className="rounded bg-muted px-2 py-1 text-xs">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Press <kbd className="rounded bg-muted px-2 py-1">esc</kbd> to close
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Example usage:
const defaultShortcuts: Shortcut[] = [
  {
    key: '⌘K',
    description: 'Open command palette',
    category: 'General',
  },
  {
    key: '⌘B',
    description: 'Toggle sidebar',
    category: 'Navigation',
  },
  {
    key: '⌘/',
    description: 'Show keyboard shortcuts',
    category: 'General',
  },
  {
    key: '⌘S',
    description: 'Save changes',
    category: 'Editing',
  },
  {
    key: '⌘Z',
    description: 'Undo',
    category: 'Editing',
  },
  {
    key: '⌘⇧Z',
    description: 'Redo',
    category: 'Editing',
  },
]; 