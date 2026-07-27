import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 

export default function PlaceholderScreen({ navigation, route }) {
  // If navigated with a title in params, use it, otherwise generic title
  const title = route.params?.title || 'Próximamente';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      
      <View style={styles.content}>
        <Ionicons name="hammer-outline" size={80} color="#ccc" style={styles.icon} />
        <Text style={styles.messageTitle}>En Construcción</Text>
        <Text style={styles.messageBody}>
          Estamos trabajando para adaptar esta funcionalidad ("{title}") a la nueva experiencia móvil de Mercy. ¡Vuelve pronto!
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  icon: { marginBottom: 20 },
  messageTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  messageBody: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
  btn: { backgroundColor: '#1c3a6b', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
