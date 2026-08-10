import React, { useState, useEffect } from 'react';
import styles from './AuctionedVehiclesList.module.css';
import { getAuthHeaders } from '../utils/auth';

interface AuctionedVehicle {
  auction_id: string;
  auction_number: string;
  edital_number: string | null;
  auction_date: string | null;
  auctioneer: string | null;
  company: string | null;
  auction_status: string;
  vehicle_id: string;
  fleet_number: string;
  patrimony_name: string;
  patrimony_plate: string;
  chassi: string | null;
  renavam: string | null;
  model: string | null;
  year: number | null;
  department: string;
  sector: string | null;
  sold_value: number | null;
  buyer_name: string | null;
  buyer_document: string | null;
  detran_status: string | null;
  detran_protocol: string | null;
  detran_request_date: string | null;
  sale_date: string | null;
}

interface AuctionedVehiclesListProps {
  searchQuery?: string;
  statusFilter?: string;
}

export default function AuctionedVehiclesList({ 
  searchQuery = '', 
  statusFilter = '' 
}: AuctionedVehiclesListProps) {
  const [vehicles, setVehicles] = useState<AuctionedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, [searchQuery, statusFilter]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError('');
      
      const headers = getAuthHeaders();
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      
      const url = `http://localhost:8080/api/auctions/report?${params.toString()}`;
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar veículos leiloados');
      }
      
      const data = await response.json();
      setVehicles(data);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar veículos leiloados');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'EM_PREPARACAO': 'Em Preparação',
      'PUBLICADO': 'Publicado',
      'REALIZADO': 'Realizado',
      'FINALIZADO': 'Finalizado',
      'BAIXA_CONCLUIDA': 'Baixa Concluída'
    };
    return labels[status] || status;
  };

  const getDetranStatusLabel = (status: string | null) => {
    if (!status) return 'N/A';
    const labels: Record<string, string> = {
      'PENDENTE': 'Pendente',
      'ENVIADO': 'Enviado ao DETRAN',
      'ANALISE': 'Em Análise',
      'CONCLUIDO': 'Concluído'
    };
    return labels[status] || status;
  };

  const getDetranStatusColor = (status: string | null) => {
    if (!status) return '#6b7280';
    const colors: Record<string, string> = {
      'PENDENTE': '#ef4444',
      'ENVIADO': '#f59e0b',
      'ANALISE': '#3b82f6',
      'CONCLUIDO': '#10b981'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return <div className={styles.loading}>Carregando veículos leiloados...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🚛 Veículos Leiloados</h2>
        <span className={styles.total}>{vehicles.length} veículos</span>
      </div>

      {vehicles.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Nenhum veículo leiloado encontrado.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Frota</th>
                <th>Veículo</th>
                <th>Placa</th>
                <th>Leilão</th>
                <th>Status</th>
                <th>DETRAN</th>
                <th>Valor</th>
                <th>Comprador</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <React.Fragment key={vehicle.vehicle_id}>
                  <tr 
                    className={`${styles.row} ${styles.auctioned}`}
                    onClick={() => setExpandedId(expandedId === vehicle.vehicle_id ? null : vehicle.vehicle_id)}
                  >
                    <td className={styles.fleetNumber}>
                      <span className={styles.lockIcon}>🔒</span>
                      {vehicle.fleet_number}
                    </td>
                    <td className={styles.vehicleName}>
                      {vehicle.patrimony_name}
                      {vehicle.model && (
                        <span className={styles.modelBadge}>{vehicle.model}</span>
                      )}
                    </td>
                    <td className={styles.plate}>{vehicle.patrimony_plate}</td>
                    <td>
                      <div className={styles.auctionInfo}>
                        <span className={styles.auctionNumber}>{vehicle.auction_number}</span>
                        <span className={styles.auctionDate}>{formatDate(vehicle.auction_date)}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[vehicle.auction_status.toLowerCase()]}`}>
                        {getStatusLabel(vehicle.auction_status)}
                      </span>
                    </td>
                    <td>
                      <span 
                        className={styles.detranBadge}
                        style={{ backgroundColor: getDetranStatusColor(vehicle.detran_status) }}
                      >
                        {getDetranStatusLabel(vehicle.detran_status)}
                      </span>
                    </td>
                    <td className={styles.value}>{formatCurrency(vehicle.sold_value)}</td>
                    <td className={styles.buyer}>
                      {vehicle.buyer_name || '-'}
                      {vehicle.buyer_document && (
                        <span className={styles.documentBadge}>{vehicle.buyer_document}</span>
                      )}
                    </td>
                  </tr>
                  
                  {expandedId === vehicle.vehicle_id && (
                    <tr className={styles.expandedRow}>
                      <td colSpan={8}>
                        <div className={styles.expandedContent}>
                          <div className={styles.detailGrid}>
                            <div className={styles.detailSection}>
                              <h4>📋 Dados do Veículo</h4>
                              <div className={styles.detailItem}>
                                <span className={styles.label}>Frota:</span>
                                <span>{vehicle.fleet_number}</span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.label}>Nome:</span>
                                <span>{vehicle.patrimony_name}</span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.label}>Placa:</span>
                                <span>{vehicle.patrimony_plate}</span>
                              </div>
                              {vehicle.chassi && (
                                <div className={styles.detailItem}>
                                  <span className={styles.label}>Chassi:</span>
                                  <span className={styles.mono}>{vehicle.chassi}</span>
                                </div>
                              )}
                              {vehicle.renavam && (
                                <div className={styles.detailItem}>
                                  <span className={styles.label}>Renavam:</span>
                                  <span className={styles.mono}>{vehicle.renavam}</span>
                                </div>
                              )}
                              <div className={styles.detailItem}>
                                <span className={styles.label}>Departamento:</span>
                                <span>{vehicle.department}</span>
                              </div>
                              {vehicle.sector && (
                                <div className={styles.detailItem}>
                                  <span className={styles.label}>Setor:</span>
                                  <span>{vehicle.sector}</span>
                                </div>
                              )}
                            </div>

                            <div className={styles.detailSection}>
                              <h4>💰 Dados do Leilão</h4>
                              <div className={styles.detailItem}>
                                <span className={styles.label}>Leilão:</span>
                                <span>{vehicle.auction_number}</span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.label}>Edital:</span>
                                <span>{vehicle.edital_number || '-'}</span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.label}>Data do Leilão:</span>
                                <span>{formatDate(vehicle.auction_date)}</span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.label}>Valor de Venda:</span>
                                <span className={styles.valueHighlight}>
                                  {formatCurrency(vehicle.sold_value)}
                                </span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.label}>Data da Venda:</span>
                                <span>{formatDate(vehicle.sale_date)}</span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.label}>Comprador:</span>
                                <span>{vehicle.buyer_name || '-'}</span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.label}>Documento:</span>
                                <span>{vehicle.buyer_document || '-'}</span>
                              </div>
                            </div>

                            <div className={styles.detailSection}>
                              <h4>📑 Controle DETRAN</h4>
                              <div className={styles.detailItem}>
                                <span className={styles.label}>Status:</span>
                                <span 
                                  className={styles.detranBadgeLarge}
                                  style={{ backgroundColor: getDetranStatusColor(vehicle.detran_status) }}
                                >
                                  {getDetranStatusLabel(vehicle.detran_status)}
                                </span>
                              </div>
                              {vehicle.detran_protocol && (
                                <div className={styles.detailItem}>
                                  <span className={styles.label}>Protocolo:</span>
                                  <span className={styles.mono}>{vehicle.detran_protocol}</span>
                                </div>
                              )}
                              {vehicle.detran_request_date && (
                                <div className={styles.detailItem}>
                                  <span className={styles.label}>Data Solicitação:</span>
                                  <span>{formatDate(vehicle.detran_request_date)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
