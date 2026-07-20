import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import CustomAlert from '../components/CustomAlert';

const API_URL = 'https://192.168.1.100:8443/api'; // [SEGURIDAD] Cambiado a HTTPS
const VIDEO_SOURCE = 'https://res.cloudinary.com/dpvm2gro2/video/upload/v1773878047/1_jch6qe.mp4';
const LOGO_SOURCE = 'https://res.cloudinary.com/dpvm2gro2/image/upload/v1769711039/logo_qp8c8w.png';

export default function RegisterScreen({ navigation }) {
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'error' });
  const isFocused = useIsFocused();

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  // Password checklist rules
  const hasLength = password.length >= 8 && password.length <= 25;
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$&*.,?_=-]/.test(password);

  const cleanNameInput = (text) => {
    // Only allow letters, spaces, and common accents. Strip numbers and special chars.
    return text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
  };

  const validate = () => {
    let isValid = true;
    let newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = 'El correo no es válido';
      isValid = false;
    }

    if (!hasLength || !hasUppercase || !hasSpecialChar) {
      newErrors.password = 'La contraseña no cumple con los requisitos';
      isValid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
      isValid = false;
    }

    if (!nombres.trim()) {
      newErrors.nombres = 'Ingresa tus nombres';
      isValid = false;
    }

    if (!apellidos.trim()) {
      newErrors.apellidos = 'Ingresa tus apellidos';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/registro`, {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo_electronico: email.trim(),
        contrasena: password,
        es_medico: false
      }, {
        headers: { 'x-api-key': 'MERCY_API_KEY_SUPER_SECRET' } // [SEGURIDAD] Autenticación M2M
      });
      
      if (response.data.success) {
        showAlert('¡Éxito!', 'Te has registrado correctamente. Ahora puedes iniciar sesión.', 'success');
      }
    } catch (error) {
      console.log(error);
      
      // Si hay una respuesta del servidor con un error específico
      if (error.response && error.response.data) {
        const msg = error.response.data.detail || error.response.data.message || 'Datos incorrectos enviados al servidor.';
        showAlert('Error de registro', msg, 'error');
      } 
      // Si no hay respuesta (ej. backend apagado o error de red)
      else if (!error.response || error.message === 'Network Error') {
        console.log("Simulando registro exitoso por falta de conexión al backend");
        
        import('@react-native-async-storage/async-storage').then(async ({ default: AsyncStorage }) => {
          try {
            const existingUsers = await AsyncStorage.getItem('mercy_users_db');
            let users = existingUsers ? JSON.parse(existingUsers) : [];
            
            // Check if email already exists
            if (users.some(u => u.correo_electronico === email.trim().toLowerCase())) {
              showAlert('Error', 'Este correo ya está registrado.', 'error');
              return;
            }

            const newUser = {
              nombres: nombres.trim(),
              apellidos: apellidos.trim(),
              correo_electronico: email.trim().toLowerCase(),
              contrasena: password
            };
            
            users.push(newUser);
            await AsyncStorage.setItem('mercy_users_db', JSON.stringify(users));
            
            showAlert('¡Éxito!', 'Te has registrado correctamente. Ahora puedes iniciar sesión.', 'success');
          } catch (e) {
            console.log('Error saving mock user', e);
            showAlert('Error', 'Hubo un problema al guardar tus datos.', 'error');
          }
        });
      } 
      // Cualquier otro error
      else {
        showAlert('Error inesperado', `Ocurrió un problema: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAlertClose = () => {
    setAlertConfig({ ...alertConfig, visible: false });
    if (alertConfig.type === 'success') {
      navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.mainContainer}>
      {isFocused && (
        <Video
          source={{ uri: VIDEO_SOURCE }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          isLooping
          shouldPlay
          isMuted
        />
      )}
      <View style={styles.overlay} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.glassContainer}>
            <View style={styles.logoContainer}>
              <Image source={{ uri: LOGO_SOURCE }} style={styles.logo} />
              <Text style={styles.title}>Crea tu cuenta</Text>
              <Text style={styles.subtitle}>Empieza a mejorar tus finanzas</Text>
            </View>

            <View style={[styles.inputContainer, errors.nombres && styles.inputError]}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#cbd5e1" style={styles.icon} />
              <TextInput 
                style={styles.input}
                placeholder="Nombres"
                placeholderTextColor="#94a3b8"
                value={nombres}
                onChangeText={(val) => { 
                  setNombres(cleanNameInput(val)); 
                  setErrors({...errors, nombres: null}) 
                }}
              />
            </View>
            {errors.nombres && <Text style={styles.errorText}>{errors.nombres}</Text>}

            <View style={[styles.inputContainer, errors.apellidos && styles.inputError]}>
              <MaterialCommunityIcons name="account-group-outline" size={20} color="#cbd5e1" style={styles.icon} />
              <TextInput 
                style={styles.input}
                placeholder="Apellidos"
                placeholderTextColor="#94a3b8"
                value={apellidos}
                onChangeText={(val) => { 
                  setApellidos(cleanNameInput(val)); 
                  setErrors({...errors, apellidos: null}) 
                }}
              />
            </View>
            {errors.apellidos && <Text style={styles.errorText}>{errors.apellidos}</Text>}

            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#cbd5e1" style={styles.icon} />
              <TextInput 
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={(val) => { setEmail(val); setErrors({...errors, email: null}) }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            {/* Contraseña Principal */}
            <View style={[styles.inputContainer, errors.password && styles.inputError]}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#cbd5e1" style={styles.icon} />
              <TextInput 
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={(val) => { setPassword(val); setErrors({...errors, password: null}) }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons name={showPassword ? "eye-off" : "eye"} size={20} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
            
            {/* Checklist interactivo */}
            <View style={styles.checklistContainer}>
              <View style={styles.checklistItem}>
                <MaterialCommunityIcons name={hasLength ? "check-circle" : "close-circle"} size={16} color={hasLength ? "#10b981" : "#ef4444"} />
                <Text style={[styles.checklistText, { color: hasLength ? "#10b981" : "#cbd5e1" }]}>8 a 25 caracteres</Text>
              </View>
              <View style={styles.checklistItem}>
                <MaterialCommunityIcons name={hasUppercase ? "check-circle" : "close-circle"} size={16} color={hasUppercase ? "#10b981" : "#ef4444"} />
                <Text style={[styles.checklistText, { color: hasUppercase ? "#10b981" : "#cbd5e1" }]}>Mínimo 1 mayúscula</Text>
              </View>
              <View style={styles.checklistItem}>
                <MaterialCommunityIcons name={hasSpecialChar ? "check-circle" : "close-circle"} size={16} color={hasSpecialChar ? "#10b981" : "#ef4444"} />
                <Text style={[styles.checklistText, { color: hasSpecialChar ? "#10b981" : "#cbd5e1" }]}>Carácter especial (!@#$&*.,?_=-)</Text>
              </View>
            </View>

            {/* Confirmar Contraseña */}
            <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError, { marginTop: 10 }]}>
              <MaterialCommunityIcons name="lock-check-outline" size={20} color="#cbd5e1" style={styles.icon} />
              <TextInput 
                style={styles.input}
                placeholder="Confirmar Contraseña"
                placeholderTextColor="#94a3b8"
                value={confirmPassword}
                onChangeText={(val) => { setConfirmPassword(val); setErrors({...errors, confirmPassword: null}) }}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <MaterialCommunityIcons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Procesando...' : 'Registrarme'}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}> Inicia sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={handleAlertClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  glassContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 20,
    padding: 25,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#fff',
  },
  checklistContainer: {
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checklistText: {
    fontSize: 12,
    marginLeft: 6,
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#cbd5e1',
  },
  footerLink: {
    color: '#60A5FA',
    fontWeight: 'bold',
  }
});
