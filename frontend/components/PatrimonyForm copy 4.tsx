// components/PatrimonyForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { PatrimonyItem, FiscalDocument } from '../types/Patrimony';
import { getAuthHeaders, checkTokenValidity } from '../utils/auth';
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
  const [showFiscalSection, setShowFiscalSection] = useState(false);

  // Estado para OCR
  const [showOCR, setShowOCR] = useState(false);

  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  // ==================== FUNÇÃO DE VERIFICAÇÃO DE PLACA EXATA ====================
  const checkPlateExistsExact = async (plate: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await fetch(`http://localhost:8080/api/patrimony/check-plate?plate=${encodeURIComponent(plate)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`🔍 Verificando placa "${plate}":`, data);
        return data.exists === true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao verificar placa:', error);
      return false;
    }
  };

  // ==================== EFEITO PARA PREENCHER DOCUMENTOS FISCAIS ====================
  // Quando a seção for aberta, preencher com os dados atuais
  useEffect(() => {
    if (showFiscalSection) {
      // Preenche com os dados atuais do formulário
      setNewDocInvoice(formData.invoice_number || '');
      setNewDocCommitment(formData.commitment_number || '');
      setNewDocIssueDate(formData.nf_issue_date || '');
    }
  }, [showFiscalSection, formData.invoice_number, formData.commitment_number, formData.nf_issue_date]);

  // ==================== EFEITO PARA CRIAR DOCUMENTO FISCAL AUTOMATICAMENTE ====================
  useEffect(() => {
    if (formData.invoice_number.trim() && formData.commitment_number.trim()) {
      const exists = fiscalDocuments.some(
        doc => doc.invoiceNumber === formData.invoice_number.trim() && 
               doc.commitmentNumber === formData.commitment_number.trim()
      );
      
      if (!exists && fiscalDocuments.length === 0) {
        const newDoc: FiscalDocument = {
          id: Date.now().toString(),
          invoiceNumber: formData.invoice_number.trim(),
          commitmentNumber: formData.commitment_number.trim(),
          issueDate: formData.nf_issue_date || '',
          invoiceFile: null,
          commitmentFile: null,
          _invoiceFile: undefined,
          _commitmentFile: undefined,
        };
        setFiscalDocuments([newDoc]);
        console.log('📋 Documento fiscal criado automaticamente:', newDoc);
      }
    }
  }, [formData.invoice_number, formData.commitment_number, formData.nf_issue_date]);

  // ==================== CARREGAR DADOS DO ITEM PARA EDIÇÃO ====================
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
      setShowFiscalSection(false);
      return;
    }

    const loadItem = async () => {
      try {
        console.log('📋 Carregando patrimônio para edição:', item.id);
        
        const response = await fetch(`http://localhost:8080/api/patrimony/${item.id}`, {
          headers: getAuthHeaders(),
        });
        
        if (!response.ok) {
          throw new Error('Falha ao carregar o patrimônio');
        }
        
        const data = await response.json();
        console.log('✅ Dados recebidos do backend:', data);
        
        setFormData({
          plate: data.plate || '',
          name: data.name || '',
          description: data.description || '',
          acquisition_date: data.acquisition_date ? data.acquisition_date.split('T')[0] : '',
          value: data.value?.toString() || '',
          department: data.department || '',
          status: data.status || 'active',
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
            id: doc.id || `doc-${Date.now()}`,
            invoiceNumber: doc.invoice_number || '',
            commitmentNumber: doc.commitment_number || '',
            issueDate: doc.issue_date || doc.nf_issue_date || '',
            invoiceFile: doc.invoice_file || '',
            commitmentFile: doc.commitment_file || '',
            isLegacy: false,
          }));
          setShowFiscalSection(true);
        } else if (data.invoice_number || data.commitment_number || data.invoice_file || data.commitment_file) {
          loadedFiscalDocuments = [{
            id: 'legacy',
            invoiceNumber: data.invoice_number || '',
            commitmentNumber: data.commitment_number || '',
            issueDate: data.nf_issue_date || '',
            invoiceFile: data.invoice_file || '',
            commitmentFile: data.commitment_file || '',
            isLegacy: true,
          }];
          setShowFiscalSection(true);
        }

        setFiscalDocuments(loadedFiscalDocuments);
        
      } catch (error) {
        console.error('❌ Erro ao carregar patrimônio completo:', error);
        
        setFormData({
          plate: item.plate || '',
          name: item.name || '',
          description: item.description || '',
          acquisition_date: item.acquisitionDate || '',
          value: item.value?.toString() || '',
          department: item.department || '',
          status: item.status || 'active',
          invoice_number: item.invoiceNumber || '',
          commitment_number: item.commitmentNumber || '',
          denf_se_number: item.denfSeNumber || '',
          sector: item.sector || '',
          nf_issue_date: item.nfIssueDate || '',
          supplier: item.supplier || '',
          is_vehicle: item.isVehicle || false,
        });
        
        if (item.fiscalDocuments && item.fiscalDocuments.length > 0) {
          setFiscalDocuments(item.fiscalDocuments);
          setShowFiscalSection(true);
        } else if (item.invoiceNumber || item.commitmentNumber || item.invoiceFile || item.commitmentFile) {
          setFiscalDocuments([{
            id: 'legacy',
            invoiceNumber: item.invoiceNumber || '',
            commitmentNumber: item.commitmentNumber || '',
            issueDate: item.nfIssueDate || '',
            invoiceFile: item.invoiceFile || '',
            commitmentFile: item.commitmentFile || '',
            isLegacy: true,
          }]);
          setShowFiscalSection(true);
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

  const handleOCRData = (data: {
    invoiceNumber?: string;
    supplier?: string;
    value?: number;
    issueDate?: string;
    commitmentNumber?: string;
  }) => {
    console.log('📝 Dados recebidos do OCR:', data);
    
    setFormData(prev => {
      const newData = { ...prev };
      if (data.invoiceNumber) newData.invoice_number = data.invoiceNumber;
      if (data.commitmentNumber) newData.commitment_number = data.commitmentNumber;
      if (data.supplier) newData.supplier = data.supplier;
      if (data.value && !isNaN(data.value)) newData.value = data.value.toString();
      if (data.issueDate) newData.nf_issue_date = data.issueDate;
      return newData;
    });
    
    // Preenche os campos do documento fiscal
    if (data.invoiceNumber) setNewDocInvoice(data.invoiceNumber);
    if (data.commitmentNumber) setNewDocCommitment(data.commitmentNumber);
    if (data.issueDate) setNewDocIssueDate(data.issueDate);
    
    setShowOCR(false);
    
    const message = `✅ Dados importados com sucesso!\n\n${
      data.invoiceNumber ? `📄 NF: ${data.invoiceNumber}\n` : ''
    }${data.commitmentNumber ? `📑 Empenho: ${data.commitmentNumber}\n` : ''}${
      data.supplier ? `🏢 Fornecedor: ${data.supplier}\n` : ''
    }${data.value ? `💰 Valor: R$ ${data.value.toFixed(2)}\n` : ''
    }${data.issueDate ? `📅 Data: ${data.issueDate}` : ''}`;
    
    alert(message);
  };

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
    if (updated.length === 0) setShowFiscalSection(false);
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

  const uploadImageToServer = async (patrimonyId: string, imageFile: File): Promise<boolean> => {
    try {
      setUploadingImage(true);
      console.log('📤 Enviando imagem para patrimônio:', patrimonyId);
      
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const headers = getAuthHeaders();
      delete headers['Content-Type'];
      
      const response = await fetch(`http://localhost:8080/api/patrimony/${patrimonyId}/image`, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (response.ok) {
        console.log('✅ Imagem enviada com sucesso');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erro ao enviar imagem:', error);
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
      delete headers['Content-Type'];
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
        const exists = await checkPlateExistsExact(patrimonyData.plate);
        if (exists) { 
          alert(`❌ A placa "${patrimonyData.plate}" já existe no sistema!`); 
          return; 
        }
      }
      
      if (!patrimonyData.name) { alert('Nome obrigatório'); return; }
      if (!patrimonyData.department) { alert('Departamento obrigatório'); return; }

      const url = item ? `http://localhost:8080/api/patrimony/${item.id}` : 'http://localhost:8080/api/patrimony';
      const method = item ? 'PUT' : 'POST';

      console.log('📤 Enviando dados:', method, url, patrimonyData);

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

      console.log('📥 Resposta do servidor:', response.status, responseData);

      if (response.ok) {
        let patrimonyId = responseData?.id || item?.id;
        
        if (!patrimonyId && typeof responseData === 'string' && responseData.length === 36) {
          patrimonyId = responseData;
        }
        
        if (!patrimonyId && responseData?.data?.id) {
          patrimonyId = responseData.data.id;
        }

        if (patrimonyId) {
          if (image) {
            await uploadImageToServer(patrimonyId, image);
          }
          
          if (fiscalDocuments.length > 0) {
            await uploadFiscalDocuments(patrimonyId);
          }
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
      console.error('❌ Erro ao salvar:', error);
      alert('Erro de conexão');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  // ==================== STYLES ====================
  const styles = {
    modalOverlay: {
      position: 'fixed' as const,
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
    },
    modal: {
      background: '#ffffff',
      borderRadius: '24px',
      padding: '28px',
      width: '100%',
      maxWidth: '900px',
      maxHeight: '92vh',
      overflowY: 'auto' as const,
      boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      borderBottom: '1px solid #e2e8f0',
      paddingBottom: '18px'
    },
    modalTitle: {
      margin: 0,
      fontSize: '22px',
      color: '#0f172a'
    },
    closeBtn: {
      background: 'transparent',
      border: 'none',
      fontSize: '28px',
      cursor: 'pointer',
      color: '#475569'
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '18px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const
    },
    formLabel: {
      marginBottom: '8px',
      fontWeight: 600,
      color: '#334155',
      fontSize: '14px'
    },
    formInput: {
      padding: '12px 14px',
      border: '1px solid #cbd5e1',
      borderRadius: '12px',
      fontSize: '14px',
      background: '#f8fafc'
    },
    formTextarea: {
      padding: '12px 14px',
      border: '1px solid #cbd5e1',
      borderRadius: '12px',
      fontSize: '14px',
      resize: 'vertical' as const,
      minHeight: '80px',
      background: '#f8fafc'
    },
    sectionCard: {
      background: '#f8fafc',
      borderRadius: '18px',
      border: '1px solid rgba(148, 163, 184, 0.24)',
      padding: '20px',
      marginTop: '10px'
    },
    sectionTitle: {
      margin: '0 0 14px 0',
      fontSize: '16px',
      fontWeight: 700,
      color: '#0f172a'
    },
    docCard: {
      background: '#ffffff',
      borderRadius: '14px',
      padding: '16px',
      marginBottom: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    },
    docHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
      paddingBottom: '12px',
      borderBottom: '1px solid #e2e8f0'
    },
    removeButton: {
      background: '#fee2e2',
      color: '#dc2626',
      border: 'none',
      borderRadius: '10px',
      padding: '6px 12px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 600,
      transition: 'all 0.2s ease',
      ':hover': { background: '#fecaca' }
    },
    addSection: {
      background: '#eff6ff',
      border: '1px dashed #3b82f6',
      borderRadius: '14px',
      padding: '16px',
      marginBottom: '16px'
    },
    addButton: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      padding: '10px 18px',
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '13px',
      marginTop: '12px',
      width: '100%',
      transition: 'transform 0.2s ease',
      ':hover': { transform: 'translateY(-1px)' }
    },
    toggleButton: {
      background: 'transparent',
      border: '1px solid #cbd5e1',
      borderRadius: '10px',
      padding: '8px 16px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 500,
      color: '#475569',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      width: '100%',
      transition: 'all 0.2s ease',
      ':hover': { background: '#f1f5f9', borderColor: '#3b82f6' }
    },
    badge: {
      background: '#dbeafe',
      color: '#1e40af',
      borderRadius: '20px',
      padding: '4px 10px',
      fontSize: '11px',
      fontWeight: 600,
      marginLeft: '8px'
    },
    filePreview: {
      marginTop: '8px',
      padding: '8px',
      background: '#f1f5f9',
      borderRadius: '8px',
      fontSize: '12px',
      color: '#475569'
    },
    fileLink: {
      color: '#3b82f6',
      textDecoration: 'none',
      fontSize: '12px',
      marginTop: '6px',
      display: 'inline-block',
      ':hover': { textDecoration: 'underline' }
    },
    imagePreview: {
      marginTop: '12px',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '2px solid #e2e8f0',
      maxWidth: '200px'
    },
    imagePreviewImg: {
      width: '100%',
      height: 'auto',
      display: 'block'
    },
    actionButtons: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      marginTop: '20px'
    },
    btn: {
      padding: '12px 24px',
      border: 'none',
      borderRadius: '14px',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: 700,
      transition: 'all 0.2s ease'
    },
    btnPrimary: {
      background: '#2563eb',
      color: 'white'
    },
    btnSecondary: {
      background: '#64748b',
      color: 'white'
    },
    btnSuccess: {
      background: '#10b981',
      color: 'white'
    },
    disabledBtn: {
      opacity: 0.65,
      cursor: 'not-allowed'
    },
    ocrButton: {
      background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      padding: '10px 18px',
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '13px',
      whiteSpace: 'nowrap' as const,
      transition: 'all 0.2s ease',
      ':hover': { transform: 'translateY(-1px)' }
    },
    fiscalInfoBadge: {
      background: '#e8f5e9',
      color: '#2e7d32',
      padding: '8px 12px',
      borderRadius: '8px',
      fontSize: '13px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '8px'
    }
  };

  const departments = [
    'Educação', 'Saúde', 'Administração', 'Urbanismo', 
    'Cultura', 'Esportes', 'Transporte', 'Finanças',
    'Assistência Comunitária', 'Turismo', 'Meio Ambiente', 'Governo'
  ];

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{item ? '✏️ Editar Bem' : '✨ Novo Bem'}</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* 📋 Informações Básicas */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionTitle}>📋 Informações Básicas</div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Placa de Patrimônio *</label>
                <input
                  type="text"
                  name="plate"
                  value={formData.plate}
                  onChange={handleInputChange}
                  required
                  style={styles.formInput}
                  placeholder="Ex: 28436"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Nome do Bem *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={styles.formInput}
                  placeholder="Ex: Computador Desktop"
                />
              </div>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Descrição</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                style={styles.formTextarea}
                placeholder="Descrição detalhada do bem..."
              />
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Data de Aquisição *</label>
                <input
                  type="date"
                  name="acquisition_date"
                  value={formData.acquisition_date}
                  onChange={handleInputChange}
                  required
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="value"
                  value={formData.value}
                  onChange={handleInputChange}
                  required
                  style={styles.formInput}
                  placeholder="0,00"
                />
              </div>
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Departamento *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                  style={styles.formInput}
                >
                  <option value="">Selecione</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  style={styles.formInput}
                >
                  <option value="active">✅ Ativo</option>
                  <option value="inactive">⭕ Inativo</option>
                  <option value="maintenance">🔧 Manutenção</option>
                  <option value="written_off">❌ Baixado</option>
                </select>
              </div>
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Setor</label>
                <input
                  type="text"
                  name="sector"
                  value={formData.sector}
                  onChange={handleInputChange}
                  style={styles.formInput}
                  placeholder="Ex: Almoxarifado, Sala 101"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={{ ...styles.formLabel, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    name="is_vehicle"
                    checked={formData.is_vehicle}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_vehicle: e.target.checked }))}
                    style={{ width: '18px', height: '18px' }}
                  />
                  🚗 É um veículo?
                </label>
              </div>
            </div>
          </div>

          {/* 💰 Informações Fiscais */}
          <div style={{ ...styles.sectionCard, background: '#eff6ff', borderColor: '#3b82f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={styles.sectionTitle}>💰 Informações Fiscais</div>
              <button type="button" onClick={() => setShowOCR(true)} style={styles.ocrButton}>
                📄 Importar NF com OCR
              </button>
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Fornecedor</label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  style={styles.formInput}
                  placeholder="Nome do fornecedor"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Data emissão NF</label>
                <input
                  type="date"
                  name="nf_issue_date"
                  value={formData.nf_issue_date}
                  onChange={handleInputChange}
                  style={styles.formInput}
                />
              </div>
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>N° Nota Fiscal</label>
                <input
                  type="text"
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={handleInputChange}
                  style={styles.formInput}
                  placeholder="Número da NF"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>N° Empenho</label>
                <input
                  type="text"
                  name="commitment_number"
                  value={formData.commitment_number}
                  onChange={handleInputChange}
                  style={styles.formInput}
                  placeholder="Número do empenho"
                />
              </div>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>N° DENF/SE</label>
              <input
                type="text"
                name="denf_se_number"
                value={formData.denf_se_number}
                onChange={handleInputChange}
                style={styles.formInput}
                placeholder="Número do DENF/SE"
              />
            </div>

            {/* Badge informativo quando dados fiscais estão preenchidos */}
            {formData.invoice_number && formData.commitment_number && (
              <div style={styles.fiscalInfoBadge}>
                ✅ Dados preenchidos: NF {formData.invoice_number} / Empenho {formData.commitment_number}
                {formData.nf_issue_date && ` - Data: ${formData.nf_issue_date}`}
                {formData.supplier && ` - Fornecedor: ${formData.supplier}`}
              </div>
            )}
          </div>

          {/* 📋 Documentos Fiscais Múltiplos */}
          <div style={styles.sectionCard}>
            <button
              type="button"
              onClick={() => setShowFiscalSection(!showFiscalSection)}
              style={styles.toggleButton}
            >
              {showFiscalSection ? '📋 ▼' : '📋 ▶'} Documentos Fiscais (NF + Empenho)
              {fiscalDocuments.length > 0 && <span style={styles.badge}>{fiscalDocuments.length}</span>}
            </button>
            
            {showFiscalSection && (
              <>
                <div style={{ marginTop: '16px' }}>
                  <div style={styles.addSection}>
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Nº Nota Fiscal</label>
                        <input
                          type="text"
                          value={newDocInvoice}
                          onChange={(e) => setNewDocInvoice(e.target.value)}
                          placeholder="Ex: 133943"
                          style={styles.formInput}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Nº Empenho</label>
                        <input
                          type="text"
                          value={newDocCommitment}
                          onChange={(e) => setNewDocCommitment(e.target.value)}
                          placeholder="Ex: 11148"
                          style={styles.formInput}
                        />
                      </div>
                    </div>
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Data Emissão</label>
                        <input
                          type="date"
                          value={newDocIssueDate}
                          onChange={(e) => setNewDocIssueDate(e.target.value)}
                          style={styles.formInput}
                        />
                      </div>
                      <div></div>
                    </div>
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Arquivo NF</label>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) => setNewDocInvoiceFile(e.target.files?.[0] || null)}
                          style={styles.formInput}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Arquivo Empenho</label>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) => setNewDocCommitmentFile(e.target.files?.[0] || null)}
                          style={styles.formInput}
                        />
                      </div>
                    </div>
                    <button type="button" onClick={addFiscalDocument} style={styles.addButton}>
                      + Adicionar Par (NF + Empenho)
                    </button>
                  </div>
                </div>
                
                {fiscalDocuments.map((doc, idx) => (
                  <div key={doc.id || idx} style={styles.docCard}>
                    <div style={styles.docHeader}>
                      <strong>📄 Documento #{idx+1} {doc.isLegacy && '(Original)'}</strong>
                      <button type="button" onClick={() => removeFiscalDocument(idx)} style={styles.removeButton}>
                        Remover
                      </button>
                    </div>
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Nº Nota Fiscal</label>
                        <input
                          type="text"
                          value={doc.invoiceNumber}
                          onChange={(e) => updateFiscalDocument(idx, 'invoiceNumber', e.target.value)}
                          style={styles.formInput}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Nº Empenho</label>
                        <input
                          type="text"
                          value={doc.commitmentNumber}
                          onChange={(e) => updateFiscalDocument(idx, 'commitmentNumber', e.target.value)}
                          style={styles.formInput}
                        />
                      </div>
                    </div>
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Data Emissão NF</label>
                        <input
                          type="date"
                          value={doc.issueDate || ''}
                          onChange={(e) => updateFiscalDocument(idx, 'issueDate', e.target.value)}
                          style={styles.formInput}
                        />
                      </div>
                      <div></div>
                    </div>
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Arquivo NF</label>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) => e.target.files?.[0] && handleDocInvoiceFileChange(idx, e.target.files[0])}
                          style={styles.formInput}
                        />
                        {doc.invoiceFile && !doc._invoiceFile && (
                          <a href={`http://localhost:8080${doc.invoiceFile}`} target="_blank" rel="noopener noreferrer" style={styles.fileLink}>
                            📎 Ver NF atual
                          </a>
                        )}
                        {doc._invoiceFile && (
                          <div style={styles.filePreview}>📎 {doc._invoiceFile.name}</div>
                        )}
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Arquivo Empenho</label>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) => e.target.files?.[0] && handleDocCommitmentFileChange(idx, e.target.files[0])}
                          style={styles.formInput}
                        />
                        {doc.commitmentFile && !doc._commitmentFile && (
                          <a href={`http://localhost:8080${doc.commitmentFile}`} target="_blank" rel="noopener noreferrer" style={styles.fileLink}>
                            📎 Ver Empenho atual
                          </a>
                        )}
                        {doc._commitmentFile && (
                          <div style={styles.filePreview}>📎 {doc._commitmentFile.name}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* 🖼️ Foto do Bem */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionTitle}>🖼️ Foto do Bem</div>
            <div style={styles.formGroup}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={styles.formInput}
              />
              {previewUrl && (
                <div style={styles.imagePreview}>
                  <img src={previewUrl} alt="Preview" style={styles.imagePreviewImg} />
                </div>
              )}
              {uploadingImage && <p style={{ fontSize: '12px', color: '#3b82f6', marginTop: '8px' }}>📤 Enviando imagem...</p>}
            </div>
          </div>

          {/* Botões de Ação */}
          <div style={styles.actionButtons}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading || uploadingImage || uploadingDocs}
              style={{
                ...styles.btn,
                ...styles.btnSecondary,
                ...((loading || uploadingImage || uploadingDocs) ? styles.disabledBtn : {})
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage || uploadingDocs}
              style={{
                ...styles.btn,
                ...styles.btnPrimary,
                ...((loading || uploadingImage || uploadingDocs) ? styles.disabledBtn : {})
              }}
            >
              {loading ? '💾 Salvando...' : uploadingDocs ? '📤 Enviando documentos...' : (item ? '💾 Atualizar Bem' : '✨ Cadastrar Bem')}
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