import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function InvestmentSimulatorScreen({ navigation }) {
  const [step, setStep] = useState(0); // 0: Initial, 1: Monthly, 2: Rate, 3: Term
  const [initialAmount, setInitialAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [rate, setRate] = useState('');
  const [years, setYears] = useState('');
  const [results, setResults] = useState(null);

  const calculateInvestment = () => {
    const P = parseFloat(initialAmount.replace(/,/g, '')) || 0;
    const PMT = parseFloat(monthlyContribution.replace(/,/g, '')) || 0;
    const rAnnual = parseFloat(rate) || 0;
    const t = parseInt(years) || 0;

    if (t <= 0) return;

    const rMonthly = (rAnnual / 100) / 12;
    const totalMonths = t * 12;

    let futureValue = P;
    let totalInvested = P;

    for (let i = 0; i < totalMonths; i++) {
      futureValue = (futureValue + PMT) * (1 + rMonthly);
      totalInvested += PMT;
    }

    if (rAnnual === 0) {
      futureValue = P + (PMT * totalMonths);
    }

    const totalInterest = futureValue - totalInvested;

    let percentInvested = 100;
    let percentInterest = 0;
    if (futureValue > 0) {
      percentInvested = (totalInvested / futureValue) * 100;
      percentInterest = (totalInterest / futureValue) * 100;
    }

    let recommendation = "";
    if (rAnnual < 5) {
      recommendation = "Tu tasa de rendimiento es conservadora. Es segura, pero podrías buscar instrumentos que, al menos, superen la inflación anual.";
    } else if (rAnnual >= 5 && rAnnual <= 12) {
      recommendation = "Utilizaste una tasa realista para instrumentos de renta fija como CETES o SOFIPOs. Es un excelente balance entre riesgo y seguridad.";
    } else {
      recommendation = "Una tasa superior al 12% sugiere renta variable (acciones, cripto). Recuerda que a mayor rendimiento posible, mayor es el riesgo de volatilidad.";
    }

    if (t >= 10) {
      recommendation += " Al invertir a largo plazo, el interés compuesto tiene un efecto multiplicador masivo.";
    }

    setResults({
      futureValue,
      totalInvested,
      totalInterest,
      percentInvested,
      percentInterest,
      recommendation
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
          <Text style={styles.headerTitle}>Tu futuro financiero</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <LinearGradient colors={['rgba(245, 158, 11, 0.1)', 'rgba(245, 158, 11, 0.02)']} style={styles.timeCard}>
            <MaterialCommunityIcons name="rocket-launch" size={32} color="#F59E0B" />
            <Text style={styles.timeCardLabel}>Monto Final Estimado</Text>
            <Text style={[styles.timeCardValue, {color: '#F59E0B'}]}>{formatCurrency(results.futureValue)}</Text>
            <Text style={styles.timeCardDesc}>Gracias al interés compuesto</Text>
          </LinearGradient>

          <View style={styles.moneyCard}>
            <Text style={styles.moneyTitle}>Composición de tu dinero</Text>
            
            <View style={styles.barContainer}>
              <View style={[styles.barFill, {width: `${results.percentInvested}%`, backgroundColor: '#3b82f6'}]} />
              <View style={[styles.barFill, {width: `${results.percentInterest}%`, backgroundColor: '#10B981'}]} />
            </View>

            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: '#3b82f6'}]} />
                <View>
                  <Text style={styles.legendLabel}>Tus aportaciones</Text>
                  <Text style={styles.legendValue}>{formatCurrency(results.totalInvested)}</Text>
                </View>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: '#10B981'}]} />
                <View>
                  <Text style={styles.legendLabel}>Intereses ganados</Text>
                  <Text style={[styles.legendValue, {color: '#10B981'}]}>+{formatCurrency(results.totalInterest)}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.recommendationBox}>
            <MaterialCommunityIcons name="brain" size={24} color="#8b5cf6" />
            <Text style={[styles.recommendationTitle, {color: '#8b5cf6'}]}>Análisis Inteligente</Text>
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
        <Text style={styles.headerTitle}>Simulador de Inversión</Text>
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
                <MaterialCommunityIcons name="cash-stack" size={32} color="#10B981" />
                <Text style={styles.stepTitle}>¿Con cuánto dinero iniciarás?</Text>
                <Text style={styles.stepDesc}>Tu capital semilla para comenzar a invertir.</Text>
                
                <View style={[styles.inputContainer, {borderColor: 'rgba(16, 185, 129, 0.3)'}]}>
                  <Text style={[styles.currencyPrefix, {color: '#10B981'}]}>$</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={initialAmount} 
                    onChangeText={setInitialAmount} 
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
                <MaterialCommunityIcons name="piggy-bank" size={32} color="#3b82f6" />
                <Text style={styles.stepTitle}>¿Cuánto aportarás cada mes?</Text>
                <Text style={styles.stepDesc}>La constancia es clave. (Opcional, puedes dejarlo en 0).</Text>
                
                <View style={[styles.inputContainer, {borderColor: 'rgba(59, 130, 246, 0.3)'}]}>
                  <Text style={[styles.currencyPrefix, {color: '#3b82f6'}]}>$</Text>
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
                <TouchableOpacity style={[styles.nextButton, {backgroundColor: '#3b82f6'}]} onPress={() => setStep(2)}>
                  <Text style={styles.nextButtonText}>Siguiente</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepBox}>
                <MaterialCommunityIcons name="chart-line-variant" size={32} color="#F59E0B" />
                <Text style={styles.stepTitle}>¿Qué rendimiento anual esperas?</Text>
                <Text style={styles.stepDesc}>CETES ~10%, SOFIPOs ~12%, Bolsa ~8-15% (variable).</Text>
                
                <View style={[styles.inputContainer, {borderColor: 'rgba(245, 158, 11, 0.3)'}]}>
                  <TextInput 
                    style={[styles.input, {textAlign: 'center'}]} 
                    keyboardType="numeric" 
                    value={rate} 
                    onChangeText={setRate} 
                    placeholder="10"
                    placeholderTextColor="#64748b"
                    autoFocus
                  />
                  <Text style={[styles.suffix, {color: '#F59E0B'}]}>%</Text>
                </View>
                <TouchableOpacity style={[styles.nextButton, {backgroundColor: '#F59E0B'}]} onPress={() => setStep(3)}>
                  <Text style={styles.nextButtonText}>Siguiente</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 3 && (
              <View style={styles.stepBox}>
                <MaterialCommunityIcons name="calendar-clock" size={32} color="#8b5cf6" />
                <Text style={styles.stepTitle}>¿Por cuántos años invertirás?</Text>
                <Text style={styles.stepDesc}>El tiempo es el mejor amigo del interés compuesto.</Text>
                
                <View style={[styles.inputContainer, {borderColor: 'rgba(139, 92, 246, 0.3)'}]}>
                  <TextInput 
                    style={[styles.input, {textAlign: 'center'}]} 
                    keyboardType="numeric" 
                    value={years} 
                    onChangeText={setYears} 
                    placeholder="5"
                    placeholderTextColor="#64748b"
                    autoFocus
                  />
                  <Text style={[styles.suffix, {color: '#8b5cf6'}]}>Años</Text>
                </View>
                <TouchableOpacity style={[styles.nextButton, {backgroundColor: '#8b5cf6'}]} onPress={calculateInvestment}>
                  <Text style={styles.nextButtonText}>Proyectar Inversión</Text>
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
  progressBar: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 3 },
  stepBox: { alignItems: 'center', paddingHorizontal: 10 },
  stepTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginTop: 20, marginBottom: 10 },
  stepDesc: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 40, paddingHorizontal: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingHorizontal: 20, height: 70, width: '100%', marginBottom: 30, borderWidth: 1 },
  currencyPrefix: { fontSize: 24, fontWeight: 'bold', marginRight: 10 },
  suffix: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  input: { flex: 1, color: '#fff', fontSize: 28, fontWeight: 'bold' },
  nextButton: { width: '100%', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  timeCard: { borderRadius: 20, padding: 30, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' },
  timeCardLabel: { color: '#f8fafc', fontSize: 16, fontWeight: 'bold', marginTop: 15 },
  timeCardValue: { fontSize: 40, fontWeight: '900', marginVertical: 10 },
  timeCardDesc: { color: '#94a3b8', fontSize: 14 },
  moneyCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 25, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  moneyTitle: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold', marginBottom: 25 },
  barContainer: { height: 12, borderRadius: 6, flexDirection: 'row', overflow: 'hidden', marginBottom: 25 },
  barFill: { height: '100%' },
  legendContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  legendItem: { flexDirection: 'row', alignItems: 'center', width: '48%' },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  legendLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 2 },
  legendValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  recommendationBox: { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: 20, padding: 25, alignItems: 'flex-start', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' },
  recommendationTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 10 },
  recommendationText: { color: '#cbd5e1', fontSize: 14, lineHeight: 22 }
});
