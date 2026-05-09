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
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('@auth_token'),
        AsyncStorage.getItem('@auth_user')
      ]);
      
      if (storedToken && storedUser) {
        // Verificar se o token ainda é válido
        const isValid = await validateToken(storedToken);
        if (isValid) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } else {
          await logout();
        }
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const validateToken = async (tokenToValidate) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/validate-token`, {
        headers: {
          'Authorization': `Bearer ${tokenToValidate}`,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Network error' };
    }
  };

  // Adicionar função para obter headers autenticados
  const getAuthHeaders = async () => {
    const currentToken = token || await AsyncStorage.getItem('@auth_token');
    return {
      'Authorization': `Bearer ${currentToken}`,
      'Content-Type': 'application/json',
    };
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    await Promise.all([
      AsyncStorage.removeItem('@auth_token'),
      AsyncStorage.removeItem('@auth_user')
    ]);
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    getAuthHeaders // Adicionar esta função ao contexto
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}