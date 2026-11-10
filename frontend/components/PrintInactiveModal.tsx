// components/PrintInactiveModal.tsx
// Relatório específico de bens INATIVOS, com foto e filtro por data.

import React, { useState, useEffect } from 'react';
import { PatrimonyItem } from '../types/Patrimony';
import { getAuthHeaders } from '../utils/auth';
import styles from './PatrimonyPage.module.css';
import { apiUrl, BACKEND_BASE_URL } from '../lib/api';

type PatrimonyItemWithType = PatrimonyItem & {
  image_url?: string;
  imageUrl?: string;
};

interface PrintInactiveModalProps {
  onClose: () => void;
}

interface ColumnOption {
  key: string;
  label: string;
  selected: boolean;
}

const PrintInactiveModal: React.FC<PrintInactiveModalProps> = ({ onClose }) => {
  const [patrimonies, setPatrimonies] = useState<PatrimonyItemWithType[]>([]);
  const [allInactive, setAllInactive] = useState<PatrimonyItemWithType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sectors, setSectors] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // Filtro de data (aplicado sobre acquisition_date)
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [showPhoto, setShowPhoto] = useState(true);

  const [columnOptions, setColumnOptions] = useState<ColumnOption[]>([
    { key: 'plate', label: 'Placa', selected: true },
    { key: 'name', label: 'Nome', selected: true },
    { key: 'description', label: 'Descrição', selected: true },
    { key: 'department', label: 'Departamento', selected: true },
    { key: 'sector', label: 'Setor', selected: true },
    { key: 'supplier', label: 'Fornecedor', selected: true },
    { key: 'acquisitionDate', label: 'Data de Aquisição', selected: true },
    { key: 'acquisitionValue', label: 'Valor', selected: true }
  ]);

  // =============================
  // CARREGA DADOS
  // =============================
  useEffect(() => {
    fetchAllInactive();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSector, selectedDepartment, dateFrom, dateTo, allInactive]);

  const fetchAllInactive = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl('/patrimony'), {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      const mapped: PatrimonyItemWithType[] = data.map((item: any) => ({
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
        image_url: item.image_url,
        imageUrl: item.image_url
      }));

      // Só inativos
      const inativos = mapped.filter(i => i.status === 'inactive');

      const sec: string[] = [];
      const dep: string[] = [];
      inativos.forEach((item: any) => {
        if (item.sector) sec.push(item.sector);
        if (item.department) dep.push(item.department);
      });

      setSectors(Array.from(new Set(sec)).sort());
      setDepartments(Array.from(new Set(dep)).sort());
      setAllInactive(inativos);
      setPatrimonies(inativos);
    } catch (err) {
      setError('Erro ao carregar patrimônios inativos');
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // APLICA FILTROS
  // =============================
  const applyFilters = () => {
    let list = [...allInactive];

    if (selectedSector !== 'all') {
      list = list.filter(i => i.sector === selectedSector);
    }

    if (selectedDepartment !== 'all') {
      list = list.filter(i => i.department === selectedDepartment);
    }

    if (dateFrom) {
      const from = new Date(dateFrom + 'T00:00:00');
      list = list.filter(i => {
        if (!i.acquisitionDate) return false;
        return new Date(i.acquisitionDate) >= from;
      });
    }

    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59');
      list = list.filter(i => {
        if (!i.acquisitionDate) return false;
        return new Date(i.acquisitionDate) <= to;
      });
    }

    setPatrimonies(list);
  };

  const toggleColumn = (key: string) => {
    setColumnOptions(prev => prev.map(col =>
      col.key === key ? { ...col, selected: !col.selected } : col
    ));
  };

  const buildImageUrl = (raw?: string): string | null => {
    if (!raw) return null;
    const s = String(raw);
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    // se começa com '/', é caminho absoluto do backend
    if (s.startsWith('/')) return `${BACKEND_BASE_URL}${s}`;
    // senão assume /uploads/
    return `${BACKEND_BASE_URL}/uploads/${s}`;
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

    const rows = patrimonies.map(item => {
      const photoCell = showPhoto
        ? `<td style="text-align:center; padding:2px;">
             ${
               item.image_url
                 ? `<img src="${buildImageUrl(item.image_url)}" style="width:40px;height:40px;object-fit:cover;border:1px solid #ccc;border-radius:3px;" onerror="this.style.display='none'" />`
                 : '-'
             }
           </td>`
        : '';

      const cols = selectedCols.map(col => {
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

        return `<td>${value ?? '-'}</td>`;
      }).join('');

      return `<tr>${photoCell}${cols}</tr>`;
    }).join('');

    const photoHeader = showPhoto
      ? `<th style="text-align:center; width:50px;">Foto</th>`
      : '';

    const periodoInfo = (dateFrom || dateTo)
      ? `<p><strong>Período:</strong> ${dateFrom ? new Date(dateFrom + 'T00:00:00').toLocaleDateString('pt-BR') : 'início'} até ${dateTo ? new Date(dateTo + 'T23:59:59').toLocaleDateString('pt-BR') : 'hoje'}</p>`
      : '';

    const html = `
      <html>
        <head>
          <title>Relatório de Bens Inativos</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 6px; text-align: left; vertical-align: middle; }
            th { background: #f0f0f0; font-weight: bold; }
            h1 { text-align: center; color: #1a1a1a; }
            .header-info { text-align: center; margin-bottom: 20px; }
            .total { margin-top: 20px; font-weight: bold; }
            img { display: block; }
            @media print {
              body { margin: 10px; }
              th { background: #f0f0f0 !important; }
            }
          </style>
        </head>
        <body>
          <h1>Relatório de Bens Inativos</h1>
          <div class="header-info">
            <p>Data de emissão: ${new Date().toLocaleDateString('pt-BR')}</p>
            <p>Total de registros: ${patrimonies.length}</p>
            ${periodoInfo}
            ${selectedSector !== 'all' ? `<p>Setor: ${selectedSector}</p>` : ''}
            ${selectedDepartment !== 'all' ? `<p>Departamento: ${selectedDepartment}</p>` : ''}
          </div>

          <table>
            <thead><tr>${photoHeader}${headers}</tr></thead>
            <tbody>${rows}</tbody>
          </table>

          <div class="total">
            Total de itens inativos: ${patrimonies.length}
          </div>

          <script>
            window.onload = () => {
              setTimeout(() => window.print(), 400);
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
          <h2>📋 Relatório de Bens Inativos</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody} style={{ padding: '20px' }}>

          {/* Filtros Setor / Departamento */}
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
          </div>

          {/* Filtros de Data */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Data de Aquisição — De
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Data de Aquisição — Até
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
          </div>

          {/* Toggle foto */}
          <div style={{ marginTop: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <input
                type="checkbox"
                checked={showPhoto}
                onChange={() => setShowPhoto(v => !v)}
              />
              🖼️ Incluir foto no relatório
            </label>
          </div>

          {/* Colunas */}
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

          {/* Total */}
          <div style={{ marginTop: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
            <strong>📊 Total de itens inativos encontrados: {patrimonies.length}</strong>
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
            style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer' }}
            disabled={loading || patrimonies.length === 0}
          >
            🖨️ Imprimir Inativos
          </button>
        </div>

      </div>
    </div>
  );
};

export default PrintInactiveModal;
