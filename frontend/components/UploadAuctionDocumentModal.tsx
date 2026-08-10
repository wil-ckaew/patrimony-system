import React, { useState } from 'react';
import styles from './UploadAuctionDocumentModal.module.css';
import { getAuthHeaders } from '../utils/auth';

interface UploadAuctionDocumentModalProps {
  vehicleId: string;
  auctionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const UploadAuctionDocumentModal: React.FC<UploadAuctionDocumentModalProps> = ({
  vehicleId,
  auctionId,
  onClose,
  onSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('edital');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const documentTypes = [
    { value: 'edital', label: '📄 Edital' },
    { value: 'ata', label: '📋 Ata' },
    { value: 'termo_entrega', label: '📝 Termo de Entrega' },
    { value: 'nota_arrematacao', label: '📊 Nota de Arrematação' },
    { value: 'comprovante_pagamento', label: '💰 Comprovante de Pagamento' },
    { value: 'publicacao_oficial', label: '📰 Publicação Oficial' },
    { value: 'laudo_avaliacao', label: '📑 Laudo de Avaliação' },
    { value: 'documento_veiculo', label: '🚗 Documento do Veículo' },
    // ADICIONE OS NOVOS ABAIXO
    { value: 'bo_ocorrencia', label: '📋 BO - Boletim de Ocorrência' },
    { value: 'processo_administrativo', label: '📂 Processo Administrativo' },
    // ... mais novos
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Selecione um arquivo');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);

    try {
      // Buscar token e criar headers sem Content-Type
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Sessão expirada. Faça login novamente.');
        setUploading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:8080/api/auctions/${auctionId}/pdfs`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Documento enviado:', data);
        alert('✅ Documento enviado com sucesso!');
        onSuccess();
        onClose();
      } else {
        const errorText = await response.text();
        console.error('❌ Erro:', errorText);
        setError(errorText || 'Erro ao enviar documento');
      }
    } catch (err) {
      console.error('❌ Erro de conexão:', err);
      setError('Erro de conexão com o servidor');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>📄 Upload de Documento</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Tipo de Documento</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className={styles.select}
            >
              {documentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Arquivo</label>
            <div className={styles.fileDrop}>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className={styles.fileInput}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <div className={styles.filePlaceholder}>
                {file ? (
                  <span>📎 {file.name}</span>
                ) : (
                  <span>Clique para selecionar ou arraste o arquivo</span>
                )}
              </div>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.uploadBtn} disabled={uploading || !file}>
              {uploading ? '⏳ Enviando...' : '📤 Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadAuctionDocumentModal;
