import React, { useState } from 'react';
import styles from './CreateAuctionModal.module.css';

interface CreateAuctionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateAuctionModal: React.FC<CreateAuctionModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    auction_number: '',
    edital_number: '',
    auction_date: '',
    auctioneer: '',
    company: '',
    status: 'EM_PREPARACAO', // ✅ VALOR PADRÃO
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // ✅ Garantir que os campos opcionais sejam null se estiverem vazios
      const payload = {
        auction_number: formData.auction_number.trim(),
        edital_number: formData.edital_number.trim() || null,
        auction_date: formData.auction_date || null,
        auctioneer: formData.auctioneer.trim() || null,
        company: formData.company.trim() || null,
        status: formData.status, // ✅ ENVIA O STATUS SELECIONADO
        notes: formData.notes.trim() || null
      };

      const response = await fetch('http://localhost:8080/api/auctions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Erro ao criar leilão');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar leilão');
    } finally {
      setLoading(false);
    }
  };

  // Opções de status
  const statusOptions = [
    { value: 'EM_PREPARACAO', label: 'Em Preparação' },
    { value: 'PUBLICADO', label: 'Publicado' },
    { value: 'REALIZADO', label: 'Realizado' },
    { value: 'FINALIZADO', label: 'Finalizado' },
    { value: 'BAIXA_CONCLUIDA', label: 'Baixa Concluída' }
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>📋 Criar Novo Leilão</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {error && (
            <div className={styles.errorMessage}>
              ❌ {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="auction_number">Nº Leilão *</label>
            <input
              type="text"
              id="auction_number"
              name="auction_number"
              value={formData.auction_number}
              onChange={handleChange}
              placeholder="Ex: LEILÃO-001/2026"
              required
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="edital_number">Edital</label>
            <input
              type="text"
              id="edital_number"
              name="edital_number"
              value={formData.edital_number}
              onChange={handleChange}
              placeholder="Ex: EDITAL-3.203/2026"
              className={styles.formInput}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="auction_date">Data do Leilão</label>
              <input
                type="date"
                id="auction_date"
                name="auction_date"
                value={formData.auction_date}
                onChange={handleChange}
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className={styles.formInput}
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="auctioneer">Leiloeiro</label>
              <input
                type="text"
                id="auctioneer"
                name="auctioneer"
                value={formData.auctioneer}
                onChange={handleChange}
                placeholder="Nome do leiloeiro"
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="company">Empresa</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Nome da empresa"
                className={styles.formInput}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="notes">Observações</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Observações sobre o leilão..."
              className={styles.formTextarea}
              rows={3}
            />
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Criando...' : '✅ Criar Leilão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAuctionModal;
