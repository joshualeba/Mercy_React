import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('mercy_theme');
      if (savedTheme !== null) {
        setIsDarkTheme(savedTheme === 'dark');
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkTheme;
      setIsDarkTheme(newTheme);
      await AsyncStorage.setItem('mercy_theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const themeColors = {
    bg: isDarkTheme ? '#0f172a' : '#f1f5f9',
    textMain: isDarkTheme ? '#ffffff' : '#0f172a',
    textSec: isDarkTheme ? '#94a3b8' : '#475569',
    cardBg: isDarkTheme ? 'rgba(255,255,255,0.02)' : '#ffffff',
    cardBorder: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    divider: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  };

  return (
    <ThemeContext.Provider value={{ isDarkTheme, toggleTheme, themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};
