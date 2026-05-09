// components/PatrimonyForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { PatrimonyItem, FiscalDocument } from '../types/Patrimony';
import { getAuthHeaders, checkTokenValidity, checkPlateExists } from '../utils/auth';
import OCRScanner from './OCRScanner';

interface PatrimonyFormProps {
  item?: PatrimonyItem | null;
  onClose: () => void;
  onRefresh: () => void;
}

export default function PatrimonyForm({ item, onClose, onRefresh }: PatrimonyFormProps) {
  const [formData, setFormData] = useState({
    plate: '',
    name: '',
    description: '',
    acquisition_date: '',
    value: '',
    department: '',
    status: 'active',
    invoice_number: '',
    commitment_number: '',
    denf_se_number: '',
    sector: '',
    nf_issue_date: '',
    supplier: '',
    is_vehicle: false
  });

  // Estados para imagem do bem (única)
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Lista de pares fiscais (NF + Empenho)
  const [fiscalDocuments, setFiscalDocuments] = useState<FiscalDocument[]>([]);
  const [newDocInvoice, setNewDocInvoice] = useState('');
  const [newDocCommitment, setNewDocCommitment] = useState('');
  const [newDocIssueDate, setNewDocIssueDate] = useState('');
  const [newDocInvoiceFile, setNewDocInvoiceFile] = useState<File | null>(null);
  const [newDocCommitmentFile, setNewDocCommitmentFile] = useState<File | null>(null);

  // Estado para OCR
  const [showOCR, setShowOCR] = useState(false);

  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  // Carregar dados do item para edição
  useEffect(() => {
    if (!item) {
      setFormData({
        plate: '',
        name: '',
        description: '',
        acquisition_date: '',
        value: '',
        department: '',
        status: 'active',
        invoice_number: '',
        commitment_number: '',
        denf_se_number: '',
        sector: '',
        nf_issue_date: '',
        supplier: '',
        is_vehicle: false
      });
      setFiscalDocuments([]);
      setPreviewUrl('');
      return;
    }

    const loadItem = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/patrimony/${item.id}`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error('Falha ao carregar o patrimônio');
        }
        const data = await response.json();
        setFormData({
          plate: data.plate,
          name: data.name,
          description: data.description,
          acquisition_date: data.acquisition_date?.split('T')[0] || '',
          value: data.value?.toString() || '',
          department: data.department,
          status: data.status,
          invoice_number: data.invoice_number || '',
          commitment_number: data.commitment_number || '',
          denf_se_number: data.denf_se_number || '',
          sector: data.sector || '',
          nf_issue_date: data.nf_issue_date ? data.nf_issue_date.split('T')[0] : '',
          supplier: data.supplier || '',
          is_vehicle: data.is_vehicle || false,
        });
        if (data.image_url) {
          setPreviewUrl(data.image_url);
        }

        let loadedFiscalDocuments: FiscalDocument[] = [];

        if (data.fiscal_documents && data.fiscal_documents.length > 0) {
          loadedFiscalDocuments = data.fiscal_documents.map((doc: any) => ({
            id: doc.id,
            invoiceNumber: doc.invoice_number || '',
            commitmentNumber: doc.commitment_number || '',
            issueDate: doc.issue_date || undefined,
            invoiceFile: doc.invoice_file || undefined,
            commitmentFile: doc.commitment_file || undefined,
          }));
        } else if (item.fiscalDocuments && item.fiscalDocuments.length > 0) {
          loadedFiscalDocuments = item.fiscalDocuments;
        } else if (data.invoice_number || data.commitment_number || data.invoice_file || data.commitment_file) {
          loadedFiscalDocuments = [{
            id: 'legacy',
            invoiceNumber: data.invoice_number || '',
            commitmentNumber: data.commitment_number || '',
            invoiceFile: data.invoice_file,
            commitmentFile: data.commitment_file,
            issueDate: data.nf_issue_date || undefined,
            isLegacy: true,
          }] as FiscalDocument[];
        }

        setFiscalDocuments(loadedFiscalDocuments);
      } catch (error) {
        console.error('Erro ao carregar patrimônio completo:', error);
        if (item.fiscalDocuments && item.fiscalDocuments.length > 0) {
          setFiscalDocuments(item.fiscalDocuments);
        } else if (item.invoiceNumber || item.commitmentNumber || item.invoiceFile || item.commitmentFile) {
          setFiscalDocuments([{
            id: 'legacy',
            invoiceNumber: item.invoiceNumber || '',
            commitmentNumber: item.commitmentNumber || '',
            invoiceFile: item.invoiceFile,
            commitmentFile: item.commitmentFile,
            issueDate: item.nfIssueDate,
            isLegacy: true,
          }] as FiscalDocument[]);
        } else {
          setFiscalDocuments([]);
        }
      }
    };

    loadItem();
  }, [item]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Função para receber dados do OCR
  const handleOCRData = (data: {
    invoiceNumber?: string;
    supplier?: string;
    value?: number;
    issueDate?: string;
    commitmentNumber?: string;
  }) => {
    console.log('📝 Dados recebidos do OCR:', data);
    
    // Atualizar formData com os dados extraídos
    setFormData(prev => {
      const newData = { ...prev };
      
      if (data.invoiceNumber) {
        newData.invoice_number = data.invoiceNumber;
        console.log('✅ NF atualizada:', data.invoiceNumber);
      }
      if (data.commitmentNumber) {
        newData.commitment_number = data.commitmentNumber;
        console.log('✅ Empenho atualizado:', data.commitmentNumber);
      }
      if (data.supplier) {
        newData.supplier = data.supplier;
        console.log('✅ Fornecedor atualizado:', data.supplier);
      }
      if (data.value && !isNaN(data.value)) {
        newData.value = data.value.toString();
        console.log('✅ Valor atualizado:', data.value);
      }
      if (data.issueDate) {
        newData.nf_issue_date = data.issueDate;
        console.log('✅ Data atualizada:', data.issueDate);
      }
      
      return newData;
    });
    
    // Preencher documentos fiscais
    if (data.invoiceNumber) {
      setNewDocInvoice(data.invoiceNumber);
    }
    if (data.commitmentNumber) {
      setNewDocCommitment(data.commitmentNumber);
    }
    if (data.issueDate) {
      setNewDocIssueDate(data.issueDate);
    }
    
    setShowOCR(false);
    
    // Mostrar mensagem com os dados extraídos
    const message = `✅ Dados importados com sucesso!\n\n${
      data.invoiceNumber ? `📄 NF: ${data.invoiceNumber}\n` : ''
    }${data.commitmentNumber ? `📑 Empenho: ${data.commitmentNumber}\n` : ''}${
      data.supplier ? `🏢 Fornecedor: ${data.supplier}\n` : ''
    }${data.value ? `💰 Valor: R$ ${data.value.toFixed(2)}\n` : ''
    }${data.issueDate ? `📅 Data: ${data.issueDate}` : ''}`;
    
    alert(message);
  };

  // Funções para gerenciar a lista de documentos fiscais
  const addFiscalDocument = () => {
    if (!newDocInvoice.trim() || !newDocCommitment.trim()) {
      alert('Preencha o número da NF e do Empenho');
      return;
    }
    const newDoc: FiscalDocument = {
      id: Date.now().toString(),
      invoiceNumber: newDocInvoice.trim(),
      commitmentNumber: newDocCommitment.trim(),
      issueDate: newDocIssueDate || undefined,
      invoiceFile: newDocInvoiceFile ? URL.createObjectURL(newDocInvoiceFile) : undefined,
      commitmentFile: newDocCommitmentFile ? URL.createObjectURL(newDocCommitmentFile) : undefined,
      _invoiceFile: newDocInvoiceFile || undefined,
      _commitmentFile: newDocCommitmentFile || undefined,
    };
    setFiscalDocuments([...fiscalDocuments, newDoc]);
    // Limpar campos
    setNewDocInvoice('');
    setNewDocCommitment('');
    setNewDocIssueDate('');
    setNewDocInvoiceFile(null);
    setNewDocCommitmentFile(null);
  };

  const removeFiscalDocument = (index: number) => {
    const updated = [...fiscalDocuments];
    updated.splice(index, 1);
    setFiscalDocuments(updated);
  };

  const updateFiscalDocument = (index: number, field: keyof FiscalDocument, value: any) => {
    const updated = [...fiscalDocuments];
    updated[index] = { ...updated[index], [field]: value };
    setFiscalDocuments(updated);
  };

  const handleDocInvoiceFileChange = (index: number, file: File) => {
    const updated = [...fiscalDocuments];
    updated[index].invoiceFile = URL.createObjectURL(file);
    updated[index]._invoiceFile = file;
    setFiscalDocuments(updated);
  };

  const handleDocCommitmentFileChange = (index: number, file: File) => {
    const updated = [...fiscalDocuments];
    updated[index].commitmentFile = URL.createObjectURL(file);
    updated[index]._commitmentFile = file;
    setFiscalDocuments(updated);
  };

  const isServerFileUrl = (url?: string) => {
    return !!url && (url.startsWith('/documents') || url.startsWith('http://') || url.startsWith('https://'));
  };

  // Uploads
  const uploadImageToServer = async (patrimonyId: string, imageFile: File): Promise<boolean> => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', imageFile);
      const headers = getAuthHeaders();
      if (headers['Content-Type']) delete headers['Content-Type'];
      const response = await fetch(`http://localhost:8080/api/patrimony/${patrimonyId}/image`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (response.ok) return true;
      return false;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadDocumentToServer = async (patrimonyId: string, documentFile: File, docType: 'invoice' | 'commitment', doc: FiscalDocument): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('document', documentFile);
      const headers = getAuthHeaders();
      if (headers['Content-Type']) delete headers['Content-Type'];
      const query = new URLSearchParams();
      if (doc.invoiceNumber) query.append('invoice_number', doc.invoiceNumber);
      if (doc.commitmentNumber) query.append('commitment_number', doc.commitmentNumber);
      const response = await fetch(`http://localhost:8080/api/patrimony/${patrimonyId}/document/${docType}?${query.toString()}`, {
        method: 'POST',
        headers,
        body: formData,
      });
      return response.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const uploadFiscalDocuments = async (patrimonyId: string): Promise<boolean> => {
    setUploadingDocs(true);
    try {
      for (const doc of fiscalDocuments) {
        if (doc._invoiceFile) {
          await uploadDocumentToServer(patrimonyId, doc._invoiceFile, 'invoice', doc);
        }
        if (doc._commitmentFile) {
          await uploadDocumentToServer(patrimonyId, doc._commitmentFile, 'commitment', doc);
        }
      }
      return true;
    } catch (error) {
      return false;
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);

    try {
      const isTokenValid = await checkTokenValidity();
      if (!isTokenValid) {
        alert('Sessão expirada. Faça login novamente.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
        return;
      }

      const acquisitionDate = formData.acquisition_date
        ? new Date(formData.acquisition_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      const nfIssueDate = formData.nf_issue_date ? new Date(formData.nf_issue_date).toISOString().split('T')[0] : undefined;

      let numericValue = 0;
      if (formData.value.trim()) {
        const cleaned = formData.value.replace(',', '.').replace(/[^\d.]/g, '');
        numericValue = parseFloat(cleaned);
        if (isNaN(numericValue)) {
          alert('Valor inválido');
          return;
        }
      }

      const patrimonyData: any = {
        plate: formData.plate.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        acquisition_date: acquisitionDate,
        value: numericValue,
        department: formData.department,
        status: formData.status,
        invoice_number: formData.invoice_number.trim(),
        commitment_number: formData.commitment_number.trim(),
        denf_se_number: formData.denf_se_number.trim(),
        sector: formData.sector.trim() || undefined,
        nf_issue_date: nfIssueDate,
        supplier: formData.supplier.trim() || undefined,
        is_vehicle: formData.is_vehicle,
      };

      if (fiscalDocuments.length > 0) {
        patrimonyData.fiscal_documents = fiscalDocuments.map(doc => ({
          invoice_number: doc.invoiceNumber,
          commitment_number: doc.commitmentNumber,
          issue_date: doc.issueDate,
          invoice_file: isServerFileUrl(doc.invoiceFile) ? doc.invoiceFile : undefined,
          commitment_file: isServerFileUrl(doc.commitmentFile) ? doc.commitmentFile : undefined,
        }));
      }

      if (!patrimonyData.plate) { alert('Placa obrigatória'); return; }
      if (!item) {
        const exists = await checkPlateExists(patrimonyData.plate);
        if (exists) { alert('Placa já existe'); return; }
      }
      if (!patrimonyData.name) { alert('Nome obrigatório'); return; }
      if (!patrimonyData.department) { alert('Departamento obrigatório'); return; }

      const url = item ? `http://localhost:8080/api/patrimony/${item.id}` : 'http://localhost:8080/api/patrimony';
      const method = item ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(patrimonyData),
      });

      if (response.status === 401) {
        alert('Sessão expirada');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
        return;
      }

      let responseData: any;
      const responseText = await response.text();
      try { responseData = JSON.parse(responseText); } catch { responseData = responseText; }

      if (response.ok) {
        let patrimonyId = responseData?.id || item?.id;
        if (!patrimonyId && typeof responseData === 'string' && responseData.length === 36) patrimonyId = responseData;

        if (patrimonyId) {
          if (image) await uploadImageToServer(patrimonyId, image);
          if (fiscalDocuments.length) await uploadFiscalDocuments(patrimonyId);
        }

        alert('Bem salvo com sucesso!');
        onRefresh();
        onClose();
      } else {
        let errorMsg = typeof responseData === 'string' ? responseData : responseData?.error || 'Erro';
        if (errorMsg.toLowerCase().includes('duplicate')) errorMsg = 'Placa já existe';
        alert(`Erro: ${errorMsg}`);
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const styles = {
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(16, 24, 40, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    } as React.CSSProperties,
    modal: {
      background: '#ffffff',
      borderRadius: '24px',
      padding: '28px',
      width: '100%',
      maxWidth: '820px',
      maxHeight: '92vh',
      overflowY: 'auto',
      boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)',
      border: '1px solid rgba(148, 163, 184, 0.16)'
    } as React.CSSProperties,
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      borderBottom: '1px solid #e2e8f0',
      paddingBottom: '18px'
    } as React.CSSProperties,
    closeBtn: {
      background: 'transparent',
      border: 'none',
      fontSize: '28px',
      cursor: 'pointer',
      color: '#475569',
      lineHeight: 1
    } as React.CSSProperties,
    modalTitle: {
      margin: 0,
      fontSize: '22px',
      color: '#0f172a'
    } as React.CSSProperties,
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    } as React.CSSProperties,
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '18px'
    } as React.CSSProperties,
    formGroup: {
      display: 'flex',
      flexDirection: 'column'
    } as React.CSSProperties,
    formLabel: {
      marginBottom: '10px',
      fontWeight: 600,
      color: '#334155'
    } as React.CSSProperties,
    formInput: {
      padding: '14px 16px',
      border: '1px solid #cbd5e1',
      borderRadius: '14px',
      fontSize: '14px',
      color: '#0f172a',
      background: '#f8fafc',
      outline: 'none',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
    } as React.CSSProperties,
    formInputFocus: {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)'
    } as React.CSSProperties,
    formTextarea: {
      padding: '14px 16px',
      border: '1px solid #cbd5e1',
      borderRadius: '14px',
      fontSize: '14px',
      resize: 'vertical',
      minHeight: '100px',
      background: '#f8fafc',
      outline: 'none'
    } as React.CSSProperties,
    sectionCard: {
      background: '#f8fafc',
      borderRadius: '18px',
      border: '1px solid rgba(148, 163, 184, 0.24)',
      padding: '20px',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)'
    } as React.CSSProperties,
    sectionTitle: {
      margin: '0 0 14px',
      fontSize: '16px',
      color: '#0f172a',
      fontWeight: 700
    } as React.CSSProperties,
    imagePreview: {
      marginTop: '12px',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)'
    } as React.CSSProperties,
    imagePreviewImg: {
      width: '100%',
      display: 'block',
      borderRadius: '14px'
    } as React.CSSProperties,
    fileLink: {
      color: '#2563eb',
      textDecoration: 'none',
      fontWeight: 600,
      marginTop: '8px',
      display: 'inline-block'
    } as React.CSSProperties,
    docCard: {
      borderRadius: '18px',
      padding: '18px',
      marginBottom: '16px',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.98), #f8fafc)',
      border: '1px solid rgba(148, 163, 184, 0.2)',
      boxShadow: '0 14px 28px rgba(15, 23, 42, 0.04)'
    } as React.CSSProperties,
    docHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    } as React.CSSProperties,
    removeButton: {
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      padding: '10px 14px',
      cursor: 'pointer',
      fontWeight: 600
    } as React.CSSProperties,
    addSection: {
      border: '1px solid rgba(59, 130, 246, 0.25)',
      padding: '18px',
      borderRadius: '18px',
      background: '#eff6ff'
    } as React.CSSProperties,
    addButton: {
      background: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '14px',
      padding: '12px 18px',
      cursor: 'pointer',
      fontWeight: 700,
      marginTop: '16px'
    } as React.CSSProperties,
    formActions: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      marginTop: '8px'
    } as React.CSSProperties,
    formButton: {
      padding: '12px 24px',
      border: 'none',
      borderRadius: '14px',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: 700,
      transition: 'transform 0.2s ease, opacity 0.2s ease'
    } as React.CSSProperties,
    cancelButton: {
      background: '#64748b',
      color: 'white'
    } as React.CSSProperties,
    submitButton: {
      background: '#2563eb',
      color: 'white'
    } as React.CSSProperties,
    disabledButton: {
      opacity: 0.65,
      cursor: 'not-allowed'
    } as React.CSSProperties
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{item ? 'Editar Bem' : 'Novo Bem'}</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Campos básicos */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Placa de Patrimônio*</label>
              <input type="text" name="plate" value={formData.plate} onChange={handleInputChange} required style={styles.formInput} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Nome do Bem*</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required style={styles.formInput} />
            </div>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Descrição</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} style={styles.formTextarea} />
          </div>
          
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Data de Aquisição*</label>
              <input type="date" name="acquisition_date" value={formData.acquisition_date} onChange={handleInputChange} required style={styles.formInput} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Valor (R$)*</label>
              <input type="number" step="0.01" name="value" value={formData.value} onChange={handleInputChange} required style={styles.formInput} />
            </div>
          </div>
          
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Departamento*</label>
              <select name="department" value={formData.department} onChange={handleInputChange} required style={styles.formInput}>
                <option value="">Selecione</option>
                <option value="education">Educação</option>
                <option value="health">Saúde</option>
                <option value="administration">Administração</option>
                <option value="urbanism">Urbanismo</option>
                <option value="culture">Cultura</option>
                <option value="sports">Esportes</option>
                <option value="transportation">Transporte</option>
                <option value="finance">Finanças</option>
                <option value="assistenci">Assistência Comunitária</option>
                <option value="tourism">Turismo</option>
                <option value="environment">Meio Ambiente</option>
                <option value="government">Governo</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Status*</label>
              <select name="status" value={formData.status} onChange={handleInputChange} required style={styles.formInput}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="maintenance">Manutenção</option>
                <option value="written_off">Baixado</option>
              </select>
            </div>
          </div>
          
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                <input type="checkbox" name="is_vehicle" checked={formData.is_vehicle} onChange={(e) => setFormData(prev => ({ ...prev, is_vehicle: e.target.checked }))} style={{ marginRight: '8px' }} />
                É um veículo?
              </label>
            </div>
          </div>
          
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Setor</label>
              <input type="text" name="sector" value={formData.sector} onChange={handleInputChange} style={styles.formInput} placeholder="Ex: Sala 101" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Data emissão NF (principal)</label>
              <input type="date" name="nf_issue_date" value={formData.nf_issue_date} onChange={handleInputChange} style={styles.formInput} />
            </div>
          </div>
          
          {/* Campo Fornecedor com botão OCR */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Fornecedor</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                name="supplier" 
                value={formData.supplier} 
                onChange={handleInputChange} 
                style={{ ...styles.formInput, flex: 1 }} 
                placeholder="Nome do fornecedor"
              />
              <button
                type="button"
                onClick={() => setShowOCR(true)}
                style={{
                  padding: '0 1.5rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
                title="Ler dados da nota fiscal pela imagem ou PDF"
              >
                📄 Importar NF
              </button>
            </div>
          </div>

          {/* SEÇÃO DE DOCUMENTOS FISCAIS MÚLTIPLOS */}
          <div style={styles.sectionCard}>
            <h4 style={styles.sectionTitle}>📋 Documentos Fiscais (NF + Empenho)</h4>
            <div style={styles.addSection}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nova NF</label>
                  <input type="text" value={newDocInvoice} onChange={(e) => setNewDocInvoice(e.target.value)} placeholder="Número" style={styles.formInput} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Novo Empenho</label>
                  <input type="text" value={newDocCommitment} onChange={(e) => setNewDocCommitment(e.target.value)} placeholder="Número" style={styles.formInput} />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Data Emissão</label>
                  <input type="date" value={newDocIssueDate} onChange={(e) => setNewDocIssueDate(e.target.value)} style={styles.formInput} />
                </div>
                <div></div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Arquivo NF</label>
                  <input type="file" accept=".pdf,image/*" onChange={(e) => setNewDocInvoiceFile(e.target.files?.[0] || null)} style={styles.formInput} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Arquivo Empenho</label>
                  <input type="file" accept=".pdf,image/*" onChange={(e) => setNewDocCommitmentFile(e.target.files?.[0] || null)} style={styles.formInput} />
                </div>
              </div>
              <button type="button" onClick={addFiscalDocument} style={styles.addButton}>+ Adicionar Par (NF+Empenho)</button>
            </div>
            {fiscalDocuments.map((doc, idx) => (
              <div key={doc.id || idx} style={styles.docCard}>
                <div style={styles.docHeader}>
                  <strong>Documento #{idx+1} {doc.isLegacy && '(Original)'}</strong>
                  <button type="button" onClick={() => removeFiscalDocument(idx)} style={styles.removeButton}>Remover</button>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Nº Nota Fiscal</label>
                    <input type="text" value={doc.invoiceNumber} onChange={(e) => updateFiscalDocument(idx, 'invoiceNumber', e.target.value)} style={styles.formInput} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Nº Empenho</label>
                    <input type="text" value={doc.commitmentNumber} onChange={(e) => updateFiscalDocument(idx, 'commitmentNumber', e.target.value)} style={styles.formInput} />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Data Emissão NF</label>
                    <input type="date" value={doc.issueDate || ''} onChange={(e) => updateFiscalDocument(idx, 'issueDate', e.target.value)} style={styles.formInput} />
                  </div>
                  <div></div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Arquivo NF</label>
                    <input type="file" accept=".pdf,image/*" onChange={(e) => e.target.files?.[0] && handleDocInvoiceFileChange(idx, e.target.files[0])} style={styles.formInput} />
                    {doc.invoiceFile && !doc._invoiceFile && (
                      <a href={`http://localhost:8080${doc.invoiceFile}`} target="_blank" rel="noopener noreferrer" style={styles.fileLink}>Ver NF atual</a>
                    )}
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Arquivo Empenho</label>
                    <input type="file" accept=".pdf,image/*" onChange={(e) => e.target.files?.[0] && handleDocCommitmentFileChange(idx, e.target.files[0])} style={styles.formInput} />
                    {doc.commitmentFile && !doc._commitmentFile && (
                      <a href={`http://localhost:8080${doc.commitmentFile}`} target="_blank" rel="noopener noreferrer" style={styles.fileLink}>Ver Empenho atual</a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Foto do bem */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Foto do Bem</label>
            <input type="file" accept="image/*" onChange={handleImageChange} style={styles.formInput} />
            {previewUrl && <div style={styles.imagePreview}><img src={previewUrl} alt="Preview" style={styles.imagePreviewImg} /></div>}
            {uploadingImage && <p>Enviando imagem...</p>}
          </div>

          <div style={styles.formActions}>
            <button type="button" onClick={onClose} disabled={loading || uploadingImage || uploadingDocs} style={{ ...styles.formButton, ...styles.cancelButton, ...((loading || uploadingImage || uploadingDocs) ? styles.disabledButton : {}) }}>Cancelar</button>
            <button type="submit" disabled={loading || uploadingImage || uploadingDocs} style={{ ...styles.formButton, ...styles.submitButton, ...((loading || uploadingImage || uploadingDocs) ? styles.disabledButton : {}) }}>
              {loading ? 'Salvando...' : uploadingDocs ? 'Enviando documentos...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Modal OCR */}
      {showOCR && (
        <OCRScanner
          onDataExtracted={handleOCRData}
          onClose={() => setShowOCR(false)}
        />
      )}
    </div>
  );
}