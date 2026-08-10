import React, { useState } from 'react';
import styles from './UploadAuctionPhotoModal.module.css';
import { getAuthHeaders } from '../utils/auth';

interface UploadAuctionPhotoModalProps {
  vehicleId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const UploadAuctionPhotoModal: React.FC<UploadAuctionPhotoModalProps> = ({
  vehicleId,
  onClose,
  onSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [photoType, setPhotoType] = useState('chassi');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const photoTypes = [
    { value: 'chassi', label: '🔧 Chassi' },
    { value: 'plate', label: '🚗 Placa' },
    { value: 'front', label: '📷 Frontal' },
    { value: 'rear', label: '📷 Traseira' },
    { value: 'engine', label: '⚙️ Motor' },
    // Arquivos/Documentos
    { value: 'fotos', label: '📸 Fotos' },
    { value: 'file', label: '📎 Arquivo' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Selecione uma imagem');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
      };
      
      const response = await fetch(
        `http://localhost:8080/api/auctions/vehicles/${vehicleId}/photos/${photoType}`,
        {
          method: 'POST',
          headers: headers,
          body: formData
        }
      );

      if (response.ok) {
        alert('✅ Foto enviada com sucesso!');
        onSuccess();
        onClose();
      } else {
        const errorText = await response.text();
        setError(errorText || 'Erro ao enviar foto');
      }
    } catch (err) {
      console.error('❌ Erro:', err);
      setError('Erro de conexão');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>📷 Upload de Foto</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Tipo de Conteúdo</label>
            <select
              value={photoType}
              onChange={(e) => setPhotoType(e.target.value)}
              className={styles.select}
            >
              {photoTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>{photoType === 'file' ? 'Arquivo' : 'Imagem'}</label>
            <div className={styles.fileDrop}>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className={styles.fileInput}
                accept={photoType === 'file' 
                  ? '.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar' 
                  : '.jpg,.jpeg,.png,.gif,.webp,.bmp'}
              />
              <div className={styles.filePlaceholder}>
                {file ? (
                  <span>
                    {file.type.startsWith('image/') ? '🖼️' : '📎'} {file.name}
                  </span>
                ) : (
                  <span>Clique para selecionar {photoType === 'file' ? 'um arquivo' : 'uma imagem'}</span>
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

export default UploadAuctionPhotoModal;