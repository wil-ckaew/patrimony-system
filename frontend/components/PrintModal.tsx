// components/PrintModal.tsx

import React, { useState, useEffect } from 'react';
import { PatrimonyItem } from '../types/Patrimony';
import { getAuthHeaders } from '../utils/auth';
import styles from './PatrimonyPage.module.css';

type PatrimonyItemWithType = PatrimonyItem & {
  type?: string;
  is_vehicle?: boolean;
  fleetNumber?: string;
  fleetNotes?: string;
};

interface PrintModalProps {
  filters: any;
  onClose: () => void;
}

interface ColumnOption {
  key: string;
  label: string;
  selected: boolean;
}

type ReportType = 'all' | 'bySector' | 'byDepartment' | 'byVehicle' | 'byFleet';

const PrintModal: React.FC<PrintModalProps> = ({ filters, onClose }) => {

  const [patrimonies, setPatrimonies] = useState<PatrimonyItemWithType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sectors, setSectors] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [fleetNumbers, setFleetNumbers] = useState<string[]>([]);

  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedVehicleType, setSelectedVehicleType] = useState('all');
  const [selectedFleet, setSelectedFleet] = useState('all');

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
    { key: 'acquisitionValue', label: 'Valor', selected: true },
    { key: 'fleetNumber', label: 'Frota', selected: true },        // ✅ NOVO
    { key: 'fleetNotes', label: 'Obs. Proj.', selected: true },    // ✅ NOVO
    { key: 'isVehicle', label: 'Veículo?', selected: true }        // ✅ NOVO
  ]);

  // =============================
  // CARREGA DADOS (SETORES/DEP)
  // =============================
  useEffect(() => {
    fetchSectorsAndOthers();
  }, []);

  useEffect(() => {
    fetchPatrimonies();
  }, [selectedSector, selectedDepartment, selectedVehicleType, selectedFleet, reportType]);

  const fetchSectorsAndOthers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/patrimony', {
        headers: getAuthHeaders()
      });

      const data = await response.json();

      const sec: string[] = [];
      const dep: string[] = [];
      const veh: string[] = [];
      const fleet: string[] = [];

      data.forEach((item: any) => {
        if (item.sector) sec.push(item.sector);
        if (item.department) dep.push(item.department);
        if (item.type) veh.push(item.type);
        if (item.fleet_number) fleet.push(item.fleet_number);
      });

      setSectors(Array.from(new Set(sec)));
      setDepartments(Array.from(new Set(dep)));
      setVehicleTypes(Array.from(new Set(veh)));
      setFleetNumbers(Array.from(new Set(fleet)));

    } catch (err) {
      setError('Erro ao carregar filtros');
    }
  };

  // =============================
  // BUSCA PATRIMÔNIO
  // =============================
  const fetchPatrimonies = async () => {

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/api/patrimony', {
        headers: getAuthHeaders()
      });

      const data = await response.json();

      let list: PatrimonyItemWithType[] = data.map((item: any) => ({
        id: item.id,
        plate: item.plate,
        name: item.name,
        description: item.description,
        acquisitionDate: item.acquisition_date,
        acquisitionValue: item.value || 0,
        department: item.department,
        status: item.status,
        sector: item.sector,
        supplier: item.supplier,
        type: item.type,
        is_vehicle: item.is_vehicle,
        fleetNumber: item.fleet_number || item.fleetNumber,    // ✅ NOVO
        fleetNotes: item.fleet_notes || item.fleetNotes,       // ✅ NOVO
        isVehicle: item.is_vehicle || false                    // ✅ NOVO
      }));

      // =============================
      // FILTROS
      // =============================
      if (reportType === 'byVehicle') {
        list = list.filter(i => i.is_vehicle);

        if (selectedVehicleType !== 'all') {
          list = list.filter(i => i.type === selectedVehicleType);
        }
      }

      if (reportType === 'byFleet') {
        if (selectedFleet !== 'all') {
          list = list.filter(i => i.fleetNumber === selectedFleet);
        }
      }

      if (selectedSector !== 'all') {
        list = list.filter(i => i.sector === selectedSector);
      }

      if (selectedDepartment !== 'all') {
        list = list.filter(i => i.department === selectedDepartment);
      }

      setPatrimonies(list);

    } catch (err) {
      setError('Erro ao carregar patrimônio');
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // TOGGLE COLUMN
  // =============================
  const toggleColumn = (key: string) => {
    setColumnOptions(prev => prev.map(col =>
      col.key === key ? { ...col, selected: !col.selected } : col
    ));
  };

  // =============================
  // PRINT
  // =============================
  const handlePrint = () => {

    if (!patrimonies.length) {
      alert('Nenhum registro encontrado');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const selectedCols = columnOptions.filter(c => c.selected);

    const headers = selectedCols.map(c => `<th>${c.label}</th>`).join('');

    const rows = patrimonies.map(item => `
      <tr>
        ${selectedCols.map(col => {

          let value: any = (item as any)[col.key];

          if (col.key === 'acquisitionDate' && value) {
            value = new Date(value).toLocaleDateString('pt-BR');
          }

          if (col.key === 'acquisitionValue' && value) {
            value = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(Number(value));
          }

          if (col.key === 'isVehicle' && value) {
            value = '🚗 Sim';
          } else if (col.key === 'isVehicle') {
            value = 'Não';
          }

          if (col.key === 'status') {
            const statusMap: { [key: string]: string } = {
              'active': 'Ativo',
              'inactive': 'Inativo',
              'maintenance': 'Manutenção',
              'written_off': 'Baixado'
            };
            value = statusMap[value] || value;
          }

          return `<td>${value ?? '-'}</td>`;
        }).join('')}
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Relatório Patrimônio</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f0f0f0; font-weight: bold; }
            h1 { text-align: center; color: #1a1a1a; }
            .header-info { text-align: center; margin-bottom: 20px; }
            .total { margin-top: 20px; font-weight: bold; }
            @media print {
              body { margin: 10px; }
              th { background: #f0f0f0 !important; }
            }
          </style>
        </head>
        <body>
          <h1>Relatório Patrimônio</h1>
          <div class="header-info">
            <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
            <p>Total de registros: ${patrimonies.length}</p>
            ${selectedFleet !== 'all' ? `<p>Frota: ${selectedFleet}</p>` : ''}
            ${selectedSector !== 'all' ? `<p>Setor: ${selectedSector}</p>` : ''}
            ${selectedDepartment !== 'all' ? `<p>Departamento: ${selectedDepartment}</p>` : ''}
          </div>

          <table>
            <thead><tr>${headers}</tr></thead>
            <tbody>${rows}</tbody>
          </table>

          <div class="total">
            Total de itens: ${patrimonies.length}
          </div>

          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // =============================
  // UI
  // =============================
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: '800px' }}>

        <div className={styles.modalHeader}>
          <h2>📊 Relatório Patrimônio</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        <div className={styles.modalBody} style={{ padding: '20px' }}>

          {/* Tipo de Relatório */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Tipo de Relatório</label>
            <select 
              value={reportType} 
              onChange={e => setReportType(e.target.value as ReportType)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="all">📋 Todos os Bens</option>
              <option value="bySector">🏢 Por Setor</option>
              <option value="byDepartment">🏛️ Por Departamento</option>
              <option value="byVehicle">🚗 Veículos</option>
              <option value="byFleet">🚛 Por Frota</option>
            </select>
          </div>

          {/* Filtros */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Setor</label>
              <select 
                value={selectedSector} 
                onChange={e => setSelectedSector(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="all">Todos</option>
                {sectors.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Departamento</label>
              <select 
                value={selectedDepartment} 
                onChange={e => setSelectedDepartment(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="all">Todos</option>
                {departments.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            {/* Filtro de Frota - NOVO */}
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Frota</label>
              <select 
                value={selectedFleet} 
                onChange={e => setSelectedFleet(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="all">Todas</option>
                {fleetNumbers.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Tipo de Veículo</label>
              <select 
                value={selectedVehicleType} 
                onChange={e => setSelectedVehicleType(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="all">Todos</option>
                {vehicleTypes.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Seleção de Colunas */}
          <div style={{ marginTop: '20px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
              📋 Colunas para exibir no relatório
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {columnOptions.map(col => (
                <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={col.selected}
                    onChange={() => toggleColumn(col.key)}
                  />
                  {col.label}
                </label>
              ))}
            </div>
          </div>

          {/* Total de Registros */}
          <div style={{ marginTop: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
            <strong>📊 Total de registros: {patrimonies.length}</strong>
          </div>

          {error && (
            <div style={{ marginTop: '10px', color: 'red', background: '#ffebee', padding: '10px', borderRadius: '4px' }}>
              {error}
            </div>
          )}

          {loading && (
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              Carregando...
            </div>
          )}

        </div>

        <div className={styles.modalFooter} style={{ padding: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #eee' }}>
          <button 
            onClick={onClose}
            style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button 
            onClick={handlePrint}
            style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}
            disabled={loading || patrimonies.length === 0}
          >
            🖨️ Imprimir
          </button>
        </div>

      </div>
    </div>
  );
};

export default PrintModal;