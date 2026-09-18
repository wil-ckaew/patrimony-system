// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Auth] 🚀 AuthProvider montou — restaurando sessão');
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('@auth_token'),
        AsyncStorage.getItem('@auth_user')
      ]);

      if (storedToken && storedUser) {
        console.log('[Auth] ✅ Sessão encontrada no storage');
        // Restaura direto, sem validar (evita 401 em rede instável)
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Valida em background (não bloqueia)
        validateToken(storedToken).then(isValid => {
          if (!isValid) {
            console.log('[Auth] ⚠️ Token inválido — fazendo logout');
            logout();
          } else {
            console.log('[Auth] ✅ Token válido');
          }
        });
      } else {
        console.log('[Auth] ❌ Nenhuma sessão salva');
      }
    } catch (error) {
      console.error('[Auth] Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateToken = async (tokenToValidate) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/patrimony`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenToValidate}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.status === 401) return false;
      return true;
    } catch (error) {
      console.log('[Auth] Erro ao validar token (mantendo sessão):', error.message);
      return true; // mantém sessão em caso de erro de rede
    }
  };

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const data = await response.json();
        await Promise.all([
          AsyncStorage.setItem('@auth_token', data.token),
          AsyncStorage.setItem('@auth_user', JSON.stringify(data.user))
        ]);
        setToken(data.token);
        setUser(data.user);
        console.log('[Auth] ✅ Login OK:', data.user.username);
        return { success: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.message || 'Login failed' };
      }
    } catch (error) {
      console.error('[Auth] Erro no login:', error);
      return { success: false, error: 'Network error' };
    }
  };

  // ✅ IMPORTANTE: prioriza o token do state, mas recorre ao storage
  const getAuthHeaders = async () => {
    let currentToken = token;
    if (!currentToken) {
      currentToken = await AsyncStorage.getItem('@auth_token');
      console.log('[Auth] 🔑 token do storage (state vazio):', currentToken ? 'OK' : 'AUSENTE');
    } else {
      console.log('[Auth] 🔑 token do state:', 'OK');
    }
    return {
      'Authorization': `Bearer ${currentToken || ''}`,
      'Content-Type': 'application/json',
    };
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (response.ok) return { success: true };
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || 'Registration failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    console.log('[Auth] 🚪 Logout');
    await Promise.all([
      AsyncStorage.removeItem('@auth_token'),
      AsyncStorage.removeItem('@auth_user')
    ]);
    setToken(null);
    setUser(null);
  };

  const value = {
    user, token, login, register, logout, loading, getAuthHeaders
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
