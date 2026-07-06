import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function RetirementSimulatorScreen({ navigation }) {
  const [step, setStep] = useState(0); 
  const [currentAge, setCurrentAge] = useState('');
  const [retirementAge, setRetirementAge] = useState('65');
  const [currentSavings, setCurrentSavings] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [annualReturnRate, setAnnualReturnRate] = useState('10');
  const [desiredIncome, setDesiredIncome] = useState('');
  const [results, setResults] = useState(null);

  const calculateRetirement = () => {
    const age = parseInt(currentAge) || 0;
    const retAge = parseInt(retirementAge) || 0;
    const savings = parseFloat(currentSavings.replace(/,/g, '')) || 0;
    const contribution = parseFloat(monthlyContribution.replace(/,/g, '')) || 0;
    const rate = parseFloat(annualReturnRate) || 0;
    const desired = parseFloat(desiredIncome.replace(/,/g, '')) || 0;

    if (age <= 0 || retAge <= age || desired <= 0) return;

    const yearsToGrow = retAge - age;
    const monthsToGrow = yearsToGrow * 12;
    const monthlyRate = (rate / 100) / 12;

    let fvSavings = 0;
    let fvContributions = 0;

    if (monthlyRate > 0) {
      fvSavings = savings * Math.pow(1 + monthlyRate, monthsToGrow);
      fvContributions = contribution * ((Math.pow(1 + monthlyRate, monthsToGrow) - 1) / monthlyRate);
    } else {
      fvSavings = savings;
      fvContributions = contribution * monthsToGrow;
    }

    const totalAccumulated = fvSavings + fvContributions;
    const monthlySafeWithdrawal = (totalAccumulated * 0.04) / 12; // 4% rule
    const coveragePct = (monthlySafeWithdrawal / desired) * 100;

    let diagnosis = "";
    if (coveragePct >= 100) {
      diagnosis = `¡Excelente! Estás en camino a un retiro dorado. Tu ahorro proyectado te permitirá vivir con más de lo que planeas (${formatCurrency(monthlySafeWithdrawal)}/mes). Sigue así.`;
    } else if (coveragePct >= 80) {
      diagnosis = `¡Muy bien! Estás cerca de tu meta. Con algunos ajustes pequeños (ahorrar un poco más o mejorar tu rendimiento) podrás cubrir el 100% de tus necesidades.`;
    } else if (coveragePct >= 50) {
      diagnosis = `Vas a medio camino. Tienes ${yearsToGrow} años para mejorar. Considera aumentar tu aportación mensual o buscar instrumentos de inversión con mejor rendimiento.`;
    } else {
      diagnosis = `Atención requerida. Tu plan actual solo cubriría una pequeña parte de tus gastos. Necesitas aumentar drásticamente tu ahorro mensual o reducir tus expectativas de gasto al retiro.`;
    }

    setResults({
      retAge,
      totalAccumulated,
      monthlySafeWithdrawal,
      desired,
      coveragePct,
      diagnosis
    });
    setStep(6);
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  if (step === 6 && results) {
    const isGood = results.coveragePct >= 80;
    const isOk = results.coveragePct >= 50 && results.coveragePct < 80;
    const color = isGood ? '#10B981' : isOk ? '#F59E0B' : '#ef4444';

    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => { setStep(0); setResults(null); }}>
            <MaterialCommunityIcons name="close" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Proyección de Retiro</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Fondo acumulado a los {results.retAge} años</Text>
            <Text style={styles.heroValue}>{formatCurrency(results.totalAccumulated)}</Text>
          </View>

          <View style={styles.moneyCard}>
            <View style={styles.coverageHeader}>
              <View>
                <Text style={styles.coverageLabel}>Ingreso Mensual (Regla del 4%)</Text>
                <Text style={styles.coverageValue}>{formatCurrency(results.monthlySafeWithdrawal)}</Text>
              </View>
              <View style={[styles.coverageBadge, {backgroundColor: `${color}20`}]}>
                <Text style={[styles.coverageBadgeText, {color}]}>{results.coveragePct.toFixed(1)}%</Text>
              </View>
            </View>

            <View style={styles.barContainer}>
              <View style={[styles.barFill, {width: `${Math.min(results.coveragePct, 100)}%`, backgroundColor: color}]} />
            </View>
            <Text style={styles.goalText}>Meta: {formatCurrency(results.desired)} / mes</Text>
          </View>

          <View style={[styles.recommendationBox, {borderColor: `${color}40`, backgroundColor: `${color}10`}]}>
            <MaterialCommunityIcons name="beach" size={24} color={color} />
            <Text style={[styles.recommendationTitle, {color}]}>Análisis de tu futuro</Text>
            <Text style={styles.recommendationText}>{results.diagnosis}</Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          if (step > 0) setStep(step - 1);
          else navigation.goBack();
        }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Simulador de Retiro</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          <View style={styles.wizardContainer}>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${(step / 5) * 100}%` }]} />
            </View>

            {step === 0 && (
              <View style={styles.stepBox}>
                <MaterialCommunityIcons name="account" size={32} color="#3b82f6" />
                <Text style={styles.stepTitle}>¿Cuál es tu edad actual?</Text>
                <Text style={styles.stepDesc}>Ingresa tu edad en años.</Text>
                
                <View style={[styles.inputContainer, {borderColor: 'rgba(59, 130, 246, 0.3)'}]}>
                  <TextInput 
                    style={[styles.input, {textAlign: 'center'}]} 
                    keyboardType="numeric" 
                    value={currentAge} 
                    onChangeText={setCurrentAge} 
                    placeholder="30"
                    placeholderTextColor="#64748b"
                    autoFocus
                  />
                  <Text style={[styles.suffix, {color: '#3b82f6'}]}>Años</Text>
                </View>
                <TouchableOpacity style={[styles.nextButton, {backgroundColor: '#3b82f6'}]} onPress={() => setStep(1)}>
                  <Text style={styles.nextButtonText}>Siguiente</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 1 && (
              <View style={styles.stepBox}>
                <MaterialCommunityIcons name="target" size={32} color="#8b5cf6" />
                <Text style={styles.stepTitle}>¿A qué edad deseas retirarte?</Text>
                <Text style={styles.stepDesc}>Normalmente es a los 65 años.</Text>
                
                <View style={[styles.inputContainer, {borderColor: 'rgba(139, 92, 246, 0.3)'}]}>
                  <TextInput 
                    style={[styles.input, {textAlign: 'center'}]} 
                    keyboardType="numeric" 
                    value={retirementAge} 
                    onChangeText={setRetirementAge} 
                    placeholder="65"
                    placeholderTextColor="#64748b"
                    autoFocus
                  />
                  <Text style={[styles.suffix, {color: '#8b5cf6'}]}>Años</Text>
                </View>
                <TouchableOpacity style={[styles.nextButton, {backgroundColor: '#8b5cf6'}]} onPress={() => setStep(2)}>
                  <Text style={styles.nextButtonText}>Siguiente</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepBox}>
                <MaterialCommunityIcons name="wallet" size={32} color="#10B981" />
                <Text style={styles.stepTitle}>¿Cuánto tienes ahorrado hoy?</Text>
                <Text style={styles.stepDesc}>Dinero ya destinado a tu retiro (AFORE, PPR, inversiones).</Text>
                
                <View style={[styles.inputContainer, {borderColor: 'rgba(16, 185, 129, 0.3)'}]}>
                  <Text style={[styles.currencyPrefix, {color: '#10B981'}]}>$</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={currentSavings} 
                    onChangeText={setCurrentSavings} 
                    placeholder="0"
                    placeholderTextColor="#64748b"
                    autoFocus
                  />
                </View>
                <TouchableOpacity style={[styles.nextButton, {backgroundColor: '#10B981'}]} onPress={() => setStep(3)}>
                  <Text style={styles.nextButtonText}>Siguiente</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 3 && (
              <View style={styles.stepBox}>
                <MaterialCommunityIcons name="calendar-plus" size={32} color="#F59E0B" />
                <Text style={styles.stepTitle}>¿Cuánto aportarás al mes?</Text>
                <Text style={styles.stepDesc}>Y ¿A qué tasa de rendimiento anual?</Text>
                
                <View style={[styles.inputContainer, {borderColor: 'rgba(245, 158, 11, 0.3)', marginBottom: 15}]}>
                  <Text style={[styles.currencyPrefix, {color: '#F59E0B'}]}>$</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={monthlyContribution} 
                    onChangeText={setMonthlyContribution} 
                    placeholder="Mensual"
                    placeholderTextColor="#64748b"
                  />
                </View>
                
                <View style={[styles.inputContainer, {borderColor: 'rgba(245, 158, 11, 0.3)'}]}>
                  <TextInput 
                    style={[styles.input, {textAlign: 'center'}]} 
                    keyboardType="numeric" 
                    value={annualReturnRate} 
                    onChangeText={setAnnualReturnRate} 
                    placeholder="10"
                    placeholderTextColor="#64748b"
                  />
                  <Text style={[styles.suffix, {color: '#F59E0B'}]}>% Anual</Text>
                </View>
                
                <TouchableOpacity style={[styles.nextButton, {backgroundColor: '#F59E0B'}]} onPress={() => setStep(4)}>
                  <Text style={styles.nextButtonText}>Siguiente</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {step === 4 && (
              <View style={styles.stepBox}>
                <MaterialCommunityIcons name="beach" size={32} color="#ec4899" />
                <Text style={styles.stepTitle}>¿Cuánto necesitas para vivir al mes?</Text>
                <Text style={styles.stepDesc}>Tu sueldo ideal para mantener tu estilo de vida en el retiro.</Text>
                
                <View style={[styles.inputContainer, {borderColor: 'rgba(236, 72, 153, 0.3)'}]}>
                  <Text style={[styles.currencyPrefix, {color: '#ec4899'}]}>$</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={desiredIncome} 
                    onChangeText={setDesiredIncome} 
                    placeholder="25,000"
                    placeholderTextColor="#64748b"
                    autoFocus
                  />
                </View>
                <TouchableOpacity style={[styles.nextButton, {backgroundColor: '#ec4899'}]} onPress={calculateRetirement}>
                  <Text style={styles.nextButtonText}>Calcular Jubilación</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>

          <View style={{height: 40}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  wizardContainer: { flex: 1, marginTop: 10 },
  progressContainer: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 40 },
  progressBar: { height: '100%', backgroundColor: '#8b5cf6', borderRadius: 3 },
  stepBox: { alignItems: 'center', paddingHorizontal: 10 },
  stepTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginTop: 20, marginBottom: 10 },
  stepDesc: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 40, paddingHorizontal: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingHorizontal: 20, height: 70, width: '100%', marginBottom: 30, borderWidth: 1 },
  currencyPrefix: { fontSize: 24, fontWeight: 'bold', marginRight: 10 },
  suffix: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  input: { flex: 1, color: '#fff', fontSize: 28, fontWeight: 'bold' },
  nextButton: { width: '100%', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  heroCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 30, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  heroLabel: { color: '#f8fafc', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  heroValue: { color: '#fff', fontSize: 40, fontWeight: '900', marginVertical: 10 },
  moneyCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 25, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  coverageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  coverageLabel: { color: '#94a3b8', fontSize: 14, marginBottom: 4 },
  coverageValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  coverageBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  coverageBadgeText: { fontWeight: 'bold', fontSize: 16 },
  barContainer: { height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: 10 },
  barFill: { height: '100%' },
  goalText: { color: '#94a3b8', fontSize: 12, textAlign: 'right' },
  recommendationBox: { borderRadius: 20, padding: 25, alignItems: 'flex-start', marginBottom: 20, borderWidth: 1 },
  recommendationTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 10 },
  recommendationText: { color: '#cbd5e1', fontSize: 14, lineHeight: 22 }
});
