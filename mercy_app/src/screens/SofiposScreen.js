import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useCustomAlert } from '../context/AlertContext';
import { Ionicons } from '@expo/vector-icons'; 

export default function SofiposScreen({ navigation }) {
  const { colors, isDarkMode } = useContext(ThemeContext);
  const { showAlert } = useCustomAlert();

  const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 15, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, color: colors.text },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20 },
  description: { fontSize: 14, color: colors.textMuted, marginBottom: 15, lineHeight: 20 },
  filterScroll: { marginBottom: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.inputBackground, marginRight: 10, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textMuted, fontWeight: '600', fontSize: 14 },
  filterTextActive: { color: colors.card, fontWeight: 'bold' },
  card: { backgroundColor: colors.card, borderRadius: 15, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  rankBadge: { backgroundColor: colors.warning, width: 35, height: 35, borderRadius: 17.5, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  rankText: { color: colors.card, fontWeight: 'bold', fontSize: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 15 },
  statBox: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 5 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: colors.text }
});

  const { userToken } = useContext(AuthContext);
  const [sofipos, setSofipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('tasa');

  useEffect(() => {
    fetchSofipos();
  }, []);

  const fetchSofipos = async () => {
    try {
      const response = await axios.get('https://twelve-laws-press.loca.lt/api/sofipos_data', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (response.data.success) {
        setSofipos(response.data.data);
      }
    } catch (e) {
      showAlert('Error', 'No se pudieron cargar los datos del ranking.');
    } finally {
      setLoading(false);
    }
  };

  const getSortedSofipos = () => {
    return [...sofipos].sort((a, b) => {
      if (sortBy === 'tasa') return b.tasa - a.tasa;
      if (sortBy === 'nicap') return b.nicap - a.nicap;
      if (sortBy === 'plazo') return a.plazo - b.plazo; // Plazos más cortos primero
      return 0;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Ranking SOFIPOs</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.description}>
            Conoce las tasas actuales del mercado en Sociedades Financieras Populares, para invertir con la mejor estrategia.
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {['tasa', 'nicap', 'plazo'].map(criterio => (
              <TouchableOpacity 
                key={criterio} 
                style={[styles.filterChip, sortBy === criterio && styles.filterChipActive]}
                onPress={() => setSortBy(criterio)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={criterio === 'tasa' ? 'trending-up' : criterio === 'nicap' ? 'shield-checkmark' : 'time-outline'} size={16} color={sortBy === criterio ? colors.card : colors.textMuted} style={{ marginRight: 6 }} />
                  <Text style={[styles.filterText, sortBy === criterio && styles.filterTextActive]}>
                    {criterio === 'tasa' ? 'Tasa' : criterio === 'nicap' ? 'NICAP' : 'Plazo'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {getSortedSofipos().map((item, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.rankBadge, { backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : colors.warning }]}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.nombre}</Text>
                <TouchableOpacity onPress={() => Linking.openURL(item.url)} style={{ marginLeft: 'auto', backgroundColor: colors.inputBackground, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 12, marginRight: 5 }}>Visitar</Text>
                  <Ionicons name="open-outline" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Tasa Anual</Text>
                  <Text style={styles.statValue}>{item.tasa}%</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Plazo (Días)</Text>
                  <Text style={styles.statValue}>{item.plazo}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>NICAP</Text>
                  <Text style={[styles.statValue, { color: item.nicap > 131 ? '#4CAF50' : '#FF9800' }]}>{item.nicap}%</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
