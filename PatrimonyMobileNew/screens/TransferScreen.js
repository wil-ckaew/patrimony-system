// screens/TransferScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

export default function TransferScreen({ route, navigation }) {
  const { item } = route.params;
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    target_department: '',
    target_sector: '',
    notes: ''
  });
  const { token } = useAuth();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/departments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleTransfer = async () => {
    if (!formData.target_department) {
      Alert.alert('Erro', 'Selecione o departamento de destino');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/patrimony/${item.id}/transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_department: formData.target_department,
          target_sector: formData.target_sector,
          notes: formData.notes
        }),
      });

      if (response.ok) {
        Alert.alert('Sucesso', 'Bem transferido com sucesso!');
        navigation.goBack();
      } else {
        const errorText = await response.text();
        Alert.alert('Erro', errorText || 'Erro ao transferir o bem');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro de conexão');
      console.error('Error transferring patrimony:', error);
    } finally {
      setLoading(false);
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
      'environment': 'Meio Ambiente'
    };
    return departmentNames[dept] || dept;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transferir Bem</Text>
        <Text style={styles.subtitle}>{item.name} - {item.plate}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Departamento Atual:</Text>
        <Text style={styles.infoValue}>{getDepartmentName(item.department)}</Text>
        
        {item.sector && (
          <>
            <Text style={styles.infoLabel}>Setor Atual:</Text>
            <Text style={styles.infoValue}>{item.sector}</Text>
          </>
        )}
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Departamento de Destino *</Text>
        <View style={styles.selectContainer}>
          {departments.map(dept => (
            <TouchableOpacity
              key={dept}
              style={[
                styles.optionButton,
                formData.target_department === dept && styles.optionButtonSelected
              ]}
              onPress={() => setFormData({ ...formData, target_department: dept })}
              disabled={loading}
            >
              <Text style={styles.optionText}>{getDepartmentName(dept)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Novo Setor (opcional)</Text>
        <TextInput
          style={styles.input}
          value={formData.target_sector}
          onChangeText={(text) => setFormData({ ...formData, target_sector: text })}
          placeholder="Digite o novo setor"
          editable={!loading}
        />

        <Text style={styles.label}>Observações (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          placeholder="Digite observações sobre a transferência"
          multiline
          numberOfLines={3}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleTransfer}
          disabled={loading || !formData.target_department}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Confirmar Transferência</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelButton, loading && styles.buttonDisabled]}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
    marginBottom: 12,
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
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
  selectContainer: {
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  optionButtonSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#dbeafe',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});