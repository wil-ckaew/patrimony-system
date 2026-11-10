import React, { useState, useEffect } from 'react';
import styles from './PatrimonyPage.module.css';
import { getAuthHeaders } from '../utils/auth';
import { apiUrl } from '../lib/api';

interface TermoIncorporacaoModalProps {
  onClose: () => void;
}

const TermoIncorporacaoModal: React.FC<TermoIncorporacaoModalProps> = ({ onClose }) => {
  const [patrimonies, setPatrimonies] = useState<any[]>([]);
  const [todosBens, setTodosBens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [doador, setDoador] = useState('PROCON-SP');
  const [dataDoacao, setDataDoacao] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchPatrimonies();
  }, []);

  useEffect(() => {
    if (doador) {
      const filtrados = todosBens.filter(item => 
        item.sector && item.sector.toLowerCase().includes(doador.toLowerCase())
      );
      setPatrimonies(filtrados);
    } else {
      setPatrimonies(todosBens);
    }
  }, [doador, todosBens]);

  const fetchPatrimonies = async () => {
    try {
      const response = await fetch(apiUrl('/patrimony'), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setTodosBens(data);
      }
    } catch (error) {
      console.error('Erro ao buscar bens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (patrimonies.length === 0) {
      alert('Nenhum bem encontrado para este doador/setor.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = patrimonies.map(item => `
      <tr>
        <td>${item.plate || '-'}</td>
        <td>${item.name || '-'}</td>
        <td>${item.description || '-'}</td>
        <td>${item.department || '-'}</td>
        <td>${item.sector || '-'}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Termo de Incorporação</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; font-size: 12px; line-height: 1.6; }
            h1 { text-align: center; font-size: 16px; text-transform: uppercase; margin-bottom: 30px; }
            .content { text-align: justify; margin-bottom: 20px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 40px; }
            .table th, .table td { border: 1px solid #000; padding: 8px; text-align: left; }
            .table th { background: #f0f0f0; }
            .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
            .signature-line { width: 45%; border-top: 1px solid #000; text-align: center; padding-top: 5px; }
            .obs { font-size: 10px; color: #555; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h1>TERMO DE INCORPORAÇÃO DE BENS</h1>
          
          <div class="content">
            <p>Aos ${new Date(dataDoacao).toLocaleDateString('pt-BR')}, o setor responsável pelo patrimônio da Prefeitura Municipal, declara que recebeu em doação os bens abaixo relacionados, provenientes do <strong>${doador}</strong>, os quais passam a integrar o patrimônio público municipal a partir desta data.</p>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Nº Patrimônio</th>
                <th>Nome do Bem</th>
                <th>Descrição</th>
                <th>Departamento</th>
                <th>Setor</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="content">
            <p>Os bens acima descritos encontram-se em perfeito estado de conservação e funcionamento, conforme atestado pela equipe técnica.</p>
            <p class="obs">* Observação: Os bens foram incorporados sem valor monetário atribuído, uma vez que a doação não foi acompanhada de nota fiscal de valor venal. O controle será feito via número de patrimônio e setor de alocação.</p>
          </div>

          <div class="signatures">
            <div class="signature-line">
              <strong>Responsável pelo Patrimônio</strong><br>
              Prefeitura Municipal
            </div>
            <div class="signature-line">
              <strong>Representante Legal</strong><br>
              ${doador}
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: '600px' }}>
        <div className={styles.modalHeader}>
          <h2>Termo de Incorporação</h2>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          <p style={{ marginBottom: '15px' }}>Configure os dados do termo:</p>
          
          <div className={styles.formGroup} style={{ marginBottom: '15px' }}>
            <label className={styles.formLabel}>Doador / Setor de Origem:</label>
            <input 
              type="text" 
              value={doador} 
              onChange={(e) => setDoador(e.target.value)} 
              className={styles.formInput}
              placeholder="Ex: Procon-SP"
            />
            <small style={{color: '#6b7280', fontSize: '12px'}}>O sistema buscará os bens cujo Setor contenha este texto.</small>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Data da Doação:</label>
            <input 
              type="date" 
              value={dataDoacao} 
              onChange={(e) => setDataDoacao(e.target.value)} 
              className={styles.formInput}
            />
          </div>

          <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
            <strong>Bens encontrados: {patrimonies.length}</strong>
            {patrimonies.length === 0 && (
              <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '5px' }}>
                Nenhum bem cadastrado com o setor "{doador}".
              </p>
            )}
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btn} style={{ background: '#e5e7eb', color: '#333' }}>Cancelar</button>
          <button onClick={handlePrint} className={styles.btn} style={{ background: '#2563eb', color: 'white' }} disabled={patrimonies.length === 0}>🖨️ Gerar Termo</button>
        </div>
      </div>
    </div>
  );
};

export default TermoIncorporacaoModal;
