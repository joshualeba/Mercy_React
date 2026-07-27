import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';

const HTML_TOGGLE = (isDarkMode) => `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>
  :root {
    --bg: transparent;
    --primary: transparent;
    --primaryT: transparent;
    --transDur: 0.3s;
  }
  body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: var(--bg); }
  .theme {
    display: flex;
    align-items: center;
    -webkit-tap-highlight-color: transparent;
  }
  .theme__fill, .theme__icon { transition: 0.3s; }
  .theme__fill { background-color: var(--bg); display: block; mix-blend-mode: difference; position: fixed; inset: 0; height: 100%; transform: translateX(-100%); }
  .theme__icon, .theme__toggle { z-index: 1; }
  .theme__icon, .theme__icon-part { position: absolute; }
  .theme__icon { display: block; top: 0.5em; left: 0.5em; width: 1.5em; height: 1.5em; }
  .theme__icon-part {
    border-radius: 50%;
    box-shadow: 0.4em -0.4em 0 0.5em hsl(0,0%,100%) inset;
    top: calc(50% - 0.5em); left: calc(50% - 0.5em);
    width: 1em; height: 1em;
    transition: box-shadow var(--transDur) ease-in-out, opacity var(--transDur) ease-in-out, transform var(--transDur) ease-in-out;
    transform: scale(0.5);
  }
  .theme__icon-part ~ .theme__icon-part {
    background-color: hsl(0,0%,100%); border-radius: 0.05em; top: 50%; left: calc(50% - 0.05em);
    transform: rotate(0deg) translateY(0.5em); transform-origin: 50% 0; width: 0.1em; height: 0.2em;
  }
  .theme__icon-part:nth-child(3) { transform: rotate(45deg) translateY(0.45em); }
  .theme__icon-part:nth-child(4) { transform: rotate(90deg) translateY(0.45em); }
  .theme__icon-part:nth-child(5) { transform: rotate(135deg) translateY(0.45em); }
  .theme__icon-part:nth-child(6) { transform: rotate(180deg) translateY(0.45em); }
  .theme__icon-part:nth-child(7) { transform: rotate(225deg) translateY(0.45em); }
  .theme__icon-part:nth-child(8) { transform: rotate(270deg) translateY(0.5em); }
  .theme__icon-part:nth-child(9) { transform: rotate(315deg) translateY(0.5em); }
  .theme__label, .theme__toggle, .theme__toggle-wrap { position: relative; }
  .theme__toggle, .theme__toggle:before { display: block; }
  .theme__toggle {
    background-color: hsl(48,90%,85%);
    border-radius: 25% / 50%;
    box-shadow: 0 0 0 0.125em var(--primaryT);
    padding: 0.25em; width: 6em; height: 3em;
    -webkit-appearance: none; appearance: none;
    transition: background-color var(--transDur) ease-in-out, box-shadow 0.15s ease-in-out, transform var(--transDur) ease-in-out;
  }
  .theme__toggle:before { background-color: hsl(48,90%,55%); border-radius: 50%; content: ""; width: 2.5em; height: 2.5em; transition: 0.3s; }
  .theme__toggle:focus { box-shadow: 0 0 0 0.125em var(--primary); outline: transparent; }
  .theme__toggle:checked { background-color: hsl(198,90%,15%); }
  .theme__toggle:checked:before, .theme__toggle:checked ~ .theme__icon { transform: translateX(3em); }
  .theme__toggle:checked:before { background-color: hsl(198,90%,55%); }
  .theme__toggle:checked ~ .theme__fill { transform: translateX(0); }
  .theme__toggle:checked ~ .theme__icon .theme__icon-part:nth-child(1) {
    box-shadow: 0.2em -0.2em 0 0.2em hsl(0,0%,100%) inset; transform: scale(1); top: 0.2em; left: -0.2em;
  }
  .theme__toggle:checked ~ .theme__icon .theme__icon-part ~ .theme__icon-part { opacity: 0; }
  .theme__toggle:checked ~ .theme__icon .theme__icon-part:nth-child(2) { transform: rotate(45deg) translateY(0.8em); }
  .theme__toggle:checked ~ .theme__icon .theme__icon-part:nth-child(3) { transform: rotate(90deg) translateY(0.8em); }
  .theme__toggle:checked ~ .theme__icon .theme__icon-part:nth-child(4) { transform: rotate(135deg) translateY(0.8em); }
  .theme__toggle:checked ~ .theme__icon .theme__icon-part:nth-child(5) { transform: rotate(180deg) translateY(0.8em); }
  .theme__toggle:checked ~ .theme__icon .theme__icon-part:nth-child(6) { transform: rotate(225deg) translateY(0.8em); }
  .theme__toggle:checked ~ .theme__icon .theme__icon-part:nth-child(7) { transform: rotate(270deg) translateY(0.8em); }
  .theme__toggle:checked ~ .theme__icon .theme__icon-part:nth-child(8) { transform: rotate(315deg) translateY(0.8em); }
  .theme__toggle:checked ~ .theme__icon .theme__icon-part:nth-child(9) { transform: rotate(360deg) translateY(0.8em); }
  .theme__toggle-wrap { margin: 0; transform: scale(0.75); transform-origin: center; }
</style>
</head>
<body>
  <label for="theme" class="theme">
    <span class="theme__toggle-wrap">
      <input id="theme" class="theme__toggle" type="checkbox" role="switch" name="theme" value="dark" ${isDarkMode ? 'checked' : ''}>
      <span class="theme__fill"></span>
      <span class="theme__icon">
        <span class="theme__icon-part"></span>
        <span class="theme__icon-part"></span>
        <span class="theme__icon-part"></span>
        <span class="theme__icon-part"></span>
        <span class="theme__icon-part"></span>
        <span class="theme__icon-part"></span>
        <span class="theme__icon-part"></span>
        <span class="theme__icon-part"></span>
        <span class="theme__icon-part"></span>
      </span>
    </span>
  </label>
  <script>
    const toggle = document.getElementById('theme');
    toggle.addEventListener('change', function(e) {
      window.ReactNativeWebView.postMessage(this.checked ? 'dark' : 'light');
    });
  </script>
</body>
</html>
`;

