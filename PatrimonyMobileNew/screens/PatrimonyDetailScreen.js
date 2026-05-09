// screens/PatrimonyDetailScreen.js
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Linking
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

export default function PatrimonyDetailScreen({ route, navigation }) {
  const { item } = route.params;
  const { token } = useAuth();

  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return 'Não informada';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função para formatar valor monetário
  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para navegar para a tela de edição
  const handleEdit = () => {
    navigation.navigate('EditPatrimony', { patrimony: item });
  };

  // Função para visualizar arquivo
  const viewFile = async (fileUrl, fileName) => {
    if (!fileUrl) {
      Alert.alert('Arquivo não disponível', `O arquivo ${fileName} não está disponível.`);
      return;
    }

    try {
      const url = `${API_BASE_URL}${fileUrl}`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erro', 'Não é possível abrir este tipo de arquivo.');
      }
    } catch (error) {
      console.error('Erro ao abrir arquivo:', error);
      Alert.alert('Erro', 'Não foi possível abrir o arquivo.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {/* Cabeçalho com imagem */}
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

        <View style={styles.header}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.plate}>{item.plate}</Text>
        </View>

        {/* Informações principais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Principais</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Descrição:</Text>
            <Text style={styles.infoValue}>{item.description || 'Não informada'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Departamento:</Text>
            <Text style={styles.infoValue}>{item.department}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Setor:</Text>
            <Text style={styles.infoValue}>{item.sector || 'Não informado'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[
              styles.infoValue,
              styles.status,
              item.status === 'active' ? styles.statusActive : 
              item.status === 'inactive' ? styles.statusInactive :
              item.status === 'maintenance' ? styles.statusMaintenance :
              styles.statusWrittenOff
            ]}>
              {item.status === 'active' ? 'Ativo' : 
               item.status === 'inactive' ? 'Inativo' :
               item.status === 'maintenance' ? 'Manutenção' : 'Baixado'}
            </Text>
          </View>
        </View>

        {/* Informações financeiras */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Financeiras</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Valor:</Text>
            <Text style={styles.infoValue}>{formatCurrency(item.value)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data de Aquisição:</Text>
            <Text style={styles.infoValue}>{formatDate(item.acquisitionDate)}</Text>
          </View>
        </View>

        {/* Documentos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documentos</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nota Fiscal:</Text>
            <TouchableOpacity 
              onPress={() => viewFile(item.invoiceFile, 'Nota Fiscal')}
              disabled={!item.invoiceFile}
            >
              <Text style={[styles.infoValue, item.invoiceFile && styles.link]}>
                {item.invoiceNumber || 'Não informada'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Empenho:</Text>
            <TouchableOpacity 
              onPress={() => viewFile(item.commitmentFile, 'Empenho')}
              disabled={!item.commitmentFile}
            >
              <Text style={[styles.infoValue, item.commitmentFile && styles.link]}>
                {item.commitmentNumber || 'Não informado'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>DENF/SE:</Text>
            <TouchableOpacity 
              onPress={() => viewFile(item.denfSeFile, 'DENF/SE')}
              disabled={!item.denfSeFile}
            >
              <Text style={[styles.infoValue, item.denfSeFile && styles.link]}>
                {item.denfSeNumber || 'Não informado'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fornecedor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fornecedor</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nome:</Text>
            <Text style={styles.infoValue}>{item.supplier || 'Não informado'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data de Emissão NF:</Text>
            <Text style={styles.infoValue}>{formatDate(item.nfIssueDate)}</Text>
          </View>
        </View>

        {/* Botões de ação */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEdit}
          >
            <Text style={styles.editButtonText}>Editar Bem</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.transferButton}
            onPress={() => navigation.navigate('Transfer', { item })}
          >
            <Text style={styles.transferButtonText}>Transferir Bem</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
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
    height: 200,
  },
  noImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#6b7280',
    fontSize: 16,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  plate: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '600',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '400',
    flex: 2,
    textAlign: 'right',
  },
  link: {
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  status: {
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  statusActive: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusInactive: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  statusMaintenance: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusWrittenOff: {
    backgroundColor: '#e5e7eb',
    color: '#374151',
  },
  actions: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  transferButton: {
    flex: 1,
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  transferButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});