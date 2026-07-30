import React, { useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { ActivityIndicator, View, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import SimuladorAhorroScreen from './src/screens/SimuladorAhorroScreen';
import SimuladorCreditoScreen from './src/screens/SimuladorCreditoScreen';
import SimuladorInversionScreen from './src/screens/SimuladorInversionScreen';
import SimuladorPresupuestoScreen from './src/screens/SimuladorPresupuestoScreen';
import SimuladorRetiroScreen from './src/screens/SimuladorRetiroScreen';
import SimuladorDeudaScreen from './src/screens/SimuladorDeudaScreen';
import SimuladoresMenuScreen from './src/screens/SimuladoresMenuScreen';
import DiagnosticoScreen from './src/screens/DiagnosticoScreen';
import SofiposScreen from './src/screens/SofiposScreen';
import GlosarioScreen from './src/screens/GlosarioScreen';
import TestConocimientosScreen from './src/screens/TestConocimientosScreen';
import PlaceholderScreen from './src/screens/PlaceholderScreen';
import ProfileScreen from './src/screens/ProfileScreen';

import { ThemeProvider } from './src/context/ThemeContext';
import { AlertProvider } from './src/context/AlertContext';
import Navbar from './src/components/Navbar';
import axios from 'axios';

// Configuración global de Axios
axios.defaults.headers.common['x-api-key'] = 'MERCY_API_KEY_SUPER_SECRET';
axios.defaults.headers.common['Bypass-Tunnel-Reminder'] = 'true'; // Bypass localtunnel warning screen

import FullScreenLoader from './src/components/FullScreenLoader';

const Stack = createNativeStackNavigator();

const AppNav = () => {
  const { isLoading, userToken } = useContext(AuthContext);

  if (isLoading) {
    return <FullScreenLoader visible={true} text="Procesando..." />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken !== null ? (
          <Stack.Group screenOptions={{ header: (props) => <Navbar {...props} />, headerShown: true }}>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="SimuladoresMenu" component={SimuladoresMenuScreen} />
            <Stack.Screen name="SimuladorAhorro" component={SimuladorAhorroScreen} />
            <Stack.Screen name="SimuladorCredito" component={SimuladorCreditoScreen} />
            <Stack.Screen name="SimuladorInversion" component={SimuladorInversionScreen} />
            <Stack.Screen name="SimuladorPresupuesto" component={SimuladorPresupuestoScreen} />
            <Stack.Screen name="SimuladorRetiro" component={SimuladorRetiroScreen} />
            <Stack.Screen name="SimuladorDeuda" component={SimuladorDeudaScreen} />
            <Stack.Screen name="Diagnostico" component={DiagnosticoScreen} />
            <Stack.Screen name="Sofipos" component={SofiposScreen} />
            <Stack.Screen name="Glosario" component={GlosarioScreen} />
            <Stack.Screen name="Test" component={TestConocimientosScreen} />
            <Stack.Screen name="Perfil" component={ProfileScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Placeholder" component={PlaceholderScreen} />
          </Stack.Group>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("overlay-swipe");
    }
  }, []);

  return (
    <ThemeProvider>
      <AlertProvider>
        <AuthProvider>
          <AppNav />
        </AuthProvider>
      </AlertProvider>
    </ThemeProvider>
  );
}
