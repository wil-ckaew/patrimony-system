// components/VehiclesDashboard.tsx
import React, { useState, useEffect } from 'react';
import { getAuthHeaders, handleAuthError } from '../utils/auth';
import { getDepartmentName, getDepartmentColor } from '../utils/departments';
import styles from './Dashboard.module.css';

interface VehicleStats {
  total: number;
  byDepartment: { department: string; count: number }[];
}

export default function VehiclesDashboard({ department }: { department: string }) {
  const [stats, setStats] = useState<VehicleStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [department]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // use the generic stats endpoint with a flag
      const base = 'http://localhost:8080/api/stats?vehicles=true';
      const url =
        department === 'all'
          ? base
          : `${base}&department=${department}`;

      const response = await fetch(url, { headers: getAuthHeaders() });
      if (handleAuthError(response)) return;
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStats({
        total: data.total || 0,
        byDepartment: data.by_department || [],
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas de veículos:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>Carregando veículos...</div>;
  if (!stats) return <div className={styles.error}>Erro ao carregar veículos</div>;

  return (
    <div className={styles.vehiclesDashboard}>
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCardTotal}`}>
          <h3>Total de Veículos</h3>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Frota total</div>
        </div>
      </div>

      <div className={styles.chartCard}>
        <h3>Veículos por Secretaria</h3>
        <div className={styles.departmentChart}>
          {stats.byDepartment.length === 0 ? (
            <p className={styles.emptyState}>Nenhum veículo cadastrado</p>
          ) : (
            stats.byDepartment
              .sort((a, b) => b.count - a.count)
              .map((dept) => (
                <div key={dept.department} className={styles.deptItem}>
                  <span className={styles.deptLabel}>
                    {getDepartmentName(dept.department)}
                  </span>
                  <div className={styles.deptBar}>
                    <div
                      className={styles.deptFill}
                      style={{
                        width: stats.total ? `${(dept.count / stats.total) * 100}%` : '0%',
                        backgroundColor: getDepartmentColor(dept.department),
                      }}
                    ></div>
                  </div>
                  <span className={styles.deptValue}>{dept.count}</span>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
