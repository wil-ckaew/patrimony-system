import React, { useState } from 'react';
import styles from './EditAuctionModal.module.css';
import { getAuthHeaders } from '../utils/auth';

interface EditAuctionModalProps {
  auction: {
    id: string;
    auction_number: string;
    edital_number: string | null;
    auction_date: string | null;
    auctioneer: string | null;
    company: string | null;
    status: string;
    notes: string | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditAuctionModal({ 
  auction, 
  onClose, 
  onSuccess 
}: EditAuctionModalProps) {
  const [formData, setFormData] = useState({
    edital_number: auction.edital_number || '',
    auction_date: auction.auction_date ? auction.auction_date.split('T')[0] : '',
    auctioneer: auction.auctioneer || '',
    company: auction.company || '',
    status: auction.status || 'EM_PREPARACAO',
    notes: auction.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const headers = getAuthHeaders();
      
      const payload = {
        edital_number: formData.edital_number || null,
        auction_date: formData.auction_date || null,
        auctioneer: formData.auctioneer || null,
        company: formData.company || null,
        status: formData.status,
        notes: formData.notes || null
      };

      console.log('📤 Atualizando leilão:', payload);

      const response = await fetch(`http://localhost:8080/api/auctions/${auction.id}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('📥 Resposta:', response.status, responseText);

      if (!response.ok) {
        let errorMsg = responseText;
        try {
          const errorJson = JSON.parse(responseText);
          errorMsg = errorJson.error || errorJson.message || responseText;
        } catch {
          // Se não for JSON, usa o texto
        }
        throw new Error(errorMsg || 'Erro ao atualizar leilão');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('❌ Erro:', err);
      setError(err.message || 'Erro ao atualizar leilão');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'EM_PREPARACAO': 'Em Preparação',
      'PUBLICADO': 'Publicado',
      'REALIZADO': 'Realizado',
      'FINALIZADO': 'Finalizado',
      'BAIXA_CONCLUIDA': 'Baixa Concluída'
    };
    return labels[status] || status;
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>✏️ Editar Leilão</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Número do Leilão</label>
            <input
              type="text"
              value={auction.auction_number}
              disabled
              className={styles.disabledInput}
            />
            <small className={styles.helperText}>O número do leilão não pode ser alterado</small>
          </div>

          <div className={styles.formGroup}>
            <label>Número do Edital</label>
            <input
              type="text"
              name="edital_number"
              value={formData.edital_number}
              onChange={handleInputChange}
              placeholder="Ex: EDITAL-001/2026"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Data do Leilão</label>
            <input
              type="date"
              name="auction_date"
              value={formData.auction_date}
              onChange={handleInputChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Leiloeiro</label>
            <input
              type="text"
              name="auctioneer"
              value={formData.auctioneer}
              onChange={handleInputChange}
              placeholder="Nome do leiloeiro"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Empresa Responsável</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="Nome da empresa"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Status *</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
            >
              <option value="EM_PREPARACAO">Em Preparação</option>
              <option value="PUBLICADO">Publicado</option>
              <option value="REALIZADO">Realizado</option>
              <option value="FINALIZADO">Finalizado</option>
              <option value="BAIXA_CONCLUIDA">Baixa Concluída</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Observações</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Observações sobre o leilão"
            />
          </div>

          {error && <div className={styles.errorText}>{error}</div>}

          <div className={styles.modalActions}>
            <button type="button" className={styles.buttonSecondary} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.buttonPrimary} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
