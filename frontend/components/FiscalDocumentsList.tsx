// components/FiscalDocumentsList.tsx
import React, { useState, useEffect } from 'react';
import { FiscalDocument } from '../types/Patrimony';

interface FiscalDocumentsListProps {
  documents: FiscalDocument[];
  onChange: (documents: FiscalDocument[]) => void;
  disabled?: boolean;
  legacyData?: {
    invoiceNumber?: string;
    commitmentNumber?: string;
    invoiceFile?: string;
    commitmentFile?: string;
    nfIssueDate?: string;
  };
}

export default function FiscalDocumentsList({ 
  documents, 
  onChange, 
  disabled,
  legacyData 
}: FiscalDocumentsListProps) {
  const [newDocument, setNewDocument] = useState<Partial<FiscalDocument>>({
    invoiceNumber: '',
    commitmentNumber: '',
    issueDate: ''
  });

  // Inicializar com dados legados se existirem
  useEffect(() => {
    if (legacyData && (legacyData.invoiceNumber || legacyData.commitmentNumber)) {
      const hasLegacyInList = documents.some(doc => doc.isLegacy);
      if (!hasLegacyInList && (legacyData.invoiceNumber || legacyData.commitmentNumber)) {
        onChange([{
          id: 'legacy',
          invoiceNumber: legacyData.invoiceNumber || '',
          commitmentNumber: legacyData.commitmentNumber || '',
          invoiceFile: legacyData.invoiceFile,
          commitmentFile: legacyData.commitmentFile,
          issueDate: legacyData.nfIssueDate,
          isLegacy: true
        }, ...documents]);
      }
    }
  }, [legacyData]);

  const addDocument = () => {
    if (newDocument.invoiceNumber?.trim() && newDocument.commitmentNumber?.trim()) {
      onChange([...documents, {
        id: Date.now().toString(),
        invoiceNumber: newDocument.invoiceNumber,
        commitmentNumber: newDocument.commitmentNumber,
        issueDate: newDocument.issueDate
      }]);
      setNewDocument({ invoiceNumber: '', commitmentNumber: '', issueDate: '' });
    }
  };

  const removeDocument = (index: number) => {
    const docToRemove = documents[index];
    // Se for documento legado, apenas limpa mas não remove completamente
    if (docToRemove.isLegacy) {
      if (confirm('Este é o documento original do sistema. Deseja removê-lo? Os dados serão perdidos.')) {
        const updated = [...documents];
        updated.splice(index, 1);
        onChange(updated);
      }
    } else {
      const updated = [...documents];
      updated.splice(index, 1);
      onChange(updated);
    }
  };

  const updateDocument = (index: number, field: keyof FiscalDocument, value: any) => {
    const updated = [...documents];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleInvoiceFileChange = (index: number, file: File) => {
    const updated = [...documents];
    updated[index].invoiceFile = URL.createObjectURL(file);
    updated[index].invoiceFileName = file.name;
    updated[index]._invoiceFile = file;
    onChange(updated);
  };

  const handleCommitmentFileChange = (index: number, file: File) => {
    const updated = [...documents];
    updated[index].commitmentFile = URL.createObjectURL(file);
    updated[index].commitmentFileName = file.name;
    updated[index]._commitmentFile = file;
    onChange(updated);
  };

  const styles = {
    container: {
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '15px',
      marginTop: '15px',
      backgroundColor: '#f9f9f9'
    },
    title: {
      fontWeight: 'bold',
      marginBottom: '15px',
      fontSize: '16px',
      color: '#333'
    },
    legacyBadge: {
      backgroundColor: '#ffc107',
      color: '#856404',
      fontSize: '11px',
      padding: '2px 8px',
      borderRadius: '12px',
      marginLeft: '10px'
    },
    documentCard: {
      backgroundColor: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: '6px',
      padding: '12px',
      marginBottom: '12px',
      position: 'relative' as const
    },
    legacyCard: {
      backgroundColor: '#fff3cd',
      border: '1px solid #ffecb5'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px',
      borderBottom: '1px solid #eee',
      paddingBottom: '8px'
    },
    cardTitle: {
      fontWeight: 'bold',
      color: '#007bff'
    },
    row: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '15px',
      marginBottom: '12px'
    },
    fieldGroup: {
      display: 'flex',
      flexDirection: 'column' as const
    },
    label: {
      fontSize: '12px',
      fontWeight: 'bold',
      marginBottom: '5px',
      color: '#555'
    },
    input: {
      padding: '8px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px'
    },
    fileInput: {
      padding: '6px',
      fontSize: '12px'
    },
    fileLink: {
      fontSize: '12px',
      color: '#007bff',
      textDecoration: 'underline',
      cursor: 'pointer',
      marginLeft: '10px'
    },
    removeButton: {
      background: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '4px 8px',
      cursor: 'pointer',
      fontSize: '12px'
    },
    addSection: {
      marginTop: '15px',
      padding: '12px',
      backgroundColor: '#f0f0f0',
      borderRadius: '6px'
    },
    addButton: {
      background: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 16px',
      cursor: 'pointer',
      marginTop: '10px',
      width: '100%'
    },
    smallText: {
      fontSize: '11px',
      color: '#666',
      marginTop: '4px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>
        📋 Documentos Fiscais (Nota Fiscal + Empenho)
      </div>
      
      {documents.map((doc, idx) => (
        <div 
          key={doc.id || idx} 
          style={{
            ...styles.documentCard,
            ...(doc.isLegacy ? styles.legacyCard : {})
          }}
        >
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>
              Documento #{idx + 1}
              {doc.isLegacy && <span style={styles.legacyBadge}>Documento Original</span>}
            </span>
            <button
              type="button"
              onClick={() => removeDocument(idx)}
              style={styles.removeButton}
              disabled={disabled}
            >
              Remover
            </button>
          </div>
          
          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Número da Nota Fiscal *</label>
              <input
                type="text"
                value={doc.invoiceNumber}
                onChange={(e) => updateDocument(idx, 'invoiceNumber', e.target.value)}
                placeholder="Ex: 12345"
                style={styles.input}
                disabled={disabled}
              />
            </div>
            
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Número do Empenho *</label>
              <input
                type="text"
                value={doc.commitmentNumber}
                onChange={(e) => updateDocument(idx, 'commitmentNumber', e.target.value)}
                placeholder="Ex: 20240001"
                style={styles.input}
                disabled={disabled}
              />
            </div>
          </div>
          
          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Data de Emissão da NF</label>
              <input
                type="date"
                value={doc.issueDate || ''}
                onChange={(e) => updateDocument(idx, 'issueDate', e.target.value)}
                style={styles.input}
                disabled={disabled}
              />
            </div>
            <div style={styles.fieldGroup}></div>
          </div>
          
          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Arquivo da Nota Fiscal</label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => e.target.files?.[0] && handleInvoiceFileChange(idx, e.target.files[0])}
                style={styles.fileInput}
                disabled={disabled}
              />
              {doc.invoiceFile && !doc._invoiceFile && (
                <a 
                  href={`http://localhost:8080${doc.invoiceFile}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.fileLink}
                >
                  Ver NF atual
                </a>
              )}
              {doc.invoiceFileName && (
                <div style={styles.smallText}>📄 {doc.invoiceFileName}</div>
              )}
            </div>
            
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Arquivo do Empenho</label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => e.target.files?.[0] && handleCommitmentFileChange(idx, e.target.files[0])}
                style={styles.fileInput}
                disabled={disabled}
              />
              {doc.commitmentFile && !doc._commitmentFile && (
                <a 
                  href={`http://localhost:8080${doc.commitmentFile}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.fileLink}
                >
                  Ver Empenho atual
                </a>
              )}
              {doc.commitmentFileName && (
                <div style={styles.smallText}>📄 {doc.commitmentFileName}</div>
              )}
            </div>
          </div>
        </div>
      ))}
      
      <div style={styles.addSection}>
        <div style={styles.row}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Nova Nota Fiscal</label>
            <input
              type="text"
              value={newDocument.invoiceNumber}
              onChange={(e) => setNewDocument({ ...newDocument, invoiceNumber: e.target.value })}
              placeholder="Número da NF"
              style={styles.input}
              disabled={disabled}
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Novo Empenho</label>
            <input
              type="text"
              value={newDocument.commitmentNumber}
              onChange={(e) => setNewDocument({ ...newDocument, commitmentNumber: e.target.value })}
              placeholder="Número do Empenho"
              style={styles.input}
              disabled={disabled}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={addDocument}
          disabled={!newDocument.invoiceNumber?.trim() || !newDocument.commitmentNumber?.trim() || disabled}
          style={styles.addButton}
        >
          + Adicionar Par (NF + Empenho)
        </button>
      </div>
    </div>
  );
}