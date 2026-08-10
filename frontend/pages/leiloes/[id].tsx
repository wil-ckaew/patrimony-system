import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../LeiloesPage.module.css';
import { getAuthHeaders } from '../../utils/auth';
import EditAuctionModal from '../../components/EditAuctionModal';
import AuctionPrintModal from '../../components/AuctionPrintModal';
import AddVehicleToAuctionModal from '../../components/AddVehicleToAuctionModal';
import UploadAuctionDocumentModal from '../../components/UploadAuctionDocumentModal';
import UploadAuctionPhotoModal from '../../components/UploadAuctionPhotoModal';

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
  chassi_photo_path: string | null;
  plate_photo_path: string | null;
  front_photo_path: string | null;
  rear_photo_path: string | null;
  engine_photo_path: string | null;
  document_path: string | null;
}

interface AuctionPdf {
  id: string;
  document_type: string;
  file_path: string;
  file_name: string;
  uploaded_by: string;
  created_at: string;
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
  pdfs?: AuctionPdf[];
}

export default function AuctionDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [deletingPhoto, setDeletingPhoto] = useState<{vehicleId: string, photoType: string} | null>(null);
  const [deletingPdf, setDeletingPdf] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchAuctionDetails(id as string);
    }
  }, [id]);

  const fetchAuctionDetails = async (auctionId: string) => {
    try {
      setLoading(true);
      setError('');

      const headers = getAuthHeaders();
      const response = await fetch(`http://localhost:8080/api/auctions/${auctionId}`, { headers });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Leilão não encontrado');
        }
        throw new Error(`Erro ${response.status}`);
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

      const pdfsResponse = await fetch(
        `http://localhost:8080/api/auctions/${auctionId}/pdfs`,
        { headers }
      );

      if (pdfsResponse.ok) {
        const pdfs = await pdfsResponse.json();
        data.pdfs = pdfs;
      } else {
        data.pdfs = [];
      }

      setAuction(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar leilão');
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

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
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

  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8080${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
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

  const handleAddVehicle = () => {
    setShowAddVehicle(true);
  };

  const handleAddImages = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setShowPhotoModal(true);
  };

  const handleAddDocuments = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setShowDocumentModal(true);
  };

  const handleAddBaixa = (vehicleId: string) => {
    alert(`📋 Registrar baixa do veículo ${vehicleId}`);
  };

  const handleAddChassi = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setShowPhotoModal(true);
  };

  // ✅ FUNÇÃO PARA EXCLUIR FOTO
  const handleDeletePhoto = async (vehicleId: string, photoType: string) => {
    if (!confirm(`Tem certeza que deseja excluir a foto "${photoType}"?`)) {
      return;
    }

    setDeletingPhoto({ vehicleId, photoType });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8080/api/auctions/vehicles/${vehicleId}/photos/${photoType}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        alert('✅ Foto excluída com sucesso!');
        fetchAuctionDetails(id as string);
      } else {
        const errorText = await response.text();
        alert(`❌ Erro ao excluir foto: ${errorText}`);
      }
    } catch (err) {
      console.error('Erro ao excluir foto:', err);
      alert('❌ Erro de conexão ao excluir foto');
    } finally {
      setDeletingPhoto(null);
    }
  };

  // ✅ FUNÇÃO PARA EXCLUIR PDF
  const handleDeletePdf = async (pdfId: string, fileName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o documento "${fileName}"?`)) {
      return;
    }

    setDeletingPdf(pdfId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8080/api/auctions/${id}/pdfs/${pdfId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        alert('✅ Documento excluído com sucesso!');
        fetchAuctionDetails(id as string);
      } else {
        const errorText = await response.text();
        alert(`❌ Erro ao excluir documento: ${errorText}`);
      }
    } catch (err) {
      console.error('Erro ao excluir documento:', err);
      alert('❌ Erro de conexão ao excluir documento');
    } finally {
      setDeletingPdf(null);
    }
  };

  // ✅ FUNÇÃO PARA VISUALIZAR PDF
  const handleViewPdf = (filePath: string, fileName: string) => {
    const url = `http://localhost:8080${filePath.startsWith('/') ? '' : '/'}${filePath}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return <div className={styles.loading}>Carregando detalhes do leilão...</div>;
  }

  if (error || !auction) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.error}>
          ❌ {error || 'Leilão não encontrado'}
          <div style={{ marginTop: '16px' }}>
            <Link href="/leiloes" className={styles.primaryButton}>
              Voltar para lista
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Leilão {auction.auction_number}</title>
      </Head>

      {showAddVehicle && (
        <AddVehicleToAuctionModal
          auctionId={auction.id}
          onClose={() => setShowAddVehicle(false)}
          onSuccess={() => {
            setShowAddVehicle(false);
            fetchAuctionDetails(id as string);
          }}
        />
      )}

      {showDocumentModal && (
        <UploadAuctionDocumentModal
          vehicleId={selectedVehicleId}
          auctionId={auction.id}
          onClose={() => setShowDocumentModal(false)}
          onSuccess={() => fetchAuctionDetails(id as string)}
        />
      )}

      {showPhotoModal && (
        <UploadAuctionPhotoModal
          vehicleId={selectedVehicleId}
          onClose={() => setShowPhotoModal(false)}
          onSuccess={() => fetchAuctionDetails(id as string)}
        />
      )}

      {selectedImage && (
        <div className={styles.imageModal} onClick={closeImageModal}>
          <div className={styles.imageModalContent} onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Visualização ampliada" className={styles.imageModalImg} />
            <button className={styles.imageModalClose} onClick={closeImageModal}>×</button>
          </div>
        </div>
      )}

      <main className={styles.pageWrapper}>
        <div className={styles.topbar}>
          <div className={styles.headerLeft}>
            <div className={styles.logo}>🏷️</div>
            <div className={styles.headerText}>
              <h1 className={styles.headerTitle}>Leilão {auction.auction_number}</h1>
              <p className={styles.headerSub}>
                {auction.edital_number ? `Edital: ${auction.edital_number}` : 'Sem edital'}
              </p>
            </div>
          </div>
          <div className={styles.topbarActions}>
            <button className={styles.primaryButton} onClick={handleAddVehicle}>
              ➕ Adicionar Veículo
            </button>
            <button className={styles.primaryButton} onClick={() => setShowPrintModal(true)}>
              🖨️ Imprimir
            </button>
            <button className={styles.primaryButton} onClick={() => setShowEditModal(true)}>
              ✏️ Editar
            </button>
            <Link href="/leiloes" className={styles.secondaryButton}>
              ← Voltar
            </Link>
          </div>
        </div>

        <div className={styles.contentCard}>
          {/* LINHA 1: Nº Leilão, Edital, Data, Status */}
          {/* LINHA 2: Leiloeiro, Empresa, Observações */}
          <div className={styles.auctionInfo}>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Nº Leilão</span>
                <span className={styles.value}><strong>{auction.auction_number}</strong></span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Edital</span>
                <span className={styles.value}><strong>{auction.edital_number || '-'}</strong></span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Data do Leilão</span>
                <span className={styles.value}><strong>{formatDate(auction.auction_date)}</strong></span>
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
              <div className={`${styles.infoItem} ${styles.infoItemObservacoes}`}>
                <span className={styles.label}>Observações</span>
                <span className={styles.value}>{auction.notes || '-'}</span>
              </div>
            </div>
          </div>

          {/* SEÇÃO DE DOCUMENTOS DO LEILÃO (GERAL) */}
          {auction.pdfs && auction.pdfs.length > 0 && (
            <div className={styles.auctionDocsSection}>
              <h3 className={styles.sectionTitle}>
                📎 Documentos do Leilão
              </h3>
              <div className={styles.auctionDocsList}>
                {auction.pdfs.map((pdf) => (
                  <div key={pdf.id} className={styles.auctionDocItem}>
                    <div className={styles.auctionDocInfo}>
                      <span className={styles.docIcon}>📄</span>
                      <span className={styles.docName}>{pdf.file_name}</span>
                      <span className={styles.docDate}>
                        {new Date(pdf.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className={styles.auctionDocActions}>
                      <button
                        className={styles.viewPdfButton}
                        onClick={() => handleViewPdf(pdf.file_path, pdf.file_name)}
                        title="Visualizar PDF"
                      >
                        👁️ Visualizar
                      </button>
                      <a
                        href={`http://localhost:8080${pdf.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.docDownload}
                      >
                        📥 Baixar
                      </a>
                      <button
                        className={styles.docDelete}
                        onClick={() => handleDeletePdf(pdf.id, pdf.file_name)}
                        disabled={deletingPdf === pdf.id}
                        title="Excluir documento"
                      >
                        {deletingPdf === pdf.id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.vehiclesSection}>
            <h3 className={styles.sectionTitle}>
              🚗 Veículos do Leilão
              <span className={styles.vehicleCount}>
                {auction.vehicles?.length || 0} veículo(s)
              </span>
            </h3>

            <div className={styles.tableContainer}>
              <table className={styles.auctionTable}>
                <thead>
                  <tr>
                    <th>Placa</th>
                    <th>Nome</th>
                    <th>Departamento</th>
                    <th>Setor</th>
                    <th>Valor</th>
                    <th>Comprador</th>
                    <th>Status DETRAN</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {auction.vehicles && auction.vehicles.length > 0 ? (
                    auction.vehicles.map(vehicle => {
                      const hasPhotos = vehicle.chassi_photo_path || 
                                       vehicle.plate_photo_path || 
                                       vehicle.front_photo_path || 
                                       vehicle.rear_photo_path || 
                                       vehicle.engine_photo_path;
                      
                      const isExpanded = expandedRows.has(vehicle.id);

                      return (
                        <React.Fragment key={vehicle.id}>
                          <tr className={styles.tableRow}>
                            <td><strong>{vehicle.plate || '-'}</strong></td>
                            <td>{vehicle.name || '-'}</td>
                            <td>{vehicle.department || '-'}</td>
                            <td>{vehicle.sector || '-'}</td>
                            <td>{formatCurrency(vehicle.sold_value)}</td>
                            <td>{vehicle.buyer_name || '-'}</td>
                            <td>
                              <span
                                className={styles.statusBadge}
                                style={{
                                  backgroundColor: vehicle.detran_status === 'CONCLUIDO'
                                    ? '#10b981'
                                    : vehicle.detran_status === 'EM_ANDAMENTO'
                                    ? '#f59e0b'
                                    : '#6b7280'
                                }}
                              >
                                {getDetranStatusLabel(vehicle.detran_status)}
                              </span>
                            </td>
                            <td>
                              <div className={styles.vehicleActions}>
                                <button
                                  className={`${styles.actionButton} ${styles.chassiButton}`}
                                  onClick={() => handleAddChassi(vehicle.id)}
                                  title="Adicionar foto do chassi"
                                >
                                  🔧 Chassi
                                </button>
                                <button
                                  className={`${styles.actionButton} ${styles.addImageButton}`}
                                  onClick={() => handleAddImages(vehicle.id)}
                                  title="Adicionar imagens"
                                >
                                  🖼️ Imagens
                                </button>
                                <button
                                  className={`${styles.actionButton} ${styles.documentButton}`}
                                  onClick={() => handleAddDocuments(vehicle.id)}
                                  title="Adicionar documentos"
                                >
                                  📄 Documentos
                                </button>
                                <button
                                  className={`${styles.actionButton} ${styles.baixaButton}`}
                                  onClick={() => handleAddBaixa(vehicle.id)}
                                  title="Registrar baixa"
                                >
                                  📋 Baixas
                                </button>
                                {hasPhotos && (
                                  <button
                                    className={`${styles.actionButton} ${styles.photoButton}`}
                                    onClick={() => toggleRow(vehicle.id)}
                                    title={isExpanded ? "Ocultar fotos" : "Ver fotos"}
                                  >
                                    {isExpanded ? '📷 Ocultar' : '📷 Fotos'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Fotos do veículo com botão de delete */}
                          {isExpanded && hasPhotos && (
                            <tr className={styles.expandedRow}>
                              <td colSpan={8}>
                                <div className={styles.expandedPhotos}>
                                  <div className={styles.photoGrid}>
                                    {vehicle.chassi_photo_path && (
                                      <div className={styles.photoItem}>
                                        <img
                                          src={getImageUrl(vehicle.chassi_photo_path) || ''}
                                          alt="Foto do Chassi"
                                          className={styles.photoThumb}
                                          onClick={(e) => handleImageClick(getImageUrl(vehicle.chassi_photo_path) || '', e)}
                                        />
                                        <span className={styles.photoLabel}>Chassi</span>
                                        <button
                                          className={styles.deletePhotoBtn}
                                          onClick={() => handleDeletePhoto(vehicle.id, 'chassi')}
                                          disabled={deletingPhoto?.vehicleId === vehicle.id && deletingPhoto?.photoType === 'chassi'}
                                          title="Excluir foto"
                                        >
                                          {deletingPhoto?.vehicleId === vehicle.id && deletingPhoto?.photoType === 'chassi' ? '⏳' : '🗑️'}
                                        </button>
                                      </div>
                                    )}
                                    {vehicle.plate_photo_path && (
                                      <div className={styles.photoItem}>
                                        <img
                                          src={getImageUrl(vehicle.plate_photo_path) || ''}
                                          alt="Foto da Placa"
                                          className={styles.photoThumb}
                                          onClick={(e) => handleImageClick(getImageUrl(vehicle.plate_photo_path) || '', e)}
                                        />
                                        <span className={styles.photoLabel}>Placa</span>
                                        <button
                                          className={styles.deletePhotoBtn}
                                          onClick={() => handleDeletePhoto(vehicle.id, 'plate')}
                                          disabled={deletingPhoto?.vehicleId === vehicle.id && deletingPhoto?.photoType === 'plate'}
                                          title="Excluir foto"
                                        >
                                          {deletingPhoto?.vehicleId === vehicle.id && deletingPhoto?.photoType === 'plate' ? '⏳' : '🗑️'}
                                        </button>
                                      </div>
                                    )}
                                    {vehicle.front_photo_path && (
                                      <div className={styles.photoItem}>
                                        <img
                                          src={getImageUrl(vehicle.front_photo_path) || ''}
                                          alt="Foto Frontal"
                                          className={styles.photoThumb}
                                          onClick={(e) => handleImageClick(getImageUrl(vehicle.front_photo_path) || '', e)}
                                        />
                                        <span className={styles.photoLabel}>Frontal</span>
                                        <button
                                          className={styles.deletePhotoBtn}
                                          onClick={() => handleDeletePhoto(vehicle.id, 'front')}
                                          disabled={deletingPhoto?.vehicleId === vehicle.id && deletingPhoto?.photoType === 'front'}
                                          title="Excluir foto"
                                        >
                                          {deletingPhoto?.vehicleId === vehicle.id && deletingPhoto?.photoType === 'front' ? '⏳' : '🗑️'}
                                        </button>
                                      </div>
                                    )}
                                    {vehicle.rear_photo_path && (
                                      <div className={styles.photoItem}>
                                        <img
                                          src={getImageUrl(vehicle.rear_photo_path) || ''}
                                          alt="Foto Traseira"
                                          className={styles.photoThumb}
                                          onClick={(e) => handleImageClick(getImageUrl(vehicle.rear_photo_path) || '', e)}
                                        />
                                        <span className={styles.photoLabel}>Traseira</span>
                                        <button
                                          className={styles.deletePhotoBtn}
                                          onClick={() => handleDeletePhoto(vehicle.id, 'rear')}
                                          disabled={deletingPhoto?.vehicleId === vehicle.id && deletingPhoto?.photoType === 'rear'}
                                          title="Excluir foto"
                                        >
                                          {deletingPhoto?.vehicleId === vehicle.id && deletingPhoto?.photoType === 'rear' ? '⏳' : '🗑️'}
                                        </button>
                                      </div>
                                    )}
                                    {vehicle.engine_photo_path && (
                                      <div className={styles.photoItem}>
                                        <img
                                          src={getImageUrl(vehicle.engine_photo_path) || ''}
                                          alt="Foto do Motor"
                                          className={styles.photoThumb}
                                          onClick={(e) => handleImageClick(getImageUrl(vehicle.engine_photo_path) || '', e)}
                                        />
                                        <span className={styles.photoLabel}>Motor</span>
                                        <button
                                          className={styles.deletePhotoBtn}
                                          onClick={() => handleDeletePhoto(vehicle.id, 'engine')}
                                          disabled={deletingPhoto?.vehicleId === vehicle.id && deletingPhoto?.photoType === 'engine'}
                                          title="Excluir foto"
                                        >
                                          {deletingPhoto?.vehicleId === vehicle.id && deletingPhoto?.photoType === 'engine' ? '⏳' : '🗑️'}
                                        </button>
                                      </div>
                                    )}
                                    {vehicle.document_path && (
                                      <div className={styles.photoItem}>
                                        <img
                                          src={getImageUrl(vehicle.document_path) || ''}
                                          alt="Documento"
                                          className={styles.photoThumb}
                                          onClick={(e) => handleImageClick(getImageUrl(vehicle.document_path) || '', e)}
                                        />
                                        <span className={styles.photoLabel}>Documento</span>
                                        <button
                                          className={styles.deletePhotoBtn}
                                          onClick={() => handleDeletePhoto(vehicle.id, 'document')}
                                          disabled={deletingPhoto?.vehicleId === vehicle.id && deletingPhoto?.photoType === 'document'}
                                          title="Excluir foto"
                                        >
                                          {deletingPhoto?.vehicleId === vehicle.id && deletingPhoto?.photoType === 'document' ? '⏳' : '🗑️'}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        <div style={{ marginBottom: '10px', fontSize: '16px' }}>🚗 Nenhum veículo associado a este leilão</div>
                        <button className={styles.primaryButton} onClick={handleAddVehicle}>
                          ➕ Adicionar Veículo
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showEditModal && (
          <EditAuctionModal
            auction={auction}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => {
              setShowEditModal(false);
              fetchAuctionDetails(id as string);
            }}
          />
        )}

        {showPrintModal && (
          <AuctionPrintModal
            auctionId={id as string}
            onClose={() => setShowPrintModal(false)}
          />
        )}
      </main>
    </>
  );
}
