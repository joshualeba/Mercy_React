import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function BudgetSimulatorScreen({ navigation }) {
  const [step, setStep] = useState(0); 
  const [income, setIncome] = useState('');
  const [fixed, setFixed] = useState('');
  const [variable, setVariable] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [results, setResults] = useState(null);

  const calculateBudget = () => {
    const i = parseFloat(income.replace(/,/g, '')) || 0;
    const f = parseFloat(fixed.replace(/,/g, '')) || 0;
    const v = parseFloat(variable.replace(/,/g, '')) || 0;
    const s = parseFloat(savingsGoal.replace(/,/g, '')) || 0;

    if (i <= 0) return;

    const totalExpenses = f + v;
    const balance = i - totalExpenses;

    const needsPct = (f / i) * 100;
    const wantsPct = (v / i) * 100;
    const savingsPotential = balance > 0 ? balance : 0;
    const realSavingsPct = (savingsPotential / i) * 100;

    let diagnosis = "";
    if (balance < 0) {
      diagnosis = "Tus gastos superan tus ingresos. Es urgente reducir gastos variables o buscar ingresos extra. No es momento de ahorrar, sino de sanear finanzas.";
    } else if (needsPct > 60) {
      diagnosis = "Tus gastos fijos son muy altos (>60%). Esto te deja poco margen. Revisa si puedes reducir costos fijos (renta, servicios).";
    } else if (wantsPct > 40) {
      diagnosis = "Estás gastando mucho en deseos (>40%). Modera esos gastos variables para aumentar tu capacidad de ahorro.";
    } else if (realSavingsPct < 10) {
      diagnosis = "Tienes balance positivo, pero ahorras menos del 10%. Intenta ajustarte un poco más para llegar al ideal del 20%.";
    } else {
      diagnosis = "¡Excelente salud financiera! Tus proporciones son muy saludables (cercanas al 50/30/20). ¡Sigue así!";
    }

    if (savingsPotential >= s && balance > 0) {
      diagnosis += " Además, ¡cubres tu meta de ahorro soñada sin problemas!";
    } else if (balance > 0) {
      diagnosis += ` Aún te falta un poco para cubrir tu meta de ahorro ideal (${formatCurrency(s)}).`;
    }

    setResults({
      income: i,
      totalExpenses,
      balance,
      needsPct,
      wantsPct,
      realSavingsPct,
      savingsPotential,
      diagnosis
    });
    setStep(4);
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  if (step === 4 && results) {
    const isNegative = results.balance < 0;
    
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => { setStep(0); setResults(null); }}>
            <MaterialCommunityIcons name="close" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Análisis 50/30/20</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={[styles.timeCard, {borderColor: isNegative ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}]}>
            <Text style={styles.timeCardLabel}>Dinero disponible real</Text>
            <Text style={[styles.timeCardValue, {color: isNegative ? '#ef4444' : '#3b82f6'}]}>{formatCurrency(results.balance)}</Text>
            {isNegative && <Text style={{color: '#ef4444', fontWeight: 'bold'}}>¡Estás gastando más de lo que ganas!</Text>}
          </View>

          <View style={styles.moneyCard}>
            <Text style={styles.moneyTitle}>Tu Presupuesto Actual</Text>
            
            {/* Needs 50% */}
            <View style={styles.barItem}>
              <View style={styles.barItemHeader}>
                <Text style={styles.barLabel}>Gastos Fijos (Ideal 50%)</Text>
                <Text style={styles.barValue}>{results.needsPct.toFixed(1)}%</Text>
              </View>
              <View style={styles.barContainer}>
                <View style={[styles.barFill, {width: `${Math.min(results.needsPct, 100)}%`, backgroundColor: results.needsPct > 60 ? '#ef4444' : '#3b82f6'}]} />
              </View>
            </View>

            {/* Wants 30% */}
            <View style={styles.barItem}>
              <View style={styles.barItemHeader}>
                <Text style={styles.barLabel}>Deseos (Ideal 30%)</Text>
                <Text style={styles.barValue}>{results.wantsPct.toFixed(1)}%</Text>
              </View>
              <View style={styles.barContainer}>
                <View style={[styles.barFill, {width: `${Math.min(results.wantsPct, 100)}%`, backgroundColor: results.wantsPct > 40 ? '#ef4444' : '#F59E0B'}]} />
              </View>
            </View>

            {/* Savings 20% */}
            <View style={styles.barItem}>
              <View style={styles.barItemHeader}>
                <Text style={styles.barLabel}>Ahorro (Ideal 20%)</Text>
                <Text style={styles.barValue}>{results.realSavingsPct.toFixed(1)}%</Text>
              </View>
              <View style={styles.barContainer}>
                <View style={[styles.barFill, {width: `${Math.min(results.realSavingsPct, 100)}%`, backgroundColor: results.realSavingsPct < 10 ? '#ef4444' : '#10B981'}]} />
              </View>
            </View>
          </View>

          <View style={styles.recommendationBox}>
            <MaterialCommunityIcons name="stethoscope" size={24} color="#38bdf8" />
            <Text style={[styles.recommendationTitle, {color: '#38bdf8'}]}>Diagnóstico</Text>
            <Text style={styles.recommendationText}>{results.diagnosis}</Text>
          </View>
          
          <View style={{height: 40}} />
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
        <Text style={styles.headerTitle}>Regla 50/30/20</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          <View style={styles.wizardContainer}>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
            </View>

            {step === 0 && (
              <View style={styles.stepBox}>
                <MaterialCommunityIcons name="cash-multiple" size={32} color="#10B981" />
                <Text style={styles.stepTitle}>¿Cuál es tu ingreso mensual neto?</Text>
                <Text style={styles.stepDesc}>Lo que recibes libre de impuestos.</Text>
                
                <View style={[styles.inputContainer, {borderColor: 'rgba(16, 185, 129, 0.3)'}]}>
                  <Text style={[styles.currencyPrefix, {color: '#10B981'}]}>$</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={income} 
                    onChangeText={setIncome} 
                    placeholder="0"
                    placeholderTextColor="#64748b"
                    autoFocus
                  />
                </View>
                <TouchableOpacity style={[styles.nextButton, {backgroundColor: '#10B981'}]} onPress={() => setStep(1)}>
                  <Text style={styles.nextButtonText}>Siguiente</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 1 && (
              <View style={styles.stepBox}>
                <MaterialCommunityIcons name="home-city" size={32} color="#3b82f6" />
                <Text style={styles.stepTitle}>Gastos Fijos o Necesidades</Text>
                <Text style={styles.stepDesc}>Renta, servicios, comida básica, transporte (El 50%).</Text>
                
                <View style={[styles.inputContainer, {borderColor: 'rgba(59, 130, 246, 0.3)'}]}>
                  <Text style={[styles.currencyPrefix, {color: '#3b82f6'}]}>$</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={fixed} 
                    onChangeText={setFixed} 
                    placeholder="0"
                    placeholderTextColor="#64748b"
                    autoFocus
                  />
                </View>
                <TouchableOpacity style={[styles.nextButton, {backgroundColor: '#3b82f6'}]} onPress={() => setStep(2)}>
                  <Text style={styles.nextButtonText}>Siguiente</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepBox}>
                <MaterialCommunityIcons name="shopping" size={32} color="#F59E0B" />
                <Text style={styles.stepTitle}>Gastos Variables o Deseos</Text>
                <Text style={styles.stepDesc}>Salidas, ropa, streaming, hobbies (El 30%).</Text>
                
                <View style={[styles.inputContainer, {borderColor: 'rgba(245, 158, 11, 0.3)'}]}>
                  <Text style={[styles.currencyPrefix, {color: '#F59E0B'}]}>$</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={variable} 
                    onChangeText={setVariable} 
                    placeholder="0"
                    placeholderTextColor="#64748b"
                    autoFocus
                  />
                </View>
                <TouchableOpacity style={[styles.nextButton, {backgroundColor: '#F59E0B'}]} onPress={() => setStep(3)}>
                  <Text style={styles.nextButtonText}>Siguiente</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 3 && (
              <View style={styles.stepBox}>
                <MaterialCommunityIcons name="piggy-bank" size={32} color="#8b5cf6" />
                <Text style={styles.stepTitle}>¿Cuánto quisieras ahorrar al mes?</Text>
                <Text style={styles.stepDesc}>Tu meta ideal de ahorro, inversión o pago de deudas (El 20%).</Text>
                
                <View style={[styles.inputContainer, {borderColor: 'rgba(139, 92, 246, 0.3)'}]}>
                  <Text style={[styles.currencyPrefix, {color: '#8b5cf6'}]}>$</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={savingsGoal} 
                    onChangeText={setSavingsGoal} 
                    placeholder="0"
                    placeholderTextColor="#64748b"
                    autoFocus
                  />
                </View>
                <TouchableOpacity style={[styles.nextButton, {backgroundColor: '#8b5cf6'}]} onPress={calculateBudget}>
                  <Text style={styles.nextButtonText}>Analizar Presupuesto</Text>
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
  progressBar: { height: '100%', backgroundColor: '#38bdf8', borderRadius: 3 },
  stepBox: { alignItems: 'center', paddingHorizontal: 10 },
  stepTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginTop: 20, marginBottom: 10 },
  stepDesc: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 40, paddingHorizontal: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingHorizontal: 20, height: 70, width: '100%', marginBottom: 30, borderWidth: 1 },
  currencyPrefix: { fontSize: 24, fontWeight: 'bold', marginRight: 10 },
  input: { flex: 1, color: '#fff', fontSize: 28, fontWeight: 'bold' },
  nextButton: { width: '100%', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  timeCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 30, alignItems: 'center', marginBottom: 20, borderWidth: 1 },
  timeCardLabel: { color: '#f8fafc', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  timeCardValue: { fontSize: 40, fontWeight: '900', marginVertical: 10 },
  moneyCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 25, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  moneyTitle: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold', marginBottom: 25 },
  barItem: { marginBottom: 20 },
  barItemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  barLabel: { color: '#94a3b8', fontSize: 14 },
  barValue: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  barContainer: { height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  barFill: { height: '100%' },
  recommendationBox: { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: 20, padding: 25, alignItems: 'flex-start', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.2)' },
  recommendationTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 10 },
  recommendationText: { color: '#cbd5e1', fontSize: 14, lineHeight: 22 }
});
