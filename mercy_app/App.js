import React from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import CustomHeader from './src/components/CustomHeader';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import SimulatorsScreen from './src/screens/SimulatorsScreen';
import DiagnosticScreen from './src/screens/DiagnosticScreen';
import RankingScreen from './src/screens/RankingScreen';
import DictionaryScreen from './src/screens/DictionaryScreen';
import KnowledgeTestScreen from './src/screens/KnowledgeTestScreen';
import ProfileScreen from './src/screens/ProfileScreen';

import SavingsSimulatorScreen from './src/screens/simulators/SavingsSimulatorScreen';
import CreditSimulatorScreen from './src/screens/simulators/CreditSimulatorScreen';
import InvestmentSimulatorScreen from './src/screens/simulators/InvestmentSimulatorScreen';
import BudgetSimulatorScreen from './src/screens/simulators/BudgetSimulatorScreen';
import RetirementSimulatorScreen from './src/screens/simulators/RetirementSimulatorScreen';
import DebtSimulatorScreen from './src/screens/simulators/DebtSimulatorScreen';

// Ignore the expo-av warning
LogBox.ignoreLogs(['[expo-av]']);

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <Stack.Navigator 
              initialRouteName="Login"
              screenOptions={{ 
                headerMode: 'screen',
                header: (props) => <CustomHeader {...props} />
              }}
            >
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Simulators" component={SimulatorsScreen} />
              <Stack.Screen name="Diagnostic" component={DiagnosticScreen} />
              <Stack.Screen name="Ranking" component={RankingScreen} />
              <Stack.Screen name="Dictionary" component={DictionaryScreen} />
              <Stack.Screen name="KnowledgeTest" component={KnowledgeTestScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              
              {/* Simulators */}
              <Stack.Screen name="SavingsSimulator" component={SavingsSimulatorScreen} />
              <Stack.Screen name="CreditSimulator" component={CreditSimulatorScreen} />
              <Stack.Screen name="InvestmentSimulator" component={InvestmentSimulatorScreen} />
              <Stack.Screen name="BudgetSimulator" component={BudgetSimulatorScreen} />
              <Stack.Screen name="RetirementSimulator" component={RetirementSimulatorScreen} />
              <Stack.Screen name="DebtSimulator" component={DebtSimulatorScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
