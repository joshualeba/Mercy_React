import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Animated, Dimensions } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useCustomAlert } from '../context/AlertContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; 

const { width } = Dimensions.get('window');

export default function TestConocimientosScreen({ navigation }) {
  const { colors, isDarkMode } = useContext(ThemeContext);
  const { showAlert } = useCustomAlert();

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 15, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, color: colors.text, flex: 1 },
    timerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBackground, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
    timerText: { fontSize: 14, fontWeight: 'bold', color: colors.primary, marginLeft: 5 },
    scoreBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '20', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 15, marginRight: 10 },
    scoreBadgeText: { fontSize: 14, fontWeight: 'bold', color: colors.primary, marginLeft: 4 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 20, paddingBottom: 40 },
    instructions: { fontSize: 15, color: colors.textMuted, marginBottom: 20, textAlign: 'center' },
    questionCard: { backgroundColor: colors.card, padding: 25, borderRadius: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
    questionCount: { fontSize: 13, color: colors.primary, fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
    questionText: { fontSize: 19, fontWeight: 'bold', color: colors.text, marginBottom: 25, lineHeight: 28 },
    optionBtn: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, marginBottom: 12, backgroundColor: colors.inputBackground },
    optionSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, marginRight: 15 },
    radioSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
    optionText: { fontSize: 16, color: colors.text, flex: 1 },
    optionTextSelected: { color: colors.primary, fontWeight: 'bold' },
    btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    submitBtn: { flex: 1, backgroundColor: colors.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginLeft: 5, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    backBtn: { flex: 1, backgroundColor: colors.inputBackground, padding: 18, borderRadius: 15, alignItems: 'center', marginRight: 5, borderWidth: 1, borderColor: colors.border },
    backBtnText: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
    
    // Result & Podium Styles
    resultCard: { backgroundColor: colors.card, padding: 30, borderRadius: 25, marginBottom: 30, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15, elevation: 6 },
    resultTitle: { fontSize: 24, fontWeight: '900', color: colors.text, marginBottom: 10, marginTop: 10 },
    scoreText: { fontSize: 48, fontWeight: '900', color: colors.primary, marginVertical: 5 },
    timeTaken: { fontSize: 15, color: colors.textMuted, marginBottom: 15, textAlign: 'center', paddingHorizontal: 20 },
    rankingTitle: { fontSize: 22, fontWeight: '900', color: colors.text, marginTop: 15, marginBottom: 35, textAlign: 'center', letterSpacing: 0.5 },
    
    // New Premium Podium
    podiumContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', height: 220, marginBottom: 40, paddingHorizontal: 5 },
    podiumPlace: { alignItems: 'center', marginHorizontal: 8, justifyContent: 'flex-end' },
    podiumBlock: { 
        width: 95, 
        borderTopLeftRadius: 20, 
        borderTopRightRadius: 20, 
        alignItems: 'center', 
        paddingTop: 35,
        shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 
    },
    podiumPlaceNumber: { fontSize: 60, fontWeight: '900', position: 'absolute', bottom: -10, opacity: 0.2 },
    avatarContainer: { position: 'absolute', top: -35, zIndex: 10, backgroundColor: colors.card, borderRadius: 35, padding: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
    podiumName: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginTop: 12, textAlign: 'center', width: 90, zIndex: 5 },
    podiumScore: { fontSize: 13, color: colors.primary, fontWeight: '900', zIndex: 5, marginTop: 4 },
    medalIcon: { position: 'absolute', top: -15, right: -10, zIndex: 20 },
    
    // Rank List
    rankCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 18, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
    rankBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.inputBackground, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    rankText: { fontWeight: 'bold', color: colors.textMuted, fontSize: 14 },
    rankName: { fontSize: 16, fontWeight: 'bold', color: colors.text, flex: 1 },
    rankScore: { fontSize: 16, fontWeight: '900', color: colors.primary },
    rankTime: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
    
    // Floating Score Animation
    floatingScore: { position: 'absolute', top: 50, alignSelf: 'center', zIndex: 100 },
    floatingScoreText: { fontSize: 32, fontWeight: '900', color: '#4CAF50', textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 4 }
  });

  const { userToken } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState(null);
  
  // Quiz state
  const [respuestas, setRespuestas] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liveScore, setLiveScore] = useState(0);
  const questionStartTime = useRef(Date.now());
  
  // Animations
  const [fadeAnim] = useState(new Animated.Value(1));
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const [floatingValue, setFloatingValue] = useState(null);
  
  // Timer state
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);
  
  // Ranking state
  const [rankingData, setRankingData] = useState([]);

  useEffect(() => {
    fetchTest();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchTest = async () => {
    try {
      const response = await axios.get('http://192.168.1.7:8000/api/preguntas_test', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setTestData(response.data);
      if (response.data.test_completado) {
        fetchRanking();
      } else {
        startTimer();
        questionStartTime.current = Date.now();
      }
    } catch (e) {
      console.log('Error fetching test', e);
      showAlert('Error', 'No se pudieron cargar las preguntas.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRanking = async () => {
    try {
      const response = await axios.get('http://192.168.1.7:8000/api/ranking_test', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (response.data.success) {
        setRankingData(response.data.ranking);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelect = (preguntaId, opcionId, esCorrecta) => {
    const timeTakenMs = Date.now() - questionStartTime.current;
    let finalTime = timeTakenMs;
    if (respuestas[preguntaId] && respuestas[preguntaId].tiempo_ms) {
        finalTime = respuestas[preguntaId].tiempo_ms; 
    }
    setRespuestas({ ...respuestas, [preguntaId]: { opcionId, esCorrecta, tiempo_ms: finalTime } });
  };
  
  const proceedToNext = () => {
      let totalSimulated = 0;
      Object.values(respuestas).forEach(r => { 
          if(r.esCorrecta) {
              let t = r.tiempo_ms / 1000.0;
              let pts = 1000 - (t * 30) - (Math.pow(t, 2) * 40);
              totalSimulated += Math.max(600, Math.round(pts));
          } 
      });
      setLiveScore(totalSimulated);
      
      Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true
      }).start(() => {
          setCurrentIndex(currentIndex + 1);
          questionStartTime.current = Date.now();
          Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true
          }).start();
      });
  };

  const handleNext = () => {
    if (!testData || !testData.preguntas) return;
    const currentQ = testData.preguntas[currentIndex];
    const respuestaData = respuestas[currentQ.id];
    
    if (!respuestaData) {
        showAlert('Atención', 'Selecciona una respuesta para continuar.');
        return;
    }
    
    if (respuestaData.esCorrecta) {
        let t = respuestaData.tiempo_ms / 1000.0;
        let pts = Math.max(600, Math.round(1000 - (t * 30) - (Math.pow(t, 2) * 40)));
        setFloatingValue(`+${pts}`);
        floatingAnim.setValue(0);
        
        Animated.parallel([
            Animated.timing(floatingAnim, {
                toValue: 1,
                duration: 900,
                useNativeDriver: true
            })
        ]).start(() => {
            setFloatingValue(null);
        });
        
        // Don't wait for animation to finish to proceed, wait just 300ms so it feels responsive
        setTimeout(() => {
            proceedToNext();
        }, 300);
    } else {
        // Incorrect answer, no animation
        proceedToNext();
    }
  };

  const submitTest = async () => {
    const currentQ = testData.preguntas[currentIndex];
    const respuestaData = respuestas[currentQ.id];
    
    if (!respuestaData) {
        showAlert('Atención', 'Selecciona una respuesta para enviar tu evaluación.');
        return;
    }

    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    
    try {
      const finalRespuestas = {};
      Object.keys(respuestas).forEach(k => { 
          finalRespuestas[k] = {
              opcionId: respuestas[k].opcionId,
              tiempo_ms: respuestas[k].tiempo_ms
          }; 
      });
      
      const payload = {
        respuestas: finalRespuestas,
        tiempo_segundos: timer
      };
      
      const response = await axios.post('http://192.168.1.7:8000/api/submit_test', payload, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (response.data.success) {
        let finalLive = 0;
        Object.values(respuestas).forEach(r => { 
            if(r.esCorrecta) {
                let t = r.tiempo_ms / 1000.0;
                let pts = 1000 - (t * 30) - (Math.pow(t, 2) * 40);
                finalLive += Math.max(600, Math.round(pts));
            } 
        });
        setLiveScore(finalLive);
        
        setTestData({
          test_completado: true,
          score: response.data.score,
          correctas: response.data.correctas,
          total: response.data.total
        });
        fetchRanking();
      } else {
        showAlert('Aviso', response.data.message);
      }
    } catch (e) {
      showAlert('Error', 'No se pudo calificar el test.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderPodium = () => {
    if (!rankingData || rankingData.length === 0) return null;
    
    const top3 = [rankingData[1] || null, rankingData[0] || null, rankingData[2] || null];
    const heights = [130, 170, 100]; 
    const colorsArr = ['#E0E0E0', '#FFD700', '#CD7F32']; // Silver, Gold, Bronze
    const textColors = ['#757575', '#B8860B', '#8B4513'];
    const places = ['2', '1', '3'];

    return (
        <View style={styles.podiumContainer}>
            {top3.map((user, i) => {
                const color = colorsArr[i];
                return (
                    <View key={i} style={styles.podiumPlace}>
                        {user ? (
                            <>
                                <View style={styles.avatarContainer}>
                                    <Ionicons name="person-circle" size={54} color={color} />
                                    {i === 1 && <MaterialCommunityIcons name="crown" size={24} color="#FFD700" style={styles.medalIcon} />}
                                </View>
                                <View style={[styles.podiumBlock, { height: heights[i], backgroundColor: colors.card, borderColor: color, borderWidth: 2, borderBottomWidth: 0 }]}>
                                    <Text style={[styles.podiumPlaceNumber, { color: color }]}>{places[i]}</Text>
                                    <Text style={styles.podiumName} numberOfLines={1}>{user.usuario}</Text>
                                    <Text style={styles.podiumScore}>{user.puntuacion_total} pts</Text>
                                </View>
                            </>
                        ) : (
                            <View style={{ width: 95 }} />
                        )}
                    </View>
                );
            })}
        </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Test</Text>
        {!testData?.test_completado && !loading && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.scoreBadge}>
                <Ionicons name="star" size={14} color={colors.primary} />
                <Text style={styles.scoreBadgeText}>{liveScore} pts</Text>
            </View>
            <View style={styles.timerContainer}>
                <Ionicons name="timer-outline" size={16} color={colors.primary} />
                <Text style={styles.timerText}>{formatTime(timer)}</Text>
            </View>
          </View>
        )}
      </View>

      {floatingValue && (
          <Animated.View style={[
              styles.floatingScore, 
              {
                  opacity: floatingAnim.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] }),
                  transform: [
                      { translateY: floatingAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -100] }) },
                      { scale: floatingAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.5, 1.2, 1] }) }
                  ]
              }
          ]}>
              <Text style={styles.floatingScoreText}>{floatingValue}</Text>
          </Animated.View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {testData?.test_completado ? (
            <View>
              <View style={styles.resultCard}>
                <MaterialCommunityIcons name="check-decagram" size={65} color={colors.primary} style={{marginBottom: 5}} />
                <Text style={styles.resultTitle}>Tu Resultado</Text>
                <Text style={styles.scoreText}>{testData.score}</Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.textMuted, marginBottom: 15 }}>Puntos Totales</Text>
                <Text style={styles.timeTaken}>Acertaste {testData.correctas} de {testData.total} preguntas en {formatTime(rankingData.find(u => u.es_actual)?.tiempo || 0)}.</Text>
              </View>
              
              <Text style={styles.rankingTitle}>🏆 Ranking Global 🏆</Text>
              
              {renderPodium()}

              {rankingData.slice(3).map((user, index) => (
                <View key={index + 3} style={[styles.rankCard, user.es_actual && { borderColor: colors.primary, borderWidth: 1.5, backgroundColor: colors.primary + '10' }]}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{index + 4}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rankName}>{user.usuario} {user.es_actual ? '(Tú)' : ''}</Text>
                    <Text style={styles.rankTime}>Tiempo: {formatTime(user.tiempo)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.rankScore}>{user.puntuacion_total}</Text>
                    <Text style={{fontSize: 12, color: colors.textMuted}}>pts</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Animated.View style={{ opacity: fadeAnim }}>
              {testData?.preguntas && testData.preguntas.length > 0 && (
                <View>
                  <View style={styles.questionCard}>
                    <Text style={styles.questionCount}>Pregunta {currentIndex + 1} de {testData.preguntas.length}</Text>
                    <Text style={styles.questionText}>{testData.preguntas[currentIndex].pregunta}</Text>
                    
                    {testData.preguntas[currentIndex].opciones.map(opcion => {
                      const isSelected = respuestas[testData.preguntas[currentIndex].id]?.opcionId === opcion.id;
                      return (
                        <TouchableOpacity 
                          key={opcion.id} 
                          style={[styles.optionBtn, isSelected && styles.optionSelected]}
                          onPress={() => handleSelect(testData.preguntas[currentIndex].id, opcion.id, opcion.es_correcta)}
                        >
                          <View style={[styles.radio, isSelected && styles.radioSelected]} />
                          <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{opcion.texto_opcion}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.btnRow}>
                    {currentIndex > 0 && (
                        <TouchableOpacity 
                            style={styles.backBtn} 
                            onPress={() => {
                                Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
                                    setCurrentIndex(currentIndex - 1);
                                    questionStartTime.current = Date.now();
                                    Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
                                });
                            }}
                        >
                            <Text style={styles.backBtnText}>Atrás</Text>
                        </TouchableOpacity>
                    )}
                    
                    {currentIndex < testData.preguntas.length - 1 ? (
                        <TouchableOpacity style={styles.submitBtn} onPress={handleNext}>
                            <Text style={styles.submitBtnText}>Siguiente</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
                            onPress={submitTest}
                            disabled={submitting}
                        >
                            <Text style={styles.submitBtnText}>{submitting ? 'Enviando...' : 'Finalizar'}</Text>
                        </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </Animated.View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
