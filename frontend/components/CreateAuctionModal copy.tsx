import React, { useState } from 'react';
import styles from './CreateAuctionModal.module.css';
import { getAuthHeaders } from '../utils/auth';

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
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.auction_number.trim()) {
      setError('O número do leilão é obrigatório');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      auction_number: formData.auction_number.trim(),
      edital_number: formData.edital_number.trim() || null,
      auction_date: formData.auction_date || null,
      auctioneer: formData.auctioneer.trim() || null,
      company: formData.company.trim() || null,
      notes: formData.notes.trim() || null
    };

    try {
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8080/api/auctions', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error || errorJson.message || errorText;
        } catch {
          // Se não for JSON, usa o texto
        }
        throw new Error(errorMsg || 'Erro ao criar leilão');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar leilão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2>➕ Novo Leilão</h2>
            <p className={styles.subtitle}>Preencha os dados para criar um novo leilão</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.body}>
            <div className={styles.formGroup}>
              <label>
                Número do Leilão *
                <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="auction_number"
                value={formData.auction_number}
                onChange={handleChange}
                placeholder="Ex: LEILAO-001/2026"
                className={styles.input}
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Número do Edital</label>
              <input
                type="text"
                name="edital_number"
                value={formData.edital_number}
                onChange={handleChange}
                placeholder="Ex: EDITAL-001/2026"
                className={styles.input}
                disabled={loading}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Data do Leilão</label>
                <input
                  type="date"
                  name="auction_date"
                  value={formData.auction_date}
                  onChange={handleChange}
                  className={styles.input}
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Status</label>
                <input
                  type="text"
                  value="Em Preparação"
                  className={styles.input}
                  disabled
                  style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Leiloeiro</label>
              <input
                type="text"
                name="auctioneer"
                value={formData.auctioneer}
                onChange={handleChange}
                placeholder="Nome do leiloeiro"
                className={styles.input}
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Empresa Responsável</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Nome da empresa"
                className={styles.input}
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Observações</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Observações sobre o leilão"
                className={styles.textarea}
                rows={3}
                disabled={loading}
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? '⏳ Criando...' : '✅ Criar Leilão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAuctionModal;
