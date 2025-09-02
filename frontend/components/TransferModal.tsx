// components/TransferModal.tsx
import React, { useState } from 'react';
import { PatrimonyItem, TransferRequest } from '../types/Patrimony';
import styles from './TransferModal.module.css';
import { getAuthHeaders, handleAuthError } from '../utils/auth';

interface TransferModalProps {
  item: PatrimonyItem;
  onClose: () => void;
  onTransferSuccess?: () => void;
}

export default function TransferModal({ item, onClose, onTransferSuccess }: TransferModalProps) {
  const [formData, setFormData] = useState({
    toDepartment: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);

  const departments = [
    'education', 'health', 'administration', 'urbanism', 'culture', 
    'sports', 'transportation', 'finance', 'tourism', 'environment'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.toDepartment || !formData.reason) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (formData.toDepartment === item.department) {
      alert('O departamento de destino deve ser diferente do departamento atual');
      return;
    }

    setLoading(true);

    try {
      const transferRequest = {
        patrimony_id: item.id,
        to_department: formData.toDepartment,
        reason: formData.reason
      };

      // ✅ CORREÇÃO: Usar getAuthHeaders() em vez de headers manuais
      const response = await fetch('http://localhost:8080/api/transfer', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(transferRequest),
      });

      // ✅ CORREÇÃO: Usar handleAuthError() para tratamento consistente
      if (handleAuthError(response)) return;

      if (response.ok) {
        alert('Transferência realizada com sucesso!');
        onClose();
        if (onTransferSuccess) {
          onTransferSuccess();
        }
      } else {
        const errorText = await response.text();
        let errorMessage = 'Erro desconhecido';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorText;
        } catch {
          errorMessage = errorText || 'Erro na transferência';
        }
        
        alert(`Erro na transferência: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error transferring patrimony:', error);
      alert('Erro ao realizar transferência. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentName = (dept: string) => {
    const departmentNames: { [key: string]: string } = {
      'education': 'Educação',
      'health': 'Saúde',
      'administration': 'Administração',
      'urbanism': 'Urbanismo',
      'culture': 'Cultura',
      'sports': 'Esportes',
      'transportation': 'Transporte',
      'finance': 'Finanças',
      'tourism': 'Turismo',
      'environment': 'Meio Ambiente'
    };
    return departmentNames[dept] || dept;
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Transferir Bem Patrimonial</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.patrimonyInfo}>
          <h3>{item.name}</h3>
          <p><strong>Placa:</strong> {item.plate}</p>
          <p><strong>Departamento Atual:</strong> {getDepartmentName(item.department)}</p>
          <p><strong>Valor:</strong> R$ {item.value.toFixed(2)}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="toDepartment">Departamento de Destino *</label>
            <select
              id="toDepartment"
              name="toDepartment"
              value={formData.toDepartment}
              onChange={handleInputChange}
              required
              disabled={loading}
            >
              <option value="">Selecione o departamento</option>
              {departments
                .filter(dept => dept !== item.department)
                .map(dept => (
                  <option key={dept} value={dept}>
                    {getDepartmentName(dept)}
                  </option>
                ))
              }
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="reason">Motivo da Transferência *</label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              rows={4}
              placeholder="Descreva o motivo da transferência..."
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formActions}>
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              className={styles.cancelButton}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? 'Processando...' : 'Confirmar Transferência'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}