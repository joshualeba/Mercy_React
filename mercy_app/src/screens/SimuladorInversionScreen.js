import React, { useState, useContext, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, Image, Modal } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useCustomAlert } from '../context/AlertContext';
import { Ionicons } from '@expo/vector-icons'; 

const { width } = Dimensions.get('window');

export default function SimuladorInversionScreen({ navigation }) {
  const { colors, isDarkMode } = useContext(ThemeContext);
  const { showAlert } = useCustomAlert();
  const { userToken } = useContext(AuthContext);

  const [step, setStep] = useState(1);
  const [montoInicial, setMontoInicial] = useState('');
  const [aporte, setAporte] = useState('');
  const [anos, setAnos] = useState('');
  const [tasa, setTasa] = useState('');
  const [resultado, setResultado] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalInfo, setModalInfo] = useState({ title: '', desc: '' });

  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateNext = () => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -width, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: width, duration: 0, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start();
  };

  const animateBack = () => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: width, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -width, duration: 0, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start();
  };

  const handleNext = () => {
    if (step === 1 && !montoInicial) return showAlert('Atención', 'Ingresa el monto inicial.');
    if (step === 2 && !aporte) return showAlert('Atención', 'Ingresa el aporte mensual.');
    if (step === 3 && !anos) return showAlert('Atención', 'Ingresa los años de inversión.');
    if (step === 4 && !tasa) return showAlert('Atención', 'Ingresa la tasa anual.');
    
    if (step < 4) {
      animateNext();
      setTimeout(() => setStep(step + 1), 100);
    } else {
      calcular();
    }
  };

  const handleBack = () => {
    if (step > 1 && step <= 4) {
      animateBack();
      setTimeout(() => setStep(step - 1), 100);
    } else if (step === 4 + 1) {
      setResultado(null);
      setStep(4);
    } else {
      navigation.goBack();
    }
  };

  const calcular = async () => {
    setIsCalculating(true);
    try {
      const response = await axios.post('https://mercyreact.duckdns.org/api/simulador/inversion', {
        monto_inicial: parseFloat(montoInicial),
        aporte_mensual: parseFloat(aporte),
        anos: parseInt(anos),
        tasa_anual: parseFloat(tasa)
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setResultado(response.data);
      animateNext();
      setTimeout(() => setStep(4 + 1), 100);
    } catch (e) {
      showAlert('Error', 'Hubo un problema al conectar con el servidor.');
      console.log(e);
    } finally {
      setIsCalculating(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 15, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, color: colors.text },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    card: { backgroundColor: colors.card, padding: 30, borderRadius: 20, shadowColor: colors.primary, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, borderWidth: 1, borderColor: colors.border },
    stepText: { fontSize: 14, color: colors.primary, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    questionText: { fontSize: 24, color: colors.text, fontWeight: '800', marginBottom: 20, lineHeight: 32 },
    input: { backgroundColor: colors.inputBackground, height: 60, borderRadius: 12, paddingHorizontal: 20, fontSize: 20, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: 30 },
    btnRow: { flexDirection: 'row', justifyContent: 'space-between' },
    btnBack: { backgroundColor: colors.inputBackground, paddingVertical: 15, paddingHorizontal: 25, borderRadius: 12 },
    btnNext: { backgroundColor: colors.primary, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 },
    btnTextBack: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
    btnTextNext: { color: colors.card, fontSize: 16, fontWeight: 'bold' },
    
    // Result Styles
    resultContainer: { backgroundColor: colors.background, flex: 1, padding: 20 },
    resultHeader: { backgroundColor: colors.card, padding: 25, borderRadius: 20, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    resultTitle: { fontSize: 16, color: colors.textMuted, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 10 },
    resultAmount: { fontSize: 38, fontWeight: '900', color: colors.primary, marginBottom: 5 },
    resultSubtitle: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
    resultStatusText: { fontSize: 18, fontWeight: 'bold', marginTop: 15, textAlign: 'center' },
    aiText: { fontSize: 15, color: colors.text, lineHeight: 24, fontStyle: 'italic', fontWeight: '500' },
    resetBtn: { marginTop: 30, backgroundColor: colors.inputBackground, padding: 18, borderRadius: 15, alignItems: 'center' },
    resetBtnText: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
    
    // Modal & Summary Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: colors.card, padding: 30, borderRadius: 25, width: '100%', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 15, elevation: 8, borderWidth: 1, borderColor: colors.border },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: colors.primary, marginBottom: 15 },
    modalText: { fontSize: 16, color: colors.text, lineHeight: 26, marginBottom: 25 },
    modalBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 15, alignItems: 'center' },
    modalBtnText: { color: colors.card, fontSize: 16, fontWeight: 'bold' },
    summaryCard: { backgroundColor: colors.inputBackground, padding: 20, borderRadius: 18, marginBottom: 25, borderWidth: 1, borderColor: colors.border },
    summaryTitle: { color: colors.textMuted, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    summaryLabel: { color: colors.text, fontSize: 15 },
    summaryValue: { color: colors.text, fontSize: 15, fontWeight: 'bold' }
  });

  const renderStep = () => {
    let question = "";
    let placeholder = "";
    let value = "";
    let setValue = null;
    let infoDesc = "";

    switch(step) {
      case 1: question = "¿Con cuánto iniciarás tu inversión?"; placeholder = "Ej. 10000"; value = montoInicial; setValue = setMontoInicial; infoDesc = "El capital o monto inicial es el dinero con el que abres tu cuenta de inversión desde el día uno."; break;
      case 2: question = "¿Cuánto aportarás mensualmente?"; placeholder = "Ej. 1000"; value = aporte; setValue = setAporte; infoDesc = "Es la cantidad de dinero nuevo que estarás ingresando cada mes al portafolio de inversión. Esto acelera drásticamente el interés compuesto."; break;
      case 3: question = "¿Por cuántos años invertirás?"; placeholder = "Ej. 5"; value = anos; setValue = setAnos; infoDesc = "El horizonte de inversión en años. Recuerda que la verdadera magia del interés compuesto se ve después de 5 a 10 años."; break;
      case 4: question = "¿Qué tasa anual (%) estimas?"; placeholder = "Ej. 10"; value = tasa; setValue = setTasa; infoDesc = "El rendimiento histórico promedio anual. Por ejemplo, el S&P 500 históricamente da alrededor del 10% anual, mientras que CETES ronda el 11%."; break;
    }

    return (
      <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
        <View style={styles.card}>
          <Text style={styles.stepText}>Paso {step} de 4</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <Text style={[styles.questionText, { flex: 1, marginBottom: 0 }]}>{question}</Text>
            <TouchableOpacity onPress={() => { setModalInfo({ title: question, desc: infoDesc }); setModalVisible(true); }} style={{ marginLeft: 15, padding: 5 }}>
              <Ionicons name="information-circle-outline" size={28} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <TextInput 
            style={styles.input} 
            keyboardType="numeric" 
            value={value} 
            onChangeText={setValue} 
            placeholder={placeholder}
            placeholderTextColor={colors.placeholder}
            autoFocus={true}
          />
          <View style={styles.btnRow}>
             <TouchableOpacity style={styles.btnBack} onPress={handleBack}>
               <Text style={styles.btnTextBack}>Atrás</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.btnNext} onPress={handleNext} disabled={isCalculating}>
               <Text style={styles.btnTextNext}>{isCalculating ? 'Evaluando...' : (step === 4 ? 'Proyectar' : 'Siguiente')}</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderResult = () => {
    if (!resultado) return null;

    return (
      <Animated.View style={[styles.resultContainer, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.summaryCard}>
           <Text style={styles.summaryTitle}>Tu Simulación</Text>
           <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Monto Inicial:</Text><Text style={styles.summaryValue}>${montoInicial}</Text></View>
           <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Aporte Mensual:</Text><Text style={styles.summaryValue}>${aporte}</Text></View>
           <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Plazo:</Text><Text style={styles.summaryValue}>{anos} años</Text></View>
           <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Tasa Anual:</Text><Text style={styles.summaryValue}>{tasa}%</Text></View>
        </View>

        <View style={styles.resultHeader}>
           <Text style={styles.resultTitle}>Valor Final Estimado</Text>
           <Text style={styles.resultAmount}>${resultado.saldo_final?.toLocaleString()}</Text>
           <Text style={styles.resultSubtitle}>Capital Inicial: ${resultado.monto_inicial?.toLocaleString()}</Text>

        </View>

        <View style={{ marginTop: 5 }}>
           <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 }}>
              <Image source={require('../../assets/merx_bot.png')} style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: colors.primary, marginRight: 15 }} />
              <View style={{ backgroundColor: colors.card, padding: 10, paddingHorizontal: 15, borderRadius: 20, borderBottomLeftRadius: 0, borderWidth: 1, borderColor: colors.border, shadowColor: colors.primary, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, marginBottom: 5 }}>
                 <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Merx Bot</Text>
              </View>
           </View>
           
           <View style={{ backgroundColor: colors.card, padding: 25, borderRadius: 20, borderTopLeftRadius: 0, borderWidth: 1, borderColor: colors.border, shadowColor: colors.primary, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, marginLeft: 20 }}>
             {!resultado.mensaje_ia ? (
               <Text style={styles.aiText}>Analizando variables...</Text>
             ) : (
               resultado.mensaje_ia.split('\n').map((line, i) => {
                 if (!line.trim()) return null;
                 return (
                   <View key={i} style={{ backgroundColor: colors.background, padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
                     <Text style={[styles.aiText, { marginBottom: 0 }]}>{line.trim()}</Text>
                   </View>
                 );
               })
             )}
           </View>
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={handleBack}>
           <Text style={styles.resetBtnText}>Modificar Variables</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Simulador de Inversión</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {step <= 4 ? renderStep() : renderResult()}
      </ScrollView>

      <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Información</Text>
            <Text style={styles.modalText}>{modalInfo.desc}</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
