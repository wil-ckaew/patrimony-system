// frontend/components/FleetList.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { FleetItem } from '../types/Patrimony';
import styles from './FleetList.module.css';
import { getAuthHeaders, handleAuthError } from '../utils/auth';

interface FleetListProps {
  onEdit: (item: FleetItem) => void;
  refreshTrigger: number;
  onTotalItemsChange?: (total: number) => void;
}

export default function FleetList({
  onEdit,
  refreshTrigger,
  onTotalItemsChange
}: FleetListProps) {

  const [fleet, setFleet] = useState<FleetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [vehicleDetails, setVehicleDetails] = useState<Map<string, any>>(new Map());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // PAGINAÇÃO
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    fetchFleet();
  }, [refreshTrigger]);

  const fetchFleet = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        'http://localhost:8080/api/fleet',
        {
          headers: getAuthHeaders(),
        }
      );

      if (handleAuthError(response)) {
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        setError(errorText || 'Falha ao carregar frota');
        return;
      }

      const data = await response.json();

      // CARREGAR DETALHES DOS VEÍCULOS
      const fleetWithDescriptions = await Promise.all(
        data.map(async (item: FleetItem) => {
          if (!item.patrimony_id) {
            return item;
          }

          try {
            const vehicleResponse = await fetch(
              `http://localhost:8080/api/patrimony/${item.patrimony_id}`,
              {
                headers: getAuthHeaders(),
              }
            );

            if (!vehicleResponse.ok) {
              return item;
            }

            const vehicleData = await vehicleResponse.json();

            setVehicleDetails((prev) =>
              new Map(prev).set(item.patrimony_id, vehicleData)
            );

            return item;
          } catch {
            return item;
          }
        })
      );

      setFleet(fleetWithDescriptions);
      onTotalItemsChange?.(fleetWithDescriptions.length);
    } catch (err) {
      console.error(err);
      setError('Erro de conexão ao buscar frota');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleDetail = async (patrimonyId: string) => {
    if (!patrimonyId || vehicleDetails.has(patrimonyId)) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/patrimony/${patrimonyId}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const vehicleData = await response.json();
        setVehicleDetails((prev) =>
          new Map(prev).set(patrimonyId, vehicleData)
        );
      }
    } catch (err) {
      console.error(`Erro ao buscar veículo ${patrimonyId}:`, err);
    }
  };

  // Função para limpar a busca
  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const filteredFleet = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return fleet;
    }

    return fleet.filter((item) => {
      const vehicleDetail = item.patrimony_id
        ? vehicleDetails.get(item.patrimony_id)
        : null;

      return (
        item.fleet_number?.toLowerCase().includes(query) ||
        item.patrimony_plate?.toLowerCase().includes(query) ||
        item.patrimony_name?.toLowerCase().includes(query) ||
        item.department?.toLowerCase().includes(query) ||
        vehicleDetail?.description?.toLowerCase().includes(query)
      );
    });
  }, [fleet, searchQuery, vehicleDetails]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredFleet.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFleet = filteredFleet.slice(startIndex, startIndex + itemsPerPage);

  const toggleRow = (id: string, patrimonyId?: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      const isExpanding = !next.has(id);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (isExpanding && patrimonyId) {
          fetchVehicleDetail(patrimonyId);
        }
      }
      return next;
    });
  };

  const handleImageClick = (imageUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este item da frota?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/fleet/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (handleAuthError(response)) {
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        alert(errorText || 'Erro ao excluir');
        return;
      }

      fetchFleet();
    } catch (err) {
      console.error(err);
      alert('Erro de conexão');
    }
  };

  const translateStatus = (status?: string) => {
    if (!status) {
      return '---';
    }

    const statusMap: Record<string, string> = {
      active: 'Ativo',
      inactive: 'Inativo',
      maintenance: 'Em manutenção',
      written_off: 'Baixado'
    };

    return statusMap[status] || status;
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) {
      return '---';
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return <div className={styles.message}>Carregando frota...</div>;
  }

  if (error) {
    return <div className={styles.messageError}>{error}</div>;
  }

  return (
    <div className={styles.fleetWrapper}>
      {/* MODAL DE IMAGEM AMPLIADA */}
      {selectedImage && (
        <div className={styles.imageModal} onClick={closeImageModal}>
          <div className={styles.imageModalContent} onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Visualização ampliada" className={styles.imageModalImg} />
            <button className={styles.imageModalClose} onClick={closeImageModal}>×</button>
          </div>
        </div>
      )}

      <div className={styles.searchBar}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar frota, placa, veículo..."
          />
          {searchQuery && (
            <button
              className={styles.clearSearchButton}
              onClick={clearSearch}
              title="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>
        
        <div className={styles.searchSummary}>
          <button
            className={`${styles.clearAllButton} ${searchQuery ? styles.active : ''}`}
            onClick={clearSearch}
            title={searchQuery ? "Limpar filtro" : "Total de registros"}
          >
            {searchQuery ? 'Limpar filtro' : 'Total'}
            <span className={styles.totalCount}>{filteredFleet.length}</span>
          </button>
        </div>
      </div>

      {filteredFleet.length === 0 ? (
        <div className={styles.emptyState}>
          {searchQuery 
            ? `Nenhum registro encontrado para "${searchQuery}".` 
            : 'Nenhum registro encontrado.'}
          {searchQuery && (
            <button
              className={styles.clearAllButton}
              onClick={clearSearch}
              style={{ marginTop: '1rem', display: 'inline-block' }}
            >
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.fleetTable}>
              <thead>
                <tr>
                  <th>Frota</th>
                  <th>Patrimônio</th>
                  <th>Descrição</th>
                  <th>Placa</th>
                  <th>Departamento</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFleet.map((item) => {
                  const isExpanded = expandedRows.has(item.id);
                  const vehicleDetail = item.patrimony_id
                    ? vehicleDetails.get(item.patrimony_id)
                    : null;

                  const imageFullUrl = vehicleDetail?.image_url
                    ? (vehicleDetail.image_url.startsWith('http')
                      ? vehicleDetail.image_url
                      : `http://localhost:8080${vehicleDetail.image_url.startsWith('/') ? '' : '/'}${vehicleDetail.image_url}`)
                    : null;

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        className={styles.tableRow}
                        onClick={() => toggleRow(item.id, item.patrimony_id)}
                      >
                        <td>{item.fleet_number}</td>
                        <td>{item.patrimony_name || 'Sem patrimônio'}</td>
                        <td>{vehicleDetail?.description || 'Sem descrição'}</td>
                        <td>{item.patrimony_plate || 'N/A'}</td>
                        <td>{item.department}</td>
                        <td>
                          <div className={styles.rowActions}>
                            <button
                              type="button"
                              className={`${styles.actionButton} ${styles.editButton}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(item);
                              }}
                            >
                              ✏️ Editar
                            </button>
                            <button
                              type="button"
                              className={`${styles.actionButton} ${styles.deleteButton}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item.id);
                              }}
                            >
                              🗑 Excluir
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className={styles.expandedRow}>
                          <td colSpan={6}>
                            <div className={styles.expandedContent}>
                              <div className={styles.imageSection}>
                                {imageFullUrl ? (
                                  <>
                                    <img
                                      src={imageFullUrl}
                                      alt={vehicleDetail?.name || 'Veículo'}
                                      className={styles.patrimonyImage}
                                      onClick={(e) => handleImageClick(imageFullUrl, e)}
                                    />
                                    <button
                                      className={styles.viewImageButton}
                                      onClick={(e) => handleImageClick(imageFullUrl, e)}
                                    >
                                      Ampliar imagem
                                    </button>
                                  </>
                                ) : (
                                  <div className={styles.noImage}>
                                    <span>📷 Sem imagem disponível</span>
                                  </div>
                                )}
                                
                                {/* NÚMERO DA FROTA EM DESTAQUE */}
                                <div className={styles.fleetNumberHighlight}>
                                  <span className={styles.fleetNumberLabel}>Nº da Frota</span>
                                  <strong className={styles.fleetNumberValue}>{item.fleet_number}</strong>
                                </div>
                              </div>

                              <div className={styles.detailsGrid}>
                                <div className={styles.expandedSection}>
                                  <strong>Patrimônio</strong>
                                  <p>{item.patrimony_name || '---'}</p>

                                  <span className={styles.detailLabel}>Descrição</span>
                                  <p>{vehicleDetail?.description || 'Sem descrição'}</p>

                                  <span className={styles.detailLabel}>Setor</span>
                                  <p>{vehicleDetail?.sector || 'N/A'}</p>

                                  {vehicleDetail?.supplier && (
                                    <>
                                      <span className={styles.detailLabel}>Fornecedor</span>
                                      <p>{vehicleDetail.supplier}</p>
                                    </>
                                  )}
                                </div>

                                <div className={styles.expandedSection}>
                                  <strong>Status</strong>
                                  <p className={styles.statusBadge}>
                                    {translateStatus(vehicleDetail?.status)}
                                  </p>

                                  <strong>Valor</strong>
                                  <p>{formatCurrency(vehicleDetail?.value)}</p>

                                  {vehicleDetail?.acquisition_date && (
                                    <>
                                      <strong>Data de Aquisição</strong>
                                      <p>{formatDate(vehicleDetail.acquisition_date)}</p>
                                    </>
                                  )}
                                </div>

                                <div className={styles.expandedSection}>
                                  <strong>Observações da Frota</strong>
                                  <p>{item.notes || 'Nenhuma observação'}</p>
                                </div>
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

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageButton}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                ← Anterior
              </button>
              <div className={styles.pageNumbers}>
                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      className={`${styles.pageNumber} ${currentPage === page ? styles.activePage : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                className={styles.pageButton}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}