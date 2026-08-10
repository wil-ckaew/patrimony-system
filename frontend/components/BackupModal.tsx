//backend/frontend/components/BackupModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import styles from './BackupModal.module.css';
import { getAuthHeaders } from '../utils/auth';

interface BackupFile {
  name: string;
  size: number;
  modified: string;
}

interface BackupModalProps {
  onClose: () => void;
}

const BackupModal: React.FC<BackupModalProps> = ({ onClose }) => {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [restoring, setRestoring] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null); // formato "YYYY-MM"

  const fetchBackups = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8080/api/backups', {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Erro ao listar backups');
      const data = await response.json();
      setBackups(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  // Processar backups para extrair anos e meses
  const { years, monthsByYear, backupsByMonth } = useMemo(() => {
    const yearsSet = new Set<string>();
    const monthsMap: Record<string, Set<string>> = {}; // ano -> Set de meses "YYYY-MM"
    const backupsMap: Record<string, BackupFile[]> = {}; // "YYYY-MM" -> backups

    backups.forEach(b => {
      try {
        const date = new Date(b.modified);
        if (isNaN(date.getTime())) return;
        const year = date.getFullYear().toString();
        const monthKey = `${year}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        yearsSet.add(year);
        if (!monthsMap[year]) monthsMap[year] = new Set();
        monthsMap[year].add(monthKey);
        if (!backupsMap[monthKey]) backupsMap[monthKey] = [];
        backupsMap[monthKey].push(b);
      } catch {
        // ignorar
      }
    });

    // Ordenar anos decrescente
    const yearsSorted = Array.from(yearsSet).sort((a, b) => parseInt(b) - parseInt(a));

    // Para cada ano, ordenar meses decrescente (mais recente primeiro)
    const monthsByYearSorted: Record<string, string[]> = {};
    Object.keys(monthsMap).forEach(year => {
      monthsByYearSorted[year] = Array.from(monthsMap[year]).sort((a, b) => b.localeCompare(a));
    });

    return {
      years: yearsSorted,
      monthsByYear: monthsByYearSorted,
      backupsByMonth: backupsMap,
    };
  }, [backups]);

  // Se não houver ano selecionado, selecionar o primeiro da lista
  useEffect(() => {
    if (years.length > 0 && !selectedYear) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  // Ao mudar de ano, limpar mês selecionado
  const handleYearClick = (year: string) => {
    setSelectedYear(year);
    setSelectedMonth(null);
  };

  const handleMonthClick = (monthKey: string) => {
    setSelectedMonth(monthKey);
  };

  const handleBackToMonths = () => {
    setSelectedMonth(null);
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('http://localhost:8080/api/backup', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Erro ao criar backup');
      }
      const data = await response.json();
      setSuccess(`Backup criado: ${data.filename}`);
      fetchBackups(); // atualiza lista
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (filename: string) => {
    if (!confirm(`Tem certeza que deseja restaurar o backup "${filename}"? Isso substituirá todos os dados atuais.`)) {
      return;
    }
    setRestoring(filename);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('http://localhost:8080/api/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ backup_file: filename })
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Erro ao restaurar');
      }
      const data = await response.json();
      setSuccess(`Backup restaurado com sucesso: ${data.message}`);
      fetchBackups(); // opcional
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRestoring(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/(1024*1024)).toFixed(1) + ' MB';
  };

  const formatDate = (iso: string) => {
    try {
      const date = new Date(iso);
      if (isNaN(date.getTime())) return iso;
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  const getMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month)-1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long' });
  };

  const currentBackups = selectedMonth ? backupsByMonth[selectedMonth] || [] : [];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Gerenciar Backups</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.createBtn}
            onClick={handleCreateBackup}
            disabled={loading}
          >
            {loading ? 'Processando...' : 'Criar Novo Backup'}
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <div className={styles.content}>
          {loading && !backups.length && <p className={styles.loading}>Carregando backups...</p>}

          {!loading && years.length === 0 && (
            <p className={styles.empty}>Nenhum backup encontrado.</p>
          )}

          {!loading && years.length > 0 && (
            <>
              {/* Navegação de anos */}
              <div className={styles.yearNav}>
                {years.map(year => (
                  <button
                    key={year}
                    className={`${styles.yearButton} ${selectedYear === year ? styles.yearActive : ''}`}
                    onClick={() => handleYearClick(year)}
                  >
                    {year}
                  </button>
                ))}
              </div>

              {/* Seleção de meses ou lista de backups */}
              {selectedYear && !selectedMonth && (
                <div className={styles.monthGrid}>
                  {monthsByYear[selectedYear]?.map(monthKey => {
                    const count = backupsByMonth[monthKey]?.length || 0;
                    return (
                      <button
                        key={monthKey}
                        className={styles.monthCard}
                        onClick={() => handleMonthClick(monthKey)}
                      >
                        <span className={styles.monthName}>{getMonthName(monthKey)}</span>
                        <span className={styles.monthBadge}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Lista de backups do mês selecionado */}
              {selectedMonth && (
                <div className={styles.monthBackups}>
                  <div className={styles.backupHeader}>
                    <button className={styles.backButton} onClick={handleBackToMonths}>
                      ← Voltar para meses
                    </button>
                    <h3>{getMonthName(selectedMonth)} de {selectedMonth.split('-')[0]}</h3>
                  </div>

                  {currentBackups.length === 0 ? (
                    <p>Nenhum backup neste mês.</p>
                  ) : (
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Arquivo</th>
                          <th>Tamanho</th>
                          <th>Data</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentBackups.map(b => (
                          <tr key={b.name}>
                            <td>{b.name}</td>
                            <td>{formatSize(b.size)}</td>
                            <td>{formatDate(b.modified)}</td>
                            <td>
                              <button
                                className={styles.restoreBtn}
                                onClick={() => handleRestore(b.name)}
                                disabled={restoring === b.name}
                              >
                                {restoring === b.name ? 'Restaurando...' : 'Restaurar'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackupModal;