import React, { useState } from 'react';
import styles from './AddDocumentModal.module.css';
import { getAuthHeaders } from '../utils/auth';

interface AddDocumentModalProps {
  auctionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddDocumentModal({ 
  auctionId, 
  onClose, 
  onSuccess 
}: AddDocumentModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('edital');
  const [documentName, setDocumentName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const documentTypes = [
    { value: 'edital', label: '📄 Edital' },
    { value: 'ata', label: '📋 Ata do Leilão' },
    { value: 'termo_entrega', label: '📝 Termo de Entrega' },
    { value: 'nota_arrematacao', label: '🧾 Nota de Arrematação' },
    { value: 'comprovante_pagamento', label: '💳 Comprovante de Pagamento' },
    { value: 'publicacao_oficial', label: '📰 Publicação Oficial' },
    { value: 'laudo_avaliacao', label: '📊 Laudo de Avaliação' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validar se é PDF
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setError('Por favor, selecione um arquivo PDF');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Selecione um arquivo PDF');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('document_type', documentType);
      formData.append('file_name', documentName || selectedFile.name);

      const headers = getAuthHeaders();
      delete headers['Content-Type'];

      const response = await fetch(`http://localhost:8080/api/auctions/${auctionId}/pdfs`, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erro ao enviar documento');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('❌ Erro:', err);
      setError(err.message || 'Erro ao enviar documento');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>📄 Adicionar Documento</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Tipo de Documento *</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              required
            >
              {documentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Nome do Documento (opcional)</label>
            <input
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Ex: Edital_Leilao_001_2026"
            />
            <small className={styles.helperText}>Se não preencher, será usado o nome do arquivo</small>
          </div>

          <div className={styles.formGroup}>
            <label>Arquivo PDF *</label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              required
            />
            <small className={styles.helperText}>Apenas arquivos PDF são permitidos</small>
          </div>

          {selectedFile && (
            <div className={styles.fileInfo}>
              <span>📎 {selectedFile.name}</span>
              <span className={styles.fileSize}>
                {(selectedFile.size / 1024).toFixed(2)} KB
              </span>
            </div>
          )}

          {error && <div className={styles.errorText}>{error}</div>}

          <div className={styles.modalActions}>
            <button type="button" className={styles.buttonSecondary} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.buttonPrimary} disabled={uploading}>
              {uploading ? 'Enviando...' : 'Enviar Documento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
