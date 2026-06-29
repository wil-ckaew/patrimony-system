// components/PrintModal.tsx
import React, { useState, useEffect } from 'react';
import { PatrimonyItem } from '../types/Patrimony';
import { getAuthHeaders } from '../utils/auth';
import styles from '../components/PatrimonyPage.module.css';

interface PrintModalProps {
  filters: any;
  onClose: () => void;
}

interface ColumnOption {
  key: string;
  label: string;
  selected: boolean;
}

const PrintModal: React.FC<PrintModalProps> = ({ filters, onClose }) => {
  const [patrimonies, setPatrimonies] = useState<PatrimonyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columnOptions, setColumnOptions] = useState<ColumnOption[]>([
    { key: 'plate', label: 'Placa', selected: true },
    { key: 'name', label: 'Nome', selected: true },
    { key: 'description', label: 'Descrição', selected: true },
    { key: 'department', label: 'Departamento', selected: true },
    { key: 'sector', label: 'Setor', selected: true },
    { key: 'status', label: 'Status', selected: true },
    { key: 'supplier', label: 'Fornecedor', selected: true },
    { key: 'acquisitionDate', label: 'Data de Aquisição', selected: true },
    { key: 'acquisitionValue', label: 'Valor de Aquisição', selected: true },
    { key: 'createdAt', label: 'Data de Cadastro', selected: false },
    { key: 'updatedAt', label: 'Última Atualização', selected: false },
  ]);

  useEffect(() => {
    fetchPatrimonies();
  }, []);

  const fetchPatrimonies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      
      // Adicionar filtros aos parâmetros de busca (igual ao PatrimonyList)
      if (filters.plate) queryParams.append('plate', filters.plate);
      if (filters.name) queryParams.append('name', filters.name);
      if (filters.department) queryParams.append('department', filters.department);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.sector) queryParams.append('sector', filters.sector);
      if (filters.supplier) queryParams.append('supplier', filters.supplier);

      console.log('Buscando patrimônios com filtros:', Object.fromEntries(queryParams));

      // ✅ CORREÇÃO: Usar a mesma URL do PatrimonyList (patrimony no singular)
      const url = `http://localhost:8080/api/patrimony${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('URL da API:', url);

      const response = await fetch(url, {
        headers: getAuthHeaders()
      });

      console.log('Resposta da API:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('Dados recebidos da API:', data);
        
        // Mapear os dados igual ao PatrimonyList
        const mappedData = data.map((item: any) => ({
          id: item.id,
          plate: item.plate,
          name: item.name,
          description: item.description,
          acquisitionDate: item.acquisition_date,
          value: item.value || 0,
          department: item.department,
          status: item.status,
          invoiceNumber: item.invoice_number || undefined,
          commitmentNumber: item.commitment_number || undefined,
          denfSeNumber: item.denf_se_number || undefined,
          invoiceFile: item.invoice_file || undefined,
          commitmentFile: item.commitment_file || undefined,
          denfSeFile: item.denf_se_file || undefined,
          imageUrl: item.image_url || undefined,
          sector: item.sector,
          nfIssueDate: item.nf_issue_date,
          supplier: item.supplier,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        })) as PatrimonyItem[];
        
        console.log('Itens mapeados:', mappedData);
        
        if (mappedData.length === 0) {
          setError('Nenhum patrimônio encontrado com os filtros aplicados');
        } else {
          setPatrimonies(mappedData);
        }
      } else if (response.status === 404) {
        setError('Endpoint não encontrado. Verifique a URL da API.');
      } else {
        const errorText = await response.text();
        console.error('Erro na resposta da API:', response.status, errorText);
        setError(`Erro ${response.status}: ${errorText || 'Falha ao carregar dados'}`);
      }
    } catch (error) {
      console.error('Erro ao buscar patrimônios:', error);
      setError('Erro de conexão. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const toggleColumn = (key: string) => {
    setColumnOptions(prev => 
      prev.map(option => 
        option.key === key ? { ...option, selected: !option.selected } : option
      )
    );
  };

  const handlePrint = () => {
    const selectedColumns = columnOptions.filter(opt => opt.selected);
    
    if (patrimonies.length === 0) {
      alert('Nenhum dado disponível para impressão');
      return;
    }
    
    // Criar conteúdo HTML para impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const tableHeaders = selectedColumns.map(opt => `<th>${opt.label}</th>`).join('');
      
      const tableRows = patrimonies.map(item => `
        <tr>
          ${selectedColumns.map(opt => {
            let value = item[opt.key as keyof PatrimonyItem];
            
            // Formatar valores especiais
            if (opt.key === 'acquisitionDate' && value) {
              value = new Date(value as string).toLocaleDateString('pt-BR');
            } else if (opt.key === 'acquisitionValue' && value) {
              value = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(Number(value));
            } else if ((opt.key === 'createdAt' || opt.key === 'updatedAt') && value) {
              value = new Date(value as string).toLocaleDateString('pt-BR');
            } else if (opt.key === 'status' && value) {
              // Traduzir status
              const statusMap: {[key: string]: string} = {
                'active': 'Ativo',
                'inactive': 'Inativo',
                'maintenance': 'Manutenção',
                'written_off': 'Baixado'
              };
              value = statusMap[value as string] || value;
            }
            
            return `<td>${value || '-'}</td>`;
          }).join('')}
        </tr>
      `).join('');

      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Relatório de Patrimônio</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                font-size: 12px;
              }
              h1 { 
                text-align: center; 
                color: #1e3a8a; 
                margin-bottom: 20px;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 20px; 
              }
              th, td { 
                border: 1px solid #ddd; 
                padding: 8px; 
                text-align: left; 
              }
              th { 
                background-color: #f2f2f2; 
                font-weight: bold;
              }
              .footer { 
                margin-top: 30px; 
                text-align: right; 
                font-size: 12px; 
                color: #666;
              }
              .filters {
                margin-bottom: 20px;
                padding: 10px;
                background-color: #f9f9f9;
                border-radius: 5px;
              }
              .filter-item {
                margin: 5px 0;
              }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>Relatório de Patrimônio</h1>
            
            <div class="filters">
              <h3>Filtros Aplicados:</h3>
              ${Object.entries(filters)
                .filter(([_, value]) => value)
                .map(([key, value]) => 
                  `<div class="filter-item"><strong>${key}:</strong> ${value}</div>`
                )
                .join('')}
            </div>
            
            <p><strong>Data de emissão:</strong> ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>
            
            <table>
              <thead>
                <tr>${tableHeaders}</tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
            
            <div class="footer">
              <p>Total de itens: ${patrimonies.length}</p>
              <p>Sistema de Gestão de Patrimônio</p>
            </div>
            
            <div class="no-print" style="margin-top: 20px; text-align: center;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Imprimir
              </button>
              <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                Fechar
              </button>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  const retryFetch = () => {
    fetchPatrimonies();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: '600px' }}>
        <div className={styles.modalHeader}>
          <h2>Imprimir Relatório</h2>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loading}>Carregando dados...</div>
          ) : error ? (
            <div className={styles.error}>
              <p>{error}</p>
              <button 
                onClick={retryFetch}
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ marginTop: '10px' }}
              >
                Tentar Novamente
              </button>
            </div>
          ) : (
            <>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Selecione as colunas para impressão:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
                  {columnOptions.map(option => (
                    <label key={option.key} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={option.selected}
                        onChange={() => toggleColumn(option.key)}
                        className={styles.formCheckbox}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
              
              <div style={{ marginTop: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '5px' }}>
                <strong>Itens encontrados:</strong> {patrimonies.length}
              </div>
            </>
          )}
        </div>
        
        <div className={styles.modalFooter}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>
            Cancelar
          </button>
          <button 
            className={`${styles.btn} ${styles.btnPrimary}`} 
            onClick={handlePrint}
            disabled={loading || patrimonies.length === 0}
          >
            {loading ? 'Carregando...' : 'Gerar Relatório'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintModal;