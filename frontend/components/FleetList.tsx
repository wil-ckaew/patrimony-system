//frontend/components/FleetList.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { FleetItem } from '../types/Patrimony';
import styles from './FleetList.module.css';
import { getAuthHeaders, handleAuthError } from '../utils/auth';

interface FleetListProps {
  onEdit: (item: FleetItem) => void;
  refreshTrigger: number;
  onTotalItemsChange?: (total: number) => void;
}

export default function FleetList({ onEdit, refreshTrigger, onTotalItemsChange }: FleetListProps) {
  const [fleet, setFleet] = useState<FleetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  // ✅ Adicionar estado para armazenar detalhes dos veículos
  const [vehicleDetails, setVehicleDetails] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    fetchFleet();
  }, [refreshTrigger]);

  const fetchFleet = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:8080/api/fleet', {
        headers: getAuthHeaders(),
      });
      if (handleAuthError(response)) return;
      if (!response.ok) {
        const errorText = await response.text();
        setError(errorText || 'Falha ao carregar frota');
        return;
      }
      const data = await response.json();
      setFleet(data);
      onTotalItemsChange?.(data.length);
    } catch (err) {
      console.error(err);
      setError('Erro de conexão ao buscar frota');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Função para buscar detalhes do veículo
  const fetchVehicleDetail = async (patrimonyId: string) => {
    if (!patrimonyId || vehicleDetails.has(patrimonyId)) return;
    
    try {
      const response = await fetch(`http://localhost:8080/api/patrimony/${patrimonyId}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const vehicleData = await response.json();
        setVehicleDetails(prev => new Map(prev).set(patrimonyId, vehicleData));
      }
    } catch (err) {
      console.error(`Erro ao buscar detalhes do veículo ${patrimonyId}:`, err);
    }
  };

  const filteredFleet = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return fleet;
    return fleet.filter((item) =>
      item.fleet_number.toLowerCase().includes(query) ||
      item.patrimony_plate?.toLowerCase().includes(query) ||
      item.patrimony_name?.toLowerCase().includes(query) ||
      item.department.toLowerCase().includes(query)
    );
  }, [fleet, searchQuery]);

  // ✅ Modificar toggleRow para buscar detalhes do veículo quando expandir
  const toggleRow = (id: string, patrimonyId?: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      const isExpanding = !next.has(id);
      
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Buscar detalhes do veículo se estiver expandindo e tiver patrimonyId
        if (isExpanding && patrimonyId) {
          fetchVehicleDetail(patrimonyId);
        }
      }
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este item da frota?')) return;
    try {
      const response = await fetch(`http://localhost:8080/api/fleet/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (handleAuthError(response)) return;
      if (!response.ok) {
        const errorText = await response.text();
        alert(errorText || 'Erro ao excluir item de frota');
        return;
      }
      fetchFleet();
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao excluir item de frota');
    }
  };

  const formatDate = (dateString?: string) => {
    return dateString ? new Date(dateString).toLocaleDateString('pt-BR') : '---';
  };

  // ✅ Função para formatar valor monetário
  const formatCurrency = (value?: number) => {
    if (!value) return '---';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // ✅ Função para traduzir status
  const translateStatus = (status?: string) => {
    if (!status) return '---';
    const statusMap: { [key: string]: string } = {
      'active': 'Ativo',
      'inactive': 'Inativo',
      'maintenance': 'Em Manutenção',
      'written_off': 'Baixado'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return <div className={styles.message}>Carregando frota...</div>;
  }

  if (error) {
    return <div className={styles.messageError}>{error}</div>;
  }

  return (
    <div className={styles.fleetWrapper}>
      <div className={styles.searchBar}>
        <input
          type="text"
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar frota, veículo, patrimônio ou departamento"
        />
        <div className={styles.searchSummary}>
          {filteredFleet.length} registros encontrados
        </div>
      </div>

      {filteredFleet.length === 0 ? (
        <div className={styles.emptyState}>
          Nenhum registro de frota encontrado. Experimente limpar o filtro ou adicionar um novo veículo.
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.fleetTable}>
            <thead>
              <tr>
                <th>Frota</th>
                <th>Patrimônio</th>
                <th>Placa</th>
                <th>Departamento</th>
                <th>Criada em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredFleet.map((item) => {
                const isExpanded = expandedRows.has(item.id);
                // ✅ Buscar detalhes do veículo
                const vehicleDetail = item.patrimony_id ? vehicleDetails.get(item.patrimony_id) : null;
                
                return (
                  <React.Fragment key={item.id}>
                    <tr className={styles.tableRow} onClick={() => toggleRow(item.id, item.patrimony_id)}>
                      <td>{item.fleet_number}</td>
                      <td>{item.patrimony_name || 'Sem patrimônio'}</td>
                      <td>{item.patrimony_plate || 'N/A'}</td>
                      <td>{item.department}</td>
                      <td>{formatDate(item.created_at)}</td>
                      <td>
                        <div className={styles.rowActions}>
                          <button className={styles.editButton} onClick={(e) => { e.stopPropagation(); onEdit(item); }}>Editar</button>
                          <button className={styles.deleteButton} onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>Excluir</button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className={styles.expandedRow}>
                        <td colSpan={6}>
                          <div className={styles.expandedContent}>
                            <div className={styles.expandedSection}>
                              <strong>Patrimônio vinculado</strong>
                              <p>{item.patrimony_name || 'Sem veículo vinculado'}</p>
                              <span className={styles.detailLabel}>Placa</span>
                              <p>{item.patrimony_plate || 'N/A'}</p>
                              {/* ✅ ADICIONAR DESCRIÇÃO DO VEÍCULO */}
                              <span className={styles.detailLabel}>Descrição</span>
                              <p>{vehicleDetail?.description || 'Sem descrição cadastrada'}</p>
                              {/* ✅ ADICIONAR VALOR DO VEÍCULO */}
                              {vehicleDetail?.value && (
                                <>
                                  <span className={styles.detailLabel}>Valor</span>
                                  <p>{formatCurrency(vehicleDetail.value)}</p>
                                </>
                              )}
                            </div>
                            <div className={styles.expandedSection}>
                              <strong>Departamento</strong>
                              <p>{item.department}</p>
                              <strong>Registrado em</strong>
                              <p>{formatDate(item.created_at)}</p>
                              {/* ✅ ADICIONAR STATUS DO VEÍCULO */}
                              {vehicleDetail?.status && (
                                <>
                                  <strong>Status do Veículo</strong>
                                  <p className={styles.statusBadge}>{translateStatus(vehicleDetail.status)}</p>
                                </>
                              )}
                              {/* ✅ ADICIONAR SETOR DO VEÍCULO */}
                              {vehicleDetail?.sector && (
                                <>
                                  <strong>Setor</strong>
                                  <p>{vehicleDetail.sector}</p>
                                </>
                              )}
                            </div>
                            <div className={styles.expandedSection}>
                              <strong>Observações</strong>
                              <p>{item.notes || 'Nenhuma observação cadastrada.'}</p>
                              <strong>Última atualização</strong>
                              <p>{formatDate(item.updated_at)}</p>
                              {/* ✅ ADICIONAR DATA DE AQUISIÇÃO */}
                              {vehicleDetail?.acquisition_date && (
                                <>
                                  <strong>Data de Aquisição</strong>
                                  <p>{formatDate(vehicleDetail.acquisition_date)}</p>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}