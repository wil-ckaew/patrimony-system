import React from 'react';
import styles from './PatrimonyPage.module.css';

interface PrintMenuModalProps {
  onPatrimony: () => void;
  onFleet: () => void;
  onClose: () => void;
}

const PrintMenuModal: React.FC<PrintMenuModalProps> = ({
  onPatrimony,
  onFleet,
  onClose
}) => {
  return (
    <div className={styles.modalOverlay}>
      <div
        className={styles.modal}
        style={{
          maxWidth: '500px',
          width: '100%'
        }}
      >
        {/* Cabeçalho */}
        <div className={styles.modalHeader}>
          <h2>Selecionar Relatório</h2>

          <button
            type="button"
            className={styles.modalClose}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Corpo */}
        <div
          className={styles.modalBody}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            padding: '20px'
          }}
        >
          <p
            style={{
              textAlign: 'center',
              marginBottom: '10px'
            }}
          >
            Escolha qual relatório deseja gerar:
          </p>

          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={onPatrimony}
            style={{
              padding: '15px',
              fontSize: '16px'
            }}
          >
            📦 Relatório de Patrimônio
          </button>

          <button
            type="button"
            className={`${styles.btn} ${styles.btnSuccess}`}
            onClick={onFleet}
            style={{
              padding: '15px',
              fontSize: '16px'
            }}
          >
            🚛 Relatório da Frota
          </button>
        </div>

        {/* Rodapé */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintMenuModal;