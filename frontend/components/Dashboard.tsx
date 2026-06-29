// components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Stats, DepartmentStats } from '../types/Patrimony';
import styles from './Dashboard.module.css';
import { getAuthHeaders, handleAuthError } from '../utils/auth';
import { getDepartmentName, getDepartmentColor } from '../utils/departments';
import VehiclesDashboard from './VehiclesDashboard';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [activeTab, setActiveTab] = useState<'patrimony' | 'vehicles'>('patrimony');

  useEffect(() => {
    fetchStats();
  }, [selectedDepartment]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const url =
        selectedDepartment === 'all'
          ? 'http://localhost:8080/api/stats'
          : `http://localhost:8080/api/stats?department=${selectedDepartment}`;

      const response = await fetch(url, { headers: getAuthHeaders() });
      if (handleAuthError(response)) return;
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setStats({
        total: data.total || 0,
        active: data.active || 0,
        inactive: data.inactive || 0,
        maintenance: data.maintenance || 0,
        writtenOff: data.written_off || 0,
        totalValue: Number(data.total_value) || 0,
        byDepartment: data.by_department || [],
      });
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'patrimony' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('patrimony')}
          >
            Patrimônio
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'vehicles' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('vehicles')}
          >
            Veículos
          </button>
        </div>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className={styles.departmentFilter}
        >
          <option value="all">Todos os Departamentos</option>
          <option value="education">Educação</option>
          <option value="health">Saúde</option>
          <option value="administration">Administração</option>
          <option value="urbanism">Urbanismo</option>
          <option value="culture">Cultura</option>
          <option value="sports">Esportes</option>
          <option value="transportation">Transporte</option>
          <option value="finance">Finanças</option>
          <option value="assistenci">Assistencia Comunitaria</option>
          <option value="tourism">Turismo</option>
          <option value="environment">Meio Ambiente</option>
          <option value="government">Governo</option>
        </select>
      </div>

      {activeTab === 'patrimony' ? (
        loading ? (
          <div className={styles.loading}>Carregando dashboard...</div>
        ) : !stats ? (
          <div className={styles.error}>Erro ao carregar estatísticas</div>
        ) : (
          <>
            <div className={styles.statsGrid}>
              <div className={`${styles.statCard} ${styles.statCardTotal}`}>
                <h3>Total de Bens</h3>
                <div className={styles.statValue}>{stats.total}</div>
                <div className={styles.statLabel}>Itens cadastrados</div>
              </div>

              <div className={`${styles.statCard} ${styles.statCardActive}`}>
                <h3>Ativos</h3>
                <div className={styles.statValue}>{stats.active}</div>
                <div className={styles.statLabel}>Em uso</div>
              </div>

              <div className={`${styles.statCard} ${styles.statCardValue}`}>
                <h3>Valor Total</h3>
                <div className={styles.statValue}>
                  R$ {Number(stats.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className={styles.statLabel}>Valor patrimonial</div>
              </div>

              <div className={`${styles.statCard} ${styles.statCardInactive}`}>
                <h3>Inativos</h3>
                <div className={styles.statValue}>{stats.inactive}</div>
                <div className={styles.statLabel}>Fora de uso</div>
              </div>
            </div>

            <div className={styles.chartsSection}>
              <div className={styles.chartCard}>
                <h3>Status dos Bens</h3>
                <div className={styles.statusChart}>
                  {[
                    { label: 'Ativos', key: 'active' as const, value: stats.active },
                    { label: 'Inativos', key: 'inactive' as const, value: stats.inactive },
                    { label: 'Manutenção', key: 'maintenance' as const, value: stats.maintenance },
                    { label: 'Baixados', key: 'writtenOff' as const, value: stats.writtenOff }
                  ].map(({ label, key, value }) => {
                    const percent = stats.total ? (value / stats.total) * 100 : 0;
                    const barClass =
                      key === 'active'
                        ? styles.chartFillActive
                        : key === 'inactive'
                        ? styles.chartFillInactive
                        : key === 'maintenance'
                        ? styles.chartFillMaintenance
                        : styles.chartFillWrittenOff;

                    return (
                      <div className={styles.chartItem} key={key}>
                        <span className={styles.chartLabel}>{label}</span>
                        <div className={styles.chartBar}>
                          <div
                            className={`${styles.chartFill} ${barClass}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <span className={styles.chartValue}>{value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.chartCard}>
                <h3>Distribuição por Departamento</h3>
                <div className={styles.departmentChart}>
                  {stats.byDepartment.length === 0 ? (
                    <p className={styles.emptyState}>Nenhum bem cadastrado</p>
                  ) : (
                    stats.byDepartment
                      .sort((a, b) => b.count - a.count)
                      .map((deptStats: DepartmentStats) => (
                        <div key={deptStats.department} className={styles.deptItem}>
                          <span className={styles.deptLabel}>
                            {getDepartmentName(deptStats.department)}
                          </span>
                          <div className={styles.deptBar}>
                            <div
                              className={styles.deptFill}
                              style={{
                                width: stats.total
                                  ? `${(deptStats.count / stats.total) * 100}%`
                                  : '0%',
                                backgroundColor: getDepartmentColor(deptStats.department),
                              }}
                            ></div>
                          </div>
                          <span className={styles.deptValue}>{deptStats.count}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </>
        )
      ) : (
        <VehiclesDashboard department={selectedDepartment} />
      )}
    </div>
  );
}

// department color helper moved to utils/departments.ts
