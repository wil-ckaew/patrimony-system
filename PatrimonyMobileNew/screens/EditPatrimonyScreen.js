// screens/EditPatrimonyScreen.js
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
  Keyboard,
  Linking
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

export default function EditPatrimonyScreen({ route, navigation }) {
  const { patrimony } = route.params;
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(patrimony.imageUrl || null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNfDatePicker, setShowNfDatePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState('');

  const [formData, setFormData] = useState({
    plate: patrimony.plate || '',
    name: patrimony.name || '',
    description: patrimony.description || '',
    acquisition_date: patrimony.acquisitionDate || '',
    value: patrimony.value ? patrimony.value.toString() : '',
    department: patrimony.department || '',
    status: patrimony.status || 'active',
    sector: patrimony.sector || '',
    supplier: patrimony.supplier || '',
    invoice_number: patrimony.invoiceNumber || '',
    commitment_number: patrimony.commitmentNumber || '',
    denf_se_number: patrimony.denfSeNumber || '',
    nf_issue_date: patrimony.nfIssueDate || '',
  });

  const { token } = useAuth();

  const verifyPermissions = async () => {
    try {
      // Câmera
      const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        const newCameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (newCameraPermission.status !== 'granted') {
          Alert.alert(
            'Permissão necessária',
            'Você precisa conceder permissão para usar a câmera.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Abrir Configurações', onPress: () => Linking.openSettings() }
            ]
          );
          return false;
        }
      }

      // Galeria
      const galleryPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (galleryPermission.status !== 'granted') {
        const newGalleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (newGalleryPermission.status !== 'granted') {
          Alert.alert(
            'Permissão necessária',
            'Você precisa conceder permissão para acessar a galeria.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Abrir Configurações', onPress: () => Linking.openSettings() }
            ]
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  };

  const extractUriFromResult = (result) => {
    if (result?.canceled === false && result?.assets && result.assets[0]?.uri) {
      return result.assets[0].uri;
    }
    if (result?.cancelled === false && result?.uri) {
      return result.uri;
    }
    return null;
  };

  const takePicture = async () => {
    const hasPermission = await verifyPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      const uri = extractUriFromResult(result);
      if (uri) setImage(uri);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir a câmera');
      console.error('takePicture error', error);
    }
  };

  const pickImage = async () => {
    const hasPermission = await verifyPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      const uri = extractUriFromResult(result);
      if (uri) setImage(uri);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
      console.error('pickImage error', error);
    }
  };

  const showDatepicker = (field) => {
    Keyboard.dismiss();
    setCurrentDateField(field);
    if (field === 'acquisition_date') setShowDatePicker(true);
    if (field === 'nf_issue_date') setShowNfDatePicker(true);
  };

  const onDateChange = (event, selectedDate) => {
    const currentField = currentDateField;
    if (currentField === 'acquisition_date') setShowDatePicker(Platform.OS === 'ios');
    if (currentField === 'nf_issue_date') setShowNfDatePicker(Platform.OS === 'ios');

    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, [currentField]: formattedDate }));
    }
  };

  const uploadImageToPatrimony = async (patrimonyId, imageUri) => {
    try {
      const formData = new FormData();
      
      // Adiciona timestamp ao nome do arquivo para evitar problemas de cache
      const filename = imageUri.split('/').pop();
      const uniqueFilename = `${Date.now()}_${filename}`;
      
      let type = 'image/jpeg';
      if (filename.toLowerCase().endsWith('.png')) type = 'image/png';
      if (filename.toLowerCase().endsWith('.gif')) type = 'image/gif';

      formData.append('image', {
        uri: imageUri,
        name: uniqueFilename,
        type,
      });

      console.log('Enviando imagem para:', `${API_BASE_URL}/api/patrimony/${patrimonyId}/image`);

      const uploadResponse = await fetch(`${API_BASE_URL}/api/patrimony/${patrimonyId}/image`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      if (uploadResponse.ok) {
        console.log('✅ Imagem enviada com sucesso');
        return true;
      } else {
        const errorText = await uploadResponse.text();
        console.log('❌ Falha no upload:', uploadResponse.status, errorText);
        return false;
      }
    } catch (error) {
      console.log('❌ Erro ao enviar imagem:', error);
      return false;
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
        description: formData.description?.trim() || '',
        acquisition_date: formData.acquisition_date || null,
        value: formData.value ? parseFloat(formData.value.replace(',', '.')) : 0,
        department: formData.department,
        status: formData.status,
        sector: formData.sector?.trim() || null,
        supplier: formData.supplier?.trim() || null,
        invoice_number: formData.invoice_number?.trim() || null,
        commitment_number: formData.commitment_number?.trim() || null,
        denf_se_number: formData.denf_se_number?.trim() || null,
        nf_issue_date: formData.nf_issue_date || null,
      };

      const response = await fetch(`${API_BASE_URL}/api/patrimony/${patrimony.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        let imageSuccess = true;
        
        // Upload da imagem apenas se for uma nova imagem (não uma URL)
        if (image && image !== patrimony.imageUrl && !image.startsWith('http')) {
          imageSuccess = await uploadImageToPatrimony(patrimony.id, image);
        }

        if (imageSuccess) {
          Alert.alert('Sucesso', 'Bem atualizado com sucesso!');
          navigation.goBack();
        } else {
          Alert.alert(
            'Atenção', 
            'Bem atualizado, mas a imagem não foi enviada. Tente editar novamente.'
          );
        }
      } else {
        const errorText = await response.text();
        Alert.alert('Erro', errorText || 'Erro ao atualizar bem');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Erro', 'Erro de conexão. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => setImage(null);

  const handleDelete = async () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este bem? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(`${API_BASE_URL}/api/patrimony/${patrimony.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': token ? `Bearer ${token}` : '' },
              });

              if (response.ok) {
                Alert.alert('Sucesso', 'Bem excluído com sucesso!');
                navigation.goBack();
              } else {
                const errorText = await response.text();
                Alert.alert('Erro', errorText || 'Erro ao excluir bem');
              }
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Erro', 'Erro de conexão');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const statusOptions = [
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' },
    { value: 'maintenance', label: 'Manutenção' },
    { value: 'written_off', label: 'Baixado' },
  ];

  const departments = [
    'education', 'health', 'administration', 'urbanism',
    'culture', 'sports', 'transportation', 'finance',
    'assistenci', 'tourism', 'environment'
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
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Editar Bem Patrimonial</Text>
        <Text style={styles.subtitle}>Placa: {patrimony.plate}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Foto do Bem</Text>

        <View style={styles.imageSection}>
          {image && (
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
          )}

          <View style={styles.imageButtons}>
            <TouchableOpacity style={styles.imageButton} onPress={takePicture} disabled={loading}>
              <Text style={styles.imageButtonText}>📷 Tirar Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageButton} onPress={pickImage} disabled={loading}>
              <Text style={styles.imageButtonText}>🖼️ Galeria</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.label}>Placa *</Text>
        <TextInput
          style={styles.input}
          value={formData.plate}
          onChangeText={(text) => handleInputChange('plate', text)}
          placeholder="Número da placa"
          editable={!loading}
        />

        <Text style={styles.label}>Nome *</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => handleInputChange('name', text)}
          placeholder="Nome do bem"
          editable={!loading}
        />

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => handleInputChange('description', text)}
          placeholder="Descrição do bem"
          multiline
          numberOfLines={3}
          editable={!loading}
        />

        <Text style={styles.label}>Departamento *</Text>
        <ScrollView horizontal style={styles.departmentScroll} showsHorizontalScrollIndicator={false}>
          {departments.map(dept => (
            <TouchableOpacity
              key={dept}
              style={[
                styles.departmentButton,
                formData.department === dept && styles.departmentButtonSelected
              ]}
              onPress={() => handleInputChange('department', dept)}
              disabled={loading}
            >
              <Text style={styles.departmentButtonText}>
                {getDepartmentName(dept)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Valor (R$)</Text>
        <TextInput
          style={styles.input}
          value={formData.value}
          onChangeText={(text) => handleInputChange('value', text)}
          placeholder="0,00"
          keyboardType="decimal-pad"
          editable={!loading}
        />

        <Text style={styles.label}>Status</Text>
        <View style={styles.statusContainer}>
          {statusOptions.map(status => (
            <TouchableOpacity
              key={status.value}
              style={[
                styles.statusButton,
                formData.status === status.value && styles.statusButtonSelected
              ]}
              onPress={() => handleInputChange('status', status.value)}
              disabled={loading}
            >
              <Text style={styles.statusButtonText}>{status.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Data de Aquisição</Text>
        <TouchableOpacity style={styles.dateInput} onPress={() => showDatepicker('acquisition_date')} disabled={loading}>
          <Text style={formData.acquisition_date ? styles.dateText : styles.placeholderText}>
            {formData.acquisition_date || 'Selecionar data'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Informações Adicionais</Text>

        <Text style={styles.label}>Setor</Text>
        <TextInput
          style={styles.input}
          value={formData.sector}
          onChangeText={(text) => handleInputChange('sector', text)}
          placeholder="Setor do bem"
          editable={!loading}
        />

        <Text style={styles.label}>Fornecedor</Text>
        <TextInput
          style={styles.input}
          value={formData.supplier}
          onChangeText={(text) => handleInputChange('supplier', text)}
          placeholder="Nome do fornecedor"
          editable={!loading}
        />

        <Text style={styles.label}>Número da Nota Fiscal</Text>
        <TextInput
          style={styles.input}
          value={formData.invoice_number}
          onChangeText={(text) => handleInputChange('invoice_number', text)}
          placeholder="Número da NF"
          editable={!loading}
        />

        <Text style={styles.label}>Número do Empenho</Text>
        <TextInput
          style={styles.input}
          value={formData.commitment_number}
          onChangeText={(text) => handleInputChange('commitment_number', text)}
          placeholder="Número do empenho"
          editable={!loading}
        />

        <Text style={styles.label}>Número DENF/SE</Text>
        <TextInput
          style={styles.input}
          value={formData.denf_se_number}
          onChangeText={(text) => handleInputChange('denf_se_number', text)}
          placeholder="Número DENF/SE"
          editable={!loading}
        />

        <Text style={styles.label}>Data de Emissão da NF</Text>
        <TouchableOpacity style={styles.dateInput} onPress={() => showDatepicker('nf_issue_date')} disabled={loading}>
          <Text style={formData.nf_issue_date ? styles.dateText : styles.placeholderText}>
            {formData.nf_issue_date || 'Selecionar data'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Atualizar Bem</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.deleteButton, loading && styles.buttonDisabled]} onPress={handleDelete} disabled={loading}>
          <Text style={styles.deleteButtonText}>Excluir Bem</Text>
        </TouchableOpacity>
      </View>

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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: 'white', padding: 20, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 5 },
  form: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
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
  dateText: { fontSize: 16, color: '#374151' },
  placeholderText: { fontSize: 16, color: '#9ca3af' },
  imageSection: { marginBottom: 20 },
  imageButtons: { flexDirection: 'row', gap: 12 },
  imageButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  imageButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  imagePreviewContainer: { position: 'relative', alignItems: 'center', marginBottom: 12 },
  imagePreview: { width: 200, height: 200, borderRadius: 8, borderWidth: 2, borderColor: '#e5e7eb' },
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
  removeImageText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  departmentScroll: { marginVertical: 8, marginBottom: 16 },
  departmentButton: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  departmentButtonSelected: { backgroundColor: '#dbeafe', borderColor: '#2563eb' },
  departmentButtonText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  statusContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8, marginBottom: 16 },
  statusButton: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 8, borderWidth: 2, borderColor: '#e5e7eb' },
  statusButtonSelected: { backgroundColor: '#dbeafe', borderColor: '#2563eb' },
  statusButtonText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  button: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  deleteButton: { backgroundColor: '#dc2626', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  deleteButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginTop: 25,
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 5,
  },
});