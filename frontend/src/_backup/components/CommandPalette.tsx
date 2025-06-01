import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import Fuse from 'fuse.js';

interface Command {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  commands: Command[];
}

export const CommandPalette = ({ commands }: CommandPaletteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const fuse = new Fuse(commands, {
    keys: ['title', 'description'],
    threshold: 0.3,
  });

  const filteredCommands = search
    ? fuse.search(search).map(result => result.item)
    : commands;

  useHotkeys('cmd+k,ctrl+k', (e) => {
    e.preventDefault();
    setIsOpen(true);
  });

  useHotkeys('esc', () => {
    setIsOpen(false);
  }, { enabled: isOpen });

  useHotkeys('up,down', (e) => {
    e.preventDefault();
    setSelectedIndex((prev) => {
      const newIndex = e.key === 'ArrowUp' ? prev - 1 : prev + 1;
      return Math.max(0, Math.min(newIndex, filteredCommands.length - 1));
    });
  }, { enabled: isOpen });

  useHotkeys('enter', () => {
    if (isOpen && filteredCommands[selectedIndex]) {
      filteredCommands[selectedIndex].action();
      setIsOpen(false);
    }
  }, { enabled: isOpen });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
        >
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-2xl p-4">
            <div className="overflow-hidden rounded-lg bg-background shadow-xl ring-1 ring-black/5">
              <div className="flex items-center border-b border-border px-4 py-3">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type a command or search..."
                  className="w-full bg-transparent text-foreground outline-none"
                  autoFocus
                />
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {filteredCommands.map((command, index) => (
                  <motion.button
                    key={command.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      command.action();
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-md px-4 py-2 text-left transition-colors ${
                      index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                    }`}
                  >
                    <span className="text-lg">{command.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{command.title}</div>
                      <div className="text-sm text-muted-foreground">{command.description}</div>
                    </div>
                    {command.shortcut && (
                      <kbd className="rounded bg-muted px-2 py-1 text-xs">
                        {command.shortcut}
                      </kbd>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 