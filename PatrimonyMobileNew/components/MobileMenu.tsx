// components/MobileMenu.js (para React Native)
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ 
  isOpen, 
  onClose, 
  currentUser, 
  onNavigate, 
  onLogout 
}) => {
  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.menuContainer}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Menu</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.menuItems}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => { onNavigate('dashboard'); onClose(); }}
            >
              <Text style={styles.menuIcon}>📊</Text>
              <Text style={styles.menuText}>Dashboard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => { onNavigate('list'); onClose(); }}
            >
              <Text style={styles.menuIcon}>📋</Text>
              <Text style={styles.menuText}>Lista de Bens</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => { onNavigate('new'); onClose(); }}
            >
              <Text style={styles.menuIcon}>+</Text>
              <Text style={styles.menuText}>Novo Bem</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => { onNavigate('bulk'); onClose(); }}
            >
              <Text style={styles.menuIcon}>📦</Text>
              <Text style={styles.menuText}>Cadastro em Massa</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => { onNavigate('print'); onClose(); }}
            >
              <Text style={styles.menuIcon}>🖨️</Text>
              <Text style={styles.menuText}>Imprimir</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => { onNavigate('profile'); onClose(); }}
            >
              <Text style={styles.menuIcon}>👤</Text>
              <Text style={styles.menuText}>Meu Perfil</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => { onNavigate('settings'); onClose(); }}
            >
              <Text style={styles.menuIcon}>⚙️</Text>
              <Text style={styles.menuText}>Configurações</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuItem, styles.logoutItem]} 
              onPress={() => { onLogout(); onClose(); }}
            >
              <Text style={styles.menuIcon}>🚪</Text>
              <Text style={[styles.menuText, styles.logoutText]}>Sair</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Logado como: <Text style={styles.userNameBold}>{currentUser?.username}</Text></Text>
            <Text style={styles.userRole}>{currentUser?.role === 'admin' ? 'Administrador' : 'Usuário'}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  menuContainer: {
    width: width * 0.75,
    height: height,
    backgroundColor: 'white',
    position: 'absolute',
    left: 0,
    top: 0,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2563eb',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  menuItems: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 30,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  logoutItem: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 10,
  },
  logoutText: {
    color: '#ef4444',
  },
  userInfo: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
  },
  userName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  userNameBold: {
    fontWeight: 'bold',
    color: '#333',
  },
  userRole: {
    fontSize: 12,
    color: '#888',
  },
});

export default MobileMenu;