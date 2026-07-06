import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const QUESTIONS = [
  {
    id: 1,
    question: '¿Qué es el Interés Compuesto?',
    options: [
      { text: 'Un interés que solo se calcula una vez al año.', correct: false },
      { text: 'Ganar intereses sobre tus intereses anteriores.', correct: true },
      { text: 'El porcentaje que te cobra el banco por usar cajeros.', correct: false },
      { text: 'Una tasa que se mantiene siempre igual sin importar el tiempo.', correct: false }
    ]
  },
  {
    id: 2,
    question: '¿Qué significa que una SOFIPO tenga NICAP 1?',
    options: [
      { text: 'Que es la número 1 en el ranking de mejores tasas.', correct: false },
      { text: 'Que solo permite 1 inversión por persona.', correct: false },
      { text: 'Que tiene el capital suficiente para operar de forma segura.', correct: true },
      { text: 'Que está al borde de la bancarrota.', correct: false }
    ]
  },
  {
    id: 3,
    question: '¿Para qué sirve el Fondo de Emergencia?',
    options: [
      { text: 'Para irse de vacaciones el fin de semana.', correct: false },
      { text: 'Para cubrir gastos imprevistos de 3 a 6 meses de tu costo de vida.', correct: true },
      { text: 'Para invertirlo todo en criptomonedas y multiplicarlo rápido.', correct: false },
      { text: 'Para prestarle a familiares.', correct: false }
    ]
  },
  {
    id: 4,
    question: '¿Qué es el GAT Real?',
    options: [
      { text: 'El rendimiento total de una inversión antes de impuestos.', correct: false },
      { text: 'El interés que el banco publica en sus anuncios.', correct: false },
      { text: 'El monto que pagas por usar una tarjeta de crédito.', correct: false },
      { text: 'El rendimiento real de tu inversión descontando la inflación.', correct: true }
    ]
  },
  {
    id: 5,
    question: '¿Qué significa ser "Totalero" en una tarjeta de crédito?',
    options: [
      { text: 'Pagar únicamente el Pago Mínimo cada mes.', correct: false },
      { text: 'Llegar siempre al límite total de la tarjeta.', correct: false },
      { text: 'Pagar el saldo total para no generar intereses antes de la fecha límite.', correct: true },
      { text: 'Tener absolutamente todas las tarjetas de crédito del mercado.', correct: false }
    ]
  },
  {
    id: 6,
    question: '¿Cuál es el orden recomendado (Bola de Nieve) para pagar deudas?',
    options: [
      { text: 'De la tasa de interés más alta a la más baja.', correct: false },
      { text: 'Pagar primero la deuda con el saldo más pequeño para ganar motivación.', correct: true },
      { text: 'Pagar todas exactamente con el mismo monto.', correct: false },
      { text: 'No pagarlas hasta que el banco ofrezca una quita.', correct: false }
    ]
  },
  {
    id: 7,
    question: '¿Qué instrumento se considera el más seguro para invertir en México?',
    options: [
      { text: 'Criptomonedas de nueva creación.', correct: false },
      { text: 'CETES (Certificados de la Tesorería), respaldados por el gobierno.', correct: true },
      { text: 'SOFIPOs con NICAP 4.', correct: false },
      { text: 'Tandas organizadas con vecinos.', correct: false }
    ]
  }
];

export default function KnowledgeTestScreen({ navigation }) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleAnswer = (isCorrect, index) => {
    if (isAnswered) return;
    
    setSelectedOption(index);
    setIsAnswered(true);

    if (isCorrect) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentQuestionIdx < QUESTIONS.length - 1) {
        setCurrentQuestionIdx(currentQuestionIdx + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        setShowResults(true);
      }
    }, 1500);
  };

  const restartQuiz = () => {
    setCurrentQuestionIdx(0);
    setScore(0);
    setShowResults(false);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  if (showResults) {
    const percentage = (score / QUESTIONS.length) * 100;
    let message = '';
    let icon = '';
    
    if (percentage === 100) {
      message = '¡Impecable! Tienes nivel experto en finanzas personales.';
      icon = 'trophy-award';
    } else if (percentage >= 50) {
      message = '¡Buen intento! Estás en camino de dominar tus finanzas.';
      icon = 'star-shooting';
    } else {
      message = 'No te desanimes. Usa nuestro Diccionario A-Z y vuelve a intentarlo.';
      icon = 'book-education-outline';
    }

    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="close" size={24} color="#f8fafc" />
          </TouchableOpacity>
        </View>

        <View style={styles.resultsContainer}>
          <MaterialCommunityIcons name={icon} size={80} color="#F59E0B" style={styles.resultIcon} />
          <Text style={styles.resultTitle}>Resultados del Desafío</Text>
          
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreText}>{score}</Text>
            <Text style={styles.scoreDivider}>/</Text>
            <Text style={styles.scoreTotalText}>{QUESTIONS.length}</Text>
          </View>
          
          <Text style={styles.resultMessage}>{message}</Text>
          
          <TouchableOpacity style={styles.primaryButton} onPress={restartQuiz}>
            <Text style={styles.primaryButtonText}>Volver a jugar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3b82f6', marginTop: 15 }]} 
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.primaryButtonText, { color: '#3b82f6' }]}>Volver al Menú</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQ = QUESTIONS[currentQuestionIdx];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Desafío de Conocimientos</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressHeader}>
        <Text style={styles.progressText}>Pregunta {currentQuestionIdx + 1} de {QUESTIONS.length}</Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${((currentQuestionIdx + 1) / QUESTIONS.length) * 100}%` }]} />
        </View>
      </View>

      {/* Question */}
      <ScrollView style={styles.content}>
        <Text style={styles.questionText}>{currentQ.question}</Text>
        
        <View style={styles.optionsContainer}>
          {currentQ.options.map((option, idx) => {
            
            let backgroundColor = 'rgba(255,255,255,0.03)';
            let borderColor = 'rgba(255,255,255,0.08)';
            let icon = null;

            if (isAnswered) {
              if (idx === selectedOption) {
                if (option.correct) {
                  backgroundColor = 'rgba(16, 185, 129, 0.2)';
                  borderColor = '#10B981';
                  icon = 'check-circle';
                } else {
                  backgroundColor = 'rgba(239, 68, 68, 0.2)';
                  borderColor = '#ef4444';
                  icon = 'close-circle';
                }
              } else if (option.correct) {
                // Highlight the correct one if they missed it
                backgroundColor = 'rgba(16, 185, 129, 0.1)';
                borderColor = 'rgba(16, 185, 129, 0.5)';
                icon = 'check-circle-outline';
              }
            }

            return (
              <TouchableOpacity 
                key={idx} 
                style={[styles.optionButton, { backgroundColor, borderColor }]}
                onPress={() => handleAnswer(option.correct, idx)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionText}>{option.text}</Text>
                {icon && <MaterialCommunityIcons name={icon} size={22} color={borderColor} />}
              </TouchableOpacity>
            )
          })}
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
  progressHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressText: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F59E0B', // gold for challenge
    borderRadius: 3,
  },
  content: {
    paddingHorizontal: 20,
  },
  questionText: {
    color: '#fff',
    fontSize: 22,
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
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionText: {
    color: '#f8fafc',
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
    paddingRight: 10,
  },
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  resultIcon: {
    marginBottom: 20,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 40,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  scoreText: {
    color: '#F59E0B',
    fontSize: 48,
    fontWeight: '900',
  },
  scoreDivider: {
    color: '#64748b',
    fontSize: 24,
    marginHorizontal: 5,
  },
  scoreTotalText: {
    color: '#94a3b8',
    fontSize: 24,
    fontWeight: 'bold',
  },
  resultMessage: {
    color: '#cbd5e1',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
