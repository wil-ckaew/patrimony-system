import React, { useState, useEffect } from 'react';
import styles from './AuctionPrintModal.module.css';
import { getAuthHeaders } from '../utils/auth';

interface AuctionVehicle {
  id: string;
  vehicle_id: string;
  plate: string;
  name: string;
  department: string;
  sector: string;
  sold_value: number | null;
  buyer_name: string | null;
  buyer_document: string | null;
  detran_status: string | null;
  protocol_number: string | null;
  sale_date: string | null;
}

interface Auction {
  id: string;
  auction_number: string;
  edital_number: string | null;
  auction_date: string | null;
  auctioneer: string | null;
  company: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  vehicles?: AuctionVehicle[];
}

interface AuctionPrintModalProps {
  auctionId: string;
  onClose: () => void;
}

const AuctionPrintModal: React.FC<AuctionPrintModalProps> = ({ auctionId, onClose }) => {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAuctionDetails();
  }, [auctionId]);

  const fetchAuctionDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const headers = getAuthHeaders();
      const response = await fetch(`http://localhost:8080/api/auctions/${auctionId}`, { headers });

      if (!response.ok) {
        throw new Error('Erro ao carregar detalhes do leilão');
      }

      const data = await response.json();

      const vehiclesResponse = await fetch(
        `http://localhost:8080/api/auctions/${auctionId}/vehicles`,
        { headers }
      );

      if (vehiclesResponse.ok) {
        const vehicles = await vehiclesResponse.json();
        data.vehicles = vehicles;
      } else {
        data.vehicles = [];
      }

      setAuction(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes');
    } finally {
      setLoading(false);
    }
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'EM_PREPARACAO': '#f59e0b',
      'PUBLICADO': '#3b82f6',
      'REALIZADO': '#8b5cf6',
      'FINALIZADO': '#10b981',
      'BAIXA_CONCLUIDA': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getDetranStatusLabel = (status: string | null) => {
    if (!status) return '-';
    const labels: Record<string, string> = {
      'PENDENTE': 'Pendente',
      'EM_ANDAMENTO': 'Em Andamento',
      'CONCLUIDO': 'Concluído',
      'CANCELADO': 'Cancelado'
    };
    return labels[status] || status;
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const handlePrint = () => {
    if (!auction) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Libere pop-ups no navegador');
      return;
    }

    const vehiclesHtml = auction.vehicles && auction.vehicles.length > 0
      ? auction.vehicles.map(vehicle => `
          <tr>
            <td>${vehicle.plate || '-'}</td>
            <td>${vehicle.name || '-'}</td>
            <td>${vehicle.department || '-'}</td>
            <td>${vehicle.sector || '-'}</td>
            <td style="text-align: right;">${formatCurrency(vehicle.sold_value)}</td>
            <td>${vehicle.buyer_name || '-'}</td>
            <td>${vehicle.buyer_document || '-'}</td>
            <td>${getDetranStatusLabel(vehicle.detran_status)}</td>
            <td>${vehicle.protocol_number || '-'}</td>
            <td>${formatDate(vehicle.sale_date)}</td>
          </tr>
        `).join('')
      : `
          <tr>
            <td colspan="10" style="text-align: center; padding: 20px; color: #666;">
              Nenhum veículo associado a este leilão
            </td>
          </tr>
        `;

    const html = `
      <html>
        <head>
          <title>Detalhes do Leilão - ${auction.auction_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Arial', sans-serif;
              margin: 20px;
              font-size: 12px;
              color: #1a1a1a;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #1e3a8a;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .header h1 {
              font-size: 22px;
              color: #1e3a8a;
              margin-bottom: 5px;
            }
            .header .subtitle {
              font-size: 14px;
              color: #666;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 10px;
              margin-bottom: 25px;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 8px;
            }
            .info-item {
              display: flex;
              flex-direction: column;
            }
            .info-item .label {
              font-weight: bold;
              font-size: 11px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .info-item .value {
              font-size: 14px;
              font-weight: 500;
              margin-top: 2px;
            }
            .status-badge {
              display: inline-block;
              padding: 3px 10px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
              color: white;
              background: ${getStatusColor(auction.status)};
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 8px 6px;
              text-align: left;
            }
            th {
              background: #f3f4f6;
              font-weight: 600;
              color: #374151;
              position: sticky;
              top: 0;
              z-index: 10;
            }
            .table-title {
              font-size: 16px;
              font-weight: bold;
              margin: 20px 0 10px 0;
              color: #1e3a8a;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 11px;
              color: #9ca3af;
              border-top: 1px solid #e5e7eb;
              padding-top: 15px;
            }
            .total-vehicles {
              margin-top: 10px;
              font-weight: bold;
              text-align: right;
              font-size: 13px;
            }
            @media print {
              body { margin: 10px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏷️ Detalhes do Leilão</h1>
            <div class="subtitle">Relatório completo do leilão</div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="label">Nº Leilão</span>
              <span class="value"><strong>${auction.auction_number}</strong></span>
            </div>
            <div class="info-item">
              <span class="label">Edital</span>
              <span class="value">${auction.edital_number || '-'}</span>
            </div>
            <div class="info-item">
              <span class="label">Data do Leilão</span>
              <span class="value">${formatDate(auction.auction_date)}</span>
            </div>
            <div class="info-item">
              <span class="label">Status</span>
              <span class="value">
                <span class="status-badge">${getStatusLabel(auction.status)}</span>
              </span>
            </div>
            <div class="info-item">
              <span class="label">Leiloeiro</span>
              <span class="value">${auction.auctioneer || '-'}</span>
            </div>
            <div class="info-item">
              <span class="label">Empresa</span>
              <span class="value">${auction.company || '-'}</span>
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
              <span class="label">Observações</span>
              <span class="value">${auction.notes || '-'}</span>
            </div>
          </div>

          <div class="table-title">📋 Veículos do Leilão</div>

          <table>
            <thead>
              <tr>
                <th>Placa</th>
                <th>Nome</th>
                <th>Departamento</th>
                <th>Setor</th>
                <th style="text-align: right;">Valor</th>
                <th>Comprador</th>
                <th>Documento</th>
                <th>Status DETRAN</th>
                <th>Protocolo</th>
                <th>Data Venda</th>
              </tr>
            </thead>
            <tbody>
              ${vehiclesHtml}
            </tbody>
          </table>

          <div class="total-vehicles">
            Total de veículos: ${auction.vehicles?.length || 0}
          </div>

          <div class="footer">
            <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
            <p style="margin-top: 5px;">Sistema de Gestão de Patrimônio</p>
          </div>

          <script>
            window.onload = () => {
              setTimeout(() => window.print(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.loading}>Carregando detalhes do leilão...</div>
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.error}>
            <p>❌ {error || 'Leilão não encontrado'}</p>
            <button onClick={onClose} className={styles.closeButton}>Fechar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>📄 Detalhes do Leilão</h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>

        <div className={styles.content}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Nº Leilão</span>
              <span className={styles.value}><strong>{auction.auction_number}</strong></span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Edital</span>
              <span className={styles.value}>{auction.edital_number || '-'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Data</span>
              <span className={styles.value}>{formatDate(auction.auction_date)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Status</span>
              <span className={styles.value}>
                <span className={styles.statusBadge} style={{ backgroundColor: getStatusColor(auction.status) }}>
                  {getStatusLabel(auction.status)}
                </span>
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Leiloeiro</span>
              <span className={styles.value}>{auction.auctioneer || '-'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Empresa</span>
              <span className={styles.value}>{auction.company || '-'}</span>
            </div>
            <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
              <span className={styles.label}>Observações</span>
              <span className={styles.value}>{auction.notes || '-'}</span>
            </div>
          </div>

          <div className={styles.tableTitle}>Veículos do Leilão</div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Nome</th>
                  <th>Depto</th>
                  <th>Setor</th>
                  <th style={{ textAlign: 'right' }}>Valor</th>
                  <th>Comprador</th>
                  <th>Status DETRAN</th>
                </tr>
              </thead>
              <tbody>
                {auction.vehicles && auction.vehicles.length > 0 ? (
                  auction.vehicles.map(vehicle => (
                    <tr key={vehicle.id}>
                      <td>{vehicle.plate || '-'}</td>
                      <td>{vehicle.name || '-'}</td>
                      <td>{vehicle.department || '-'}</td>
                      <td>{vehicle.sector || '-'}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(vehicle.sold_value)}</td>
                      <td>{vehicle.buyer_name || '-'}</td>
                      <td>{getDetranStatusLabel(vehicle.detran_status)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      Nenhum veículo associado a este leilão
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.total}>
            Total de veículos: {auction.vehicles?.length || 0}
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelBtn}>Fechar</button>
          <button onClick={handlePrint} className={styles.printBtn}>
            🖨️ Imprimir Relatório
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuctionPrintModal;
