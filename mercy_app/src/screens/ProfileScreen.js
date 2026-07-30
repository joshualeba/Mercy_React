import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useCustomAlert } from '../context/AlertContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation }) {
  const { user, userToken, updateUser } = useContext(AuthContext);
  const { isDarkTheme, colors } = useContext(ThemeContext);
  const { showAlert } = useCustomAlert();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Field states
  const initialName = user?.nombre_completo || user?.nombre || 'Usuario';
  const initialEmail = user?.correo || user?.correo_electronico || 'correo@mercy.com';
  const [nombre, setNombre] = useState(initialName);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Eye visibility states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
      if (user?.nombre_completo || user?.nombre) {
          setNombre(user?.nombre_completo || user?.nombre || 'Usuario');
      }
  }, [user]);

  // Validations
  const cleanNameInput = (text) => text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
  
  const isNameValid = (name) => {
    const trimmed = name.trim();
    if (trimmed.length < 3) return false;
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    return regex.test(trimmed);
  };

  const hasLength = newPassword.length >= 8 && newPassword.length <= 25;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasSpecialChar = /[!@#$&*.,?_=-]/.test(newPassword);
  
  const isPasswordValid = newPassword === '' || (hasLength && hasUppercase && hasSpecialChar && newPassword === confirmPassword);

  const handleSave = async () => {
    if (!isNameValid(nombre)) {
      showAlert('Error', 'Ingresa un nombre válido (solo letras, mínimo 3 caracteres).');
      return;
    }
    
    if (newPassword !== '' && !isPasswordValid) {
      showAlert('Error', 'La nueva contraseña no cumple con los requisitos o no coinciden.');
      return;
    }
    
    if (newPassword !== '' && currentPassword === '') {
      showAlert('Error', 'Ingresa tu contraseña actual para autorizar el cambio.');
      return;
    }

    setIsSaving(true);
    
    try {
        const payload = {
            nombre: nombre,
            password_actual: currentPassword !== '' ? currentPassword : null,
            password_nueva: newPassword !== '' ? newPassword : null,
        };
        
        const response = await axios.put('https://twelve-laws-press.loca.lt/api/update_profile', payload, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        
        if (response.data.success) {
            showAlert('Éxito', 'Tu perfil ha sido actualizado.');
            setIsEditing(false);
            
            // Update local context
            let updatedUser = { ...user };
            updatedUser.nombre = response.data.nombre_pila || updatedUser.nombre;
            updatedUser.apellidoP = response.data.apellido || updatedUser.apellidoP;
            updatedUser.nombre_completo = response.data.nombre;
            
            updateUser(updatedUser);
            
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
    } catch (e) {
        if (e.response && e.response.data && e.response.data.detail) {
            showAlert('Error', e.response.data.detail);
        } else {
            showAlert('Error', 'Ocurrió un error al guardar los cambios.');
        }
    } finally {
        setIsSaving(false);
    }
  };

  const renderChecklist = () => {
    if (newPassword === '' && !isEditing) return null;
    return (
      <View style={styles.checklistContainer}>
        <Text style={styles.checklistTitle}>Requisitos de la nueva contraseña:</Text>
        <View style={styles.checklistItem}>
          <Ionicons name={hasLength ? "checkmark-circle" : "ellipse-outline"} size={16} color={hasLength ? "#4CAF50" : colors.textMuted} />
          <Text style={[styles.checklistText, hasLength && styles.checklistTextValid]}>8 a 25 caracteres</Text>
        </View>
        <View style={styles.checklistItem}>
          <Ionicons name={hasUppercase ? "checkmark-circle" : "ellipse-outline"} size={16} color={hasUppercase ? "#4CAF50" : colors.textMuted} />
          <Text style={[styles.checklistText, hasUppercase && styles.checklistTextValid]}>Al menos 1 mayúscula</Text>
        </View>
        <View style={styles.checklistItem}>
          <Ionicons name={hasSpecialChar ? "checkmark-circle" : "ellipse-outline"} size={16} color={hasSpecialChar ? "#4CAF50" : colors.textMuted} />
          <Text style={[styles.checklistText, hasSpecialChar && styles.checklistTextValid]}>Al menos 1 carácter especial</Text>
        </View>
        {newPassword !== '' && (
          <View style={styles.checklistItem}>
            <Ionicons name={(newPassword === confirmPassword && confirmPassword !== '') ? "checkmark-circle" : "ellipse-outline"} size={16} color={(newPassword === confirmPassword && confirmPassword !== '') ? "#4CAF50" : colors.textMuted} />
            <Text style={[styles.checklistText, (newPassword === confirmPassword && confirmPassword !== '') && styles.checklistTextValid]}>Las contraseñas coinciden</Text>
          </View>
        )}
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, color: colors.text },
    editBtn: { backgroundColor: colors.primary, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
    editBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    
    avatarContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    avatarInitials: { fontSize: 36, fontWeight: 'bold', color: colors.primary },
    userName: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 5 },
    userRole: { fontSize: 14, color: colors.primary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15, marginTop: 10 },
    
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: 'bold', color: colors.textMuted, marginBottom: 8, marginLeft: 4 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: isEditing ? colors.inputBackground : colors.background, borderWidth: 1, borderColor: isEditing ? colors.border : colors.background, borderRadius: 12, paddingHorizontal: 15 },
    inputWrapperDisabled: { backgroundColor: colors.card, borderColor: colors.border, opacity: 0.7 },
    icon: { marginRight: 10 },
    input: { flex: 1, height: 50, color: colors.text, fontSize: 16 },
    eyeIcon: { padding: 10 },
    
    checklistContainer: { marginTop: 5, paddingHorizontal: 10, marginBottom: 20 },
    checklistTitle: { fontSize: 13, color: colors.text, fontWeight: 'bold', marginBottom: 8 },
    checklistItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    checklistText: { fontSize: 13, color: colors.textMuted, marginLeft: 8 },
    checklistTextValid: { color: "#4CAF50" },

    saveBtn: { backgroundColor: colors.primary, borderRadius: 12, height: 55, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
      >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Mi Perfil</Text>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(!isEditing)}>
          <Text style={styles.editBtnText}>{isEditing ? 'Cancelar' : 'Editar'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{user?.nombre && user?.apellidoP ? `${user.nombre.charAt(0)}${user.apellidoP.charAt(0)}`.toUpperCase() : nombre.substring(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{nombre}</Text>
          <Text style={styles.userRole}>Cliente Activo</Text>
        </View>

        <Text style={styles.sectionTitle}>Datos Personales</Text>
        
        {/* Email Field (Locked) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Correo Electrónico (No editable)</Text>
          <View style={[styles.inputWrapper, styles.inputWrapperDisabled]}>
            <Ionicons name="mail" size={20} color={colors.textMuted} style={styles.icon} />
            <TextInput style={styles.input} value={initialEmail} editable={false} color={colors.textMuted} />
          </View>
        </View>

        {/* Name Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre Completo</Text>
          <View style={[styles.inputWrapper, !isEditing && styles.inputWrapperDisabled]}>
            <Ionicons name="person" size={20} color={isEditing ? colors.primary : colors.textMuted} style={styles.icon} />
            <TextInput 
              style={styles.input} 
              value={nombre} 
              onChangeText={(t) => setNombre(cleanNameInput(t))} 
              editable={isEditing}
              placeholder="Ej. Juan Pérez"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        {isEditing && (
          <View>
            <Text style={[styles.sectionTitle, {marginTop: 20}]}>Cambiar Contraseña (Opcional)</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña Actual</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed" size={20} color={colors.textMuted} style={styles.icon} />
                <TextInput 
                  style={styles.input} 
                  value={currentPassword} 
                  onChangeText={setCurrentPassword} 
                  secureTextEntry={!showCurrent}
                  placeholder="********"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeIcon}>
                  <Ionicons name={showCurrent ? "eye-off" : "eye"} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nueva Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="key" size={20} color={colors.primary} style={styles.icon} />
                <TextInput 
                  style={styles.input} 
                  value={newPassword} 
                  onChangeText={setNewPassword} 
                  secureTextEntry={!showNew}
                  placeholder="********"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeIcon}>
                  <Ionicons name={showNew ? "eye-off" : "eye"} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="checkmark-done-circle" size={20} color={(newPassword === confirmPassword && confirmPassword !== '') ? "#4CAF50" : colors.textMuted} style={styles.icon} />
                <TextInput 
                  style={styles.input} 
                  value={confirmPassword} 
                  onChangeText={setConfirmPassword} 
                  secureTextEntry={!showConfirm}
                  placeholder="********"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
                  <Ionicons name={showConfirm ? "eye-off" : "eye"} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {renderChecklist()}

            <TouchableOpacity 
              style={[styles.saveBtn, isSaving && {opacity: 0.7}]} 
              onPress={handleSave} 
              disabled={isSaving}
            >
              <Text style={styles.saveBtnText}>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
