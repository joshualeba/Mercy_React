import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const API_URL = 'http://192.168.1.100:8000/api';

export default function ChatbotModal({ visible, onClose }) {
  const [messages, setMessages] = useState([
    { id: '1', role: 'assistant', content: '¡Hola! Soy Mercy IA. ¿En qué te puedo ayudar hoy con tus finanzas?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, visible]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      
      const groqMessages = [
        { role: 'system', content: 'Eres Mercy IA, una asesora financiera experta y amable que ayuda a usuarios en México a mejorar sus finanzas personales.' },
        ...history,
        { role: 'user', content: text }
      ];

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama3-8b-8192',
        messages: groqMessages,
        max_tokens: 300,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const botMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.choices[0].message.content
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Hubo un error de conexión con mi cerebro. Verifica tu conexión a internet o tu API Key.'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperBot]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <MaterialCommunityIcons name="robot-outline" size={18} color="#fff" />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.messageUser : styles.messageBot]}>
          <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextBot]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.modalContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.chatContainer}>
          {/* Header */}
          <LinearGradient colors={['#1e3a8a', '#3b82f6']} style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <MaterialCommunityIcons name="lightning-bolt" size={24} color="#FBBF24" />
              <Text style={styles.headerTitle}>Mercy IA</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Chat History */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
          />

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text style={styles.loadingText}>Mercy está pensando...</Text>
            </View>
          )}

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Pregúntale a Mercy..."
              placeholderTextColor="#94a3b8"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={300}
            />
            <TouchableOpacity 
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <MaterialCommunityIcons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  chatContainer: {
    backgroundColor: '#0f172a',
    height: '85%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  closeButton: {
    padding: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
  },
  chatList: {
    padding: 15,
    paddingBottom: 20,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 15,
    maxWidth: '85%',
  },
  messageWrapperUser: {
    alignSelf: 'flex-end',
  },
  messageWrapperBot: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 5,
  },
  messageBubble: {
    padding: 15,
    borderRadius: 20,
  },
  messageUser: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 5,
  },
  messageBot: {
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 5,
    borderColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextUser: {
    color: '#fff',
  },
  messageTextBot: {
    color: '#f8fafc',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  loadingText: {
    color: '#94a3b8',
    marginLeft: 10,
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    color: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 45,
    maxHeight: 100,
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  }
});
