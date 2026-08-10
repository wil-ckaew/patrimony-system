import React, { useState } from 'react';
import styles from './UploadPhotoModal.module.css';
import { getAuthHeaders } from '../utils/auth';

interface UploadPhotoModalProps {
  auctionVehicleId: string;
  vehicleId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadPhotoModal({ 
  auctionVehicleId, 
  vehicleId,
  onClose, 
  onSuccess 
}: UploadPhotoModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoType, setPhotoType] = useState('chassi');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const photoTypes = [
    { value: 'chassi', label: '🔧 Chassi' },
    { value: 'plate', label: '🚗 Placa' },
    { value: 'front', label: '📷 Frente' },
    { value: 'rear', label: '📷 Traseira' },
    { value: 'engine', label: '⚙️ Motor' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Selecione uma foto');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('photo_type', photoType);

      const headers = getAuthHeaders();
      delete headers['Content-Type'];

      const response = await fetch(
        `http://localhost:8080/api/auctions/vehicles/${auctionVehicleId}/photos/${photoType}`,
        {
          method: 'POST',
          headers,
          body: formData
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erro ao fazer upload da foto');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>📸 Adicionar Foto</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Tipo de Foto *</label>
            <select
              value={photoType}
              onChange={(e) => setPhotoType(e.target.value)}
              required
            >
              {photoTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Selecione a Foto *</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
          </div>

          {preview && (
            <div className={styles.previewContainer}>
              <img src={preview} alt="Preview" className={styles.preview} />
            </div>
          )}

          {error && <div className={styles.errorText}>{error}</div>}

          <div className={styles.modalActions}>
            <button type="button" className={styles.buttonSecondary} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.buttonPrimary} disabled={uploading}>
              {uploading ? 'Enviando...' : 'Enviar Foto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
