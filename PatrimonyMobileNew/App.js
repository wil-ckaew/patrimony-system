// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';

// Import das telas
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import PatrimonyListScreen from './screens/PatrimonyListScreen';
import PatrimonyDetailScreen from './screens/PatrimonyDetailScreen';
import TransferScreen from './screens/TransferScreen';
import NewPatrimonyScreen from './screens/NewPatrimonyScreen';
import EditPatrimonyScreen from './screens/EditPatrimonyScreen'; // Adicionado

// Contexto de autenticação
import { AuthProvider, useAuth } from './contexts/AuthContext';

const Stack = createNativeStackNavigator();

function AppContent() {
  const { user, loading } = useAuth();

  // Enquanto carrega o estado de autenticação
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? 'Dashboard' : 'Login'}>
        {!user ? (
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen} 
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="PatrimonyList" 
              component={PatrimonyListScreen}
              options={{ title: 'Lista de Bens' }}
            />
            <Stack.Screen 
              name="PatrimonyDetail" 
              component={PatrimonyDetailScreen}
              options={{ title: 'Detalhes do Bem' }}
            />
            <Stack.Screen 
              name="Transfer" 
              component={TransferScreen}
              options={{ title: 'Transferir Bem' }}
            />
            <Stack.Screen 
              name="NewPatrimony" 
              component={NewPatrimonyScreen}
              options={{ title: 'Novo Bem Patrimonial' }}
            />
            <Stack.Screen 
              name="EditPatrimony" 
              component={EditPatrimonyScreen} // Adicionado
              options={{ title: 'Editar Bem Patrimonial' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppContent />
    </AuthProvider>
  );
}