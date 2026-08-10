import React, { useState, useMemo } from 'react';
import styles from './PatrimonyPage.module.css';
import { FleetItem } from '../types/Patrimony';

type FleetReportType = 'all' | 'byDepartment' | 'bySector';

interface FleetPrintModalProps {
  fleet: FleetItem[];
  departments: string[];
  sectors: string[];
  onClose: () => void;
}

const FleetPrintModal: React.FC<FleetPrintModalProps> = ({
  fleet,
  departments,
  sectors,
  onClose
}) => {

  const [reportType, setReportType] = useState<FleetReportType>('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');

  // =========================
  // FILTRO
  // =========================
  const filteredFleet = useMemo(() => {
    let data = [...fleet];

    if (reportType === 'byDepartment' && selectedDepartment !== 'all') {
      data = data.filter(item => item.department === selectedDepartment);
    }

    if (reportType === 'bySector' && selectedSector !== 'all') {
      data = data.filter(item => (item as any).sector === selectedSector);
    }

    return data;
  }, [fleet, reportType, selectedDepartment, selectedSector]);

  // =========================
  // PRINT
  // =========================
  const handlePrint = () => {

    if (!filteredFleet.length) {
      alert('Nenhum registro encontrado');
      return;
    }

    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      alert('Libere pop-ups no navegador');
      return;
    }

    // =========================
    // HEADER (COM Nº FROTA)
    // =========================
    const headers = `
      <th>Nº Frota</th>
      <th>Placa</th>
      <th>Nome</th>
      <th>Departamento</th>
      <th>Secretaria</th>
      <th>Observações</th>
    `;

    // =========================
    // LINHAS (COM Nº FROTA)
    // =========================
    const rows = filteredFleet.map(item => `
      <tr>
        <td>${item.fleet_number ?? '-'}</td>
        <td>${(item as any).patrimony_plate ?? '-'}</td>
        <td>${(item as any).patrimony_name ?? '-'}</td>
        <td>${item.department ?? '-'}</td>
        <td>${(item as any).sector ?? '-'}</td>
        <td>${item.notes ?? '-'}</td>
      </tr>
    `).join('');

    // =========================
    // HTML DO PRINT
    // =========================
    const html = `
      <html>
        <head>
          <title>Relatório da Frota</title>
          <style>
            body { font-family: Arial; margin: 20px; font-size: 12px; }
            h1 { text-align: center; color: #1e3a8a; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; }
            th { background: #f2f2f2; }
          </style>
        </head>

        <body>

          <h1>Relatório da Frota</h1>

          <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>

          ${
            selectedDepartment !== 'all'
              ? `<p><strong>Departamento:</strong> ${selectedDepartment}</p>`
              : ''
          }

          ${
            selectedSector !== 'all'
              ? `<p><strong>Secretaria:</strong> ${selectedSector}</p>`
              : ''
          }

          <table>
            <thead>
              <tr>${headers}</tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <script>
            window.onload = () => window.print();
          </script>

        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // =========================
  // UI
  // =========================
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: '650px', width: '100%' }}>

        <div className={styles.modalHeader}>
          <h2>Relatório da Frota</h2>

          <button className={styles.modalClose} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>

          {/* TIPO RELATÓRIO */}
          <div>
            <p><strong>Tipo de relatório:</strong></p>

            <label>
              <input
                type="radio"
                checked={reportType === 'all'}
                onChange={() => setReportType('all')}
              />
              {' '}Geral
            </label>

            <br />

            <label>
              <input
                type="radio"
                checked={reportType === 'byDepartment'}
                onChange={() => setReportType('byDepartment')}
              />
              {' '}Por Departamento
            </label>

            <br />

            <label>
              <input
                type="radio"
                checked={reportType === 'bySector'}
                onChange={() => setReportType('bySector')}
              />
              {' '}Por Secretaria
            </label>
          </div>

          {/* DEPARTAMENTO */}
          {reportType === 'byDepartment' && (
            <div>
              <label>Departamento:</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="all">Todos</option>
                {departments.map(dep => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* SECRETARIA */}
          {reportType === 'bySector' && (
            <div>
              <label>Secretaria:</label>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
              >
                <option value="all">Todas</option>
                {sectors.map(sec => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginTop: 15 }}>
            <strong>
              Registros encontrados: {filteredFleet.length}
            </strong>
          </div>

        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose}>Cancelar</button>
          <button onClick={handlePrint}>
            🖨️ Gerar Relatório
          </button>
        </div>

      </div>
    </div>
  );
};

export default FleetPrintModal;