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

console.log('[Edit] 📄 EditPatrimonyScreen.js CARREGADO');

// ============================================================
// HELPERS WEB/MOBILE
// ============================================================
const showAlert = (title, message, onOk) => {
  if (Platform.OS === 'web') {
    try { window.alert(`${title}\n\n${message}`); } catch (e) {}
    if (onOk) onOk();
  } else {
    Alert.alert(title, message, [{ text: 'OK', onPress: onOk }], { cancelable: false });
  }
};

const showConfirm = (title, message, onConfirm) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`) && onConfirm) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: 'destructive', onPress: onConfirm }
    ]);
  }
};

// ============================================================
// INPUT DE DATA
// ============================================================
const DateInput = ({ label, value, onChange, disabled, placeholder }) => {
  if (Platform.OS === 'web') {
    return (
      <View>
        <Text style={styles.label}>{label}</Text>
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={{
            backgroundColor: 'white',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: '#e5e7eb',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '16px',
            marginBottom: '16px',
            width: '100%',
            maxWidth: '100%',
            height: '44px',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            color: '#374151',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            display: 'block',
            lineHeight: 'normal',
          }}
        />
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.dateInput}
        onPress={() => onChange('__OPEN_PICKER__')}
        disabled={disabled}
      >
        <Text style={value ? styles.dateText : styles.placeholderText}>
          {value || placeholder || 'Selecionar data'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function EditPatrimonyScreen({ route, navigation }) {
  const { patrimony } = route.params;
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(patrimony.imageUrl || null);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [commitmentFile, setCommitmentFile] = useState(null);
  const [denfFile, setDenfFile] = useState(null);
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
    notes: patrimony.notes || '',
    supplier: patrimony.supplier || '',
    invoice_number: patrimony.invoiceNumber || '',
    commitment_number: patrimony.commitmentNumber || '',
    denf_se_number: patrimony.denfSeNumber || '',
    nf_issue_date: patrimony.nfIssueDate || '',
  });

  const { token } = useAuth();

  // ============================================================
  // PERMISSÕES
  // ============================================================
  const verifyPermissions = async () => {
    if (Platform.OS === 'web') return true;
    try {
      const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        const newCameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (newCameraPermission.status !== 'granted') {
          showAlert('Permissão necessária', 'Você precisa conceder permissão para usar a câmera.');
          return false;
        }
      }
      if (Platform.OS === 'ios') {
        const galleryPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (galleryPermission.status !== 'granted') {
          const newGalleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (newGalleryPermission.status !== 'granted') {
            showAlert('Permissão necessária', 'Você precisa conceder permissão para acessar a galeria.');
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

  // ============================================================
  // FOTO DO BEM
  // ============================================================
  const takePicture = async () => {
    const hasPermission = await verifyPermissions();
    if (!hasPermission) return;
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setImage(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
      }
    } catch (error) {
      showAlert('Erro', 'Não foi possível abrir a câmera');
    }
  };

  const pickImage = async () => {
    const hasPermission = await verifyPermissions();
    if (!hasPermission) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setImage(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
      }
    } catch (error) {
      showAlert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  // ============================================================
  // DOCUMENTOS FISCAIS
  // ============================================================
  const pickDocument = async (setter, label) => {
    const hasPermission = await verifyPermissions();
    if (!hasPermission) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setter(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
        console.log(`[Edit] 📎 ${label} selecionado:`, asset.base64 ? 'base64' : asset.uri);
      }
    } catch (error) {
      showAlert('Erro', `Não foi possível selecionar ${label}`);
    }
  };

  // ============================================================
  // DATA
  // ============================================================
  const handleDateChange = (field, newValue) => {
    if (newValue === '__OPEN_PICKER__') {
      setCurrentDateField(field);
      if (field === 'acquisition_date') setShowDatePicker(true);
      if (field === 'nf_issue_date') setShowNfDatePicker(true);
      return;
    }
    setFormData(prev => ({ ...prev, [field]: newValue }));
  };

  const onDateChangeMobile = (event, selectedDate) => {
    const currentField = currentDateField;
    if (currentField === 'acquisition_date') setShowDatePicker(Platform.OS === 'ios');
    if (currentField === 'nf_issue_date') setShowNfDatePicker(Platform.OS === 'ios');

    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, [currentField]: formattedDate }));
    }
  };

  // ============================================================
  // VALOR
  // ============================================================
  const handleValueChange = (text) => {
    let cleaned = text.replace(/[^0-9.,]/g, '');
    const firstComma = cleaned.indexOf(',');
    const firstDot = cleaned.indexOf('.');
    if (firstComma !== -1 && firstDot !== -1) {
      const first = Math.min(
        firstComma === -1 ? Infinity : firstComma,
        firstDot === -1 ? Infinity : firstDot
      );
      cleaned = cleaned.substring(0, first + 1) + cleaned.substring(first + 1).replace(/[.,]/g, '');
    }
    setFormData({ ...formData, value: cleaned });
  };

  const parseValueToNumber = (valueStr) => {
    if (!valueStr) return 0;
    const normalized = valueStr.replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  // ============================================================
  // UPLOAD DA FOTO DO BEM
  // ============================================================
  // Menu de anexo (câmera, galeria, arquivo)
  const pickFiscalDocumentWithMenu = (setter, label) => {
    if (Platform.OS === 'web') {
      pickDocument(setter, label);
      return;
    }

    Alert.alert(
      `Anexar ${label}`,
      'Escolha a origem:',
      [
        {
          text: '📷 Tirar foto',
          onPress: async () => {
            try {
              const cameraPerm = await ImagePicker.getCameraPermissionsAsync();
              if (cameraPerm.status !== 'granted') {
                const newPerm = await ImagePicker.requestCameraPermissionsAsync();
                if (newPerm.status !== 'granted') {
                  showAlert('Permissão', 'Permissão de câmera negada');
                  return;
                }
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                quality: 0.8,
                base64: true,
              });
              if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                setter(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
              }
            } catch (e) {
              showAlert('Erro', 'Não foi possível tirar a foto');
            }
          },
        },
        {
          text: '🖼️ Escolher da galeria',
          onPress: async () => {
            try {
              const libPerm = await ImagePicker.getMediaLibraryPermissionsAsync();
              if (libPerm.status !== 'granted') {
                const newPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (newPerm.status !== 'granted') {
                  showAlert('Permissão', 'Permissão de galeria negada');
                  return;
                }
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.8,
                base64: true,
              });
              if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                setter(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
              }
            } catch (e) {
              showAlert('Erro', 'Não foi possível abrir a galeria');
            }
          },
        },
        {
          text: '📎 Escolher arquivo (PDF, imagem)',
          onPress: () => pickDocument(setter, label),
        },
        { text: 'Cancelar', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const uploadImageToPatrimony = async (patrimonyId, imageUri) => {
    console.log('[Edit] 📷 ================== UPLOAD FOTO ==================');
    try {
      const fd = new FormData();

      if (Platform.OS === 'web') {
        const blobResponse = await fetch(imageUri);
        const blob = await blobResponse.blob();
        const mimeType = blob.type || 'image/jpeg';
        const ext = mimeType.split('/')[1] || 'jpg';
        fd.append('image', blob, `image_${Date.now()}.${ext}`);
      } else {
        const rawFilename = imageUri.split('/').pop();
        const uniqueFilename = `${Date.now()}_${rawFilename}`;
        let type = 'image/jpeg';
        const lower = rawFilename.toLowerCase();
        if (lower.endsWith('.png')) type = 'image/png';
        if (lower.endsWith('.gif')) type = 'image/gif';
        if (lower.endsWith('.heic')) type = 'image/heic';
        fd.append('image', { uri: imageUri, name: uniqueFilename, type });
      }

      const url = `${API_BASE_URL}/api/patrimony/${patrimonyId}/image`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });

      console.log('[Edit] 📡 Status foto:', response.status);
      return response.ok;
    } catch (error) {
      console.error('[Edit] ❌ Exception foto:', error);
      return false;
    }
  };

  // ============================================================
  // UPLOAD DE DOCUMENTOS FISCAIS
  // ============================================================
  const uploadFiscalDocument = async (patrimonyId, fileUri, docType) => {
    try {
      const fd = new FormData();

      if (Platform.OS === 'web') {
        const blobResponse = await fetch(fileUri);
        const blob = await blobResponse.blob();
        const mimeType = blob.type || 'image/jpeg';
        const ext = mimeType.split('/')[1] || 'jpg';
        fd.append('file', blob, `${docType}_${Date.now()}.${ext}`);
      } else {
        const rawFilename = fileUri.split('/').pop();
        let type = 'image/jpeg';
        const lower = rawFilename.toLowerCase();
        if (lower.endsWith('.png')) type = 'image/png';
        if (lower.endsWith('.pdf')) type = 'application/pdf';
        fd.append('file', { uri: fileUri, name: rawFilename, type });
      }

      const url = `${API_BASE_URL}/api/fiscal-document/${patrimonyId}/${docType}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });

      console.log(`[Edit] 📡 Status ${docType}:`, response.status);
      return response.ok;
    } catch (error) {
      console.error(`[Edit] ❌ Exception ${docType}:`, error);
      return false;
    }
  };

  // ============================================================
  // SUBMIT
  // ============================================================
  const handleSubmit = async () => {
    console.log('[Edit] 🔵 handleSubmit chamado');

    if (!formData.plate || !formData.name || !formData.department) {
      showAlert('Erro', 'Preencha pelo menos placa, nome e departamento');
      return;
    }

    if (!token) {
      showAlert('Sessão expirada', 'Faça login novamente.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        plate: formData.plate.trim(),
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        acquisition_date: formData.acquisition_date || null,
        value: parseValueToNumber(formData.value),
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
      console.log('[Edit] 📡 Status PUT:', response.status);

      if (response.ok) {
        const patrimonyId = patrimony.id;

        // 1. Upload da FOTO (se mudou)
        if (image && image !== patrimony.imageUrl && !image.startsWith('http')) {
          console.log('[Edit] 🖼️ Enviando FOTO...');
          await uploadImageToPatrimony(patrimonyId, image);
        }

        // 2. DOCUMENTOS FISCAIS
        if (invoiceFile || commitmentFile || denfFile) {
          let fiscalDocId = null;

          // Busca o fiscal_document ATUALIZADO do backend
          try {
            const fullResp = await fetch(`${API_BASE_URL}/api/patrimony/${patrimonyId}`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (fullResp.ok) {
              const full = await fullResp.json();
              if (full.fiscal_documents && full.fiscal_documents.length > 0) {
                fiscalDocId = full.fiscal_documents[0].id;
                console.log('[Edit] 📋 fiscal_document existente encontrado:', fiscalDocId);
              } else {
                console.log('[Edit] 📋 Nenhum fiscal_document encontrado, vai criar novo');
              }
            }
          } catch (e) {
            console.log('[Edit] ⚠️ Erro ao buscar fiscal_documents:', e);
          }

          // Se não achou, cria novo
          if (!fiscalDocId) {
            console.log('[Edit] 📋 Criando novo fiscal_document...');
            try {
              const fiscalResp = await fetch(`${API_BASE_URL}/api/patrimony/${patrimonyId}/fiscal-document`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  invoice_number: formData.invoice_number.trim() || null,
                  commitment_number: formData.commitment_number.trim() || null,
                  denf_se_number: formData.denf_se_number.trim() || null,
                  nf_issue_date: formData.nf_issue_date || null,
                }),
              });
              console.log('[Edit] 📡 fiscal_document status:', fiscalResp.status);
              if (fiscalResp.ok) {
                const fiscalDoc = await fiscalResp.json();
                fiscalDocId = fiscalDoc.id;
                console.log('[Edit] ✅ fiscal_document criado:', fiscalDocId);
              } else {
                const errText = await fiscalResp.text();
                console.log('[Edit] ❌ Erro fiscal_document:', errText);
              }
            } catch (e) {
              console.log('[Edit] ❌ Exception fiscal_document:', e);
            }
          }

          if (fiscalDocId) {
            if (invoiceFile) {
              console.log('[Edit] 📄 Enviando NF...');
              await uploadFiscalDocument(fiscalDocId, invoiceFile, 'invoice');
            }
            if (commitmentFile) {
              console.log('[Edit] 📑 Enviando Empenho...');
              await uploadFiscalDocument(fiscalDocId, commitmentFile, 'commitment');
            }
            if (denfFile) {
              console.log('[Edit] 📋 Enviando DENF/SE...');
              await uploadFiscalDocument(fiscalDocId, denfFile, 'denf');
            }
          }
        }

        // Mostrar o alerta (sem callback)
        showAlert('Sucesso', 'Bem atualizado com sucesso!');

        // Voltar para a lista (fora do callback)
        try {
          navigation.goBack();
        } catch (e) {
          navigation.navigate('Patrimonies');
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

  const removeImage = () => setImage(null);
  const removeInvoice = () => setInvoiceFile(null);
  const removeCommitment = () => setCommitmentFile(null);
  const removeDenf = () => setDenfFile(null);

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
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (response.ok) {
            showAlert('Sucesso', 'Bem excluído com sucesso!', () => {
              try { navigation.goBack(); } catch (e) { navigation.navigate('Patrimonies'); }
            });
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
    'assistenci', 'tourism', 'environment', 'instituto_profissoes', 'desenvolvimento', 'government'
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
      'instituto_profissoes': 'Instituto de Profissões',
      'desenvolvimento': 'Desenvolvimento',
      'government': 'Governo',
    };
    return departmentNames[dept] || dept;
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="always">
      <View style={styles.header}>
        <Text style={styles.title}>Editar Bem Patrimonial</Text>
        <Text style={styles.subtitle}>Placa: {patrimony.plate}</Text>
      </View>

      <View style={styles.form}>
        {/* SEÇÃO DE ANEXOS */}
        <View style={styles.attachmentSection}>
          <Text style={styles.attachmentTitle}>📎 Anexos</Text>

          {/* FOTO DO BEM */}
          <Text style={styles.fileLabel}>🖼️ Foto do Bem</Text>
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
              <TouchableOpacity style={styles.imageButton} onPress={takePicture} disabled={loading}>
                <Text style={styles.imageButtonText}>📷 Tirar Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage} disabled={loading}>
                <Text style={styles.imageButtonText}>🖼️ Galeria</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* NOTA FISCAL */}
          <Text style={styles.fileLabel}>📄 Nota Fiscal</Text>
          <TouchableOpacity
            style={styles.fileButton}
            onPress={() => pickFiscalDocumentWithMenu(setInvoiceFile, 'Nota Fiscal')}
            disabled={loading}
          >
            <Text style={styles.fileButtonText}>📎 Selecionar Novo Arquivo</Text>
          </TouchableOpacity>
          {invoiceFile && (
            <View style={styles.filePreview}>
              <Text style={styles.fileName}>📄 NF selecionada</Text>
              <TouchableOpacity onPress={removeInvoice} style={styles.removeFile}>
                <Text style={styles.removeFileText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* EMPENHO */}
          <Text style={styles.fileLabel}>📑 Empenho</Text>
          <TouchableOpacity
            style={styles.fileButton}
            onPress={() => pickFiscalDocumentWithMenu(setCommitmentFile, 'Empenho')}
            disabled={loading}
          >
            <Text style={styles.fileButtonText}>📎 Selecionar Novo Arquivo</Text>
          </TouchableOpacity>
          {commitmentFile && (
            <View style={styles.filePreview}>
              <Text style={styles.fileName}>📑 Empenho selecionado</Text>
              <TouchableOpacity onPress={removeCommitment} style={styles.removeFile}>
                <Text style={styles.removeFileText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* DENF/SE */}
          <Text style={styles.fileLabel}>📋 DENF/SE</Text>
          <TouchableOpacity
            style={styles.fileButton}
            onPress={() => pickFiscalDocumentWithMenu(setDenfFile, 'DENF/SE')}
            disabled={loading}
          >
            <Text style={styles.fileButtonText}>📎 Selecionar Novo Arquivo</Text>
          </TouchableOpacity>
          {denfFile && (
            <View style={styles.filePreview}>
              <Text style={styles.fileName}>📋 DENF/SE selecionado</Text>
              <TouchableOpacity onPress={removeDenf} style={styles.removeFile}>
                <Text style={styles.removeFileText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* FORMULÁRIO */}
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
              <Text style={styles.departmentButtonText}>{getDepartmentName(dept)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Valor (R$)</Text>
        <TextInput
          style={styles.input}
          value={formData.value}
          onChangeText={handleValueChange}
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

        <DateInput
          label="Data de Aquisição"
          value={formData.acquisition_date}
          onChange={(v) => handleDateChange('acquisition_date', v)}
          disabled={loading}
          placeholder="Selecionar data"
        />

        <Text style={styles.sectionTitle}>Informações Adicionais</Text>

        <Text style={styles.label}>Setor</Text>
        <TextInput
          style={styles.input}
          value={formData.sector}
          onChangeText={(text) => handleInputChange('sector', text)}
          placeholder="Setor do bem"
          editable={!loading}
        />

        <Text style={styles.label}>Observações (Localização)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.notes}
          onChangeText={(text) => handleInputChange('notes', text)}
          placeholder="Ex: Instalado na Sala do Vice-Prefeito"
          multiline
          numberOfLines={3}
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

        <DateInput
          label="Data de Emissão da NF"
          value={formData.nf_issue_date}
          onChange={(v) => handleDateChange('nf_issue_date', v)}
          disabled={loading}
          placeholder="Selecionar data"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => {
            console.log('🔥 BOTAO ATUALIZAR CLICADO');
            showConfirm('Confirmar Atualização', 'Deseja salvar as alterações?', handleSubmit);
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

      {Platform.OS !== 'web' && showDatePicker && (
        <DateTimePicker
          value={formData.acquisition_date ? new Date(formData.acquisition_date) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChangeMobile}
        />
      )}

      {Platform.OS !== 'web' && showNfDatePicker && (
        <DateTimePicker
          value={formData.nf_issue_date ? new Date(formData.nf_issue_date) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChangeMobile}
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

  attachmentSection: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  attachmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 12,
  },
  fileLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginTop: 12,
    marginBottom: 6,
  },
  fileButton: {
    backgroundColor: '#f59e0b',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  fileButtonText: { color: 'white', fontSize: 13, fontWeight: '600' },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff7ed',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  fileName: { fontSize: 12, color: '#92400e', flex: 1 },
  removeFile: {
    backgroundColor: '#ef4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeFileText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

  imageButtons: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  imageButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  imageButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  imagePreviewContainer: { position: 'relative', alignItems: 'center', marginBottom: 8 },
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
  deleteButton: {
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
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
