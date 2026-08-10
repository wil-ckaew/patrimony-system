import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from './LeiloesPage.module.css';
import { getAuthHeaders } from '../utils/auth';
import EditAuctionModal from '../components/EditAuctionModal';
import CreateAuctionModal from '../components/CreateAuctionModal';

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
}

export default function LeiloesPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);

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
        if (response.status === 401) {
          setError('Sessão expirada. Faça login novamente.');
          return;
        }
        const errorText = await response.text();
        throw new Error(errorText || `Erro ${response.status}`);
      }

      const data = await response.json();
      setAuctions(data);
      
    } catch (err: any) {
      console.error('❌ Erro:', err);
      setError(`Erro ao carregar leilões: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (auction: Auction) => {
    setSelectedAuction(auction);
    setShowEditModal(true);
  };

  const handleDeleteAuction = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este leilão?')) return;
    
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`http://localhost:8080/api/auctions/${id}`, {
        method: 'DELETE',
        headers
      });
      
      if (response.ok) {
        await fetchAuctions();
        alert('✅ Leilão excluído com sucesso!');
      } else {
        const errorText = await response.text();
        alert(`Erro ao excluir leilão: ${errorText}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir leilão');
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

  if (loading) {
    return <div className={styles.loading}>Carregando leilões...</div>;
  }

  return (
    <>
      <Head>
        <title>Módulo de Leilões</title>
      </Head>

      <main className={styles.pageWrapper}>
        <div className={styles.topbar}>
          <div className={styles.headerLeft}>
            <div className={styles.logo}>🏷️</div>
            <div className={styles.headerText}>
              <h1 className={styles.headerTitle}>Módulo de Leilões</h1>
              <p className={styles.headerSub}>Controle de veículos leiloados</p>
            </div>
          </div>
          <div className={styles.topbarActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => {
                setShowCreateModal(true);
              }}
            >
              ➕ Novo Leilão
            </button>
            <Link href="/leiloes/relatorio" className={styles.primaryButton}>
              📊 Relatório
            </Link>
            <Link href="/" className={styles.secondaryButton}>
              ← Voltar
            </Link>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            <strong>❌ Erro:</strong> {error}
            <button 
              onClick={fetchAuctions} 
              style={{ marginLeft: '1rem', padding: '0.3rem 0.8rem', cursor: 'pointer' }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        <div className={styles.contentCard}>
          {auctions.length === 0 && !error ? (
            <div className={styles.emptyState}>
              <p>Nenhum leilão cadastrado.</p>
              <button
                className={styles.primaryButton}
                onClick={() => {
                  setShowCreateModal(true);
                }}
              >
                Criar primeiro leilão
              </button>
            </div>
          ) : auctions.length > 0 ? (
            <div className={styles.tableContainer}>
              <table className={styles.auctionTable}>
                <thead>
                  <tr>
                    <th>Nº Leilão</th>
                    <th>Edital</th>
                    <th>Data</th>
                    <th>Leiloeiro</th>
                    <th>Empresa</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {auctions.map((auction) => (
                    <tr key={auction.id} className={styles.tableRow}>
                      <td><strong>{auction.auction_number}</strong></td>
                      <td>{auction.edital_number || '-'}</td>
                      <td>{auction.auction_date ? new Date(auction.auction_date).toLocaleDateString('pt-BR') : '-'}</td>
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
                      <td>
                        <div className={styles.rowActions}>
                          <Link href={`/leiloes/${auction.id}`}>
                            <button
                              className={`${styles.actionButton} ${styles.viewButton}`}
                              title="Ver detalhes"
                            >
                              👁️
                            </button>
                          </Link>
                          <button
                            className={`${styles.actionButton} ${styles.editButton}`}
                            title="Editar"
                            onClick={() => handleEditClick(auction)}
                          >
                            ✏️
                          </button>
                          <button
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            title="Excluir"
                            onClick={() => handleDeleteAuction(auction.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        {/* Modal de criação */}
        {showCreateModal && (
          <CreateAuctionModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchAuctions();
            }}
          />
        )}

        {/* Modal de edição */}
        {showEditModal && selectedAuction && (
          <EditAuctionModal
            auction={selectedAuction}
            onClose={() => {
              setShowEditModal(false);
              setSelectedAuction(null);
            }}
            onSuccess={() => {
              fetchAuctions();
              setShowEditModal(false);
              setSelectedAuction(null);
            }}
          />
        )}
      </main>
    </>
  );
}
