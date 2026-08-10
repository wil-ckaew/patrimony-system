import React, { useState, useEffect, useMemo } from 'react';
import styles from './AddVehicleToAuctionModal.module.css';
import { getAuthHeaders } from '../utils/auth';

interface AvailableVehicle {
  id: string;
  plate: string;
  name: string;
  description: string;
  department: string;
  sector: string;
  status: string;
  value: string;
}

interface AddVehicleToAuctionModalProps {
  auctionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddVehicleToAuctionModal: React.FC<AddVehicleToAuctionModalProps> = ({
  auctionId,
  onClose,
  onSuccess
}) => {
  const [vehicles, setVehicles] = useState<AvailableVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  useEffect(() => {
    fetchAvailableVehicles();
  }, []);

  const fetchAvailableVehicles = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8080/api/auctions/vehicles/available', { headers });

      if (!response.ok) {
        throw new Error('Erro ao carregar veículos');
      }

      const data = await response.json();
      setVehicles(data);

      // Extrair departamentos únicos
      const depts = new Set<string>();
      data.forEach((v: any) => {
        if (v.department) depts.add(v.department);
      });
      setDepartments(Array.from(depts).sort());

    } catch (err) {
      setError('Erro ao carregar veículos disponíveis');
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = useMemo(() => {
    let list = vehicles;

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      list = list.filter(v =>
        v.plate?.toLowerCase().includes(search) ||
        v.name?.toLowerCase().includes(search) ||
        v.description?.toLowerCase().includes(search) ||
        v.department?.toLowerCase().includes(search) ||
        v.sector?.toLowerCase().includes(search)
      );
    }

    if (selectedDepartment !== 'all') {
      list = list.filter(v => v.department === selectedDepartment);
    }

    return list;
  }, [vehicles, searchTerm, selectedDepartment]);

  const handleAddVehicle = async () => {
    if (!selectedVehicle) {
      setError('Selecione um veículo');
      return;
    }

    try {
      setAdding(true);
      setError('');

      const headers = getAuthHeaders();
      const response = await fetch(`http://localhost:8080/api/auctions/${auctionId}/vehicles`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_id: selectedVehicle })
      });

      if (response.ok) {
        alert('✅ Veículo adicionado com sucesso!');
        onSuccess();
        onClose();
      } else {
        const errorText = await response.text();
        setError(errorText || 'Erro ao adicionar veículo');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setAdding(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const formatCurrency = (value: string) => {
    if (!value || value === '0' || value === '0.00') return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'active': 'Ativo',
      'inactive': 'Inativo',
      'maintenance': 'Manutenção',
      'written_off': 'Baixado'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': '#10b981',
      'inactive': '#6b7280',
      'maintenance': '#f59e0b',
      'written_off': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2>➕ Adicionar Veículo ao Leilão</h2>
            <p className={styles.subtitle}>Selecione um veículo disponível para adicionar</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.body}>
          {/* Barra de busca */}
          <div className={styles.searchBar}>
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por placa, nome, descrição, departamento ou setor..."
              />
              {searchTerm && (
                <button className={styles.clearSearchBtn} onClick={clearSearch}>
                  ✕
                </button>
              )}
            </div>
            <div className={styles.searchSummary}>
              <button
                className={`${styles.clearAllButton} ${searchTerm ? styles.active : ''}`}
                onClick={clearSearch}
              >
                {searchTerm ? 'Limpar filtro' : 'Total'}
                <span className={styles.totalCount}>{filteredVehicles.length}</span>
              </button>
            </div>
          </div>

          {/* Filtro por departamento */}
          {departments.length > 0 && (
            <div className={styles.filterBar}>
              <label>Departamento:</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">Todos</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          )}

          {/* Lista de veículos */}
          <div className={styles.vehicleList}>
            {loading ? (
              <div className={styles.loading}>⏳ Carregando veículos...</div>
            ) : error ? (
              <div className={styles.errorMessage}>{error}</div>
            ) : filteredVehicles.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🚗</span>
                <p>{searchTerm ? 'Nenhum veículo encontrado para esta busca' : 'Nenhum veículo disponível'}</p>
                {searchTerm && (
                  <button className={styles.clearAllButton} onClick={clearSearch}>
                    Limpar busca
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.vehicleGrid}>
                {filteredVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className={`${styles.vehicleCard} ${selectedVehicle === vehicle.id ? styles.selected : ''}`}
                    onClick={() => setSelectedVehicle(vehicle.id)}
                  >
                    <div className={styles.vehicleRadio}>
                      <input
                        type="radio"
                        name="selectedVehicle"
                        checked={selectedVehicle === vehicle.id}
                        onChange={() => setSelectedVehicle(vehicle.id)}
                      />
                    </div>
                    <div className={styles.vehicleInfo}>
                      <div className={styles.vehicleHeader}>
                        <span className={styles.vehiclePlate}>{vehicle.plate || 'Sem placa'}</span>
                        <span
                          className={styles.vehicleStatus}
                          style={{ backgroundColor: getStatusColor(vehicle.status) }}
                        >
                          {getStatusLabel(vehicle.status)}
                        </span>
                      </div>
                      <div className={styles.vehicleName}>{vehicle.name || 'Sem nome'}</div>
                      {vehicle.description && (
                        <div className={styles.vehicleDescription}>{vehicle.description}</div>
                      )}
                      <div className={styles.vehicleMeta}>
                        <span>🏢 {vehicle.department || '-'}</span>
                        {vehicle.sector && <span>📍 {vehicle.sector}</span>}
                        <span>💰 {formatCurrency(vehicle.value)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancelar
          </button>
          <button
            className={styles.addBtn}
            onClick={handleAddVehicle}
            disabled={adding || !selectedVehicle || filteredVehicles.length === 0}
          >
            {adding ? '⏳ Adicionando...' : '➕ Adicionar ao Leilão'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddVehicleToAuctionModal;
