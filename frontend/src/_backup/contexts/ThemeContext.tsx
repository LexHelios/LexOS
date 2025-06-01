import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light' | 'gold' | 'platinum';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'dark';
  });

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));

    // Apply theme-specific styles
    document.documentElement.classList.remove('dark', 'light', 'gold', 'platinum');
    document.documentElement.classList.add(theme);

    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 