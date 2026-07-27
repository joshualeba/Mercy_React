import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video } from 'expo-av';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useCustomAlert } from '../context/AlertContext';
import FullScreenLoader from '../components/FullScreenLoader';

export default function RegisterScreen({ navigation }) {
  const { showAlert } = useCustomAlert();
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation checks
  const hasUppercase = /[A-Z]/.test(contrasena);
  const isValidLength = contrasena.length >= 8 && contrasena.length <= 25;
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(contrasena);

  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!nombres || !apellidos || !correo || !contrasena || !confirmarContrasena) {
      showAlert('Atención', 'Todos los campos son obligatorios para mantener tu cuenta segura.');
      return;
    }

    const nameRegex = /^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nameRegex.test(nombres)) {
      showAlert('Error en Nombres', 'Solo se permiten letras, espacios, acentos y la letra ñ.');
      return;
    }
    if (!nameRegex.test(apellidos)) {
      showAlert('Error en Apellidos', 'Solo se permiten letras, espacios, acentos y la letra ñ.');
      return;
    }

    const badWords = ['puto', 'puta', 'pendejo', 'pendeja', 'mierda', 'cabron', 'cabrona', 'chingada', 'verga', 'culo', 'estupido', 'estupida', 'idiota', 'imbecil', 'maricon', 'puto', 'zorra'];
    const lowerNombres = nombres.toLowerCase();
    const lowerApellidos = apellidos.toLowerCase();
    const containsBadWord = badWords.some(word => lowerNombres.includes(word) || lowerApellidos.includes(word));
    
    if (containsBadWord) {
      showAlert('Términos inválidos', 'Por favor, utiliza tu nombre real. Nuestro sistema ha detectado lenguaje inapropiado.');
      return;
    }

    if (correo.toLowerCase() === 'joshualeba2109@gmail.com') {
      showAlert('Acceso Restringido', 'Esta cuenta es de administrador. No puedes registrarte desde la aplicación móvil. El administrador solo le corresponde la interfaz web de flask.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      showAlert('Error', 'Ingresa un correo electrónico válido.');
      return;
    }

    if (!hasUppercase || !isValidLength || !hasSpecial) {
      showAlert('Seguridad', 'La contraseña no cumple con todos los requisitos.');
      return;
    }

    if (contrasena !== confirmarContrasena) {
      showAlert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://192.168.1.7:8000/api/registro', {
        nombres: nombres,
        apellidos: apellidos,
        correo_electronico: correo,
        contrasena: contrasena
      });
      
      if (response.data.success) {
        setIsLoading(false);
        showAlert('¡Éxito!', 'Tu cuenta ha sido creada. Serás redirigido para iniciar sesión...');
        setTimeout(() => {
          navigation.goBack();
        }, 3000);
      }
    } catch (e) {
      setIsLoading(false);
      console.log(e);
      let errorMsg = 'Hubo un problema al registrar la cuenta.';
      if (e.response && e.response.data && e.response.data.detail) {
        errorMsg = e.response.data.detail;
      }
      showAlert('Error de Registro', errorMsg);
    }
  };

  return (
    <View style={styles.container}>
      {/* Video Background */}
      <Video
        source={{ uri: 'https://res.cloudinary.com/dpvm2gro2/video/upload/v1773878047/1_jch6qe.mp4' }}
        rate={1.0}
        volume={0.0}
        isMuted={true}
        resizeMode="cover"
        shouldPlay
        isLooping
        style={StyleSheet.absoluteFill}
      />
      
      {/* Overlay to darken video slightly */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
          <View style={styles.glassCard}>
            <Text style={styles.title}>Regístrate</Text>
            <Text style={styles.subtitle}>Únete a Mercy y mejora tus finanzas</Text>
            
            <TextInput style={styles.input} placeholder="Nombres" placeholderTextColor="#ddd" value={nombres} onChangeText={setNombres} />
            <TextInput style={styles.input} placeholder="Apellidos" placeholderTextColor="#ddd" value={apellidos} onChangeText={setApellidos} />
            <TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor="#ddd" keyboardType="email-address" autoCapitalize="none" value={correo} onChangeText={setCorreo} />
            
            <View style={styles.passwordContainer}>
              <TextInput style={styles.passwordInput} placeholder="Contraseña" placeholderTextColor="#ddd" secureTextEntry={!showPassword} value={contrasena} onChangeText={setContrasena} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#ddd" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.validationContainer}>
              <View style={styles.validationRow}>
                <Ionicons name={hasUppercase ? "checkmark-circle" : "close-circle"} size={16} color={hasUppercase ? "#4CAF50" : "#F44336"} />
                <Text style={styles.validationText}> Al menos 1 mayúscula</Text>
              </View>
              <View style={styles.validationRow}>
                <Ionicons name={isValidLength ? "checkmark-circle" : "close-circle"} size={16} color={isValidLength ? "#4CAF50" : "#F44336"} />
                <Text style={styles.validationText}> Entre 8 y 25 caracteres</Text>
              </View>
              <View style={styles.validationRow}>
                <Ionicons name={hasSpecial ? "checkmark-circle" : "close-circle"} size={16} color={hasSpecial ? "#4CAF50" : "#F44336"} />
                <Text style={styles.validationText}> Un carácter especial</Text>
              </View>
            </View>

            <View style={styles.passwordContainer}>
              <TextInput style={styles.passwordInput} placeholder="Confirmar contraseña" placeholderTextColor="#ddd" secureTextEntry={!showConfirmPassword} value={confirmarContrasena} onChangeText={setConfirmarContrasena} />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={22} color="#ddd" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>Crear cuenta</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.registerLink} onPress={() => navigation.goBack()}>
              <Text style={styles.registerText}>¿Ya tienes cuenta? <Text style={{fontWeight: 'bold', color: '#fff'}}>Inicia sesión</Text></Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <FullScreenLoader visible={isLoading} text="Creando cuenta..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  safeArea: { flex: 1, padding: 20 },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#eee', textAlign: 'center', marginBottom: 30 },
  input: {
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#fff',
  },
  eyeIcon: {
    paddingHorizontal: 15,
  },
  validationContainer: {
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  validationText: {
    color: '#ddd',
    fontSize: 13,
  },
  button: { backgroundColor: '#0052cc', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerText: { color: '#ddd', fontSize: 14 }
});
