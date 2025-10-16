import React, { createContext, useContext, useState, useEffect } from 'react';

const DarkModeContext = createContext();

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

export const DarkModeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first
    try {
      const saved = localStorage.getItem('sanctityFermeDarkMode');
      if (saved !== null && saved !== undefined) {
        return JSON.parse(saved);
      }
    } catch (error) {
      // If JSON parsing fails, remove the invalid value
      localStorage.removeItem('sanctityFermeDarkMode');
    }
    
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      } catch (error) {
        // If matchMedia is not available (e.g., in test environment), default to light mode
        return false;
      }
    }
    
    return false;
  });

  useEffect(() => {
    // Save to localStorage
    try {
      localStorage.setItem('sanctityFermeDarkMode', JSON.stringify(isDarkMode));
    } catch (error) {
      // If localStorage is not available (e.g., in test environment), just continue
      console.warn('localStorage not available:', error);
    }
    
    // Apply to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Listen for system preference changes
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
          // Only update if user hasn't manually set a preference
          try {
            const saved = localStorage.getItem('sanctityFermeDarkMode');
            if (saved === null || saved === undefined) {
              setIsDarkMode(e.matches);
            }
          } catch (error) {
            // If localStorage access fails, just update based on system preference
            setIsDarkMode(e.matches);
          }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } catch (error) {
        // If matchMedia is not available, just return empty cleanup function
        return () => {};
      }
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const value = {
    isDarkMode,
    toggleDarkMode,
  };

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
}; 