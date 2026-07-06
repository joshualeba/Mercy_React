import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function DiagnosticScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [tips, setTips] = useState([]);

  const questions = [
    {
      id: 'savings',
      title: 'Hábitos de Ahorro',
      question: '¿Qué porcentaje de tus ingresos ahorras mensualmente?',
      options: [
        { label: 'Nada, apenas me alcanza', score: 0, tip: '💡 Ahorro: Empieza registrando tus gastos diarios. Descubrirás pequeños "gastos hormiga" que puedes eliminar para empezar a ahorrar al menos un 5%.' },
        { label: 'Menos del 10%', score: 5, tip: '💡 Ahorro: Estás empezando bien, pero lo ideal es acercarte al 20%. Automatiza tu ahorro separándolo apenas recibas tu sueldo.' },
        { label: 'Entre 10% y 20%', score: 10, tip: '💡 Ahorro: ¡Buen hábito! Mantén este porcentaje y asegúrate de que tu dinero esté en cuentas que generen rendimientos (como SOFIPOs o CETES).' },
        { label: 'Más del 20%', score: 15, tip: '💡 Ahorro: ¡Excelente! Tienes una gran capacidad de ahorro. Ahora enfócate en diversificar tus inversiones a largo plazo.' },
      ]
    },
    {
      id: 'debt',
      title: 'Nivel de Deuda',
      question: '¿Qué porcentaje de tus ingresos se va en pagar deudas?',
      options: [
        { label: 'Más del 50%', score: 0, tip: '🚨 Deuda: Estás en zona de alto riesgo. Detén el uso de tarjetas de crédito y usa el método "Avalancha" o "Bola de Nieve" para liquidar tus deudas.' },
        { label: 'Entre 30% y 50%', score: 5, tip: '⚠️ Deuda: Tu nivel de deuda es alto. No adquieras nuevos compromisos financieros hasta que reduzcas tus pagos por debajo del 30%.' },
        { label: 'Menos del 30%', score: 15, tip: '✅ Deuda: Tienes tus deudas bajo control. Asegúrate de ser totalero en tus tarjetas (pagar el saldo total) siempre.' },
        { label: 'No tengo deudas', score: 20, tip: '🌟 Deuda: ¡Perfecto! Mantenerte libre de deuda mala te da mucha libertad financiera.' },
      ]
    },
    {
      id: 'emergency',
      title: 'Fondo de Emergencia',
      question: '¿Cuántos meses podrías vivir con tus ahorros actuales?',
      options: [
        { label: 'Menos de 1 mes', score: 0, tip: '🚨 Fondo: Eres vulnerable ante imprevistos. Tu meta número uno a partir de hoy debe ser ahorrar al menos 1 mes de gastos fijos.' },
        { label: 'De 1 a 3 meses', score: 5, tip: '⚠️ Fondo: Tienes un colchón inicial. Sigue ahorrando hasta llegar a un mínimo de 3 a 6 meses de cobertura.' },
        { label: 'De 3 a 6 meses', score: 10, tip: '✅ Fondo: ¡Felicidades! Tienes el fondo ideal. Mantenlo en instrumentos líquidos que puedas retirar rápido pero que generen rendimiento (e.g. CETES 28 días, Cuenta Nu).' },
        { label: 'Más de 6 meses', score: 15, tip: '🌟 Fondo: Estás blindado. El excedente de tu fondo puedes empezar a invertirlo en plazos más largos para mayor rendimiento.' },
      ]
    }
  ];

  const handleSelect = (score, tip) => {
    setAnswers({ ...answers, [step]: score });
    setTips([...tips, tip]);
    if (step < questions.length) {
      setStep(step + 1);
    }
  };

  const getResults = () => {
    const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
    // Max score is 15 + 20 + 15 = 50. Let's map it to 100.
    const normalizedScore = (totalScore / 50) * 100;
    
    let status = '';
    let color = '';
    let recommendation = '';

    if (normalizedScore < 40) {
      status = 'Crítico';
      color = '#ef4444';
      recommendation = 'Necesitamos un plan de rescate. Tus finanzas están en una posición delicada y requieren acción inmediata.';
    } else if (normalizedScore < 70) {
      status = 'Estable';
      color = '#F59E0B';
      recommendation = 'Vas por buen camino, pero hay bastante margen de mejora. Ajustando un par de hábitos podrías lograr la libertad financiera.';
    } else {
      status = 'Excelente';
      color = '#10B981';
      recommendation = '¡Felicidades! Tienes unas finanzas sólidas. El siguiente paso lógico para ti es escalar tus inversiones y diversificarlas.';
    }

    return { score: normalizedScore, status, color, recommendation, finalTips: tips };
  };

  if (step >= questions.length) {
    const results = getResults();
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="close" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tu Diagnóstico 360°</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.resultCircleContainer}>
            <View style={[styles.resultCircle, { borderColor: results.color }]}>
              <Text style={[styles.resultScore, { color: results.color }]}>{results.score}</Text>
              <Text style={styles.resultMax}>/100</Text>
            </View>
          </View>
          
          <Text style={[styles.resultStatus, { color: results.color }]}>{results.status}</Text>
          
          <LinearGradient 
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']} 
            style={[styles.recommendationCard, {marginBottom: 20}]}
          >
            <View style={styles.recommendationHeader}>
              <MaterialCommunityIcons name="stethoscope" size={24} color="#3b82f6" />
              <Text style={styles.recommendationTitle}>Veredicto General</Text>
            </View>
            <Text style={styles.recommendationText}>{results.recommendation}</Text>
          </LinearGradient>

          <View style={{ marginBottom: 30 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
              Tus Tips Personalizados
            </Text>
            {results.finalTips.map((tip, idx) => (
              <View key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 12, marginBottom: 10 }}>
                <Text style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 22 }}>{tip}</Text>
              </View>
            ))}
          </View>
          
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => { setStep(0); setAnswers({}); setTips([]); }}
          >
            <Text style={styles.primaryButtonText}>Volver a evaluar</Text>
          </TouchableOpacity>
          
          <View style={{height: 40}}/>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentQ = questions[step];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          if (step > 0) {
            setStep(step - 1);
            setTips(tips.slice(0, -1));
          } else {
            navigation.goBack();
          }
        }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paso {step + 1} de {questions.length}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${((step) / questions.length) * 100}%` }]} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.questionCategory}>{currentQ.title}</Text>
        <Text style={styles.questionText}>{currentQ.question}</Text>
        
        <View style={styles.optionsContainer}>
          {currentQ.options.map((option, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.optionButton}
              onPress={() => handleSelect(option.score, option.tip)}
            >
              <Text style={styles.optionText}>{option.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  content: {
    padding: 24,
  },
  questionCategory: {
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 1,
  },
  questionText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 15,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  optionText: {
    color: '#f8fafc',
    fontSize: 16,
  },
  resultCircleContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  resultCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  resultScore: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  resultMax: {
    color: '#94a3b8',
    fontSize: 16,
  },
  resultStatus: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  recommendationCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 40,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  recommendationTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  recommendationText: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
