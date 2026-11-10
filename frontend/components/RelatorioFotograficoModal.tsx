import React, { useState, useEffect } from 'react';
import styles from './PatrimonyPage.module.css';
import { getAuthHeaders } from '../utils/auth';
import { apiUrl, BACKEND_BASE_URL } from '../lib/api';

interface RelatorioFotograficoModalProps {
  onClose: () => void;
}

const RelatorioFotograficoModal: React.FC<RelatorioFotograficoModalProps> = ({ onClose }) => {
  const [patrimonies, setPatrimonies] = useState<any[]>([]);
  const [todosBens, setTodosBens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroSetor, setFiltroSetor] = useState('Procon-SP');

  useEffect(() => {
    fetchPatrimonies();
  }, []);

  useEffect(() => {
    // Filtra apenas os bens com foto E que correspondam ao setor
    let filtrados = todosBens.filter(item => item.image_url);
    
    if (filtroSetor) {
      filtrados = filtrados.filter(item => 
        item.sector && item.sector.toLowerCase().includes(filtroSetor.toLowerCase())
      );
    }
    
    setPatrimonies(filtrados);
  }, [filtroSetor, todosBens]);

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
      alert('Nenhum bem com foto encontrado para este setor.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = patrimonies.map(item => {
      const imageUrl = item.image_url.startsWith('http') 
        ? item.image_url 
        : `${BACKEND_BASE_URL}${item.image_url}`;

      return `
        <div class="item-card">
          <div class="item-info">
            <h3>${item.name}</h3>
            <p><strong>Placa/Nº:</strong> ${item.plate}</p>
            <p><strong>Descrição:</strong> ${item.description || 'N/A'}</p>
            <p><strong>Departamento:</strong> ${item.department}</p>
            <p><strong>Setor:</strong> ${item.sector || 'N/A'}</p>
            <p><strong>Status:</strong> ${item.status}</p>
          </div>
          <div class="item-photo">
            <img src="${imageUrl}" alt="Foto do bem" />
          </div>
        </div>
      `;
    }).join('');

    const html = `
      <html>
        <head>
          <title>Relatório Fotográfico de Bens</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
            h1 { text-align: center; font-size: 18px; margin-bottom: 30px; }
            .item-card { 
              display: flex; 
              border: 1px solid #ccc; 
              margin-bottom: 20px; 
              border-radius: 8px; 
              overflow: hidden;
              page-break-inside: avoid;
            }
            .item-info { flex: 1; padding: 15px; }
            .item-photo { width: 250px; display: flex; align-items: center; justify-content: center; background: #f9f9f9; border-left: 1px solid #ccc; }
            .item-photo img { max-width: 100%; max-height: 200px; object-fit: contain; }
            h3 { margin-top: 0; color: #1e3a8a; }
            p { margin: 5px 0; }
            @media print {
              body { margin: 10px; }
            }
          </style>
        </head>
        <body>
          <h1>RELATÓRIO FOTOGRÁFICO DE BENS EM FUNCIONAMENTO</h1>
          <p style="text-align: center; margin-bottom: 30px;">Setor: ${filtroSetor} | Data: ${new Date().toLocaleDateString('pt-BR')}</p>
          
          ${rows || '<p style="text-align:center;">Nenhum item encontrado com os filtros aplicados.</p>'}
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: '700px' }}>
        <div className={styles.modalHeader}>
          <h2>Relatório Fotográfico</h2>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          <p style={{ marginBottom: '15px' }}>Gere um relatório com fotos dos bens cadastrados.</p>
          
          <div className={styles.formGroup} style={{ marginBottom: '15px' }}>
            <label className={styles.formLabel}>Filtrar por Setor:</label>
            <input 
              type="text" 
              value={filtroSetor} 
              onChange={(e) => setFiltroSetor(e.target.value)} 
              className={styles.formInput}
              placeholder="Ex: Procon-SP"
            />
          </div>

          <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
            <strong>Bens com foto encontrados: {patrimonies.length}</strong>
            {patrimonies.length === 0 && (
              <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '5px' }}>
                Nenhum bem com foto cadastrado no setor "{filtroSetor}".
              </p>
            )}
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btn} style={{ background: '#e5e7eb', color: '#333' }}>Cancelar</button>
          <button onClick={handlePrint} className={styles.btn} style={{ background: '#059669', color: 'white' }} disabled={patrimonies.length === 0}>🖨️ Gerar Relatório</button>
        </div>
      </div>
    </div>
  );
};

export default RelatorioFotograficoModal;
