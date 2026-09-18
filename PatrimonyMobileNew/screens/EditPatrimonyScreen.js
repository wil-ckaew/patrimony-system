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

console.log('[Edit] 📄 ARQUIVO EditPatrimonyScreen.js CARREGADO');

// ============================================================
// HELPERS DE COMPATIBILIDADE WEB/MOBILE
// ============================================================

// Alerta compatível com web e mobile
const showAlert = (title, message, onOk) => {
  if (Platform.OS === 'web') {
    try {
      window.alert(`${title}\n\n${message}`);
    } catch (e) {
      console.log('[Edit] window.alert falhou:', e);
    }
    if (onOk) onOk();
  } else {
    Alert.alert(title, message, [{ text: 'OK', onPress: onOk }], { cancelable: false });
  }
};

// Alerta com confirmação (cancelar/confirmar)
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
        { text: 'OK', style: 'destructive', onPress: onConfirm }
      ]
    );
  }
};

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

  console.log('[Edit] 🎬 Tela renderizada — patrimony.id:', patrimony?.id, '| token:', token ? 'OK' : 'AUSENTE');

  // ============================================================
  // NAVEGAÇÃO DE VOLTA (compatível com web e mobile)
  // ============================================================
  const goBackToList = () => {
    console.log('[Edit] 🔙 Tentando voltar para a lista...');
    try {
      if (navigation.canGoBack && navigation.canGoBack()) {
        console.log('[Edit] 🔙 goBack()');
        navigation.goBack();
      } else {
        console.log('[Edit] 🔙 não pode goBack, tentando navigate("Patrimonies")');
        navigation.navigate('Patrimonies');
      }
    } catch (e) {
      console.log('[Edit] ❌ erro na navegação:', e);
      try {
        navigation.navigate('Patrimonies');
      } catch (e2) {
        console.log('[Edit] ❌ navigate também falhou:', e2);
      }
    }
  };

  // ============================================================
  // PERMISSÕES
  // ============================================================
  const verifyPermissions = async () => {
    // No web, não precisa de permissão
    if (Platform.OS === 'web') return true;

    try {
      const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        const newCameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (newCameraPermission.status !== 'granted') {
          showAlert(
            'Permissão necessária',
            'Você precisa conceder permissão para usar a câmera.'
          );
          return false;
        }
      }

      const galleryPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (galleryPermission.status !== 'granted') {
        const newGalleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (newGalleryPermission.status !== 'granted') {
          showAlert(
            'Permissão necessária',
            'Você precisa conceder permissão para acessar a galeria.'
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

  // ============================================================
  // IMAGEM
  // ============================================================
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
      showAlert('Erro', 'Não foi possível abrir a câmera');
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
      showAlert('Erro', 'Não foi possível selecionar a imagem');
      console.error('pickImage error', error);
    }
  };

  const removeImage = () => setImage(null);

  // ============================================================
  // DATE PICKER
  // ============================================================
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

  // ============================================================
  // UPLOAD DE IMAGEM — COMPATÍVEL COM WEB E MOBILE
  // ============================================================
  const uploadImageToPatrimony = async (patrimonyId, imageUri) => {
    console.log('[Edit] 🖼️ Iniciando upload. Platform:', Platform.OS);
    console.log('[Edit] 🖼️ imageUri (primeiros 100 chars):', imageUri?.substring(0, 100));

    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        // ============ WEB ============
        console.log('[Edit] 🌐 Modo WEB — convertendo para Blob');

        let blob;
        let filename = `image_${Date.now()}.jpg`;
        let mimeType = 'image/jpeg';

        if (imageUri.startsWith('blob:') || imageUri.startsWith('data:')) {
          // blob: ou data: URL — buscar e converter para Blob
          const blobResponse = await fetch(imageUri);
          blob = await blobResponse.blob();

          // Tentar extrair extensão do blob
          if (blob.type) {
            mimeType = blob.type;
            const ext = mimeType.split('/')[1] || 'jpg';
            filename = `image_${Date.now()}.${ext}`;
          }
        } else if (imageUri.startsWith('http')) {
          // URL http — buscar e converter
          const blobResponse = await fetch(imageUri);
          blob = await blobResponse.blob();
          if (blob.type) {
            mimeType = blob.type;
            const ext = mimeType.split('/')[1] || 'jpg';
            filename = `image_${Date.now()}.${ext}`;
          }
        } else {
          showAlert('Erro', 'Formato de imagem não suportado no navegador.');
          return false;
        }

        console.log('[Edit] 🌐 Blob criado:', blob.size, 'bytes, tipo:', mimeType);
        formData.append('image', blob, filename);
      } else {
        // ============ MOBILE ============
        console.log('[Edit] 📱 Modo MOBILE');

        const rawFilename = imageUri.split('/').pop();
        const uniqueFilename = `${Date.now()}_${rawFilename}`;

        let type = 'image/jpeg';
        const lower = rawFilename.toLowerCase();
        if (lower.endsWith('.png')) type = 'image/png';
        if (lower.endsWith('.gif')) type = 'image/gif';

        formData.append('image', {
          uri: imageUri,
          name: uniqueFilename,
          type,
        });
      }

      const uploadUrl = `${API_BASE_URL}/api/patrimony/${patrimonyId}/image`;
      console.log('[Edit] 🌐 POST', uploadUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          // NÃO definir Content-Type — o fetch define automaticamente com boundary
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('[Edit] 📡 Upload status:', uploadResponse.status);

      if (uploadResponse.ok) {
        console.log('[Edit] ✅ Imagem enviada com sucesso');
        return true;
      } else {
        const errorText = await uploadResponse.text();
        console.log('[Edit] ❌ Falha no upload:', uploadResponse.status, errorText);
        showAlert('Erro no upload', `HTTP ${uploadResponse.status}\n${errorText}`);
        return false;
      }
    } catch (error) {
      console.log('[Edit] ❌ Erro ao enviar imagem:', error);
      if (error.name === 'AbortError') {
        showAlert('Timeout', 'O upload da imagem demorou mais de 30s.');
      } else {
        showAlert('Erro no upload', `Erro: ${error.message}`);
      }
      return false;
    }
  };

  // ============================================================
  // SUBMIT — ATUALIZAR BEM
  // ============================================================
  const handleSubmit = async () => {
    console.log('[Edit] 🔵 handleSubmit chamado');
    console.log('[Edit] 📦 formData:', formData);
    console.log('[Edit] 🔑 token:', token ? `${token.substring(0, 20)}...` : 'AUSENTE');
    console.log('[Edit] 🆔 patrimony.id:', patrimony?.id);
    console.log('[Edit] 🌐 API_BASE_URL:', API_BASE_URL);

    if (!formData.plate || !formData.name || !formData.department) {
      console.log('[Edit] ❌ Validação falhou');
      showAlert('Erro', 'Preencha pelo menos placa, nome e departamento');
      return;
    }

    if (!token) {
      console.log('[Edit] ❌ Token ausente');
      showAlert('Sessão expirada', 'Faça login novamente.');
      return;
    }

    console.log('[Edit] ✅ Validação passou, iniciando requisição');
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

      const url = `${API_BASE_URL}/api/patrimony/${patrimony.id}`;
      console.log('[Edit] 🌐 PUT', url);
      console.log('[Edit] 📤 payload:', JSON.stringify(payload));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('[Edit] 📡 Status HTTP:', response.status);

      if (response.ok) {
        console.log('[Edit] ✅ PUT OK');

        // Fazer upload da imagem se houver nova
        let imageSuccess = true;
        if (image && image !== patrimony.imageUrl && !image.startsWith('http')) {
          console.log('[Edit] 🖼️ Nova imagem detectada, fazendo upload');
          imageSuccess = await uploadImageToPatrimony(patrimony.id, image);
        }

        if (imageSuccess) {
          console.log('[Edit] ✅ Sucesso completo — voltando para lista');
          showAlert(
            'Sucesso',
            'Bem atualizado com sucesso!',
            () => {
              console.log('[Edit] 🔙 Executando goBackToList');
              goBackToList();
            }
          );
        } else {
          console.log('[Edit] ⚠️ Bem atualizado mas imagem falhou');
          showAlert(
            'Atenção',
            'Bem atualizado, mas a imagem não foi enviada. Tente editar novamente.',
            () => goBackToList()
          );
        }
      } else {
        const errorText = await response.text();
        console.log('[Edit] ❌ Erro do servidor:', errorText);
        showAlert('Erro', errorText || `Erro ao atualizar bem (HTTP ${response.status})`);
      }
    } catch (error) {
      console.error('[Edit] ❌ Exception:', error);
      if (error.name === 'AbortError') {
        showAlert('Timeout', 'O servidor não respondeu em 15 segundos.');
      } else {
        showAlert('Erro', `Erro de conexão: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // DELETE
  // ============================================================
  const handleDelete = () => {
    showConfirm(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este bem? Esta ação não pode ser desfeita.',
      async () => {
        setLoading(true);
        try {
          const response = await fetch(`${API_BASE_URL}/api/patrimony/${patrimony.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token ? `Bearer ${token}` : '' },
          });

          if (response.ok) {
            showAlert('Sucesso', 'Bem excluído com sucesso!', () => goBackToList());
          } else {
            const errorText = await response.text();
            showAlert('Erro', errorText || 'Erro ao excluir bem');
          }
        } catch (error) {
          console.error('Error:', error);
          showAlert('Erro', 'Erro de conexão');
        } finally {
          setLoading(false);
        }
      }
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
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="on-drag"
    >
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

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => {
            console.log('🔥 BOTAO CLICADO');
            if (Platform.OS === 'web') {
              if (window.confirm('Confirmar atualização do bem?')) {
                handleSubmit();
              }
            } else {
              alert('BOTAO CLICADO - handleSubmit vai rodar');
              handleSubmit();
            }
          }}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Atualizar Bem</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, loading && styles.buttonDisabled]}
          onPress={handleDelete}
          disabled={loading}
          activeOpacity={0.7}
        >
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
