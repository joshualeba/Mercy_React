import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SOFIPOS_DATA = [
  { id: '1', name: 'Nu', gat: '14.75', nicap: '1', trend: 'up' },
  { id: '2', name: 'Klar', gat: '14.00', nicap: '1', trend: 'neutral' },
  { id: '3', name: 'Finsus', gat: '13.50', nicap: '1', trend: 'down' },
  { id: '4', name: 'Stori', gat: '13.98', nicap: '1', trend: 'up' },
  { id: '5', name: 'Kubo Financiero', gat: '12.00', nicap: '1', trend: 'neutral' },
];

export default function RankingScreen({ navigation }) {

  const renderItem = ({ item, index }) => {
    const isTop3 = index < 3;
    
    return (
      <View style={styles.card}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, isTop3 && { color: '#F59E0B' }]}>#{index + 1}</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.badgesContainer}>
            <View style={styles.badge}>
              <MaterialCommunityIcons name="shield-check" size={12} color="#10B981" />
              <Text style={styles.badgeText}>NICAP {item.nicap}</Text>
            </View>
          </View>
        </View>

        <View style={styles.rateContainer}>
          <Text style={styles.rateLabel}>GAT Nominal</Text>
          <Text style={styles.rateValue}>{item.gat}%</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ranking SOFIPOs</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Intro */}
      <LinearGradient 
        colors={['rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.02)']} 
        style={styles.introHeader}
      >
        <MaterialCommunityIcons name="trending-up" size={32} color="#F59E0B" />
        <Text style={styles.introTitle}>Las mejores tasas de rendimiento</Text>
        <Text style={styles.introDesc}>Compara y elige dónde invertir tu dinero de forma segura. Actualizado mensualmente.</Text>
      </LinearGradient>

      {/* List */}
      <FlatList
        data={SOFIPOS_DATA.sort((a, b) => parseFloat(b.gat) - parseFloat(a.gat))}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  introHeader: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  introTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  introDesc: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  rankContainer: {
    width: 40,
  },
  rankText: {
    color: '#64748b',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  badgesContainer: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  rateContainer: {
    alignItems: 'flex-end',
  },
  rateLabel: {
    color: '#94a3b8',
    fontSize: 10,
    marginBottom: 4,
  },
  rateValue: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '900',
  }
});
