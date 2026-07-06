import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CustomAlert({ visible, title, message, type = 'error', onClose, onConfirm, showCancel = false }) {
  const isError = type === 'error';
  const isWarning = type === 'warning';
  const iconName = isError ? 'alert-circle-outline' : isWarning ? 'help-circle-outline' : 'check-circle-outline';
  const iconColor = isError ? '#ef4444' : isWarning ? '#F59E0B' : '#10b981';

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <MaterialCommunityIcons name={iconName} size={50} color={iconColor} style={styles.icon} />
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonsContainer}>
            {showCancel && (
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.button, showCancel && styles.halfButton, isWarning && styles.warningButton]} 
              onPress={onConfirm || onClose}
            >
              <Text style={styles.buttonText}>{showCancel ? 'Confirmar' : 'Entendido'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    width: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  icon: {
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  halfButton: {
    width: '48%',
  },
  warningButton: {
    backgroundColor: '#ef4444',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderColor: '#4b5563',
    borderWidth: 1,
    width: '48%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
