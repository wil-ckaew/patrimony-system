// components/PrintModal.tsx
import React, { useState, useEffect } from 'react';
import { PatrimonyItem } from '../types/Patrimony';
import { getAuthHeaders } from '../utils/auth';
import styles from './PatrimonyPage.module.css';

// Tipo estendido para incluir 'type'
type PatrimonyItemWithType = PatrimonyItem & { type?: string };

interface PrintModalProps {
  filters: any;
  onClose: () => void;
}

interface ColumnOption {
  key: string;
  label: string;
  selected: boolean;
}

type ReportType = 'all' | 'bySector' | 'byDepartment' | 'byVehicle';

const PrintModal: React.FC<PrintModalProps> = ({ filters, onClose }) => {
  const [patrimonies, setPatrimonies] = useState<PatrimonyItemWithType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [sectors, setSectors] = useState<string[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('all');
  
  const [reportType, setReportType] = useState<ReportType>('all');
  
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
    fetchSectorsAndOthers();
  }, []);

  useEffect(() => {
    fetchPatrimonies();
  }, [selectedSector, selectedDepartment, selectedVehicleType, reportType]);

  const fetchSectorsAndOthers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/patrimony', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        
        const uniqueSectors = new Set<string>();
        const uniqueDepartments = new Set<string>();
        const uniqueVehicleTypes = new Set<string>();
        
        data.forEach((item: any) => {
          if (item.sector && item.sector.trim() !== '') uniqueSectors.add(item.sector);
          if (item.department && item.department.trim() !== '') uniqueDepartments.add(item.department);
          if (item.type && item.type.trim() !== '') uniqueVehicleTypes.add(item.type);
        });
        
        setSectors(Array.from(uniqueSectors).sort());
        setDepartments(Array.from(uniqueDepartments).sort());
        setVehicleTypes(Array.from(uniqueVehicleTypes).sort());
      } else {
        setError('Erro ao carregar opções de filtro');
      }
    } catch (error) {
      setError('Erro de conexão ao carregar opções');
    }
  };

  const fetchPatrimonies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      
      // ✅ CORREÇÃO: Usar searchQuery do filtro principal
      if (filters.searchQuery) {
        queryParams.append('search', filters.searchQuery);
      }
      
      if (reportType === 'bySector' && selectedSector !== 'all') {
        queryParams.append('sector', selectedSector);
      } else if (reportType === 'byDepartment' && selectedDepartment !== 'all') {
        queryParams.append('department', selectedDepartment);
      } else if (reportType === 'byVehicle') {
        if (selectedSector !== 'all') queryParams.append('sector', selectedSector);
        if (selectedDepartment !== 'all') queryParams.append('department', selectedDepartment);
        if (selectedVehicleType !== 'all') queryParams.append('type', selectedVehicleType);
      }

      const url = `http://localhost:8080/api/patrimony${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, { headers: getAuthHeaders() });

      if (response.ok) {
        const data = await response.json();
        
        let mappedData: PatrimonyItemWithType[] = data.map((item: any) => ({
          id: item.id,
          plate: item.plate,
          name: item.name,
          description: item.description,
          acquisitionDate: item.acquisition_date,
          acquisitionValue: item.value || 0,
          department: item.department,
          status: item.status,
          invoiceNumber: item.invoice_number,
          commitmentNumber: item.commitment_number,
          denfSeNumber: item.denf_se_number,
          invoiceFile: item.invoice_file,
          commitmentFile: item.commitment_file,
          denfSeFile: item.denf_se_file,
          imageUrl: item.image_url,
          sector: item.sector,
          nfIssueDate: item.nf_issue_date,
          supplier: item.supplier,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          type: item.type,
        }));
        
        // Aplicar filtros locais
        let filteredData = [...mappedData];

        // Se for modo veículos, filtra por presença de placa
        if (reportType === 'byVehicle') {
          filteredData = filteredData.filter(item => item.plate && item.plate.trim() !== '');
          
          if (selectedVehicleType !== 'all') {
            filteredData = filteredData.filter(
              item => item.type?.trim().toLowerCase() === selectedVehicleType.trim().toLowerCase()
            );
          }
        }

        if (selectedSector !== 'all') {
          filteredData = filteredData.filter(
            item => item.sector?.trim().toLowerCase() === selectedSector.trim().toLowerCase()
          );
        }

        if (selectedDepartment !== 'all') {
          filteredData = filteredData.filter(
            item => item.department?.trim().toLowerCase() === selectedDepartment.trim().toLowerCase()
          );
        }
        
        if (filteredData.length === 0) {
          setError('Nenhum patrimônio encontrado com os filtros aplicados');
        } else {
          setPatrimonies(filteredData);
        }
      } else {
        setError(`Erro ${response.status}: Falha ao carregar dados`);
      }
    } catch (error) {
      setError('Erro de conexão. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const toggleColumn = (key: string) => {
    setColumnOptions(prev => 
      prev.map(opt => opt.key === key ? { ...opt, selected: !opt.selected } : opt)
    );
  };

  const handlePrint = () => {
    const selectedColumns = columnOptions.filter(opt => opt.selected);
    
    if (patrimonies.length === 0) {
      alert('Nenhum dado disponível para impressão');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableHeaders = selectedColumns.map(opt => `<th>${opt.label}</th>`).join('');
    
    const tableRows = patrimonies.map(item => `
      <tr>
        ${selectedColumns.map(opt => {
          let value = item[opt.key as keyof PatrimonyItemWithType];
          
          if (opt.key === 'acquisitionDate' && value) {
            value = new Date(value as string).toLocaleDateString('pt-BR');
          } else if (opt.key === 'acquisitionValue' && value) {
            value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
          } else if ((opt.key === 'createdAt' || opt.key === 'updatedAt') && value) {
            value = new Date(value as string).toLocaleDateString('pt-BR');
          } else if (opt.key === 'status' && value) {
            const statusMap: Record<string, string> = {
              active: 'Ativo',
              inactive: 'Inativo',
              maintenance: 'Manutenção',
              written_off: 'Baixado'
            };
            value = statusMap[value as string] || value;
          }
          
          return `<td>${value || '-'}</td>`;
        }).join('')}
      </tr>
    `).join('');

    let reportTitle = 'Relatório Geral de Patrimônio';
    if (reportType === 'bySector' && selectedSector !== 'all') {
      reportTitle = `Relatório de Patrimônio - Setor: ${selectedSector}`;
    } else if (reportType === 'byDepartment' && selectedDepartment !== 'all') {
      reportTitle = `Relatório de Patrimônio - Departamento: ${selectedDepartment}`;
    } else if (reportType === 'byVehicle') {
      reportTitle = 'Relatório de Veículos';
      if (selectedVehicleType !== 'all') reportTitle += ` - Tipo: ${selectedVehicleType}`;
      if (selectedSector !== 'all') reportTitle += ` - Setor: ${selectedSector}`;
      if (selectedDepartment !== 'all') reportTitle += ` - Departamento: ${selectedDepartment}`;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head><title>${reportTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
          h1 { text-align: center; color: #1e3a8a; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .filters { margin-bottom: 20px; padding: 10px; background: #f9f9f9; border-radius: 5px; }
          .filter-item { margin: 5px 0; }
          .footer { margin-top: 30px; text-align: right; color: #666; }
          @media print { .no-print { display: none; } }
        </style>
        </head>
        <body>
          <h1>${reportTitle}</h1>
          <div class="filters">
            <h3>Filtros Aplicados:</h3>
            ${filters.searchQuery ? `<div class="filter-item"><strong>Busca:</strong> ${filters.searchQuery}</div>` : ''}
            ${reportType === 'bySector' && selectedSector !== 'all' ? `<div class="filter-item"><strong>Setor:</strong> ${selectedSector}</div>` : ''}
            ${reportType === 'byDepartment' && selectedDepartment !== 'all' ? `<div class="filter-item"><strong>Departamento:</strong> ${selectedDepartment}</div>` : ''}
            ${reportType === 'byVehicle' && selectedVehicleType !== 'all' ? `<div class="filter-item"><strong>Tipo de Veículo:</strong> ${selectedVehicleType}</div>` : ''}
            ${reportType === 'byVehicle' && selectedSector !== 'all' ? `<div class="filter-item"><strong>Setor:</strong> ${selectedSector}</div>` : ''}
            ${reportType === 'byVehicle' && selectedDepartment !== 'all' ? `<div class="filter-item"><strong>Departamento:</strong> ${selectedDepartment}</div>` : ''}
          </div>
          <p><strong>Data de emissão:</strong> ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>
          <table><thead><td>${tableHeaders}</tr></thead><tbody>${tableRows}</tbody></table>
          <div class="footer"><p>Total de itens: ${patrimonies.length}</p></div>
          <div class="no-print" style="margin-top:20px; text-align:center;">
            <button onclick="window.print()" style="padding:10px 20px; background:#2563eb; color:white; border:none; border-radius:5px; cursor:pointer;">Imprimir</button>
            <button onclick="window.close()" style="padding:10px 20px; background:#6b7280; color:white; border:none; border-radius:5px; cursor:pointer; margin-left:10px;">Fechar</button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleReportTypeChange = (type: ReportType) => {
    setReportType(type);
    if (type === 'all') {
      setSelectedSector('all');
      setSelectedDepartment('all');
      setSelectedVehicleType('all');
    } else if (type === 'bySector') {
      setSelectedDepartment('all');
      setSelectedVehicleType('all');
    } else if (type === 'byDepartment') {
      setSelectedSector('all');
      setSelectedVehicleType('all');
    } else if (type === 'byVehicle') {
      // mantém setor/departamento
    }
  };

  const applyFilters = () => fetchPatrimonies();

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Imprimir Relatório</h2>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tipo de Relatório:</label>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '10px' }}>
              <label className={styles.radioLabel}>
                <input type="radio" checked={reportType === 'all'} onChange={() => handleReportTypeChange('all')} className={styles.formRadio} /> Todos os Itens
              </label>
              <label className={styles.radioLabel}>
                <input type="radio" checked={reportType === 'bySector'} onChange={() => handleReportTypeChange('bySector')} className={styles.formRadio} /> Por Setor
              </label>
              <label className={styles.radioLabel}>
                <input type="radio" checked={reportType === 'byDepartment'} onChange={() => handleReportTypeChange('byDepartment')} className={styles.formRadio} /> Por Departamento
              </label>
              <label className={styles.radioLabel}>
                <input type="radio" checked={reportType === 'byVehicle'} onChange={() => handleReportTypeChange('byVehicle')} className={styles.formRadio} /> Por Veículos
              </label>
            </div>
          </div>

          {reportType === 'bySector' && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Setor:</label>
              <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)} className={styles.formSelect}>
                <option value="all">Todos os Setores</option>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {reportType === 'byDepartment' && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Departamento:</label>
              <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className={styles.formSelect}>
                <option value="all">Todos os Departamentos</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}

          {reportType === 'byVehicle' && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Setor (opcional):</label>
                <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)} className={styles.formSelect}>
                  <option value="all">Todos os Setores</option>
                  {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Departamento (opcional):</label>
                <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className={styles.formSelect}>
                  <option value="all">Todos os Departamentos</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tipo de Veículo (opcional):</label>
                <select value={selectedVehicleType} onChange={(e) => setSelectedVehicleType(e.target.value)} className={styles.formSelect}>
                  <option value="all">Todos os Tipos</option>
                  {vehicleTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </>
          )}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Colunas para impressão:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginTop: '10px', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', background: '#f8fafc', borderRadius: '12px' }}>
              {columnOptions.map(opt => (
                <label key={opt.key} className={styles.checkboxLabel}>
                  <input type="checkbox" checked={opt.selected} onChange={() => toggleColumn(opt.key)} className={styles.formCheckbox} />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          
          {loading ? (
            <div className={styles.loading}>Carregando dados...</div>
          ) : error ? (
            <div className={styles.error}>
              <p>{error}</p>
              <button onClick={applyFilters} className={styles.btn} style={{ marginTop: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer' }}>Tentar Novamente</button>
            </div>
          ) : (
            <div style={{ marginTop: '15px', padding: '10px', background: '#f1f5f9', borderRadius: '12px' }}>
              <strong>Itens encontrados:</strong> {patrimonies.length}
              {reportType === 'bySector' && selectedSector !== 'all' && <div style={{ fontSize:'12px', marginTop:'5px' }}>Setor: {selectedSector}</div>}
              {reportType === 'byDepartment' && selectedDepartment !== 'all' && <div style={{ fontSize:'12px', marginTop:'5px' }}>Departamento: {selectedDepartment}</div>}
              {reportType === 'byVehicle' && selectedVehicleType !== 'all' && <div style={{ fontSize:'12px', marginTop:'5px' }}>Tipo: {selectedVehicleType}</div>}
            </div>
          )}
        </div>
        
        <div className={styles.modalFooter}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>
            Cancelar
          </button>
          <button 
            className={`${styles.btn} ${styles.btnPrimary}`} 
            onClick={applyFilters}
            disabled={loading}
          >
            {loading ? 'Carregando...' : 'Aplicar Filtros'}
          </button>
          <button 
            className={`${styles.btn} ${styles.btnSuccess}`} 
            onClick={handlePrint}
            disabled={loading || patrimonies.length === 0}
          >
            Gerar Relatório
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintModal;