import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLoggedInUser();
  }, []);

  const checkLoggedInUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('mercy_current_user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.log('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem('mercy_current_user', JSON.stringify(userData));
    } catch (error) {
      console.log('Error saving user data:', error);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('mercy_current_user');
    } catch (error) {
      console.log('Error removing user data:', error);
    }
  };

  const updateUser = async (newUserData) => {
    try {
      const updatedUser = { ...user, ...newUserData };
      setUser(updatedUser);
      await AsyncStorage.setItem('mercy_current_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.log('Error updating user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
