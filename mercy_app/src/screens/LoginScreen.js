import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAlert from '../components/CustomAlert';
import { AuthContext } from '../context/AuthContext';

const API_URL = 'https://192.168.1.100:8443/api'; // [SEGURIDAD] Cambiado a HTTPS
const VIDEO_SOURCE = 'https://res.cloudinary.com/dpvm2gro2/video/upload/v1773878047/1_jch6qe.mp4';
const LOGO_SOURCE = 'https://res.cloudinary.com/dpvm2gro2/image/upload/v1769711039/logo_qp8c8w.png';

export default function LoginScreen({ navigation }) {
  const { login } = React.useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'error' });
  const isFocused = useIsFocused();

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  useEffect(() => {
    checkSavedCredentials();
  }, []);

  const checkSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('mercy_email');
      const savedPassword = await AsyncStorage.getItem('mercy_password');
      if (savedEmail && savedPassword) {
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRememberMe(true);
        // Opcional: auto-login
        // handleAutoLogin(savedEmail, savedPassword);
      }
    } catch (e) {
      console.log('Error reading credentials');
    }
  };

  const validate = () => {
    let isValid = true;
    let newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = 'El correo no es válido';
      isValid = false;
    }

    if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    
    if (email.trim().toLowerCase().startsWith('joshualeba')) {
      showAlert('Acceso web exclusivo', 'Esta cuenta es de administrador y sólo es accesible desde la plataforma web. Por favor, inicia sesión con otra cuenta o registra una nueva.', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login`, {
        correo: email.trim(),
        contrasena: password
      }, {
        headers: { 'x-api-key': 'MERCY_API_KEY_SUPER_SECRET' } // [SEGURIDAD] Cabecera obligatoria
      });
      
      if (response.data.success) {
        if (rememberMe) {
          await AsyncStorage.setItem('mercy_email', email.trim());
          await AsyncStorage.setItem('mercy_password', password);
        } else {
          await AsyncStorage.removeItem('mercy_email');
          await AsyncStorage.removeItem('mercy_password');
        }
        await login(response.data.user);
        navigation.replace('Dashboard');
      }
    } catch (error) {
      console.log(error);
      
      // Si el servidor envía un error claro
      if (error.response && error.response.data) {
        const msg = error.response.data.detail || error.response.data.message || 'Correo o contraseña incorrectos.';
        showAlert('Error de acceso', msg, 'error');
      } 
      // Si el backend no responde, intentamos ver si se registró una cuenta mock offline
      else if (!error.response || error.message === 'Network Error') {
        try {
          const usersData = await AsyncStorage.getItem('mercy_users_db');
          const users = usersData ? JSON.parse(usersData) : [];
          
          const mockUser = users.find(u => u.correo_electronico === email.trim().toLowerCase());
          
          if (mockUser && mockUser.contrasena === password) {
            // Éxito mock
            if (rememberMe) {
              await AsyncStorage.setItem('mercy_email', email.trim());
              await AsyncStorage.setItem('mercy_password', password);
            } else {
              await AsyncStorage.removeItem('mercy_email');
              await AsyncStorage.removeItem('mercy_password');
            }
            await login({ nombre: mockUser.nombres, correo_electronico: mockUser.correo_electronico });
            navigation.replace('Dashboard');
            return;
          }
        } catch (e) {
          console.log('Error leyendo mock user', e);
        }
        
        showAlert('Error de red', 'No se pudo conectar al servidor y las credenciales no coinciden con ninguna cuenta local.', 'error');
      } 
      // Cualquier otro error
      else {
        showAlert('Error inesperado', `Ocurrió un error: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
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
              <Text style={styles.title}>Bienvenido a Mercy</Text>
              <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
            </View>

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
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <TouchableOpacity 
              style={styles.rememberContainer} 
              onPress={() => setRememberMe(!rememberMe)}
            >
              <MaterialCommunityIcons 
                name={rememberMe ? "checkbox-marked" : "checkbox-blank-outline"} 
                size={22} 
                color={rememberMe ? "#60A5FA" : "#cbd5e1"} 
              />
              <Text style={styles.rememberText}>Recordarme</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Ingresando...' : 'Ingresar'}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿No tienes cuenta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerLink}> Regístrate aquí</Text>
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
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    marginTop: 5,
  },
  glassContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)', // Fallback to translucent dark background instead of BlurView
    borderRadius: 20,
    padding: 25,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 15,
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
    marginTop: -10,
    marginLeft: 5,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 55,
    fontSize: 16,
    color: '#fff',
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberText: {
    color: '#cbd5e1',
    marginLeft: 8,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText: {
    color: '#cbd5e1',
  },
  footerLink: {
    color: '#60A5FA',
    fontWeight: 'bold',
  }
});
