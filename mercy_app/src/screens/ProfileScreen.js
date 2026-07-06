import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

export default function ProfileScreen({ navigation }) {
  const { user, updateUser } = useContext(AuthContext);
  const { isDarkTheme, themeColors } = useContext(ThemeContext);
  
  const fullName = [user?.nombres, user?.apellidos].filter(Boolean).join(' ') || user?.nombre || 'Usuario';
  const initialName = fullName;
  const initialEmail = user?.correo_electronico || user?.email || 'correo@mercy.com';
  
  const [isEditing, setIsEditing] = useState(false);
  const [nombre, setNombre] = useState(initialName);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Validations
  const isNameValid = (name) => {
    const trimmed = name.trim();
    if (trimmed.length > 100) return false;
    const words = trimmed.split(/\s+/);
    if (words.length < 2) return false;
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    return regex.test(trimmed);
  };

  const hasLength = password.length >= 8 && password.length <= 25;
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$&*.,?_=-]/.test(password);
  
  const isPasswordValid = password === '' || (hasLength && hasUppercase && hasSpecialChar && password === confirmPassword);

  const cleanNameInput = (text) => {
    return text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
  };

  const handleSave = async () => {
    if (!isNameValid(nombre)) {
      Alert.alert('Error', 'El nombre debe contener al menos 2 palabras, sin números ni caracteres especiales, y máximo 100 letras.');
      return;
    }
    
    if (password !== '' && !isPasswordValid) {
      Alert.alert('Error', 'La contraseña no cumple con los requisitos o no coinciden.');
      return;
    }
    
    setIsSaving(true);
    try {
      const usersData = await AsyncStorage.getItem('mercy_users_db');
      let users = usersData ? JSON.parse(usersData) : [];
      
      const userIndex = users.findIndex(u => u.correo_electronico === initialEmail);
      if (userIndex !== -1) {
        users[userIndex].nombres = nombre.trim();
        if (password !== '') {
          users[userIndex].contrasena = password;
        }
        await AsyncStorage.setItem('mercy_users_db', JSON.stringify(users));
      }
      
      await updateUser({ nombre: nombre.trim() });
      setIsEditing(false);
      setPassword('');
      setConfirmPassword('');
      Alert.alert('¡Éxito!', 'Tus datos han sido actualizados.');
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al guardar tus datos.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderChecklist = () => {
    if (password === '') return null;
    return (
      <View style={styles.checklist}>
        <View style={styles.checkItem}>
          <MaterialCommunityIcons name={hasLength ? "check-circle" : "close-circle"} size={16} color={hasLength ? "#10B981" : "#EF4444"} />
          <Text style={[styles.checkText, { color: hasLength ? "#10B981" : "#EF4444" }]}> 8 a 25 caracteres</Text>
        </View>
        <View style={styles.checkItem}>
          <MaterialCommunityIcons name={hasUppercase ? "check-circle" : "close-circle"} size={16} color={hasUppercase ? "#10B981" : "#EF4444"} />
          <Text style={[styles.checkText, { color: hasUppercase ? "#10B981" : "#EF4444" }]}> 1 letra mayúscula</Text>
        </View>
        <View style={styles.checkItem}>
          <MaterialCommunityIcons name={hasSpecialChar ? "check-circle" : "close-circle"} size={16} color={hasSpecialChar ? "#10B981" : "#EF4444"} />
          <Text style={[styles.checkText, { color: hasSpecialChar ? "#10B981" : "#EF4444" }]}> 1 carácter especial (!@#$&*.,?_=-)</Text>
        </View>
        <View style={styles.checkItem}>
          <MaterialCommunityIcons name={password === confirmPassword && password !== '' ? "check-circle" : "close-circle"} size={16} color={password === confirmPassword && password !== '' ? "#10B981" : "#EF4444"} />
          <Text style={[styles.checkText, { color: password === confirmPassword && password !== '' ? "#10B981" : "#EF4444" }]}> Las contraseñas coinciden</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={themeColors.textMain} />
            <Text style={[styles.backButtonText, { color: themeColors.textMain }]}>Regresar</Text>
          </TouchableOpacity>

          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{(nombre || 'U').charAt(0).toUpperCase()}</Text>
            </View>
          </View>

          <View style={[styles.formSection, { backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder }]}>
            <Text style={[styles.label, { color: themeColors.textSec }]}>Correo Electrónico (No editable)</Text>
            <View style={[styles.inputContainer, { backgroundColor: isDarkTheme ? 'rgba(0,0,0,0.2)' : '#e2e8f0', borderColor: themeColors.divider }]}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: '#94a3b8' }]}
                value={initialEmail}
                editable={false}
              />
            </View>

            <View style={styles.editToggleContainer}>
              <Text style={[styles.sectionTitle, { color: themeColors.textMain }]}>Datos Personales</Text>
              {!isEditing && (
                <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                  <MaterialCommunityIcons name="pencil" size={16} color="#3b82f6" />
                  <Text style={styles.editButtonText}>Editar perfil</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.label, { color: themeColors.textSec }]}>Nombre completo</Text>
            <View style={[styles.inputContainer, { backgroundColor: isEditing ? (isDarkTheme ? 'rgba(255,255,255,0.05)' : '#ffffff') : (isDarkTheme ? 'rgba(0,0,0,0.2)' : '#e2e8f0'), borderColor: themeColors.divider }]}>
              <MaterialCommunityIcons name="account-outline" size={20} color={isEditing ? themeColors.textMain : "#94a3b8"} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: isEditing ? themeColors.textMain : '#94a3b8' }]}
                value={nombre}
                onChangeText={(text) => setNombre(cleanNameInput(text))}
                placeholder="Tu nombre completo"
                placeholderTextColor="#64748b"
                editable={isEditing}
                maxLength={100}
              />
            </View>
            {isEditing && !isNameValid(nombre) && nombre.length > 0 && (
              <Text style={styles.errorInline}>Debe contener al menos 2 palabras sin caracteres especiales.</Text>
            )}

            {isEditing && (
              <>
                <Text style={[styles.label, { color: themeColors.textSec, marginTop: 10 }]}>Nueva Contraseña (Opcional)</Text>
                <View style={[styles.inputContainer, { backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.05)' : '#ffffff', borderColor: themeColors.divider }]}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color={themeColors.textMain} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: themeColors.textMain }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Ingresa una nueva contraseña"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                  />
                </View>

                {password.length > 0 && (
                  <>
                    <Text style={[styles.label, { color: themeColors.textSec }]}>Confirmar Nueva Contraseña</Text>
                    <View style={[styles.inputContainer, { backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.05)' : '#ffffff', borderColor: themeColors.divider }]}>
                      <MaterialCommunityIcons name="lock-check-outline" size={20} color={themeColors.textMain} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: themeColors.textMain }]}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirma la contraseña"
                        placeholderTextColor="#64748b"
                        secureTextEntry
                      />
                    </View>
                  </>
                )}

                {renderChecklist()}

                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.cancelButton, { borderColor: themeColors.divider }]} 
                    onPress={() => {
                      setIsEditing(false);
                      setNombre(initialName);
                      setPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    <Text style={[styles.cancelButtonText, { color: themeColors.textMain }]}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.saveButton, (isSaving || (!isNameValid(nombre)) || (password !== '' && !isPasswordValid)) && { opacity: 0.5 }]} 
                    onPress={handleSave}
                    disabled={isSaving || (!isNameValid(nombre)) || (password !== '' && !isPasswordValid)}
                  >
                    <Text style={styles.saveButtonText}>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: -10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  content: {
    padding: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  avatarText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  formSection: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  editToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 55,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  errorInline: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 15,
    marginLeft: 4,
  },
  checklist: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkText: {
    fontSize: 12,
    marginLeft: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  saveButton: {
    flex: 1.5,
    backgroundColor: '#3b82f6',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  }
});
