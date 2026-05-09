// components/PatrimonyCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { API_BASE_URL } from '../config';

export default function PatrimonyCard({ item, onPress }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'inactive': return '#ef4444';
      case 'maintenance': return '#f59e0b';
      case 'written_off': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'maintenance': return 'Manutenção';
      case 'written_off': return 'Baixado';
      default: return status;
    }
  };

  const getDepartmentName = (dept) => {
    const departmentNames = {
      'education': 'Educação',
      'health': 'Saúde',
      'administration': 'Administração',
      'urbanism': 'Urbanismo',
      'culture': 'Cultura',
      'sports': 'Esportes',
      'transportation': 'Transporte',
      'finance': 'Finanças',
      'assistenci': 'Assistencia Comunitaria',
      'tourism': 'Turismo',
      'environment': 'Meio Ambiente',
    };
    return departmentNames[dept] || dept;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {item.imageUrl ? (
        <Image 
          source={{ uri: `${API_BASE_URL}${item.imageUrl}` }} 
          style={styles.image}
          resizeMode="cover"
          onError={(e) => console.log('Erro ao carregar imagem:', e.nativeEvent.error)}
        />
      ) : (
        <View style={styles.noImageContainer}>
          <Text style={styles.noImageText}>Sem imagem</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.plate}>{item.plate}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        
        <Text style={styles.name}>{item.name}</Text>
        
        <View style={styles.details}>
          <Text style={styles.detailText}>{getDepartmentName(item.department)}</Text>
          {item.sector && <Text style={styles.detailText}>• {item.sector}</Text>}
        </View>
        
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        {item.value > 0 && (
          <Text style={styles.value}>
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(item.value)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: 150,
  },
  noImageContainer: {
    width: '100%',
    height: 150,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#6b7280',
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  plate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  details: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
});