import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export default function App() {
  const [patrimonies, setPatrimonies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatrimonies();
  }, []);

  const fetchPatrimonies = async () => {
    try {
      const response = await axios.get(`${API_URL}/patrimony`);
      setPatrimonies(response.data);
    } catch (error) {
      console.error('Error fetching patrimonies:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      )}
      <View style={styles.details}>
        <Text style={styles.name}>{item.name}</Text>
        <Text>Placa: {item.plate}</Text>
        <Text>Departamento: {item.department}</Text>
        <Text>Valor: R$ {item.value.toFixed(2)}</Text>
        <Text>Status: {item.status}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patrimônio Municipal</Text>
      <FlatList
        data={patrimonies}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
});