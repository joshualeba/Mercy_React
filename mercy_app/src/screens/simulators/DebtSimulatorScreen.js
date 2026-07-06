import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CustomAlert from '../../components/CustomAlert';

export default function DebtSimulatorScreen({ navigation }) {
  const [step, setStep] = useState(0); 
  const [debtAmount, setDebtAmount] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [results, setResults] = useState(null);
  const [alert, setAlert] = useState({ visible: false, message: '' });

  const calculateDebt = () => {
    const p = parseFloat(debtAmount.replace(/,/g, '')) || 0;
    const rAnnual = parseFloat(annualRate) || 0;
    const pmt = parseFloat(monthlyPayment.replace(/,/g, '')) || 0;

    if (p <= 0 || pmt <= 0) return;

    const rMonthly = (rAnnual / 100) / 12;
    const minPayment = p * rMonthly;

    if (pmt <= minPayment && rMonthly > 0) {
      setAlert({
        visible: true,
        message: `Tu pago mensual (${formatCurrency(pmt)}) es muy bajo. Ni siquiera cubre los intereses generados (${formatCurrency(minPayment)}). ¡Tu deuda crecerá infinitamente! Debes pagar más de ${formatCurrency(minPayment)}.`
      });
      return;
    }

    let months = 0;
    if (rMonthly > 0) {
      months = -Math.log(1 - (rMonthly * p) / pmt) / Math.log(1 + rMonthly);
    } else {
      months = p / pmt;
    }
    months = Math.ceil(months);

    const totalPaid = pmt * months;
    const totalInterest = totalPaid - p;

    // Formatting Time
    const years = Math.floor(months / 12);
    const remMonths = months % 12;
    let timeString = "";
    if (years > 0) timeString += `${years} año${years > 1 ? 's' : ''}`;
    if (years > 0 && remMonths > 0) timeString += " y ";
    if (remMonths > 0 || years === 0) timeString += `${remMonths} mes${remMonths !== 1 ? 'es' : ''}`;

    const finishDate = new Date();
    finishDate.setMonth(finishDate.getMonth() + months);
    const dateString = finishDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

    const interestPct = (totalInterest / totalPaid) * 100;
    const principalPct = 100 - interestPct;

    // Smart Tip Boost +20%
    const boostedPmt = pmt * 1.2;
    let boostedMonths = 0;
    if (rMonthly > 0) {
      boostedMonths = -Math.log(1 - (rMonthly * p) / boostedPmt) / Math.log(1 + rMonthly);
    } else {
      boostedMonths = p / boostedPmt;
    }
    boostedMonths = Math.ceil(boostedMonths);
    const savedMonths = months - boostedMonths;
    const savedMoney = totalPaid - (boostedPmt * boostedMonths);

    let tip = "";
    if (savedMonths > 0) {
      tip = `Si aumentas tu pago a ${formatCurrency(boostedPmt)} (+20%), terminarías ${savedMonths} meses antes y te ahorrarías ${formatCurrency(savedMoney)} en intereses.`;
    } else {
      tip = "Estás pagando muy rápido. ¡Sigue así!";
    }

    setResults({
      months,
      timeString,
      dateString,
      totalPaid,
      totalInterest,
      interestPct,
      principalPct,
      tip,
      debt: p
    });
    setStep(3);
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  if (step === 3 && results) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => { setStep(0); setResults(null); }}>
            <MaterialCommunityIcons name="close" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ruta de escape de deudas</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <LinearGradient colors={['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.02)']} style={styles.timeCard}>
            <MaterialCommunityIcons name="clock-fast" size={32} color="#ef4444" />
            <Text style={styles.timeCardLabel}>Tiempo estimado para salir</Text>
            <Text style={styles.timeCardValue}>{results.timeString}</Text>
            
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Estarás libre en:</Text>
              <Text style={styles.dateValue}>{results.dateString.charAt(0).toUpperCase() + results.dateString.slice(1)}</Text>
            </View>
          </LinearGradient>

          <View style={styles.moneyCard}>
            <Text style={styles.moneyTitle}>El costo real de tu deuda</Text>
            
            <View style={styles.barContainer}>
              <View style={[styles.barFill, {width: `${results.principalPct}%`, backgroundColor: '#3b82f6'}]} />
              <View style={[styles.barFill, {width: `${results.interestPct}%`, backgroundColor: '#ef4444'}]} />
            </View>

            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: '#3b82f6'}]} />
                <View>
                  <Text style={styles.legendLabel}>Dinero que te prestaron</Text>
                  <Text style={styles.legendValue}>{formatCurrency(results.debt)}</Text>
                </View>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: '#ef4444'}]} />
                <View>
                  <Text style={styles.legendLabel}>Intereses pagados</Text>
                  <Text style={[styles.legendValue, {color: '#ef4444'}]}>+{formatCurrency(results.totalInterest)}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total que pagarás al banco:</Text>
              <Text style={styles.totalValue}>{formatCurrency(results.totalPaid)}</Text>
            </View>
          </View>

          <View style={styles.recommendationBox}>
            <MaterialCommunityIcons name="lightbulb-on" size={24} color="#F59E0B" />
            <Text style={[styles.recommendationTitle, {color: '#F59E0B'}]}>Hack Financiero (+20%)</Text>
            <Text style={styles.recommendationText}>{results.tip}</Text>
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
        <Text style={styles.headerTitle}>Calculadora de Deuda</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          <View style={styles.wizardContainer}>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${(step / 2) * 100}%` }]} />
            </View>

            {step === 0 && (
              <View style={styles.stepBox}>
                <MaterialCommunityIcons name="credit-card-alert" size={32} color="#ef4444" />
                <Text style={styles.stepTitle}>¿De cuánto es tu deuda total?</Text>
                <Text style={styles.stepDesc}>Suma el saldo actual de tu tarjeta o préstamo.</Text>
                
                <View style={[styles.inputContainer, {borderColor: 'rgba(239, 68, 68, 0.3)'}]}>
                  <Text style={[styles.currencyPrefix, {color: '#ef4444'}]}>$</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={debtAmount} 
                    onChangeText={setDebtAmount} 
                    placeholder="0"
                    placeholderTextColor="#64748b"
                    autoFocus
                  />
                </View>
                <TouchableOpacity style={[styles.nextButton, {backgroundColor: '#ef4444'}]} onPress={() => setStep(1)}>
                  <Text style={styles.nextButtonText}>Siguiente</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 1 && (
              <View style={styles.stepBox}>
                <MaterialCommunityIcons name="percent" size={32} color="#F59E0B" />
                <Text style={styles.stepTitle}>¿Cuál es la tasa de interés anual?</Text>
                <Text style={styles.stepDesc}>Revisa el estado de cuenta (CAT o Tasa ordinaria).</Text>
                
                <View style={[styles.inputContainer, {borderColor: 'rgba(245, 158, 11, 0.3)'}]}>
                  <TextInput 
                    style={[styles.input, {textAlign: 'center'}]} 
                    keyboardType="numeric" 
                    value={annualRate} 
                    onChangeText={setAnnualRate} 
                    placeholder="55"
                    placeholderTextColor="#64748b"
                    autoFocus
                  />
                  <Text style={[styles.suffix, {color: '#F59E0B'}]}>%</Text>
                </View>
                <TouchableOpacity style={[styles.nextButton, {backgroundColor: '#F59E0B'}]} onPress={() => setStep(2)}>
                  <Text style={styles.nextButtonText}>Siguiente</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepBox}>
                <MaterialCommunityIcons name="cash-fast" size={32} color="#10B981" />
                <Text style={styles.stepTitle}>¿Cuánto puedes pagar al mes?</Text>
                <Text style={styles.stepDesc}>Tiene que ser mayor al pago mínimo.</Text>
                
                <View style={[styles.inputContainer, {borderColor: 'rgba(16, 185, 129, 0.3)'}]}>
                  <Text style={[styles.currencyPrefix, {color: '#10B981'}]}>$</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={monthlyPayment} 
                    onChangeText={setMonthlyPayment} 
                    placeholder="0"
                    placeholderTextColor="#64748b"
                    autoFocus
                  />
                </View>
                <TouchableOpacity style={[styles.nextButton, {backgroundColor: '#10B981'}]} onPress={calculateDebt}>
                  <Text style={styles.nextButtonText}>Analizar mi deuda</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>

          <View style={{height: 40}} />
        </ScrollView>
      </KeyboardAvoidingView>
      
      <CustomAlert 
        visible={alert.visible}
        title="Alerta de Deuda"
        message={alert.message}
        type="error"
        onClose={() => setAlert({visible: false, message: ''})}
        onConfirm={() => setAlert({visible: false, message: ''})}
      />
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
  progressBar: { height: '100%', backgroundColor: '#ef4444', borderRadius: 3 },
  stepBox: { alignItems: 'center', paddingHorizontal: 10 },
  stepTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginTop: 20, marginBottom: 10 },
  stepDesc: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 40, paddingHorizontal: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingHorizontal: 20, height: 70, width: '100%', marginBottom: 30, borderWidth: 1 },
  currencyPrefix: { fontSize: 24, fontWeight: 'bold', marginRight: 10 },
  suffix: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  input: { flex: 1, color: '#fff', fontSize: 28, fontWeight: 'bold' },
  nextButton: { width: '100%', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  timeCard: { borderRadius: 20, padding: 30, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  timeCardLabel: { color: '#f8fafc', fontSize: 16, fontWeight: 'bold', marginTop: 15 },
  timeCardValue: { color: '#ef4444', fontSize: 40, fontWeight: '900', marginVertical: 10, textAlign: 'center' },
  dateBox: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginTop: 20, flexDirection: 'row', alignItems: 'center' },
  dateLabel: { color: '#cbd5e1', fontSize: 14, fontWeight: 'bold', marginRight: 10 },
  dateValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  moneyCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 25, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  moneyTitle: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold', marginBottom: 25 },
  barContainer: { height: 12, borderRadius: 6, flexDirection: 'row', overflow: 'hidden', marginBottom: 25 },
  barFill: { height: '100%' },
  legendContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', width: '48%' },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  legendLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 2 },
  legendValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  totalBox: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold' },
  totalValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  recommendationBox: { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 20, padding: 25, alignItems: 'flex-start', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' },
  recommendationTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 10 },
  recommendationText: { color: '#cbd5e1', fontSize: 14, lineHeight: 22 }
});
