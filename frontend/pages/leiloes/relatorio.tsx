import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../LeiloesPage.module.css';
import { getAuthHeaders } from '../../utils/auth';

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

export default function AuctionReportPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedAuctioneer, setSelectedAuctioneer] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [statuses, setStatuses] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [auctioneers, setAuctioneers] = useState<string[]>([]);

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      setError('');

      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8080/api/auctions', { headers });

      if (!response.ok) {
        throw new Error('Erro ao carregar leilões');
      }

      const data = await response.json();

      const auctionsWithVehicles = await Promise.all(
        data.map(async (auction: Auction) => {
          try {
            const vehiclesResponse = await fetch(
              `http://localhost:8080/api/auctions/${auction.id}/vehicles`,
              { headers }
            );
            if (vehiclesResponse.ok) {
              const vehicles = await vehiclesResponse.json();
              return { ...auction, vehicles };
            }
            return { ...auction, vehicles: [] };
          } catch {
            return { ...auction, vehicles: [] };
          }
        })
      );

      setAuctions(auctionsWithVehicles);

      const statusSet = new Set<string>();
      const companySet = new Set<string>();
      const auctioneerSet = new Set<string>();

      auctionsWithVehicles.forEach((a: Auction) => {
        if (a.status) statusSet.add(a.status);
        if (a.company) companySet.add(a.company);
        if (a.auctioneer) auctioneerSet.add(a.auctioneer);
      });

      setStatuses(Array.from(statusSet));
      setCompanies(Array.from(companySet));
      setAuctioneers(Array.from(auctioneerSet));

    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const filteredAuctions = auctions.filter(auction => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const match = 
        auction.auction_number.toLowerCase().includes(search) ||
        (auction.edital_number?.toLowerCase().includes(search) || false) ||
        (auction.auctioneer?.toLowerCase().includes(search) || false) ||
        (auction.company?.toLowerCase().includes(search) || false);
      if (!match) return false;
    }

    if (selectedStatus !== 'all' && auction.status !== selectedStatus) {
      return false;
    }

    if (selectedCompany !== 'all' && auction.company !== selectedCompany) {
      return false;
    }

    if (selectedAuctioneer !== 'all' && auction.auctioneer !== selectedAuctioneer) {
      return false;
    }

    if (dateFrom && auction.auction_date) {
      const auctionDate = new Date(auction.auction_date);
      const fromDate = new Date(dateFrom);
      if (auctionDate < fromDate) return false;
    }
    if (dateTo && auction.auction_date) {
      const auctionDate = new Date(auction.auction_date);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59);
      if (auctionDate > toDate) return false;
    }

    return true;
  });

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
    if (!filteredAuctions.length) {
      alert('Nenhum registro encontrado para imprimir');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Libere pop-ups no navegador');
      return;
    }

    const totalVehicles = filteredAuctions.reduce((sum, a) => sum + (a.vehicles?.length || 0), 0);
    const totalValue = filteredAuctions.reduce((sum, a) => {
      const auctionTotal = a.vehicles?.reduce((s, v) => s + (v.sold_value || 0), 0) || 0;
      return sum + auctionTotal;
    }, 0);

    const auctionsHtml = filteredAuctions.map(auction => {
      const vehiclesHtml = auction.vehicles && auction.vehicles.length > 0
        ? auction.vehicles.map(v => `
            <tr>
              <td>${v.plate || '-'}</td>
              <td>${v.name || '-'}</td>
              <td>${v.department || '-'}</td>
              <td>${v.sector || '-'}</td>
              <td style="text-align: right;">${formatCurrency(v.sold_value)}</td>
              <td>${v.buyer_name || '-'}</td>
              <td>${getDetranStatusLabel(v.detran_status)}</td>
              <td>${v.protocol_number || '-'}</td>
              <td>${formatDate(v.sale_date)}</td>
            </tr>
          `).join('')
        : `
            <tr>
              <td colspan="9" style="text-align: center; padding: 10px; color: #999;">
                Nenhum veículo
              </td>
            </tr>
          `;

      return `
        <div style="page-break-after: always; margin-bottom: 30px;">
          <div style="background: #f8f9fa; padding: 10px 15px; border-radius: 6px; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #1e3a8a;">${auction.auction_number}</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 5px; margin-top: 5px; font-size: 12px;">
              <span><strong>Edital:</strong> ${auction.edital_number || '-'}</span>
              <span><strong>Data:</strong> ${formatDate(auction.auction_date)}</span>
              <span><strong>Leiloeiro:</strong> ${auction.auctioneer || '-'}</span>
              <span><strong>Empresa:</strong> ${auction.company || '-'}</span>
              <span><strong>Status:</strong> ${getStatusLabel(auction.status)}</span>
              <span><strong>Veículos:</strong> ${auction.vehicles?.length || 0}</span>
            </div>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Nome</th>
                <th>Depto</th>
                <th>Setor</th>
                <th style="text-align: right;">Valor</th>
                <th>Comprador</th>
                <th>Status DETRAN</th>
                <th>Protocolo</th>
                <th>Data Venda</th>
              </tr>
            </thead>
            <tbody>
              ${vehiclesHtml}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    const html = `
      <html>
        <head>
          <title>Relatório de Leilões</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Arial', sans-serif;
              margin: 20px;
              font-size: 12px;
              color: #1a1a1a;
            }
            .report-header {
              text-align: center;
              border-bottom: 2px solid #1e3a8a;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .report-header h1 {
              font-size: 24px;
              color: #1e3a8a;
            }
            .report-header .subtitle {
              font-size: 14px;
              color: #666;
              margin-top: 5px;
            }
            .report-filters {
              background: #f8f9fa;
              padding: 12px 16px;
              border-radius: 6px;
              margin-bottom: 20px;
              font-size: 12px;
              display: flex;
              flex-wrap: wrap;
              gap: 15px;
            }
            .report-filters .filter-item {
              display: flex;
              align-items: center;
              gap: 5px;
            }
            .report-filters .filter-item strong {
              color: #374151;
            }
            .report-summary {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 10px;
              margin-bottom: 25px;
              padding: 15px;
              background: #eef2ff;
              border-radius: 8px;
              border: 1px solid #c7d2fe;
            }
            .report-summary .summary-item {
              text-align: center;
            }
            .report-summary .summary-item .number {
              font-size: 20px;
              font-weight: bold;
              color: #1e3a8a;
            }
            .report-summary .summary-item .label {
              font-size: 11px;
              color: #6b7280;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 6px 8px;
              text-align: left;
            }
            th {
              background: #f3f4f6;
              font-weight: 600;
              color: #374151;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 11px;
              color: #9ca3af;
              border-top: 1px solid #e5e7eb;
              padding-top: 15px;
            }
            @media print {
              body { margin: 10px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="report-header">
            <h1>📊 Relatório de Leilões</h1>
            <div class="subtitle">Relatório completo com todos os leilões e veículos</div>
          </div>

          <div class="report-filters">
            <div class="filter-item"><strong>Filtros aplicados:</strong></div>
            ${selectedStatus !== 'all' ? `<div class="filter-item"><strong>Status:</strong> ${getStatusLabel(selectedStatus)}</div>` : ''}
            ${selectedCompany !== 'all' ? `<div class="filter-item"><strong>Empresa:</strong> ${selectedCompany}</div>` : ''}
            ${selectedAuctioneer !== 'all' ? `<div class="filter-item"><strong>Leiloeiro:</strong> ${selectedAuctioneer}</div>` : ''}
            ${dateFrom ? `<div class="filter-item"><strong>De:</strong> ${new Date(dateFrom).toLocaleDateString('pt-BR')}</div>` : ''}
            ${dateTo ? `<div class="filter-item"><strong>Até:</strong> ${new Date(dateTo).toLocaleDateString('pt-BR')}</div>` : ''}
          </div>

          <div class="report-summary">
            <div class="summary-item">
              <div class="number">${filteredAuctions.length}</div>
              <div class="label">Leilões</div>
            </div>
            <div class="summary-item">
              <div class="number">${totalVehicles}</div>
              <div class="label">Veículos</div>
            </div>
            <div class="summary-item">
              <div class="number">${formatCurrency(totalValue)}</div>
              <div class="label">Valor Total</div>
            </div>
            <div class="summary-item">
              <div class="number">${(totalVehicles > 0 ? (totalValue / totalVehicles) : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              <div class="label">Média por Veículo</div>
            </div>
          </div>

          ${auctionsHtml}

          <div class="footer">
            <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
            <p style="margin-top: 5px;">Sistema de Gestão de Patrimônio</p>
          </div>

          <script>
            window.onload = () => {
              setTimeout(() => window.print(), 800);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const exportCSV = () => {
    if (!filteredAuctions.length) {
      alert('Nenhum registro para exportar');
      return;
    }

    const headers = [
      'Leilão', 'Edital', 'Data', 'Leiloeiro', 'Empresa', 'Status',
      'Placa', 'Nome Veículo', 'Departamento', 'Setor', 'Valor',
      'Comprador', 'CPF/CNPJ', 'Status DETRAN', 'Protocolo', 'Data Venda'
    ];

    const rows = filteredAuctions.flatMap(auction => {
      if (!auction.vehicles || auction.vehicles.length === 0) {
        return [[
          auction.auction_number,
          auction.edital_number || '',
          formatDate(auction.auction_date),
          auction.auctioneer || '',
          auction.company || '',
          getStatusLabel(auction.status),
          '', '', '', '', '', '', '', '', '', ''
        ]];
      }
      return auction.vehicles.map(v => [
        auction.auction_number,
        auction.edital_number || '',
        formatDate(auction.auction_date),
        auction.auctioneer || '',
        auction.company || '',
        getStatusLabel(auction.status),
        v.plate || '',
        v.name || '',
        v.department || '',
        v.sector || '',
        formatCurrency(v.sold_value),
        v.buyer_name || '',
        v.buyer_document || '',
        getDetranStatusLabel(v.detran_status),
        v.protocol_number || '',
        formatDate(v.sale_date)
      ]);
    });

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_leiloes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const resetFilters = () => {
    setSelectedStatus('all');
    setSelectedCompany('all');
    setSelectedAuctioneer('all');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
  };

  if (loading) {
    return <div className={styles.loading}>Carregando relatório...</div>;
  }

  return (
    <>
      <Head>
        <title>Relatório de Leilões</title>
      </Head>

      <main className={styles.pageWrapper}>
        <div className={styles.topbar}>
          <div className={styles.headerLeft}>
            <div className={styles.logo}>📊</div>
            <div className={styles.headerText}>
              <h1 className={styles.headerTitle}>Relatório de Leilões</h1>
              <p className={styles.headerSub}>Análise completa de todos os leilões</p>
            </div>
          </div>
          <div className={styles.topbarActions}>
            <button
              className={styles.primaryButton}
              onClick={handlePrint}
              disabled={!filteredAuctions.length}
            >
              🖨️ Imprimir
            </button>
            <button
              className={styles.primaryButton}
              onClick={exportCSV}
              disabled={!filteredAuctions.length}
            >
              📥 CSV
            </button>
            <button
              className={styles.secondaryButton}
              onClick={resetFilters}
            >
              🔄 Limpar Filtros
            </button>
            <Link href="/leiloes" className={styles.secondaryButton}>
              ← Voltar
            </Link>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            ❌ {error}
            <button onClick={fetchAuctions} style={{ marginLeft: '1rem', padding: '0.3rem 0.8rem', cursor: 'pointer' }}>
              Tentar novamente
            </button>
          </div>
        )}

        <div className={styles.filterCard}>
          <div className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <label>Buscar</label>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Nº leilão, edital, leiloeiro..."
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Status</label>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">Todos</option>
                {statuses.map(s => (
                  <option key={s} value={s}>{getStatusLabel(s)}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Empresa</label>
              <select
                value={selectedCompany}
                onChange={e => setSelectedCompany(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">Todas</option>
                {companies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Leiloeiro</label>
              <select
                value={selectedAuctioneer}
                onChange={e => setSelectedAuctioneer(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">Todos</option>
                {auctioneers.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Data Início</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Data Fim</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className={styles.filterInput}
              />
            </div>
          </div>
        </div>

        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryNumber}>{filteredAuctions.length}</span>
            <span className={styles.summaryLabel}>Leilões</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryNumber}>
              {filteredAuctions.reduce((sum, a) => sum + (a.vehicles?.length || 0), 0)}
            </span>
            <span className={styles.summaryLabel}>Veículos</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryNumber}>
              {formatCurrency(
                filteredAuctions.reduce((sum, a) => {
                  const auctionTotal = a.vehicles?.reduce((s, v) => s + (v.sold_value || 0), 0) || 0;
                  return sum + auctionTotal;
                }, 0)
              )}
            </span>
            <span className={styles.summaryLabel}>Valor Total</span>
          </div>
        </div>

        <div className={styles.contentCard}>
          <div className={styles.tableContainer}>
            <table className={styles.auctionTable}>
              <thead>
                <tr>
                  <th>Leilão</th>
                  <th>Edital</th>
                  <th>Data</th>
                  <th>Leiloeiro</th>
                  <th>Empresa</th>
                  <th>Status</th>
                  <th>Veículos</th>
                  <th>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuctions.length > 0 ? (
                  filteredAuctions.map(auction => {
                    const totalVehicles = auction.vehicles?.length || 0;
                    const totalValue = auction.vehicles?.reduce((sum, v) => sum + (v.sold_value || 0), 0) || 0;

                    return (
                      <tr key={auction.id} className={styles.tableRow}>
                        <td><strong>{auction.auction_number}</strong></td>
                        <td>{auction.edital_number || '-'}</td>
                        <td>{formatDate(auction.auction_date)}</td>
                        <td>{auction.auctioneer || '-'}</td>
                        <td>{auction.company || '-'}</td>
                        <td>
                          <span
                            className={styles.statusBadge}
                            style={{ backgroundColor: getStatusColor(auction.status) }}
                          >
                            {getStatusLabel(auction.status)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>{totalVehicles}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                          {totalVehicles > 0 ? formatCurrency(totalValue) : '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      Nenhum leilão encontrado com os filtros selecionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
