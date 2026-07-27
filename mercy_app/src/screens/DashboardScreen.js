import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useCustomAlert } from '../context/AlertContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

export default function DashboardScreen({ navigation }) {
  const { colors, isDarkMode } = useContext(ThemeContext);
  const [radarNoticia, setRadarNoticia] = useState('Analizando mercados...');
  const [radarFecha, setRadarFecha] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [lastFetchTime, setLastFetchTime] = useState(0);

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '';
    try {
      const d = new Date(fechaStr);
      if (isNaN(d.getTime())) return fechaStr;
      return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return fechaStr;
    }
  };

  const { userName } = useContext(AuthContext);
  const { showAlert } = useCustomAlert();

  const fetchRadar = async (isManual = false) => {
    if (isManual) {
      const now = Date.now();
      if (now - lastFetchTime < 10000) {
        showAlert('Espera', `Espera unos segundos más para buscar nuevas noticias (${Math.ceil((10000 - (now - lastFetchTime))/1000)}s).`);
        return;
      }
    }
    
    try {
      setRadarNoticia('Sincronizando radar bursátil...');
      setRadarFecha('');
      const response = await axios.get('http://192.168.1.7:8000/api/radar', {
        headers: { 'x-api-key': 'MERCY_API_KEY_SUPER_SECRET' }
      });
      if (response.data && response.data.noticia) {
        setRadarNoticia(response.data.noticia);
        setRadarFecha(formatFecha(response.data.fecha || ''));
        setLastFetchTime(Date.now());
      }
    } catch (e) {
      console.log("Error al cargar radar:", e);
      setRadarNoticia('Los mercados financieros están estables. Consulta con tu asesor.');
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    fetchRadar();
  }, []);

  const herramientas = [
    { title: 'Simuladores pro', subtitle: 'Proyecta tus ahorros e inversiones.', icon: 'calculator-outline', route: 'SimuladoresMenu' },
    { title: 'Diagnóstico 360°', subtitle: 'Salud financiera y estrategias.', icon: 'pulse-outline', route: 'Diagnostico' },
    { title: 'Ranking SOFIPOs', subtitle: 'Compara tasas de rendimiento.', icon: 'stats-chart-outline', route: 'Sofipos' },
    { title: 'Glosario', subtitle: 'Aprende términos financieros.', icon: 'book-outline', route: 'Glosario' },
    { title: 'Test de nivel', subtitle: 'Demuestra qué tanto sabes.', icon: 'school-outline', route: 'Test' },
  ];

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 25, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 20 },
    greeting: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: 0.5, marginBottom: 5 },
    headerTitle: { color: colors.text, fontSize: 26, fontWeight: '800' },
    radarContainer: { marginTop: 10, borderRadius: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.primary, padding: 18, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    radarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
    radarHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
    radarTitle: { color: colors.primary, fontWeight: '700', fontSize: 16, marginLeft: 8 },
    radarContentWrapper: { position: 'relative', paddingLeft: 10 },
    radarText: { color: colors.text, fontSize: 15, lineHeight: 24, fontStyle: 'italic', fontWeight: '500' },
    radarDateContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, alignSelf: 'flex-end', backgroundColor: colors.inputBackground, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    radarDateText: { color: colors.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    scroll: { padding: 20, paddingBottom: 40 },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 5 },
    divider: { height: 3, backgroundColor: colors.primary, width: 40, borderRadius: 2, marginBottom: 20 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    cardWrapper: { width: '48%', marginBottom: 15, backgroundColor: colors.card, borderRadius: 15, borderWidth: 1, borderColor: colors.border, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDarkMode ? 0.2 : 0.05, shadowRadius: 4, elevation: 3 },
    iconContainer: { width: 45, height: 45, borderRadius: 12, backgroundColor: colors.inputBackground, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 6 },
    cardSubtitle: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hola, <Text style={{ color: colors.primary }}>{userName || 'Usuario'}</Text>
          </Text>

          <View style={styles.radarContainer}>
            <View style={styles.radarHeader}>
              <View style={styles.radarHeaderLeft}>
                <Ionicons name="newspaper-outline" size={20} color={colors.primary} />
                <Text style={styles.radarTitle}>Radar Inteligente</Text>
              </View>
              <TouchableOpacity onPress={() => fetchRadar(true)}>
                <Ionicons name="refresh" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.radarContentWrapper}>
               <Ionicons name="quote" size={24} color={colors.border} style={{ position: 'absolute', top: -8, left: -12, opacity: 0.5 }} />
               <Text style={styles.radarText}>{radarNoticia}</Text>
            </View>

            {radarFecha ? (
               <View style={styles.radarDateContainer}>
                 <Ionicons name="calendar-outline" size={12} color={colors.primary} style={{ marginRight: 5 }}/>
                 <Text style={styles.radarDateText}>{radarFecha}</Text>
               </View>
            ) : null}
          </View>
        </View>
        
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Servicios disponibles</Text>
          <View style={styles.divider} />
          
          <View style={styles.grid}>
            {herramientas.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.cardWrapper}
                activeOpacity={0.7}
                onPress={() => navigation.navigate(item.route)}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon} size={24} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle} numberOfLines={2}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}


