import { createContext, useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  isAnimating: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  isAnimating: false,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isAnimating }}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen bg-gradient-to-br from-background to-background/80"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 