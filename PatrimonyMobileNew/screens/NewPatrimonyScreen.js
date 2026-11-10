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

console.log('[New] 📄 NewPatrimonyScreen.js CARREGADO');

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

export default function NewPatrimonyScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [commitmentFile, setCommitmentFile] = useState(null);
  const [denfFile, setDenfFile] = useState(null);
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
  // FOTO DO BEM — câmera e galeria
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
      console.log('[New] 📷 takePicture result:', JSON.stringify(result));
      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('[New] 📷 Foto capturada:', result.assets[0].uri);
        const asset = result.assets[0];
        setImage(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
      }
    } catch (error) {
      console.error('[New] ❌ takePicture erro:', error);
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
        console.log(`[New] 📎 ${label} selecionado:`, asset.base64 ? 'base64' : asset.uri);
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
  // UPLOAD DA FOTO DO BEM — ENDPOINT CORRETO
  // ============================================================
  const uploadImageToPatrimony = async (patrimonyId, imageUri) => {
    console.log('[New] 📷 ================== UPLOAD FOTO ==================');
    console.log('[New] 📷 patrimonyId:', patrimonyId);
    console.log('[New] 📷 imageUri:', imageUri);
    console.log('[New] 📷 Platform:', Platform.OS);

    try {
      const fd = new FormData();

      if (Platform.OS === 'web') {
        console.log('[New] 🌐 Modo WEB — convertendo para Blob');
        const blobResponse = await fetch(imageUri);
        const blob = await blobResponse.blob();
        const mimeType = blob.type || 'image/jpeg';
        const ext = mimeType.split('/')[1] || 'jpg';
        const filename = `image_${Date.now()}.${ext}`;
        fd.append('image', blob, filename);
        console.log('[New] 🌐 Blob:', blob.size, 'bytes, tipo:', mimeType);
      } else {
        console.log('[New] 📱 Modo MOBILE');
        const rawFilename = imageUri.split('/').pop();
        const uniqueFilename = `${Date.now()}_${rawFilename}`;
        let type = 'image/jpeg';
        const lower = rawFilename.toLowerCase();
        if (lower.endsWith('.png')) type = 'image/png';
        if (lower.endsWith('.gif')) type = 'image/gif';
        if (lower.endsWith('.heic')) type = 'image/heic';
        fd.append('image', {
          uri: imageUri,
          name: uniqueFilename,
          type,
        });
        console.log('[New] 📱 Campo "image":', uniqueFilename, type);
      }

      const url = `${API_BASE_URL}/api/patrimony/${patrimonyId}/image`;
      console.log('[New] 📡 POST', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: fd,
      });

      console.log('[New] 📡 Status:', response.status);

      if (response.ok) {
        const responseText = await response.text();
        console.log('[New] ✅ Foto enviada:', responseText.substring(0, 200));
        return true;
      } else {
        const errorText = await response.text();
        console.log('[New] ❌ Erro foto:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('[New] ❌ Exception upload foto:', error);
      return false;
    }
  };

  // ============================================================
  // MENU DE ANEXO (câmera, galeria, arquivo) para documentos
  // ============================================================
  const pickFiscalDocumentWithMenu = (setter, label) => {
    if (Platform.OS === 'web') {
      // No web, o Alert.alert não funciona. Usa o pickDocument (seletor de arquivos)
      // que no iOS inclui "Tirar foto" e "Galeria"
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
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // ============================================================
  // UPLOAD DE DOCUMENTOS FISCAIS (NF, EMPENHO, DENF/SE)
  // ============================================================
  const uploadFiscalDocument = async (patrimonyId, fileUri, docType) => {
    console.log(`[New] 📎 ================== UPLOAD ${docType.toUpperCase()} ==================`);

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
        fd.append('file', {
          uri: fileUri,
          name: rawFilename,
          type,
        });
      }

      const url = `${API_BASE_URL}/api/fiscal-document/${patrimonyId}/${docType}`;
      console.log(`[New] 📡 POST ${docType}:`, url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: fd,
      });

      console.log(`[New] 📡 Status ${docType}:`, response.status);

      if (response.ok) {
        console.log(`[New] ✅ ${docType} enviado`);
        return true;
      } else {
        const errorText = await response.text();
        console.log(`[New] ❌ Erro ${docType}:`, response.status, errorText);
        return false;
      }
    } catch (error) {
      console.log(`[New] ❌ Exception ${docType}:`, error);
      return false;
    }
  };

  // ============================================================
  // SUBMIT
  // ============================================================
  const handleSubmit = async () => {
    console.log('[New] 🔵 handleSubmit chamado');
    console.log('[New] 📦 formData:', formData);
    console.log('[New] 🖼️ image:', image);
    console.log('[New] 📄 invoiceFile:', invoiceFile);
    console.log('[New] 📑 commitmentFile:', commitmentFile);
    console.log('[New] 📋 denfFile:', denfFile);

    if (!formData.plate || !formData.name || !formData.department) {
      showAlert('Erro', 'Preencha pelo menos placa, nome e departamento');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        plate: formData.plate.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        acquisition_date: formData.acquisition_date || new Date().toISOString().split('T')[0],
        value: parseValueToNumber(formData.value),
        department: formData.department,
        status: formData.status,
        sector: formData.sector.trim() || undefined,
        supplier: formData.supplier.trim() || undefined,
        invoice_number: formData.invoice_number.trim() || undefined,
        commitment_number: formData.commitment_number.trim() || undefined,
        denf_se_number: formData.denf_se_number.trim() || undefined,
        nf_issue_date: formData.nf_issue_date || undefined,
      };

      console.log('[New] 🌐 POST', `${API_BASE_URL}/api/patrimony`);
      console.log('[New] 📤 payload:', JSON.stringify(payload));

      const response = await fetch(`${API_BASE_URL}/api/patrimony`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('[New] 📡 status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('[New] ✅ Bem criado:', responseData);

        const patrimonyId = responseData.id;

        if (patrimonyId) {
          // 1. Upload da FOTO DO BEM
          if (image) {
            console.log('[New] 🖼️ Enviando FOTO DO BEM...');
            await uploadImageToPatrimony(patrimonyId, image);
          }

          // 2. Criar o DOCUMENTO FISCAL (se tiver pelo menos um anexo)
          if (invoiceFile || commitmentFile || denfFile) {
            console.log('[New] 📋 Criando fiscal_document...');
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

              console.log('[New] 📡 fiscal_document status:', fiscalResp.status);

              if (fiscalResp.ok) {
                const fiscalDoc = await fiscalResp.json();
                const fiscalDocId = fiscalDoc.id;
                console.log('[New] ✅ fiscal_document criado:', fiscalDocId);

                if (invoiceFile) {
                  console.log('[New] 📄 Enviando NF...');
                  await uploadFiscalDocument(fiscalDocId, invoiceFile, 'invoice');
                }
                if (commitmentFile) {
                  console.log('[New] 📑 Enviando Empenho...');
                  await uploadFiscalDocument(fiscalDocId, commitmentFile, 'commitment');
                }
                if (denfFile) {
                  console.log('[New] 📋 Enviando DENF/SE...');
                  await uploadFiscalDocument(fiscalDocId, denfFile, 'denf');
                }
              } else {
                const errText = await fiscalResp.text();
                console.log('[New] ❌ Erro ao criar fiscal_document:', errText);
              }
            } catch (e) {
              console.log('[New] ❌ Exception fiscal_document:', e);
            }
          }
        }

        // Mostrar o alerta (sem callback)
        showAlert('Sucesso', 'Bem cadastrado com sucesso!');

        // Voltar para a lista (fora do callback)
        try {
          navigation.goBack();
        } catch (e) {
          navigation.navigate('Patrimonies');
        }
      } else {
        const errorText = await response.text();
        console.log('[New] ❌ Erro do servidor:', errorText);
        showAlert('Erro', errorText || 'Erro ao cadastrar bem');
      }
    } catch (error) {
      console.error('[New] ❌ Exception:', error);
      showAlert('Erro', 'Erro de conexão. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => setImage(null);
  const removeInvoice = () => setInvoiceFile(null);
  const removeCommitment = () => setCommitmentFile(null);
  const removeDenf = () => setDenfFile(null);

  const departments = [
    'education', 'health', 'administration', 'urbanism',
    'culture', 'sports', 'transportation', 'finance',
    'assistenci', 'tourism', 'environment', 'instituto_profissoes', 'desenvolvimento', 'government'
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
      'instituto_profissoes': 'Instituto de Profissões',
      'desenvolvimento': 'Desenvolvimento',
      'government': 'Governo',
    };
    return departmentNames[dept] || dept;
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="always">
      <View style={styles.header}>
        <Text style={styles.title}>Cadastrar Novo Bem</Text>
      </View>

      <View style={styles.form}>
        {/* SEÇÃO DE ANEXOS */}
        <View style={styles.attachmentSection}>
          <Text style={styles.attachmentTitle}>📎 Anexos (Opcional)</Text>

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
            <Text style={styles.fileButtonText}>📎 Anexar (Foto / Galeria / Arquivo)</Text>
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
            <Text style={styles.fileButtonText}>📎 Anexar (Foto / Galeria / Arquivo)</Text>
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
            <Text style={styles.fileButtonText}>📎 Anexar (Foto / Galeria / Arquivo)</Text>
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

        <DateInput
          label="Data de Aquisição *"
          value={formData.acquisition_date}
          onChange={(v) => handleDateChange('acquisition_date', v)}
          disabled={loading}
          placeholder="Selecionar data"
        />

        <DateInput
          label="Data emissão NF (Opcional)"
          value={formData.nf_issue_date}
          onChange={(v) => handleDateChange('nf_issue_date', v)}
          disabled={loading}
          placeholder="Selecionar data"
        />

        <Text style={styles.label}>Valor (R$)</Text>
        <TextInput
          style={styles.input}
          value={formData.value}
          onChangeText={handleValueChange}
          placeholder="Ex: 1500,00 ou 1500.00"
          keyboardType="decimal-pad"
          editable={!loading}
        />
        <Text style={styles.hint}>Use vírgula ou ponto para decimais (ex: 1500,50)</Text>

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
              <Text style={styles.departmentButtonText}>{getDepartmentName(dept)}</Text>
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
          onPress={() => {
            console.log('🔥 BOTAO CADASTRAR CLICADO');
            showConfirm('Confirmar Cadastro', 'Deseja cadastrar este bem?', handleSubmit);
          }}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Cadastrar Bem</Text>
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
  form: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: -12, marginBottom: 16, fontStyle: 'italic' },
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
  dateText: { fontSize: 16, color: '#374151' },
  placeholderText: { fontSize: 16, color: '#9ca3af' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },

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
  buttonDisabled: { opacity: 0.6 },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cancelButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
