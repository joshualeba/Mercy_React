import React, { createContext, useState, useContext } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemeContext } from './ThemeContext';

export const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title, message) => {
    setAlertConfig({ visible: true, title, message });
  };

  const hideAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  const overlayColor = 'rgba(0, 0, 0, 0.6)';
  // Color sólido (sin transparencia): Azul marino profundo en modo noche, Azul sobrio en modo día
  const solidBackgroundColor = isDarkMode ? '#0a192f' : '#1c3a6b';
  const borderColor = isDarkMode ? '#1e3a5f' : '#2d5a9e';
  const titleColor = '#fff';
  const messageColor = '#eee';

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal
        visible={alertConfig.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideAlert}
      >
        <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
          <View style={[styles.solidCard, { backgroundColor: solidBackgroundColor, borderColor }]}>
            <Text style={[styles.title, { color: titleColor }]}>{alertConfig.title}</Text>
            <Text style={[styles.message, { color: messageColor }]}>{alertConfig.message}</Text>
            
            <TouchableOpacity style={styles.button} onPress={hideAlert}>
              <Text style={styles.buttonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useCustomAlert = () => {
  return useContext(AlertContext);
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  solidCard: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 20,
    padding: 25,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    alignItems: 'center',
    overflow: 'hidden',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#0052cc',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
