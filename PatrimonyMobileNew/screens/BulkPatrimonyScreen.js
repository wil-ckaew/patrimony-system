// screens/BulkPatrimonyScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

export default function BulkPatrimonyScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNfDatePicker, setShowNfDatePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState('');
  
  // Estados para arquivos
  const [image, setImage] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [commitmentFile, setCommitmentFile] = useState(null);
  
  const [formData, setFormData] = useState({
    start_plate: '',
    end_plate: '',
    name: '',
    description: '',
    acquisition_date: '',
    value: '',
    department: '',
    status: 'active',
    sector: '',
    supplier: '',
    invoice_number: '',
    commitment_number: '',
    denf_se_number: '',
    nf_issue_date: '',
    is_vehicle: false
  });

  const { token } = useAuth();

  // Funções para selecionar arquivos
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const pickInvoiceFile = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setInvoiceFile(result.assets[0].uri);
    }
  };

  const pickCommitmentFile = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setCommitmentFile(result.assets[0].uri);
    }
  };

  const takePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Erro', 'Precisamos de permissão para usar a câmera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  // Função para fazer upload de um arquivo para um patrimônio específico
  const uploadFileToPatrimony = async (patrimonyId, fileUri, type) => {
    try {
      const formData = new FormData();
      const filename = fileUri.split('/').pop();
      let mimeType = 'image/jpeg';
      if (filename.endsWith('.png')) mimeType = 'image/png';
      if (filename.endsWith('.jpg')) mimeType = 'image/jpeg';

      formData.append(type === 'image' ? 'image' : 'document', {
        uri: fileUri,
        name: filename,
        type: mimeType,
      });

      let url;
      if (type === 'image') {
        url = `${API_BASE_URL}/api/patrimony/${patrimonyId}/image`;
      } else {
        url = `${API_BASE_URL}/api/patrimony/${patrimonyId}/document/${type}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      return response.ok;
    } catch (error) {
      console.error(`Erro ao enviar ${type}:`, error);
      return false;
    }
  };

  // Função para fazer upload em paralelo para todos os patrimônios
  const uploadFilesToAllPatrimonies = async (patrimonyIds) => {
    const uploadPromises = [];
    
    for (const patrimonyId of patrimonyIds) {
      if (image) {
        uploadPromises.push(uploadFileToPatrimony(patrimonyId, image, 'image'));
      }
      if (invoiceFile) {
        uploadPromises.push(uploadFileToPatrimony(patrimonyId, invoiceFile, 'invoice'));
      }
      if (commitmentFile) {
        uploadPromises.push(uploadFileToPatrimony(patrimonyId, commitmentFile, 'commitment'));
      }
    }
    
    // Executar todos os uploads em paralelo
    const results = await Promise.allSettled(uploadPromises);
    
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    const failCount = results.filter(r => r.status === 'rejected' || r.value === false).length;
    
    return { successCount, failCount, total: uploadPromises.length };
  };

  const showDatepicker = (field) => {
    setCurrentDateField(field);
    if (field === 'acquisition_date') {
      setShowDatePicker(true);
    } else if (field === 'nf_issue_date') {
      setShowNfDatePicker(true);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentField = currentDateField;
    
    if (currentField === 'acquisition_date') {
      setShowDatePicker(Platform.OS === 'ios');
    } else if (currentField === 'nf_issue_date') {
      setShowNfDatePicker(Platform.OS === 'ios');
    }

    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        [currentField]: formattedDate
      }));
    }
  };

  const handleSubmit = async () => {
    const start = parseInt(formData.start_plate);
    const end = parseInt(formData.end_plate);
    
    if (isNaN(start) || isNaN(end)) {
      Alert.alert('Erro', 'Informe os números inicial e final');
      return;
    }
    
    if (start > end) {
      Alert.alert('Erro', 'Número inicial deve ser menor que o final');
      return;
    }
    
    if (!formData.name.trim()) {
      Alert.alert('Erro', 'Nome do bem é obrigatório');
      return;
    }
    
    if (!formData.value || parseFloat(formData.value) <= 0) {
      Alert.alert('Erro', 'Valor deve ser maior que zero');
      return;
    }

    if (!formData.department) {
      Alert.alert('Erro', 'Departamento é obrigatório');
      return;
    }

    const totalItems = end - start + 1;
    Alert.alert(
      'Confirmar Cadastro em Massa',
      `📦 Você está prestes a cadastrar ${totalItems} patrimônios!\n\n🔢 Faixa: ${start} a ${end}\n📝 Nome: ${formData.name}\n💰 Valor: R$ ${parseFloat(formData.value).toFixed(2)}\n\n🖼️ ${image ? 'Com foto' : 'Sem foto'}\n📄 ${invoiceFile ? 'Com NF' : 'Sem NF'}\n📑 ${commitmentFile ? 'Com Empenho' : 'Sem Empenho'}\n\nOs arquivos serão anexados a TODOS os itens!\n\nDeseja continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: executeSubmit }
      ]
    );
  };

  const executeSubmit = async () => {
    setLoading(true);
    
    try {
      const start = parseInt(formData.start_plate);
      const end = parseInt(formData.end_plate);
      
      const payload = {
        start_plate: start,
        end_plate: end,
        name: formData.name.trim(),
        description: formData.description.trim(),
        acquisition_date: formData.acquisition_date || new Date().toISOString().split('T')[0],
        value: parseFloat(formData.value.replace(',', '.')) || 0,
        department: formData.department,
        status: formData.status,
        sector: formData.sector.trim() || undefined,
        supplier: formData.supplier.trim() || undefined,
        invoice_number: formData.invoice_number.trim() || undefined,
        commitment_number: formData.commitment_number.trim() || undefined,
        denf_se_number: formData.denf_se_number.trim() || undefined,
        nf_issue_date: formData.nf_issue_date || undefined,
        is_vehicle: formData.is_vehicle
      };

      console.log('📦 Enviando dados em massa:', payload);

      const response = await fetch(`${API_BASE_URL}/api/patrimony/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('📦 Resposta do servidor:', data);

      if (response.ok && data.inserted > 0 && data.inserted_ids && data.inserted_ids.length > 0) {
        
        // Se tem arquivos para upload, anexar a CADA patrimônio criado
        if (image || invoiceFile || commitmentFile) {
          console.log(`📤 Fazendo upload dos arquivos para ${data.inserted_ids.length} patrimônios...`);
          
          const { successCount, failCount, total } = await uploadFilesToAllPatrimonies(data.inserted_ids);
          
          console.log(`✅ Uploads concluídos: ${successCount} sucessos, ${failCount} falhas de ${total} total`);
          
          if (failCount > 0) {
            Alert.alert('Aviso', `${successCount} uploads realizados com sucesso, ${failCount} falhas. Os patrimônios foram criados, mas alguns arquivos podem não ter sido anexados.`);
          }
        }
        
        Alert.alert(
          '✅ Sucesso!', 
          `${data.inserted} patrimônios cadastrados com sucesso!\n\n📊 Total solicitado: ${data.total}\n${image || invoiceFile || commitmentFile ? `\n📎 Arquivos anexados a TODOS os ${data.inserted} itens!` : ''}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else if (response.ok && data.inserted > 0) {
        // Caso não tenha inserted_ids (back-end antigo)
        Alert.alert(
          '✅ Sucesso!', 
          `${data.inserted} patrimônios cadastrados com sucesso!\n\n⚠️ Não foi possível anexar os arquivos.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Erro', data.error || 'Erro ao cadastrar bens em massa');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Erro', `Erro ao cadastrar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const totalItems = formData.start_plate && formData.end_plate 
    ? parseInt(formData.end_plate) - parseInt(formData.start_plate) + 1
    : 0;

  const departments = [
    'Educação', 'Saúde', 'Administração', 'Urbanismo', 
    'Cultura', 'Esportes', 'Transporte', 'Finanças', 
    'Assistência Comunitária', 'Turismo', 'Meio Ambiente'
  ];

  const statusOptions = [
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' },
    { value: 'maintenance', label: 'Manutenção' },
    { value: 'written_off', label: 'Baixado' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📦 Cadastro em Massa</Text>
        <Text style={styles.subtitle}>Cadastre vários bens de uma só vez</Text>
      </View>

      <View style={styles.form}>
        {/* Faixa de Numeração */}
        <View style={styles.rangeCard}>
          <Text style={styles.rangeTitle}>🔢 Faixa de Numeração</Text>
          <View style={styles.rangeRow}>
            <View style={styles.rangeInput}>
              <Text style={styles.rangeLabel}>Inicial</Text>
              <TextInput
                style={styles.input}
                value={formData.start_plate}
                onChangeText={(text) => setFormData({ ...formData, start_plate: text })}
                placeholder="Ex: 28436"
                keyboardType="numeric"
                editable={!loading}
              />
            </View>
            <View style={styles.rangeInput}>
              <Text style={styles.rangeLabel}>Final</Text>
              <TextInput
                style={styles.input}
                value={formData.end_plate}
                onChangeText={(text) => setFormData({ ...formData, end_plate: text })}
                placeholder="Ex: 28570"
                keyboardType="numeric"
                editable={!loading}
              />
            </View>
          </View>
          {totalItems > 0 && (
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>
                📊 Serão gerados {totalItems} patrimônios
              </Text>
            </View>
          )}
        </View>

        {/* Seção de Arquivos (opcional) */}
        <View style={styles.fileSection}>
          <Text style={styles.sectionTitle}>📎 Anexos (Opcional)</Text>
          <Text style={styles.sectionSubtitle}>
            Os arquivos serão anexados a TODOS os bens da faixa
          </Text>
          
          {/* Foto do Bem */}
          <Text style={styles.fileLabel}>🖼️ Foto do Bem</Text>
          <View style={styles.fileButtons}>
            <TouchableOpacity style={styles.fileButton} onPress={takePicture}>
              <Text style={styles.fileButtonText}>📷 Tirar Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fileButton} onPress={pickImage}>
              <Text style={styles.fileButtonText}>🖼️ Galeria</Text>
            </TouchableOpacity>
          </View>
          {image && (
            <View style={styles.filePreview}>
              <Image source={{ uri: image }} style={styles.previewImage} />
              <TouchableOpacity onPress={() => setImage(null)} style={styles.removeFile}>
                <Text style={styles.removeFileText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Nota Fiscal */}
          <Text style={styles.fileLabel}>📄 Nota Fiscal</Text>
          <View style={styles.fileButtons}>
            <TouchableOpacity style={styles.fileButton} onPress={pickInvoiceFile}>
              <Text style={styles.fileButtonText}>📎 Selecionar Arquivo</Text>
            </TouchableOpacity>
          </View>
          {invoiceFile && (
            <View style={styles.filePreview}>
              <Text style={styles.fileName}>📄 NF selecionada</Text>
              <TouchableOpacity onPress={() => setInvoiceFile(null)} style={styles.removeFile}>
                <Text style={styles.removeFileText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Empenho */}
          <Text style={styles.fileLabel}>📑 Empenho</Text>
          <View style={styles.fileButtons}>
            <TouchableOpacity style={styles.fileButton} onPress={pickCommitmentFile}>
              <Text style={styles.fileButtonText}>📎 Selecionar Arquivo</Text>
            </TouchableOpacity>
          </View>
          {commitmentFile && (
            <View style={styles.filePreview}>
              <Text style={styles.fileName}>📑 Empenho selecionado</Text>
              <TouchableOpacity onPress={() => setCommitmentFile(null)} style={styles.removeFile}>
                <Text style={styles.removeFileText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.label}>Nome do Bem *</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Ex: Computador, Cadeira, Mesa"
          editable={!loading}
        />

        <Text style={styles.label}>Valor Unitário (R$) *</Text>
        <TextInput
          style={styles.input}
          value={formData.value}
          onChangeText={(text) => setFormData({ ...formData, value: text })}
          placeholder="0,00"
          keyboardType="numeric"
          editable={!loading}
        />

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="Descrição detalhada do bem..."
          multiline
          numberOfLines={3}
          editable={!loading}
        />

        <Text style={styles.label}>Data de Aquisição *</Text>
        <TouchableOpacity 
          style={styles.dateInput}
          onPress={() => showDatepicker('acquisition_date')}
          disabled={loading}
        >
          <Text style={formData.acquisition_date ? styles.dateText : styles.placeholderText}>
            {formData.acquisition_date || 'Selecionar data'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Departamento *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.departmentScroll}>
          {departments.map(dept => (
            <TouchableOpacity
              key={dept}
              style={[
                styles.departmentButton,
                formData.department === dept && styles.departmentButtonSelected
              ]}
              onPress={() => setFormData({ ...formData, department: dept })}
              disabled={loading}
            >
              <Text style={styles.departmentButtonText}>{dept}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Status</Text>
        <View style={styles.statusContainer}>
          {statusOptions.map(status => (
            <TouchableOpacity
              key={status.value}
              style={[
                styles.statusButton,
                formData.status === status.value && styles.statusButtonSelected
              ]}
              onPress={() => setFormData({ ...formData, status: status.value })}
              disabled={loading}
            >
              <Text style={styles.statusButtonText}>{status.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Setor (Opcional)</Text>
        <TextInput
          style={styles.input}
          value={formData.sector}
          onChangeText={(text) => setFormData({ ...formData, sector: text })}
          placeholder="Ex: Almoxarifado, Sala 101"
          editable={!loading}
        />

        <Text style={styles.label}>Fornecedor (Opcional)</Text>
        <TextInput
          style={styles.input}
          value={formData.supplier}
          onChangeText={(text) => setFormData({ ...formData, supplier: text })}
          placeholder="Nome do fornecedor"
          editable={!loading}
        />

        <Text style={styles.label}>N° Nota Fiscal (Opcional)</Text>
        <TextInput
          style={styles.input}
          value={formData.invoice_number}
          onChangeText={(text) => setFormData({ ...formData, invoice_number: text })}
          placeholder="Número da NF"
          editable={!loading}
        />

        <Text style={styles.label}>N° Empenho (Opcional)</Text>
        <TextInput
          style={styles.input}
          value={formData.commitment_number}
          onChangeText={(text) => setFormData({ ...formData, commitment_number: text })}
          placeholder="Número do empenho"
          editable={!loading}
        />

        <Text style={styles.label}>Data Emissão NF (Opcional)</Text>
        <TouchableOpacity 
          style={styles.dateInput}
          onPress={() => showDatepicker('nf_issue_date')}
          disabled={loading}
        >
          <Text style={formData.nf_issue_date ? styles.dateText : styles.placeholderText}>
            {formData.nf_issue_date || 'Selecionar data'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              🚀 Cadastrar {totalItems} Bens
            </Text>
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

      {/* Date Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.acquisition_date ? new Date(formData.acquisition_date) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      {showNfDatePicker && (
        <DateTimePicker
          value={formData.nf_issue_date ? new Date(formData.nf_issue_date) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    height: 48,
  },
  dateText: {
    fontSize: 16,
    color: '#374151',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  rangeCard: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  rangeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 12,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rangeInput: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#1e3a8a',
    marginBottom: 4,
    fontWeight: '500',
  },
  totalBadge: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  totalBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  fileSection: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#b45309',
    marginBottom: 12,
  },
  fileLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginTop: 12,
    marginBottom: 6,
  },
  fileButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  fileButton: {
    backgroundColor: '#f59e0b',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  fileButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff7ed',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  fileName: {
    fontSize: 12,
    color: '#92400e',
    flex: 1,
  },
  removeFile: {
    backgroundColor: '#ef4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeFileText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  departmentScroll: {
    marginVertical: 8,
    marginBottom: 16,
  },
  departmentButton: {
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  departmentButtonSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  departmentButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
    marginBottom: 16,
  },
  statusButton: {
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusButtonSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  statusButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});