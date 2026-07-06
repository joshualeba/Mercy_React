import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function SavingsSimulatorScreen({ navigation }) {
  const [step, setStep] = useState(0); // 0: Select Goal, 1: Goal Amount, 2: Current Amount, 3: Monthly
  const [meta, setMeta] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [results, setResults] = useState(null);

  const goalTypes = [
    { id: 'fiestas', title: 'Celebración', desc: 'Bodas, XV años, aniversarios.', icon: 'party-popper', color: '#ef4444' },
    { id: 'viajes', title: 'Viaje soñado', desc: 'Vacaciones, escapadas, turismo.', icon: 'airplane', color: '#38bdf8' },
    { id: 'educacion', title: 'Educación', desc: 'Universidad, maestrías, cursos.', icon: 'school', color: '#3b82f6' },
    { id: 'personal', title: 'Meta personal', desc: 'Auto nuevo, gadgets, emergencias.', icon: 'star', color: '#10B981' }
  ];

  const dynamicTexts = {
    'fiestas': {
      goal: { label: '¿Cuál es el presupuesto para la celebración?', desc: 'Incluye salón, música, comida y extras.' },
      current: { label: '¿Ya tienes algo reservado o ahorrado?', desc: 'Dinero ya asignado al evento.' },
      monthly: { label: '¿Cuánto puedes destinar al mes?', desc: 'Considera tus ingresos menos gastos fijos.' },
      recommendation: 'Planificar con tiempo te permite reservar mejores lugares y precios. ¡Considera invertir tu ahorro a corto plazo!'
    },
    'viajes': {
      goal: { label: '¿Cuánto costará el viaje de tus sueños?', desc: 'Vuelos, hospedaje, comidas y tours.' },
      current: { label: '¿Tienes algún ahorro previo para esto?', desc: 'Millas, puntos o efectivo guardado.' },
      monthly: { label: '¿Cuánto puedes ahorrar mensualmente?', desc: 'Intenta reducir gastos hormiga para aumentar este monto.' },
      recommendation: 'Para viajes internacionales, considera una cuenta en dólares o inversiones líquidas.'
    },
    'educacion': {
      goal: { label: '¿Cuál es el costo total de la educación?', desc: 'Matrícula, libros, estancia y manutención.' },
      current: { label: '¿Dispones de un fondo educativo actual?', desc: 'Ahorros previos o becas parciales.' },
      monthly: { label: '¿Cuánto puedes aportar mensualmente?', desc: 'La constancia es clave para metas a largo plazo.' },
      recommendation: 'La educación es la mejor inversión. Revisa instrumentos que protejan tu dinero contra la inflación.'
    },
    'personal': {
      goal: { label: '¿Cuánto necesitas para tu meta personal?', desc: 'El precio total del bien o servicio.' },
      current: { label: '¿Cuánto tienes ahorrado hasta hoy?', desc: 'Tu capital inicial disponible.' },
      monthly: { label: '¿Cuánto separarás de tu sueldo al mes?', desc: 'Un 10-20% de tus ingresos es un excelente hábito.' },
      recommendation: 'Define plazos claros. Si es a largo plazo, el interés compuesto será tu mejor aliado.'
    }
  };

  const handleSelectMeta = (id) => {
    setMeta(id);
    setStep(1);
  };

  const calculateSavings = () => {
    const goal = parseFloat(goalAmount.replace(/,/g, '')) || 0;
    const current = parseFloat(currentAmount.replace(/,/g, '')) || 0;
    const monthly = parseFloat(monthlyContribution.replace(/,/g, '')) || 0;

    const remaining = goal - current;
    let monthsNeeded = 0;

    if (remaining > 0 && monthly > 0) {
      monthsNeeded = Math.ceil(remaining / monthly);
    } else if (remaining > 0 && monthly === 0) {
      monthsNeeded = 999;
    }

    const today = new Date();
    const targetDate = new Date(today.setMonth(today.getMonth() + monthsNeeded));
    const dateString = targetDate.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

    // 10% annual SOFIPO investment projection
    const monthlyRate = 0.10 / 12;
    let futureValue = current;
    for (let i = 0; i < monthsNeeded; i++) {
      futureValue = (futureValue + monthly) * (1 + monthlyRate);
    }
    if (monthsNeeded === 0) futureValue = current;

    const simpleSavings = current + (monthly * monthsNeeded);
    const interestEarned = futureValue - simpleSavings;

    let specificAdvice = "";
    if (monthsNeeded > 60) {
      specificAdvice = "Es un plazo largo. Considera aumentar ligeramente tu aportación mensual para reducir el tiempo significativamente.";
    } else if (monthsNeeded < 6) {
      specificAdvice = "¡Estás muy cerca! Mantén tu dinero líquido en opciones de disponibilidad diaria.";
    } else {
      specificAdvice = "Un plazo saludable. Las SOFIPOS o CETES son excelentes opciones para este horizonte de tiempo.";
    }
    const metaAdvice = dynamicTexts[meta]?.recommendation || "";

    setResults({
      months: monthsNeeded,
      date: dateString,
      saved: simpleSavings,
      invested: futureValue,
      interest: interestEarned,
      recommendation: `${metaAdvice} ${specificAdvice}`
    });
    setStep(4);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  if (step === 4 && results) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => { setStep(0); setResults(null); }}>
            <MaterialCommunityIcons name="close" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tu plan de acción</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.timeCard}>
            <MaterialCommunityIcons name="calendar-check" size={32} color="#3b82f6" />
            <Text style={styles.timeCardLabel}>Ruta de tiempo</Text>
            <Text style={styles.timeCardValue}>{results.months === 999 ? '∞' : results.months}</Text>
            <Text style={styles.timeCardDesc}>meses para lograrlo</Text>
            
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Fecha estimada:</Text>
              <Text style={styles.dateValue}>{results.months === 999 ? 'Nunca' : results.date}</Text>
            </View>
          </View>

          <LinearGradient colors={['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.02)']} style={styles.moneyCard}>
            <View style={styles.moneyHeader}>
              <MaterialCommunityIcons name="piggy-bank" size={32} color="#10B981" />
              <View style={{marginLeft: 15}}>
                <Text style={styles.moneyTitle}>Potencial de inversión</Text>
                <Text style={styles.moneySubtitle}>Ahorro vs. Inversión (~10%)</Text>
              </View>
            </View>

            <View style={styles.moneyStats}>
              <Text style={styles.statLabel}>Ahorro acumulado (sin invertir):</Text>
              <Text style={styles.statValueBad}>{formatCurrency(results.saved)}</Text>
              
              <View style={{height: 15}} />
              
              <Text style={[styles.statLabel, {color: '#8b5cf6'}]}>Proyección invertido:</Text>
              <Text style={[styles.statValueGood, {color: '#8b5cf6'}]}>{formatCurrency(results.invested)}</Text>
            </View>

            <View style={styles.interestBox}>
              <Text style={styles.interestLabel}>Intereses ganados (dinero extra):</Text>
              <Text style={styles.interestValue}>+{formatCurrency(results.interest)}</Text>
            </View>
          </LinearGradient>

          <View style={styles.recommendationBox}>
            <MaterialCommunityIcons name="star" size={24} color="#F59E0B" />
            <Text style={styles.recommendationTitle}>Recomendación</Text>
            <Text style={styles.recommendationText}>{results.recommendation}</Text>
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
        <Text style={styles.headerTitle}>Simulador de Ahorro</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {step === 0 && (
            <View>
              <Text style={styles.sectionTitle}>Paso 1: ¿Para qué deseas ahorrar?</Text>
              <View style={styles.grid}>
                {goalTypes.map(item => (
                  <TouchableOpacity key={item.id} style={styles.goalCard} onPress={() => handleSelectMeta(item.id)}>
                    <View style={[styles.goalIconContainer, { backgroundColor: `${item.color}20` }]}>
                      <MaterialCommunityIcons name={item.icon} size={32} color={item.color} />
                    </View>
                    <Text style={styles.goalTitle}>{item.title}</Text>
                    <Text style={styles.goalDesc}>{item.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step > 0 && (
            <View style={styles.wizardContainer}>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
              </View>

              {step === 1 && (
                <View style={styles.stepBox}>
                  <MaterialCommunityIcons name="flag" size={32} color="#10B981" />
                  <Text style={styles.stepTitle}>{dynamicTexts[meta].goal.label}</Text>
                  <Text style={styles.stepDesc}>{dynamicTexts[meta].goal.desc}</Text>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.currencyPrefix}>$</Text>
                    <TextInput 
                      style={styles.input} 
                      keyboardType="numeric" 
                      value={goalAmount} 
                      onChangeText={setGoalAmount} 
                      placeholder="0"
                      placeholderTextColor="#64748b"
                      autoFocus
                    />
                  </View>
                  <TouchableOpacity style={styles.nextButton} onPress={() => setStep(2)}>
                    <Text style={styles.nextButtonText}>Siguiente</Text>
                  </TouchableOpacity>
                </View>
              )}

              {step === 2 && (
                <View style={styles.stepBox}>
                  <MaterialCommunityIcons name="wallet" size={32} color="#3b82f6" />
                  <Text style={styles.stepTitle}>{dynamicTexts[meta].current.label}</Text>
                  <Text style={styles.stepDesc}>{dynamicTexts[meta].current.desc}</Text>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.currencyPrefix}>$</Text>
                    <TextInput 
                      style={styles.input} 
                      keyboardType="numeric" 
                      value={currentAmount} 
                      onChangeText={setCurrentAmount} 
                      placeholder="0"
                      placeholderTextColor="#64748b"
                      autoFocus
                    />
                  </View>
                  <TouchableOpacity style={styles.nextButton} onPress={() => setStep(3)}>
                    <Text style={styles.nextButtonText}>Siguiente</Text>
                  </TouchableOpacity>
                </View>
              )}

              {step === 3 && (
                <View style={styles.stepBox}>
                  <MaterialCommunityIcons name="calendar-plus" size={32} color="#38bdf8" />
                  <Text style={styles.stepTitle}>{dynamicTexts[meta].monthly.label}</Text>
                  <Text style={styles.stepDesc}>{dynamicTexts[meta].monthly.desc}</Text>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.currencyPrefix}>$</Text>
                    <TextInput 
                      style={styles.input} 
                      keyboardType="numeric" 
                      value={monthlyContribution} 
                      onChangeText={setMonthlyContribution} 
                      placeholder="0"
                      placeholderTextColor="#64748b"
                      autoFocus
                    />
                  </View>
                  <TouchableOpacity style={[styles.nextButton, {backgroundColor: '#10B981'}]} onPress={calculateSavings}>
                    <Text style={styles.nextButtonText}>Calcular Plan</Text>
                  </TouchableOpacity>
                </View>
              )}

            </View>
          )}

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
  sectionTitle: { color: '#94a3b8', fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  goalCard: { backgroundColor: 'rgba(255,255,255,0.03)', width: '48%', borderRadius: 20, padding: 20, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  goalIconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  goalTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  goalDesc: { color: '#64748b', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  wizardContainer: { flex: 1, marginTop: 20 },
  progressContainer: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 40 },
  progressBar: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 },
  stepBox: { alignItems: 'center', paddingHorizontal: 10 },
  stepTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginTop: 20, marginBottom: 10 },
  stepDesc: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 40 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingHorizontal: 20, height: 70, width: '100%', marginBottom: 30, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' },
  currencyPrefix: { color: '#3b82f6', fontSize: 24, fontWeight: 'bold', marginRight: 10 },
  input: { flex: 1, color: '#fff', fontSize: 24, fontWeight: 'bold' },
  nextButton: { backgroundColor: '#3b82f6', width: '100%', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  timeCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 30, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  timeCardLabel: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 15 },
  timeCardValue: { color: '#fff', fontSize: 60, fontWeight: '900', marginVertical: 10 },
  timeCardDesc: { color: '#94a3b8', fontSize: 16 },
  dateBox: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginTop: 20, flexDirection: 'row', alignItems: 'center' },
  dateLabel: { color: '#64748b', fontSize: 14, fontWeight: 'bold', marginRight: 10 },
  dateValue: { color: '#10B981', fontSize: 16, fontWeight: 'bold' },
  moneyCard: { borderRadius: 20, padding: 25, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
  moneyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  moneyTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  moneySubtitle: { color: '#10B981', fontSize: 14 },
  moneyStats: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 20 },
  statLabel: { color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 5 },
  statValueBad: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  statValueGood: { fontSize: 32, fontWeight: '900' },
  interestBox: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 20 },
  interestLabel: { color: '#10B981', fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 5 },
  interestValue: { color: '#10B981', fontSize: 24, fontWeight: 'bold', backgroundColor: 'rgba(16, 185, 129, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },
  recommendationBox: { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 20, padding: 25, alignItems: 'flex-start', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' },
  recommendationTitle: { color: '#F59E0B', fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 10 },
  recommendationText: { color: '#cbd5e1', fontSize: 14, lineHeight: 22 }
});
