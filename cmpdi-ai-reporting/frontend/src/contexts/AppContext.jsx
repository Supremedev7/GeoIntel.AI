import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../locales/translations';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('en');
  
  // Theme initialization
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'system';
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // Language initialization
  useEffect(() => {
    const savedLang = localStorage.getItem('app-lang') || 'en';
    setLanguage(savedLang);
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('app-lang', lang);
  };

  // Translation helper
  const t = (keyPath) => {
    const keys = keyPath.split('.');
    let current = translations[language] || translations['en'];
    for (const key of keys) {
      if (current[key] === undefined) {
        // Fallback to English
        let fallback = translations['en'];
        for (const fbKey of keys) {
          fallback = fallback[fbKey] || keyPath;
        }
        return fallback;
      }
      current = current[key];
    }
    return current;
  };

  return (
    <AppContext.Provider value={{ theme, setTheme, language, changeLanguage, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
