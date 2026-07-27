import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 

export default function SimuladoresMenuScreen({ navigation }) {
  const { colors, isDarkMode } = useContext(ThemeContext);

  const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 15, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  scroll: { padding: 20 },
  description: { fontSize: 16, color: colors.textMuted, marginBottom: 20 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 15, borderRadius: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDarkMode ? 0.2 : 0.05, shadowRadius: 3, elevation: 2 },
  iconContainer: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 3 },
  subtitle: { fontSize: 13, color: colors.textMuted }
});

  const simuladores = [
    { title: 'Ahorro', subtitle: 'Proyecta cuánto tendrás en el futuro', icon: 'wallet-outline', route: 'SimuladorAhorro', color: '#4CAF50' },
    { title: 'Crédito', subtitle: 'Calcula tus pagos mensuales e intereses', icon: 'card-outline', route: 'SimuladorCredito', color: '#F44336' },
    { title: 'Inversión', subtitle: 'Rendimiento compuesto de tu dinero', icon: 'trending-up-outline', route: 'SimuladorInversion', color: '#2196F3' },
    { title: 'Presupuesto Personal', subtitle: 'Controla tus ingresos y gastos', icon: 'pie-chart-outline', route: 'SimuladorPresupuesto', color: '#9C27B0' },
    { title: 'Retiro / Jubilación', subtitle: 'Planea tu futuro financiero', icon: 'calendar-outline', route: 'SimuladorRetiro', color: '#FF9800' },
    { title: 'Calculadora de Deuda', subtitle: 'Estrategias para salir de deudas', icon: 'cash-outline', route: 'SimuladorDeuda', color: '#607D8B' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Simuladores pro</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.description}>Selecciona la herramienta financiera que necesitas usar hoy:</Text>
        
        {simuladores.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.listItem}
            onPress={() => navigation.navigate(item.route, { title: item.title })}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
              <Ionicons name={item.icon} size={28} color={item.color} />
            </View>
            <View style={styles.textContainer}>
               <Text style={styles.title}>{item.title}</Text>
               <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.border} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}


