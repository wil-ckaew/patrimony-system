// screens/NewPatrimonyScreen.js
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
  Image,
  Platform,
  Linking
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

export default function NewPatrimonyScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNfDatePicker, setShowNfDatePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState('');
  
  const [formData, setFormData] = useState({
    plate: '',
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
  });

  const { token } = useAuth();

  const verifyPermissions = async () => {
    try {
      // Verifica e solicita permissões da câmera
      const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
      
      if (cameraPermission.status !== 'granted') {
        const newCameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        
        if (newCameraPermission.status !== 'granted') {
          Alert.alert(
            'Permissão necessária',
            'Você precisa conceder permissão para usar a câmera para tirar fotos dos bens.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Abrir Configurações', onPress: () => Linking.openSettings() }
            ]
          );
          return false;
        }
      }

      // Verifica e solicita permissões da galeria (apenas para iOS)
      if (Platform.OS === 'ios') {
        const galleryPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
        
        if (galleryPermission.status !== 'granted') {
          const newGalleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          
          if (newGalleryPermission.status !== 'granted') {
            Alert.alert(
              'Permissão necessária',
              'Você precisa conceder permissão para acessar a galeria para selecionar fotos.',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Abrir Configurações', onPress: () => Linking.openSettings() }
              ]
            );
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  };

  const takePicture = async () => {
    const hasPermission = await verifyPermissions();
    
    if (!hasPermission) {
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'], // Corrigido: usando array em vez de ImagePicker.MediaTypeOptions.Images
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir a câmera');
    }
  };

  const pickImage = async () => {
    const hasPermission = await verifyPermissions();
    
    if (!hasPermission) {
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Corrigido: usando array em vez de ImagePicker.MediaTypeOptions.Images
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
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

  const uploadImageToPatrimony = async (patrimonyId, imageUri) => {
    try {
      // Criar FormData corretamente
      const formData = new FormData();
      
      // Obter o nome do arquivo da URI
      const filename = imageUri.split('/').pop();
      
      // Determinar o tipo MIME com base na extensão do arquivo
      let type = 'image/jpeg';
      if (filename.endsWith('.png')) type = 'image/png';
      if (filename.endsWith('.gif')) type = 'image/gif';
      
      // Adicionar a imagem ao FormData
      formData.append('image', {
        uri: imageUri,
        name: filename,
        type: type,
      });
      
      console.log('Enviando imagem para:', `${API_BASE_URL}/api/patrimony/${patrimonyId}/image`);
      
      const uploadResponse = await fetch(`${API_BASE_URL}/api/patrimony/${patrimonyId}/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Não definir Content-Type, o fetch irá definir automaticamente com o boundary
        },
        body: formData,
      });
      
      if (uploadResponse.ok) {
        console.log('✅ Imagem enviada com sucesso');
        const responseData = await uploadResponse.json();
        console.log('Resposta do servidor:', responseData);
      } else {
        const errorText = await uploadResponse.text();
        console.log('❌ Falha no envio da imagem:', uploadResponse.status, errorText);
      }
    } catch (error) {
      console.log('❌ Erro ao enviar imagem:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.plate || !formData.name || !formData.department) {
      Alert.alert('Erro', 'Preencha pelo menos placa, nome e departamento');
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        plate: formData.plate.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        acquisition_date: formData.acquisition_date || new Date().toISOString().split('T')[0],
        value: formData.value ? parseFloat(formData.value.replace(',', '.')) : 0,
        department: formData.department,
        status: formData.status,
        sector: formData.sector.trim() || undefined,
        supplier: formData.supplier.trim() || undefined,
        invoice_number: formData.invoice_number.trim() || undefined,
        commitment_number: formData.commitment_number.trim() || undefined,
        denf_se_number: formData.denf_se_number.trim() || undefined,
        nf_issue_date: formData.nf_issue_date || undefined,
      };

      console.log('Enviando dados:', payload);

      const response = await fetch(`${API_BASE_URL}/api/patrimony`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('Resposta do servidor ao criar patrimônio:', responseData);
        
        // Se há imagem, tenta enviar separadamente após criar o bem
        if (image) {
          try {
            const patrimonyId = responseData.id;
            
            if (patrimonyId) {
              await uploadImageToPatrimony(patrimonyId, image);
            }
          } catch (imageError) {
            console.log('Imagem não pode ser enviada, mas o bem foi salvo');
          }
        }
        
        Alert.alert('Sucesso', 'Bem cadastrado com sucesso!');
        navigation.goBack();
      } else {
        const errorText = await response.text();
        Alert.alert('Erro', errorText || 'Erro ao cadastrar bem');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Erro', 'Erro de conexão. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const departments = [
    'education', 'health', 'administration', 'urbanism', 
    'culture', 'sports', 'transportation', 'finance', 
    'assistenci', 'tourism', 'environment'
  ];

  const statusOptions = [
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' },
    { value: 'maintenance', label: 'Manutenção' },
    { value: 'written_off', label: 'Baixado' },
  ];

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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cadastrar Novo Bem</Text>
      </View>

      <View style={styles.form}>
        {/* Seção de Foto (Opcional) */}
        <Text style={styles.label}>Foto do Bem (Opcional)</Text>
        <View style={styles.imageSection}>
          {image ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={removeImage}
                disabled={loading}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imageButtons}>
              <TouchableOpacity 
                style={styles.imageButton}
                onPress={takePicture}
                disabled={loading}
              >
                <Text style={styles.imageButtonText}>📷 Tirar Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.imageButton}
                onPress={pickImage}
                disabled={loading}
              >
                <Text style={styles.imageButtonText}>🖼️ Galeria</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.label}>Placa *</Text>
        <TextInput
          style={styles.input}
          value={formData.plate}
          onChangeText={(text) => setFormData({ ...formData, plate: text })}
          placeholder="Ex: PAT-001"
          editable={!loading}
        />

        <Text style={styles.label}>Nome *</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Nome do bem patrimonial"
          editable={!loading}
        />

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="Descrição detalhada do bem"
          multiline
          numberOfLines={3}
          editable={!loading}
        />

        {/* Data de Aquisição com DatePicker */}
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

        {/* Data de Emissão NF com DatePicker */}
        <Text style={styles.label}>Data emissão NF (Opcional)</Text>
        <TouchableOpacity 
          style={styles.dateInput}
          onPress={() => showDatepicker('nf_issue_date')}
          disabled={loading}
        >
          <Text style={formData.nf_issue_date ? styles.dateText : styles.placeholderText}>
            {formData.nf_issue_date || 'Selecionar data'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Valor (R$)</Text>
        <TextInput
          style={styles.input}
          value={formData.value}
          onChangeText={(text) => setFormData({ ...formData, value: text })}
          placeholder="0.00"
          keyboardType="numeric"
          editable={!loading}
        />

        <Text style={styles.label}>Departamento *</Text>
        <ScrollView horizontal style={styles.departmentScroll}>
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
              <Text style={styles.departmentButtonText}>
                {getDepartmentName(dept)}
              </Text>
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
          placeholder="Setor específico"
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

        <Text style={styles.label}>Número da Nota Fiscal (Opcional)</Text>
        <TextInput
          style={styles.input}
          value={formData.invoice_number}
          onChangeText={(text) => setFormData({ ...formData, invoice_number: text })}
          placeholder="Opcional"
          editable={!loading}
        />

        <Text style={styles.label}>Número do Empenho (Opcional)</Text>
        <TextInput
          style={styles.input}
          value={formData.commitment_number}
          onChangeText={(text) => setFormData({ ...formData, commitment_number: text })}
          placeholder="Opcional"
          editable={!loading}
        />

        <Text style={styles.label}>Número DENF/SE (Opcional)</Text>
        <TextInput
          style={styles.input}
          value={formData.denf_se_number}
          onChangeText={(text) => setFormData({ ...formData, denf_se_number: text })}
          placeholder="Opcional"
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              Cadastrar Bem
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
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
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  dateInput: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imageSection: {
    marginBottom: 20,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  imageButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#ef4444',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  departmentScroll: {
    marginVertical: 8,
    marginBottom: 16,
  },
  departmentButton: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
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
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
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