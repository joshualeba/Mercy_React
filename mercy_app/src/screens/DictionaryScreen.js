import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, LayoutAnimation, UIManager, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Enable layout animation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DICTIONARY_DATA = [
  { id: '1', term: 'CAT', definition: 'El Costo Anual Total (CAT) es una medida estandarizada del costo de financiamiento, expresada en términos porcentuales anuales que, para fines informativos y de comparación, incorpora la totalidad de los costos y gastos inherentes a los créditos.' },
  { id: '2', term: 'GAT Nominal', definition: 'La Ganancia Anual Total (GAT) Nominal es un indicador que sirve para calcular el rendimiento total de tu inversión antes de restar la inflación esperada.' },
  { id: '3', term: 'GAT Real', definition: 'Es el rendimiento que obtendrás una vez descontada la inflación estimada. Es la medida más precisa para saber si tu dinero realmente está creciendo en valor adquisitivo.' },
  { id: '4', term: 'Inflación', definition: 'Aumento generalizado y sostenido de los precios de los bienes y servicios existentes en el mercado durante un período de tiempo.' },
  { id: '5', term: 'Interés Compuesto', definition: 'Es el interés de un capital al que se van acumulando sus réditos o intereses para que produzcan otros. En pocas palabras, es "ganar intereses sobre tus intereses".' },
  { id: '6', term: 'NICAP', definition: 'El Nivel de Capitalización (NICAP) refleja la solidez financiera de una SOFIPO. El Nivel 1 significa que la institución tiene los niveles de capitalización óptimos requeridos por la ley.' },
  { id: '7', term: 'SOFIPO', definition: 'Sociedad Financiera Popular. Son entidades del sector microfinanzas que operan mediante la autorización de la CNBV, ofreciendo servicios de ahorro, crédito e inversión.' },
];

export default function DictionaryScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filteredData = DICTIONARY_DATA.filter(item => 
    item.term.toLowerCase().includes(search.toLowerCase()) || 
    item.definition.toLowerCase().includes(search.toLowerCase())
  );

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }) => {
    const isExpanded = expandedId === item.id;
    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.7}
        onPress={() => toggleExpand(item.id)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.term}>{item.term}</Text>
          <MaterialCommunityIcons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={24} 
            color="#3b82f6" 
          />
        </View>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.definition}>{item.definition}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Diccionario A-Z</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <MaterialCommunityIcons name="magnify" size={22} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar concepto..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredData.sort((a, b) => a.term.localeCompare(b.term))}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="text-box-search-outline" size={48} color="#334155" />
            <Text style={styles.emptyText}>No se encontraron resultados para "{search}"</Text>
          </View>
        }
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  listContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  term: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expandedContent: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  definition: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyText: {
    color: '#64748b',
    marginTop: 15,
    fontSize: 15,
  }
});
