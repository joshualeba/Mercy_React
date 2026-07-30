import React, { useState, useEffect, useContext, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons'; 

export default function GlosarioScreen({ navigation }) {
  const { colors, isDarkMode } = useContext(ThemeContext);

  const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 15, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, color: colors.text },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: 15, marginTop: 15, marginBottom: 10, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 45, fontSize: 16 },
  categoriesContainer: { paddingHorizontal: 15, marginBottom: 15 },
  categoryChip: { backgroundColor: colors.border, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  categoryChipSelected: { backgroundColor: '#00BCD4' },
  categoryChipText: { color: colors.textMuted, fontWeight: 'bold', fontSize: 14 },
  categoryChipTextSelected: { color: colors.card },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 15, paddingBottom: 30 },
  card: { backgroundColor: colors.card, padding: 20, borderRadius: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginLeft: 10, flexShrink: 1 },
  cardText: { fontSize: 15, color: colors.textMuted, lineHeight: 22, marginBottom: 15 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#e0f7fa', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  categoryText: { color: '#0097a7', fontSize: 12, fontWeight: 'bold' },
  noResults: { textAlign: 'center', color: colors.textMuted, marginTop: 20, fontSize: 16 }
});

  const { userToken } = useContext(AuthContext);
  const [terminos, setTerminos] = useState([]);
  const [filteredTerminos, setFilteredTerminos] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  useEffect(() => {
    fetchGlosario();
  }, []);

  const fetchGlosario = async () => {
    try {
      const response = await axios.get('https://mercyreact.duckdns.org/api/glosario', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (response.data.success) {
        setTerminos(response.data.terminos);
        setFilteredTerminos(response.data.terminos);
      }
    } catch (e) {
      console.log('Error fetching glosario', e);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(terminos.map(t => t.categoria));
    return ['Todos', ...Array.from(cats)];
  }, [terminos]);

  useEffect(() => {
    let result = terminos;
    if (selectedCategory !== 'Todos') {
      result = result.filter(t => t.categoria === selectedCategory);
    }
    if (search !== '') {
      const lower = search.toLowerCase();
      result = result.filter(t => 
        t.termino.toLowerCase().includes(lower) || 
        t.descripcion.toLowerCase().includes(lower)
      );
    }
    setFilteredTerminos(result);
  }, [search, selectedCategory, terminos]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Glosario Financiero</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Buscar un término o frase..."
          placeholderTextColor={isDarkMode ? '#A0A0A0' : '#888'}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipSelected]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextSelected]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#00BCD4" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {filteredTerminos.map((item, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="book-outline" size={20} color="#00BCD4" />
                <Text style={styles.cardTitle}>{item.termino}</Text>
              </View>
              <Text style={styles.cardText}>{item.descripcion}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.categoria.charAt(0).toUpperCase() + item.categoria.slice(1)}</Text>
              </View>
            </View>
          ))}
          {filteredTerminos.length === 0 && (
            <Text style={styles.noResults}>No se encontraron resultados.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}


