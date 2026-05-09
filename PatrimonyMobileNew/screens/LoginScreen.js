// mobile/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  Platform,
  StyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);

    const result = await login(username, password);

    setLoading(false);

    if (!result.success) {
      Alert.alert('Erro', result.error || 'Credenciais inválidas');
    }
    // Se o login for bem-sucedido, a navegação será tratada automaticamente
    // pelo AuthContext e App.js
  };

  const handleBackgroundPress = () => {
    if (Platform.OS === 'ios') {
      Keyboard.dismiss();
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <View 
        style={styles.backgroundView}
        onStartShouldSetResponder={() => {
          handleBackgroundPress();
          return false;
        }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Sistema de Gestão de Patrimônio</Text>
          <Text style={styles.subtitle}>Ambiente Oficial</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Usuário</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Digite seu usuário"
            autoCapitalize="none"
            editable={!loading}
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Digite sua senha"
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.registerLink}
            disabled={loading}
          >
            <Text style={styles.registerText}>
              Não tem uma conta? <Text style={styles.registerBold}>Cadastre-se</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.demoContainer}>
            <Text style={styles.demoTitle}>Credenciais de Demonstração:</Text>
            <Text style={styles.demoText}>Usuário: demo</Text>
            <Text style={styles.demoText}>Senha: demo123</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
    justifyContent: 'center',
  },
  backgroundView: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9fafb',
  },
  button: {
    backgroundColor: '#059669',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerLink: {
    alignItems: 'center',
    marginBottom: 30,
  },
  registerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  registerBold: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  demoContainer: {
    backgroundColor: '#f1f5f9',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  demoTitle: {
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 5,
    fontSize: 14,
  },
  demoText: {
    color: '#6b7280',
    fontSize: 13,
    marginBottom: 2,
  },
});