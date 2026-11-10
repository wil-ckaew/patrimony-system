// screens/PatrimonyDetailScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

// Alerta compatível com web e mobile
const showAlert = (title, message, onOk) => {
  if (Platform.OS === 'web') {
    try { window.alert(`${title}\n\n${message}`); } catch (e) {}
    if (onOk) onOk();
  } else {
    Alert.alert(title, message, [{ text: 'OK', onPress: onOk }], { cancelable: false });
  }
};

const showConfirm = (title, message, onConfirm, onCancel) => {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed && onConfirm) onConfirm();
    else if (!confirmed && onCancel) onCancel();
  } else {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancelar', style: 'cancel', onPress: onCancel },
        { text: 'Excluir', style: 'destructive', onPress: onConfirm }
      ]
    );
  }
};

export default function PatrimonyDetailScreen({ route, navigation }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const { item } = route.params;

  // DEBUG: ver o que chega no Detail
  if (Platform.OS === 'web') {
  }
  const { token } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'Não informada';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleEdit = () => {
    navigation.navigate('EditPatrimony', { patrimony: item });
  };

  const viewFile = async (fileUrl, fileName) => {
    if (!fileUrl) {
      showAlert('Arquivo não disponível', `O arquivo ${fileName} não está disponível.`);
      return;
    }
    try {
      const url = `${API_BASE_URL}${fileUrl}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showAlert('Erro', 'Não é possível abrir este tipo de arquivo.');
      }
    } catch (error) {
      console.error('Erro ao abrir arquivo:', error);
      showAlert('Erro', 'Não foi possível abrir o arquivo.');
    }
  };

  const goBackToList = () => {
    try {
      if (navigation.canGoBack && navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Patrimonies');
      }
    } catch (e) {
      try { navigation.navigate('Patrimonies'); } catch (e2) {}
    }
  };

  // ============================================================
  // EXCLUIR BEM
  // ============================================================
  const handleDelete = () => {
    console.log('[Detail] 🗑️ Botão excluir clicado');
    showConfirm(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir "${item.name}"? Esta ação não pode ser desfeita.`,
      async () => {
        console.log('[Detail] ✅ Usuário confirmou exclusão');
        setDeleting(true);
        try {
          const url = `${API_BASE_URL}/api/patrimony/${item.id}`;
          console.log('[Detail] 🌐 DELETE', url);

          const response = await fetch(url, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });

          console.log('[Detail] 📡 Status:', response.status);

          if (response.ok) {
            console.log('[Detail] ✅ Excluído com sucesso');
            showAlert('Sucesso', 'Bem excluído com sucesso!', () => {
              goBackToList();
            });
          } else {
            const errorText = await response.text();
            console.log('[Detail] ❌ Erro do servidor:', errorText);
            showAlert('Erro', errorText || 'Não foi possível excluir o bem.');
          }
        } catch (error) {
          console.error('[Detail] ❌ Exception:', error);
          showAlert('Erro', `Erro de conexão: ${error.message}`);
        } finally {
          setDeleting(false);
        }
      }
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
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
              onPress={() => viewFile(item.denfFile, 'DENF/SE')}
              disabled={!item.denfFile}
            >
              <Text style={[styles.infoValue, item.denfFile && styles.link]}>
                {item.denfSeNumber || 'Não informado'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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

        {/* BOTÕES DE AÇÃO */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
            disabled={deleting}
          >
            <Text style={styles.editButtonText}>Editar Bem</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.transferButton}
            onPress={() => navigation.navigate('Transfer', { item })}
            disabled={deleting}
          >
            <Text style={styles.transferButtonText}>Transferir Bem</Text>
          </TouchableOpacity>
        </View>

        {/* BOTÃO EXCLUIR */}
        <View style={styles.deleteContainer}>
          <TouchableOpacity
            style={[styles.deleteButton, deleting && styles.buttonDisabled]}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.deleteButtonText}>🗑️ Excluir Bem</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  card: {
    backgroundColor: 'white', margin: 16, borderRadius: 12,
    overflow: 'hidden', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5,
  },
  image: { width: '100%', height: 200 },
  noImageContainer: {
    width: '100%', height: 200, backgroundColor: '#e5e7eb',
    justifyContent: 'center', alignItems: 'center',
  },
  noImageText: { color: '#6b7280', fontSize: 16 },
  header: {
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 8,
  },
  plate: { fontSize: 18, color: '#64748b', fontWeight: '600' },
  section: {
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16, color: '#6b7280', fontWeight: '500', flex: 1,
  },
  infoValue: {
    fontSize: 16, color: '#374151', fontWeight: '400', flex: 2, textAlign: 'right',
  },
  link: { color: '#2563eb', textDecorationLine: 'underline' },
  status: {
    fontWeight: '600', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 4, overflow: 'hidden',
  },
  statusActive: { backgroundColor: '#dcfce7', color: '#166534' },
  statusInactive: { backgroundColor: '#fee2e2', color: '#991b1b' },
  statusMaintenance: { backgroundColor: '#fef3c7', color: '#92400e' },
  statusWrittenOff: { backgroundColor: '#e5e7eb', color: '#374151' },
  actions: {
    padding: 20, flexDirection: 'row',
    justifyContent: 'space-between', gap: 12,
  },
  editButton: {
    flex: 1, backgroundColor: '#2563eb', padding: 16,
    borderRadius: 8, alignItems: 'center',
  },
  editButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  transferButton: {
    flex: 1, backgroundColor: '#059669', padding: 16,
    borderRadius: 8, alignItems: 'center',
  },
  transferButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  deleteContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  deleteButton: {
    backgroundColor: '#dc2626', padding: 16,
    borderRadius: 8, alignItems: 'center',
  },
  deleteButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
});
