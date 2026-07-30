import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const login = async (correo, contrasena) => {
    setIsLoading(true);
    try {
      const response = await axios.post('https://mercyreact.duckdns.org/api/login', { correo, contrasena });

      if (response.data.access_token) {
        setUserToken(response.data.access_token);
        setUser(response.data.user);
        await AsyncStorage.setItem('userToken', response.data.access_token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        setIsLoading(false);
        return { success: true };
      }
    } catch (e) {
      setIsLoading(false);
      console.log(`Login error: ${e}`);
      let errorMsg = "Error al iniciar sesión. Revisa tus credenciales.";
      if (e.response && e.response.data && e.response.data.detail) {
          errorMsg = e.response.data.detail;
      }
      return { success: false, message: errorMsg };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await sleep(2000);
    setUserToken(null);
    setUser(null);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('user');
    setIsLoading(false);
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      await sleep(2000);
      let token = await AsyncStorage.getItem('userToken');
      let userData = await AsyncStorage.getItem('user');
      if (token && userData) {
        try {
          await axios.get('https://mercyreact.duckdns.org/api/verify_session', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserToken(token);
          setUser(JSON.parse(userData));
        } catch (apiError) {
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('user');
          setUserToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    } catch (e) {
      console.log(`isLoggedIn error: ${e}`);
      setIsLoading(false);
    }
  };
  
  const updateUser = async (newUser) => {
      setUser(newUser);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken, user, updateUser, userName: user?.nombre || '' }}>
      {children}
    </AuthContext.Provider>
  );
};
