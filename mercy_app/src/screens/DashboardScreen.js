import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import ChatbotModal from '../components/ChatbotModal';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

export default function DashboardScreen({ navigation }) {
  const { isDarkTheme, themeColors } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  
  const [radarNews, setRadarNews] = useState('');
  const [loadingRadar, setLoadingRadar] = useState(true);
  const [chatbotVisible, setChatbotVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchRadarNews();
    }, [])
  );

  const fetchRadarNews = async () => {
    setLoadingRadar(true);
    try {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: 'Eres Mercy radar, una experta financiera para jóvenes en México.' },
          { role: 'user', content: 'Escribe un consejo financiero o noticia muy breve (máximo 2 oraciones y menos de 100 caracteres) y actual sobre tasas de interés, ahorro o inversión.' }
        ],
        max_tokens: 100,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        setRadarNews(response.data.choices[0].message.content.replace(/"/g, ''));
      } else {
        setRadarNews("Mantente siempre informado sobre las tasas de rendimiento para que tu dinero crezca.");
      }
    } catch (error) {
      setRadarNews("Revisa tus finanzas cada semana para mantenerte seguro.");
    } finally {
      setLoadingRadar(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]} edges={['bottom']}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} />

      {/* Greeting */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: themeColors.textMain }]}>Bienvenido/a al futuro de tus finanzas</Text>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        
        {/* Mercy Radar Card */}
        <LinearGradient 
          colors={['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={[styles.radarCard, !isDarkTheme && { backgroundColor: '#ffffff', borderColor: '#bfdbfe' }]}
        >
          <View style={styles.radarHeader}>
            <View style={styles.radarIconContainer}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color="#fff" />
            </View>
            <View>
              <Text style={[styles.radarTitle, { color: isDarkTheme ? '#f8fafc' : '#1e3a8a' }]}>Mercy radar</Text>
              <Text style={styles.radarSubtitle}>Inteligencia en tiempo real</Text>
            </View>
            {loadingRadar && (
              <ActivityIndicator size="small" color="#3b82f6" style={styles.radarSpinner} />
            )}
          </View>
          <Text style={[styles.radarContent, { color: isDarkTheme ? '#cbd5e1' : '#475569' }]}>
            {loadingRadar ? 'Analizando y extrayendo los últimos movimientos...' : radarNews}
          </Text>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.textMain }]}>Herramientas Mercy</Text>
          <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />
        </View>

        <View style={styles.grid}>
          {/* Simuladores pro */}
          <TouchableOpacity style={[styles.toolCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder }]} onPress={() => navigation.navigate('Simulators')}>
            <View style={styles.toolHeader}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <MaterialCommunityIcons name="calculator" size={26} color="#10B981" />
              </View>
              <MaterialCommunityIcons name="arrow-top-right" size={16} color={themeColors.divider} />
            </View>
            <Text style={[styles.toolTitle, { color: themeColors.textMain }]}>Simuladores pro</Text>
            <Text style={[styles.toolDesc, { color: themeColors.textSec }]}>Proyecta tus ahorros, créditos e inversiones con alta precisión.</Text>
          </TouchableOpacity>

          {/* Diagnóstico 360 */}
          <TouchableOpacity style={[styles.toolCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder }]} onPress={() => navigation.navigate('Diagnostic')}>
            <View style={styles.toolHeader}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <MaterialCommunityIcons name="heart-pulse" size={26} color="#ef4444" />
              </View>
              <MaterialCommunityIcons name="arrow-top-right" size={16} color={themeColors.divider} />
            </View>
            <Text style={[styles.toolTitle, { color: themeColors.textMain }]}>Diagnóstico 360°</Text>
            <Text style={[styles.toolDesc, { color: themeColors.textSec }]}>Conoce tu salud financiera actual y recibe una estrategia personalizada.</Text>
          </TouchableOpacity>

          {/* Ranking SOFIPOs */}
          <TouchableOpacity style={[styles.toolCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder }]} onPress={() => navigation.navigate('Ranking')}>
            <View style={styles.toolHeader}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <MaterialCommunityIcons name="trending-up" size={26} color="#F59E0B" />
              </View>
              <MaterialCommunityIcons name="arrow-top-right" size={16} color={themeColors.divider} />
            </View>
            <Text style={[styles.toolTitle, { color: themeColors.textMain }]}>Ranking SOFIPOs</Text>
            <Text style={[styles.toolDesc, { color: themeColors.textSec }]}>Compara las tasas de rendimiento de las instituciones financieras.</Text>
          </TouchableOpacity>

          {/* Diccionario A-Z */}
          <TouchableOpacity style={[styles.toolCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder }]} onPress={() => navigation.navigate('Dictionary')}>
            <View style={styles.toolHeader}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
                <MaterialCommunityIcons name="book-open-page-variant" size={26} color="#38bdf8" />
              </View>
              <MaterialCommunityIcons name="arrow-top-right" size={16} color={themeColors.divider} />
            </View>
            <Text style={[styles.toolTitle, { color: themeColors.textMain }]}>Diccionario A-Z</Text>
            <Text style={[styles.toolDesc, { color: themeColors.textSec }]}>Domina todos los conceptos clave explicados de forma sencilla.</Text>
          </TouchableOpacity>
        </View>

        {/* Desafío de conocimientos CTA */}
        <TouchableOpacity style={styles.challengeCard} onPress={() => navigation.navigate('KnowledgeTest')}>
          <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(59, 130, 246, 0.05)']} style={[styles.challengeGradient, !isDarkTheme && { backgroundColor: '#ffffff' }]}>
            <View style={styles.challengeIcon}>
              <MaterialCommunityIcons name="trophy" size={30} color="#3b82f6" />
            </View>
            <View style={styles.challengeTextContainer}>
              <Text style={[styles.challengeTitle, { color: themeColors.textMain }]}>Desafío de conocimientos</Text>
              <Text style={[styles.challengeDesc, { color: themeColors.textSec }]}>Demuestra tus habilidades y evalúa lo aprendido.</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#3b82f6" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Chatbot Button */}
      <TouchableOpacity 
        style={styles.floatingButton} 
        onPress={() => setChatbotVisible(true)}
        activeOpacity={0.8}
      >
        <LinearGradient 
          colors={['#1e3a8a', '#3b82f6']} 
          style={styles.floatingButtonGradient}
        >
          <MaterialCommunityIcons name="robot-outline" size={30} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <ChatbotModal visible={chatbotVisible} onClose={() => setChatbotVisible(false)} />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 25,
    paddingTop: 10,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  scrollArea: {
    paddingHorizontal: 20,
  },
  radarCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
  },
  radarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  radarIconContainer: {
    backgroundColor: '#3b82f6',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 3,
  },
  radarTitle: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  radarSubtitle: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: '600',
  },
  radarSpinner: {
    marginLeft: 'auto',
  },
  radarContent: {
    fontSize: 13,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 15,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  toolCard: {
    width: '48%',
    borderRadius: 20,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
  },
  toolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  toolDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  challengeCard: {
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
  },
  challengeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  challengeIcon: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  challengeTextContainer: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  challengeDesc: {
    fontSize: 12,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 25,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
