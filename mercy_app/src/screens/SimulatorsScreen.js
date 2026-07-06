import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function SimulatorsScreen({ navigation }) {

  const simulators = [
    {
      id: 'Savings',
      title: 'Ahorro',
      desc: 'Proyecta cuánto tiempo necesitas para alcanzar tus metas financieras.',
      icon: 'piggy-bank-outline',
      color: '#10B981', // Verde
      route: 'SavingsSimulator'
    },
    {
      id: 'Credit',
      title: 'Créditos',
      desc: 'Calcula tus pagos mensuales y visualiza la tabla de amortización.',
      icon: 'credit-card-outline',
      color: '#ef4444', // Rojo
      route: 'CreditSimulator'
    },
    {
      id: 'Investment',
      title: 'Inversión',
      desc: 'Haz crecer tu dinero con el poder del interés compuesto.',
      icon: 'chart-line',
      color: '#F59E0B', // Amarillo
      route: 'InvestmentSimulator'
    },
    {
      id: 'Budget',
      title: 'Presupuesto',
      desc: 'Distribuye tu sueldo idealmente con la regla 50/30/20.',
      icon: 'wallet-outline',
      color: '#38bdf8', // Azul claro
      route: 'BudgetSimulator'
    },
    {
      id: 'Retirement',
      title: 'Retiro',
      desc: 'Calcula cuánto necesitas ahorrar para una jubilación tranquila.',
      icon: 'beach',
      color: '#8b5cf6', // Morado
      route: 'RetirementSimulator'
    },
    {
      id: 'Debt',
      title: 'Deudas',
      desc: 'Crea una estrategia para salir de deudas rápido.',
      icon: 'file-document-outline',
      color: '#f97316', // Naranja
      route: 'DebtSimulator'
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centro de Simuladores</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        <LinearGradient 
          colors={['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.02)']} 
          style={styles.introCard}
        >
          <MaterialCommunityIcons name="calculator-variant-outline" size={32} color="#3b82f6" style={styles.introIcon} />
          <Text style={styles.introTitle}>Simuladores Pro</Text>
          <Text style={styles.introDesc}>Calculadoras financieras avanzadas para tomar el control total de tu dinero.</Text>
        </LinearGradient>

        <View style={styles.grid}>
          {simulators.map((sim, index) => (
            <TouchableOpacity 
              key={sim.id}
              style={styles.card}
              onPress={() => navigation.navigate(sim.route)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: `${sim.color}20` }]}>
                  <MaterialCommunityIcons name={sim.icon} size={28} color={sim.color} />
                </View>
              </View>
              <Text style={styles.cardTitle}>{sim.title}</Text>
              <Text style={styles.cardDesc}>{sim.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{height: 40}} />
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
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
  content: {
    padding: 20,
  },
  introCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    marginBottom: 25,
    alignItems: 'center',
  },
  introIcon: {
    marginBottom: 10,
  },
  introTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  introDesc: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    width: '48%',
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: {
    marginBottom: 12,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  cardDesc: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 16,
  }
});
