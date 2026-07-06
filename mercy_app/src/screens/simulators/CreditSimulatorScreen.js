import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function CreditSimulatorScreen({ navigation }) {
  const [step, setStep] = useState(0); // 0: Select Type, 1: Amount, 2: Term, 3: Rate
  const [creditType, setCreditType] = useState('');
  const [amount, setAmount] = useState('');
  const [months, setMonths] = useState('');
  const [rate, setRate] = useState('');
  const [results, setResults] = useState(null);

  const creditTypes = [
    { id: 'personal', title: 'Personal', desc: 'Libre inversión.', icon: 'cash', color: '#3b82f6' },
    { id: 'hipotecario', title: 'Hipotecario', desc: 'Compra de vivienda.', icon: 'home', color: '#8b5cf6' },
    { id: 'automotriz', title: 'Automotriz', desc: 'Vehículos nuevos o usados.', icon: 'car', color: '#ef4444' },
    { id: 'educativo', title: 'Educativo', desc: 'Estudios superiores.', icon: 'school', color: '#10B981' }
  ];

  const dynamicTexts = {
    'personal': {
      amount: { label: '¿Cuánto dinero necesitas?', desc: 'El monto total que deseas solicitar.' },
      term: { label: '¿En cuántos meses deseas pagar?', desc: 'Ingresa el plazo en meses (Ej: 12, 24, 60).' },
      rate: { label: '¿Qué tasa de interés anual te ofrecen?', desc: 'Consulta el CAT promedio (aprox. 20%-45%).' },
    },
    'hipotecario': {
      amount: { label: '¿De cuánto será el préstamo hipotecario?', desc: 'El valor de la casa menos el enganche.' },
      term: { label: '¿En cuántos meses pagarás tu casa?', desc: 'Tip: 15 años = 180 meses, 20 años = 240 meses.' },
      rate: { label: '¿Cuál es la tasa anual fija?', desc: 'Normalmente ronda entre 9% y 12% anual.' },
    },
    'automotriz': {
      amount: { label: '¿Cuánto necesitas financiar del auto?', desc: 'El precio del vehículo menos tu enganche.' },
      term: { label: '¿En cuántos meses lo terminarás de pagar?', desc: 'Plazos comunes: 24, 36, 48 o 60 meses.' },
      rate: { label: '¿Cuál es la tasa de interés anual?', desc: 'Varía según la agencia o banco (aprox. 11%-17%).' },
    },
    'educativo': {
      amount: { label: '¿Cuál es el monto del financiamiento?', desc: 'Lo que la institución pagará por ti.' },
      term: { label: '¿En cuánto tiempo planeas liquidarlo?', desc: 'Recuerda considerar el periodo de gracia si aplica.' },
      rate: { label: '¿Cuál es la tasa de interés anual?', desc: 'Suele ser preferencial (aprox. 10%-18%).' },
    }
  };

  const handleSelectType = (id) => {
    setCreditType(id);
    setStep(1);
  };

  const calculateCredit = () => {
    const P = parseFloat(amount.replace(/,/g, '')) || 0;
    const n = parseInt(months) || 0;
    const rAnnual = parseFloat(rate) || 0;

    if (P <= 0 || n <= 0) return; // Prevent division by zero

    const rMonthly = rAnnual / 100 / 12;
    let monthlyPayment = 0;

    if (rMonthly === 0) {
      monthlyPayment = P / n;
    } else {
      monthlyPayment = (P * rMonthly) / (1 - Math.pow(1 + rMonthly, -n));
    }

    const totalPayment = monthlyPayment * n;
    const totalInterest = totalPayment - P;

    const percentPrincipal = (P / totalPayment) * 100;
    const percentInterest = (totalInterest / totalPayment) * 100;

    setResults({
      monthlyPayment,
      totalPayment,
      totalInterest,
      principal: P,
      rate: rAnnual,
      months: n,
      percentPrincipal,
      percentInterest
    });
    setStep(4);
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  if (step === 4 && results) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => { setStep(0); setResults(null); }}>
            <MaterialCommunityIcons name="close" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Análisis de Crédito</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.timeCard}>
            <Text style={styles.timeCardLabel}>Pago mensual estimado</Text>
            <Text style={[styles.timeCardValue, {color: '#ef4444'}]}>{formatCurrency(results.monthlyPayment)}</Text>
            <View style={styles.badgeContainer}>
              <View style={styles.badge}><Text style={styles.badgeText}>{results.months} meses</Text></View>
              <View style={[styles.badge, {backgroundColor: 'rgba(239,68,68,0.1)'}]}><Text style={[styles.badgeText, {color: '#ef4444'}]}>{results.rate}% Anual</Text></View>
            </View>
          </View>

          <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']} style={styles.moneyCard}>
            <Text style={styles.moneyTitle}>Desglose del pago total</Text>
            
            <View style={styles.barContainer}>
              <View style={[styles.barFill, {width: `${results.percentPrincipal}%`, backgroundColor: '#3b82f6'}]} />
              <View style={[styles.barFill, {width: `${results.percentInterest}%`, backgroundColor: '#ef4444'}]} />
            </View>

            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: '#3b82f6'}]} />
                <View>
                  <Text style={styles.legendLabel}>Capital prestado</Text>
                  <Text style={styles.legendValue}>{formatCurrency(results.principal)}</Text>
                </View>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: '#ef4444'}]} />
                <View>
                  <Text style={styles.legendLabel}>Intereses pagados</Text>
                  <Text style={[styles.legendValue, {color: '#ef4444'}]}>{formatCurrency(results.totalInterest)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Costo Total del Crédito:</Text>
              <Text style={styles.totalValue}>{formatCurrency(results.totalPayment)}</Text>
            </View>
          </LinearGradient>

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
        <Text style={styles.headerTitle}>Simulador de Crédito</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {step === 0 && (
            <View>
              <Text style={styles.sectionTitle}>Paso 1: ¿Qué tipo de crédito necesitas?</Text>
              <View style={styles.grid}>
                {creditTypes.map(item => (
                  <TouchableOpacity key={item.id} style={styles.goalCard} onPress={() => handleSelectType(item.id)}>
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
                  <MaterialCommunityIcons name="cash-multiple" size={32} color="#3b82f6" />
                  <Text style={styles.stepTitle}>{dynamicTexts[creditType].amount.label}</Text>
                  <Text style={styles.stepDesc}>{dynamicTexts[creditType].amount.desc}</Text>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.currencyPrefix}>$</Text>
                    <TextInput 
                      style={styles.input} 
                      keyboardType="numeric" 
                      value={amount} 
                      onChangeText={setAmount} 
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
                  <MaterialCommunityIcons name="calendar-month-outline" size={32} color="#8b5cf6" />
                  <Text style={styles.stepTitle}>{dynamicTexts[creditType].term.label}</Text>
                  <Text style={styles.stepDesc}>{dynamicTexts[creditType].term.desc}</Text>
                  
                  <View style={styles.inputContainer}>
                    <TextInput 
                      style={[styles.input, {textAlign: 'center'}]} 
                      keyboardType="numeric" 
                      value={months} 
                      onChangeText={setMonths} 
                      placeholder="12"
                      placeholderTextColor="#64748b"
                      autoFocus
                    />
                    <Text style={styles.suffix}>meses</Text>
                  </View>
                  <TouchableOpacity style={[styles.nextButton, {backgroundColor: '#8b5cf6'}]} onPress={() => setStep(3)}>
                    <Text style={styles.nextButtonText}>Siguiente</Text>
                  </TouchableOpacity>
                </View>
              )}

              {step === 3 && (
                <View style={styles.stepBox}>
                  <MaterialCommunityIcons name="percent" size={32} color="#ef4444" />
                  <Text style={styles.stepTitle}>{dynamicTexts[creditType].rate.label}</Text>
                  <Text style={styles.stepDesc}>{dynamicTexts[creditType].rate.desc}</Text>
                  
                  <View style={styles.inputContainer}>
                    <TextInput 
                      style={[styles.input, {textAlign: 'center'}]} 
                      keyboardType="numeric" 
                      value={rate} 
                      onChangeText={setRate} 
                      placeholder="15.5"
                      placeholderTextColor="#64748b"
                      autoFocus
                    />
                    <Text style={styles.suffix}>%</Text>
                  </View>
                  <TouchableOpacity style={[styles.nextButton, {backgroundColor: '#ef4444'}]} onPress={calculateCredit}>
                    <Text style={styles.nextButtonText}>Calcular Crédito</Text>
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
  progressBar: { height: '100%', backgroundColor: '#ef4444', borderRadius: 3 },
  stepBox: { alignItems: 'center', paddingHorizontal: 10 },
  stepTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginTop: 20, marginBottom: 10 },
  stepDesc: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 40 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingHorizontal: 20, height: 70, width: '100%', marginBottom: 30, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  currencyPrefix: { color: '#ef4444', fontSize: 24, fontWeight: 'bold', marginRight: 10 },
  suffix: { color: '#ef4444', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  input: { flex: 1, color: '#fff', fontSize: 28, fontWeight: 'bold' },
  nextButton: { backgroundColor: '#3b82f6', width: '100%', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  timeCard: { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: 20, padding: 30, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  timeCardLabel: { color: '#f8fafc', fontSize: 16, fontWeight: 'bold' },
  timeCardValue: { fontSize: 44, fontWeight: '900', marginVertical: 15 },
  badgeContainer: { flexDirection: 'row', gap: 10 },
  badge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  moneyCard: { borderRadius: 20, padding: 25, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  moneyTitle: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  barContainer: { height: 12, borderRadius: 6, flexDirection: 'row', overflow: 'hidden', marginBottom: 25 },
  barFill: { height: '100%' },
  legendContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  legendItem: { flexDirection: 'row', alignItems: 'center', width: '48%' },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  legendLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 2 },
  legendValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  totalBox: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold' },
  totalValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});
