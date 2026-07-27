import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (e) {
      console.log('Error loading theme:', e);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (e) {
      console.log('Error saving theme:', e);
    }
  };

  const lightColors = {
    background: '#f8f9fa',
    card: '#fff',
    text: '#333333',
    textMuted: '#666666',
    placeholder: '#999999',
    border: '#eeeeee',
    inputBackground: '#f5f5f5',
    danger: '#F44336',
    dangerBg: '#ffebee',
    success: '#10b981',
    successBg: '#d1fae5',
    warning: '#f59e0b',
    warningBg: '#fef3c7',
    primary: '#0052cc',
  };

  const darkColors = {
    background: '#121212',
    card: '#1e1e1e',
    text: '#e0e0e0',
    textMuted: '#a0a0a0',
    placeholder: '#6b7280',
    border: '#333333',
    inputBackground: '#2c2c2c',
    danger: '#ef4444',
    dangerBg: '#450a0a',
    success: '#10b981',
    successBg: '#064e3b',
    warning: '#f59e0b',
    warningBg: '#451a03',
    primary: '#4c8bf5',
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
