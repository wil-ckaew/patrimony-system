import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Importar telas
import HomeScreen from '../screens/HomeScreen';
import PatrimoniesScreen from '../screens/PatrimoniesScreen';
import FleetScreen from '../screens/FleetScreen';
import LeiloesScreen from '../screens/LeiloesScreen';
import LeilaoDetalhesScreen from '../screens/LeilaoDetalhesScreen';
import NovoLeilaoScreen from '../screens/NovoLeilaoScreen';
import AdicionarVeiculoLeilaoScreen from '../screens/AdicionarVeiculoLeilaoScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Stack de Leilões
function LeiloesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="LeiloesList" component={LeiloesScreen} />
      <Stack.Screen name="LeilaoDetalhes" component={LeilaoDetalhesScreen} />
      <Stack.Screen name="NovoLeilao" component={NovoLeilaoScreen} />
      <Stack.Screen name="AdicionarVeiculoLeilao" component={AdicionarVeiculoLeilaoScreen} />
    </Stack.Navigator>
  );
}

// Tabs principais
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Patrimonies') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Fleet') {
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'Leiloes') {
            iconName = focused ? 'hammer' : 'hammer-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1e3a8a',
        tabBarInactiveTintColor: '#6b7280',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Início' }}
      />
      <Tab.Screen 
        name="Patrimonies" 
        component={PatrimoniesScreen} 
        options={{ title: 'Patrimônio' }}
      />
      <Tab.Screen 
        name="Fleet" 
        component={FleetScreen} 
        options={{ title: 'Frota' }}
      />
      <Tab.Screen 
        name="Leiloes" 
        component={LeiloesStack} 
        options={{ title: 'Leilões' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}
