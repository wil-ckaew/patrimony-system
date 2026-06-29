// components/BulkPatrimonyForm.tsx
import React, { useState } from 'react';
import { getAuthHeaders } from '../utils/auth';

interface FiscalDocument {
  id: string;
  invoiceNumber: string;
  commitmentNumber: string;
  issueDate: string;
  invoiceFile: File | null;
  commitmentFile: File | null;
  _invoiceFile?: File;
  _commitmentFile?: File;
}

interface BulkPatrimonyFormProps {
  onClose: () => void;
  onRefresh: () => void;
}

export default function BulkPatrimonyForm({ onClose, onRefresh }: BulkPatrimonyFormProps) {
  const [formData, setFormData] = useState({
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
    start_plate: '',
    end_plate: '',
    is_vehicle: false
  });
  
  // Estados para arquivos
  const [image, setImage] = useState<File | null>(null);
  
  // ✅ LISTA DE DOCUMENTOS FISCAIS MÚLTIPLOS (ADICIONADO)
  const [fiscalDocuments, setFiscalDocuments] = useState<FiscalDocument[]>([]);
  const [newDocInvoice, setNewDocInvoice] = useState('');
  const [newDocCommitment, setNewDocCommitment] = useState('');
  const [newDocIssueDate, setNewDocIssueDate] = useState('');
  const [newDocInvoiceFile, setNewDocInvoiceFile] = useState<File | null>(null);
  const [newDocCommitmentFile, setNewDocCommitmentFile] = useState<File | null>(null);
  const [showFiscalSection, setShowFiscalSection] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    }));
  };

  // ✅ FUNÇÕES PARA MÚLTIPLOS DOCUMENTOS FISCAIS (ADICIONADO)
  const addFiscalDocument = () => {
    if (!newDocInvoice.trim() || !newDocCommitment.trim()) {
      alert('Preencha o número da NF e do Empenho');
      return;
    }
    const newDoc: FiscalDocument = {
      id: Date.now().toString(),
      invoiceNumber: newDocInvoice.trim(),
      commitmentNumber: newDocCommitment.trim(),
      issueDate: newDocIssueDate,
      invoiceFile: newDocInvoiceFile,
      commitmentFile: newDocCommitmentFile,
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
    if (updated.length === 0) setShowFiscalSection(false);
  };

  const updateFiscalDocument = (index: number, field: keyof FiscalDocument, value: any) => {
    const updated = [...fiscalDocuments];
    updated[index] = { ...updated[index], [field]: value };
    setFiscalDocuments(updated);
  };

  const handleDocInvoiceFileChange = (index: number, file: File) => {
    const updated = [...fiscalDocuments];
    updated[index].invoiceFile = file;
    updated[index]._invoiceFile = file;
    setFiscalDocuments(updated);
  };

  const handleDocCommitmentFileChange = (index: number, file: File) => {
    const updated = [...fiscalDocuments];
    updated[index].commitmentFile = file;
    updated[index]._commitmentFile = file;
    setFiscalDocuments(updated);
  };

  const uploadFile = async (patrimonyId: string, file: File, type: 'image' | 'invoice' | 'commitment', docInfo?: { invoiceNumber?: string; commitmentNumber?: string }): Promise<boolean> => {
    const formData = new FormData();
    formData.append(type === 'image' ? 'image' : 'document', file);
    
    const headers = getAuthHeaders();
    if (headers['Content-Type']) delete headers['Content-Type'];
    
    let url = '';
    if (type === 'image') {
      url = `http://localhost:8080/api/patrimony/${patrimonyId}/image`;
    } else {
      const docType = type === 'invoice' ? 'invoice' : 'commitment';
      let queryParams = '';
      if (docInfo) {
        const params = new URLSearchParams();
        if (docInfo.invoiceNumber) params.append('invoice_number', docInfo.invoiceNumber);
        if (docInfo.commitmentNumber) params.append('commitment_number', docInfo.commitmentNumber);
        queryParams = `?${params.toString()}`;
      }
      url = `http://localhost:8080/api/patrimony/${patrimonyId}/document/${docType}${queryParams}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });
    
    return response.ok;
  };

  // ✅ FUNÇÃO PARA UPLOAD DE DOCUMENTOS FISCAIS MÚLTIPLOS (ADICIONADO)
  const uploadFiscalDocumentsToPatrimony = async (patrimonyId: string, doc: FiscalDocument): Promise<boolean> => {
    let success = true;
    
    if (doc._invoiceFile) {
      const invoiceSuccess = await uploadFile(patrimonyId, doc._invoiceFile, 'invoice', {
        invoiceNumber: doc.invoiceNumber,
        commitmentNumber: doc.commitmentNumber
      });
      if (!invoiceSuccess) success = false;
    }
    
    if (doc._commitmentFile) {
      const commitmentSuccess = await uploadFile(patrimonyId, doc._commitmentFile, 'commitment', {
        invoiceNumber: doc.invoiceNumber,
        commitmentNumber: doc.commitmentNumber
      });
      if (!commitmentSuccess) success = false;
    }
    
    return success;
  };

  // Função para fazer upload em paralelo para todos os patrimônios
  const uploadFilesToAllPatrimonies = async (patrimonyIds: string[]) => {
    const uploadPromises: Promise<boolean>[] = [];
    
    for (const patrimonyId of patrimonyIds) {
      if (image) {
        uploadPromises.push(uploadFile(patrimonyId, image, 'image'));
      }
    }
    
    // ✅ ADICIONADO: Upload dos documentos fiscais múltiplos
    for (const doc of fiscalDocuments) {
      for (const patrimonyId of patrimonyIds) {
        uploadPromises.push(uploadFiscalDocumentsToPatrimony(patrimonyId, doc));
      }
    }
    
    // Executar todos os uploads em paralelo
    const results = await Promise.allSettled(uploadPromises);
    
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    const failCount = results.filter(r => r.status === 'rejected' || r.value === false).length;
    
    return { successCount, failCount, total: uploadPromises.length };
  };

  const executeDirectly = async () => {
    const start = parseInt(formData.start_plate);
    const end = parseInt(formData.end_plate);
    
    if (isNaN(start) || isNaN(end)) {
      alert('Informe os números inicial e final');
      return;
    }
    
    if (start > end) {
      alert('Número inicial deve ser menor que o final');
      return;
    }
    
    if (!formData.name.trim()) {
      alert('Nome do bem é obrigatório');
      return;
    }
    
    if (!formData.value || parseFloat(formData.value) <= 0) {
      alert('Valor deve ser maior que zero');
      return;
    }
    
    setLoading(true);
    setUploadProgress({ current: 0, total: 0 });
    
    try {
      // Primeiro, criar todos os patrimônios em massa
      const response = await fetch('http://localhost:8080/api/patrimony/bulk', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          start_plate: start,
          end_plate: end,
          name: formData.name,
          description: formData.description,
          acquisition_date: formData.acquisition_date,
          value: parseFloat(formData.value) || 0,
          department: formData.department,
          status: formData.status,
          invoice_number: formData.invoice_number,
          commitment_number: formData.commitment_number,
          denf_se_number: formData.denf_se_number,
          sector: formData.sector,
          nf_issue_date: formData.nf_issue_date || null,
          supplier: formData.supplier,
          is_vehicle: formData.is_vehicle
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.inserted_ids && data.inserted_ids.length > 0) {
        const totalItems = data.inserted_ids.length;
        
        // Se tem arquivos para upload, anexar a CADA patrimônio criado
        if (image || fiscalDocuments.length > 0) {
          console.log(`📤 Fazendo upload dos arquivos para ${totalItems} patrimônios...`);
          console.log(`   📸 Foto: ${image ? 'Sim' : 'Não'}`);
          console.log(`   📋 Documentos fiscais: ${fiscalDocuments.length}`);
          
          const { successCount, failCount, total } = await uploadFilesToAllPatrimonies(data.inserted_ids);
          
          console.log(`✅ Uploads concluídos: ${successCount} sucessos, ${failCount} falhas de ${total} total`);
          
          let message = `✅ ${data.inserted} patrimônios inseridos com sucesso!\n\n`;
          message += `📊 Total solicitado: ${data.total}\n`;
          
          if (image || fiscalDocuments.length > 0) {
            if (failCount === 0) {
              message += `\n📎 Arquivos anexados a TODOS os ${totalItems} itens com sucesso!`;
              message += `\n   📸 ${image ? '1 foto' : ''}${image && fiscalDocuments.length > 0 ? ' + ' : ''}`;
              message += `📋 ${fiscalDocuments.length} documento(s) fiscal(is)`;
            } else {
              message += `\n📎 Anexos: ${successCount} uploads OK, ${failCount} falhas.`;
            }
          }
          
          alert(message);
        } else {
          alert(`✅ ${data.inserted} patrimônios inseridos com sucesso!\n\n📊 Total solicitado: ${data.total}`);
        }
        
        onRefresh();
        onClose();
      } else {
        alert(`⚠️ ${data.inserted || 0} patrimônios inseridos. ${data.errors?.length || 0} erros.`);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const totalItems = formData.start_plate && formData.end_plate 
    ? parseInt(formData.end_plate) - parseInt(formData.start_plate) + 1
    : 0;

  const departments = [
    'Educação', 'Saúde', 'Administração', 'Urbanismo', 
    'Cultura', 'Esportes', 'Transporte', 'Finanças'
  ];

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
    rangeCard: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '18px',
      padding: '20px',
      color: 'white',
      marginBottom: '10px'
    },
    rangeTitle: {
      margin: '0 0 16px 0',
      fontSize: '18px',
      fontWeight: 700
    },
    totalBadge: {
      background: 'rgba(255,255,255,0.2)',
      borderRadius: '12px',
      padding: '12px',
      textAlign: 'center' as const,
      marginTop: '16px'
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
    loadingText: {
      marginLeft: '10px',
      fontSize: '12px',
      color: '#666'
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>📦 Cadastro em Massa de Bens</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); executeDirectly(); }} style={styles.form}>
          {/* Faixa de numeração */}
          <div style={styles.rangeCard}>
            <h3 style={styles.rangeTitle}>🔢 Faixa de Numeração</h3>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={{ ...styles.formLabel, color: 'white' }}>Número Inicial *</label>
                <input
                  type="number"
                  name="start_plate"
                  value={formData.start_plate}
                  onChange={handleInputChange}
                  required
                  style={{ ...styles.formInput, background: 'white' }}
                  placeholder="Ex: 28436"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={{ ...styles.formLabel, color: 'white' }}>Número Final *</label>
                <input
                  type="number"
                  name="end_plate"
                  value={formData.end_plate}
                  onChange={handleInputChange}
                  required
                  style={{ ...styles.formInput, background: 'white' }}
                  placeholder="Ex: 28570"
                />
              </div>
            </div>
            {totalItems > 0 && (
              <div style={styles.totalBadge}>
                📊 Serão gerados <strong>{totalItems}</strong> patrimônios
              </div>
            )}
          </div>

          {/* Dados comuns a todos os bens */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Nome do Bem *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={styles.formInput}
                placeholder="Ex: Computador, Cadeira, Mesa"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Valor Unitário (R$) *</label>
              <input
                type="number"
                step="0.01"
                name="value"
                value={formData.value}
                onChange={handleInputChange}
                required
                style={styles.formInput}
                placeholder="0.00"
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Descrição</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
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
              <label style={styles.formLabel}>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                style={styles.formInput}
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="maintenance">Manutenção</option>
              </select>
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

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Data Emissão NF</label>
              <input
                type="date"
                name="nf_issue_date"
                value={formData.nf_issue_date}
                onChange={handleInputChange}
                style={styles.formInput}
              />
            </div>
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
          </div>

          {/* ✅ SEÇÃO DE MÚLTIPLOS DOCUMENTOS FISCAIS (ADICIONADA) */}
          <div style={styles.sectionCard}>
            <button
              type="button"
              onClick={() => setShowFiscalSection(!showFiscalSection)}
              style={styles.toggleButton}
            >
              {showFiscalSection ? '📋 ▼' : '📋 ▶'} Documentos Fiscais Adicionais (NF + Empenho)
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
                  <div key={doc.id} style={styles.docCard}>
                    <div style={styles.docHeader}>
                      <strong>📄 Documento Fiscal Adicional #{idx + 1}</strong>
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
                          value={doc.issueDate}
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
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (file) handleDocInvoiceFileChange(idx, file);
                          }}
                          style={styles.formInput}
                        />
                        {doc._invoiceFile && (
                          <div style={styles.filePreview}>📎 {doc._invoiceFile.name}</div>
                        )}
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Arquivo Empenho</label>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (file) handleDocCommitmentFileChange(idx, file);
                          }}
                          style={styles.formInput}
                        />
                        {doc._commitmentFile && (
                          <div style={styles.filePreview}>📎 {doc._commitmentFile.name}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                <p style={{ fontSize: '12px', color: '#f59e0b', marginTop: '12px', textAlign: 'center' }}>
                  ⚠️ Todos os documentos adicionais serão anexados a TODOS os {totalItems} itens da faixa
                </p>
              </>
            )}
          </div>

          {/* Seção de arquivos (foto) */}
          <div style={styles.sectionCard}>
            <h4 style={styles.sectionTitle}>📎 Anexos (Opcional)</h4>
            <p style={{ fontSize: '12px', color: '#f59e0b', marginBottom: '12px' }}>
              ⚠️ Os arquivos serão anexados a TODOS os itens da faixa
            </p>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>🖼️ Foto do Bem</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                style={styles.formInput}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>
              <input
                type="checkbox"
                name="is_vehicle"
                checked={formData.is_vehicle}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              É um veículo?
            </label>
          </div>

          <div style={styles.actionButtons}>
            <button
              type="button"
              onClick={() => onClose()}
              style={{ ...styles.btn, ...styles.btnSecondary }}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || totalItems === 0}
              style={{
                ...styles.btn,
                ...styles.btnPrimary,
                ...((loading || totalItems === 0) ? styles.disabledBtn : {})
              }}
            >
              {loading ? 'Cadastrando e enviando arquivos...' : `🚀 Cadastrar ${totalItems} Bens`}
            </button>
          </div>
          
          {loading && (
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <small style={{ color: '#666' }}>Aguarde, anexando arquivos a todos os itens...</small>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}