import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import CustomAlert from './CustomAlert';

export default function CustomHeader({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { isDarkTheme, toggleTheme, themeColors } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);
  
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [logoutAlert, setLogoutAlert] = useState(false);

  // No renderizar el header en Login o Register
  if (route.name === 'Login' || route.name === 'Register') {
    return null;
  }

  const handleLogout = () => {
    setLogoutAlert(false);
    setDropdownVisible(false);
    logout();
    navigation.replace('Login');
  };

  const userName = user?.nombre || 'Usuario';
  const userInitial = userName.charAt(0).toUpperCase();
  const userEmail = user?.correo_electronico || user?.email || 'correo@mercy.com';

  return (
    <View style={[styles.headerContainer, { 
      backgroundColor: themeColors.bg, 
      paddingTop: insets.top,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.divider
    }]}>
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          {/* Logo container without background in Light Mode, just invert color using tintColor */}
          <View style={styles.logoWrapper}>
            <Image 
              source={{ uri: 'https://res.cloudinary.com/dpvm2gro2/image/upload/v1769711039/logo_qp8c8w.png' }} 
              style={[styles.logoImage, !isDarkTheme && { tintColor: '#000000' }]} 
            />
          </View>
        </View>
        
        <View style={styles.topbarRight}>
          <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme} activeOpacity={0.8}>
            <View style={[styles.toggleTrack, !isDarkTheme && styles.toggleTrackLight]}>
              <View style={[styles.toggleKnob, !isDarkTheme && styles.toggleKnobLight]}>
                <MaterialCommunityIcons name={isDarkTheme ? "weather-night" : "weather-sunny"} size={14} color={isDarkTheme ? "#3b82f6" : "#F59E0B"} />
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.userAvatar} onPress={() => setDropdownVisible(true)}>
            <Text style={styles.userAvatarText}>{userInitial}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown Modal */}
      <Modal visible={dropdownVisible} transparent={true} animationType="fade" onRequestClose={() => setDropdownVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDropdownVisible(false)}>
          <TouchableWithoutFeedback>
            <View style={[styles.dropdownMenu, { backgroundColor: isDarkTheme ? '#1e293b' : '#ffffff', borderColor: themeColors.cardBorder }]}>
              <View style={styles.dropdownHeader}>
                <View style={styles.dropdownAvatar}>
                  <Text style={styles.dropdownAvatarText}>{userInitial}</Text>
                </View>
                <View>
                  <Text style={[styles.dropdownName, { color: themeColors.textMain }]}>{userName}</Text>
                  <Text style={styles.dropdownEmail}>{userEmail}</Text>
                </View>
              </View>
              
              <View style={[styles.dropdownDivider, { backgroundColor: themeColors.divider }]} />
              
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setDropdownVisible(false); navigation.navigate('Profile'); }}>
                <MaterialCommunityIcons name="account-outline" size={22} color={themeColors.textMain} />
                <Text style={[styles.dropdownItemText, { color: themeColors.textMain }]}>Ver mi perfil</Text>
              </TouchableOpacity>
              
              <View style={[styles.dropdownDivider, { backgroundColor: themeColors.divider }]} />
              
              <TouchableOpacity style={styles.dropdownItem} onPress={() => setLogoutAlert(true)}>
                <MaterialCommunityIcons name="logout" size={22} color="#ef4444" />
                <Text style={[styles.dropdownItemText, { color: '#ef4444' }]}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      <CustomAlert 
        visible={logoutAlert}
        title="Cerrar sesión"
        message="¿Estás seguro de que deseas salir de tu cuenta?"
        type="warning"
        showCancel={true}
        onClose={() => setLogoutAlert(false)}
        onConfirm={handleLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 10,
    zIndex: 100,
  },
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
  },
  topbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrapper: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  logoImage: {
    width: 90,
    height: 28,
    resizeMode: 'contain',
  },
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggle: {
    marginRight: 15,
  },
  toggleTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    padding: 3,
    justifyContent: 'center',
  },
  toggleTrackLight: {
    backgroundColor: '#cbd5e1',
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: 0 }],
  },
  toggleKnobLight: {
    backgroundColor: '#ffffff',
    transform: [{ translateX: 22 }],
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 90,
    right: 20,
    width: 250,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  dropdownAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dropdownAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dropdownName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownEmail: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  dropdownDivider: {
    height: 1,
    marginVertical: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 12,
  }
});