export default function Navbar() {
  const { isDarkMode, toggleTheme, colors } = useContext(ThemeContext);
  const { logout, userName } = useContext(AuthContext);
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => setMenuVisible(!menuVisible);

  const handleProfile = () => {
    setMenuVisible(false);
    navigation.navigate('Perfil');
  };

  const handleLogout = () => {
    setMenuVisible(false);
    logout();
  };

  const handleWebViewMessage = (event) => {
    const isDark = event.nativeEvent.data === 'dark';
    if (isDark !== isDarkMode) {
      toggleTheme();
    }
  };

  const userInitial = userName && userName.length > 0 ? userName.charAt(0).toUpperCase() : 'U';
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: insets.top > 0 ? insets.top + 10 : Platform.OS === 'android' ? 40 : 45,
      paddingBottom: 15,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      zIndex: 10,
    },
    leftSection: { flexDirection: 'row', alignItems: 'center' },
    logoImg: { width: 30, height: 30, resizeMode: 'contain', borderRadius: 8 },
    logoText: { fontSize: 22, fontWeight: '900', color: colors.primary, marginLeft: 8, letterSpacing: 1 },
    rightSection: { flexDirection: 'row', alignItems: 'center' },
    switchWrapper: { width: 90, height: 50, marginRight: 10, backgroundColor: 'transparent' },
    webview: { backgroundColor: 'transparent' },
    avatarButton: { backgroundColor: colors.primary, width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    modalOverlay: { flex: 1, backgroundColor: 'transparent' },
    dropdownMenu: { position: 'absolute', top: 90, right: 20, backgroundColor: colors.card, borderRadius: 10, padding: 5, width: 160, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, borderWidth: 1, borderColor: colors.border },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    menuItemLast: { borderBottomWidth: 0 },
    menuText: { color: colors.text, fontSize: 15, marginLeft: 10 },
    logoutText: { color: colors.danger }
  });

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Image 
          source={{ uri: isDarkMode ? 'https://res.cloudinary.com/dpvm2gro2/image/upload/v1769711039/logo_qp8c8w.png' : 'https://res.cloudinary.com/dpvm2gro2/image/upload/e_negate/v1769711039/logo_qp8c8w.png' }} 
          style={styles.logoImg} 
        />
        <Text style={styles.logoText}>MERCY</Text>
      </View>

      <View style={styles.rightSection}>
        <View style={styles.switchWrapper}>
          <WebView
            originWhitelist={['*']}
            source={{ html: HTML_TOGGLE(isDarkMode) }}
            style={styles.webview}
            scrollEnabled={false}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            onMessage={handleWebViewMessage}
          />
        </View>

        <TouchableOpacity style={styles.avatarButton} onPress={toggleMenu}>
          <Text style={styles.avatarText}>{userInitial}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={menuVisible} transparent={true} animationType="fade" onRequestClose={toggleMenu}>
        <TouchableOpacity style={styles.modalOverlay} onPress={toggleMenu} activeOpacity={1}>
          <View style={styles.dropdownMenu}>
            <TouchableOpacity style={styles.menuItem} onPress={handleProfile}>
              <Ionicons name="person-outline" size={18} color={colors.text} />
              <Text style={styles.menuText}>Mi perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <Text style={[styles.menuText, styles.logoutText]}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
