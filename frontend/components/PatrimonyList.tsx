// components/PatrimonyList.tsx

import React, { useState, useEffect } from 'react';
import { PatrimonyItem } from '../types/Patrimony';
import styles from './PatrimonyList.module.css';
import { getAuthHeaders, handleAuthError } from '../utils/auth';
import { getDepartmentName } from '../utils/departments';

interface PatrimonyListProps {
  onEdit: (item: PatrimonyItem) => void;
  onTransfer: (item: PatrimonyItem) => void;
  refreshTrigger: number;
  searchQuery: string;
  currentPage: number;
  itemsPerPage: number;
  onTotalItemsChange: (total: number) => void;
}

export default function PatrimonyList({ 
  onEdit, 
  onTransfer, 
  refreshTrigger, 
  searchQuery,
  currentPage,
  itemsPerPage,
  onTotalItemsChange
}: PatrimonyListProps) {
  const [patrimonies, setPatrimonies] = useState<PatrimonyItem[]>([]);
  const [allPatrimonies, setAllPatrimonies] = useState<PatrimonyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPatrimonies();
  }, [refreshTrigger, searchQuery]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPatrimonies(allPatrimonies.slice(startIndex, endIndex));
    onTotalItemsChange(allPatrimonies.length);
  }, [allPatrimonies, currentPage, itemsPerPage, onTotalItemsChange]);

  const getStatusName = (status: string) => {
    const statusNames: { [key: string]: string } = {
      'active': 'Ativo',
      'inactive': 'Inativo',
      'maintenance': 'Manutenção',
      'written_off': 'Baixado'
    };
    return statusNames[status] || status;
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active': return styles.statusActive;
      case 'inactive': return styles.statusInactive;
      case 'maintenance': return styles.statusMaintenance;
      case 'written_off': return styles.statusWrittenOff;
      default: return '';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const fetchPatrimonies = async () => {
    try {
      setLoading(true);
      setError('');
  
      const params = new URLSearchParams();
      
      if (searchQuery && searchQuery.trim()) {
        params.append('search', searchQuery.trim());
        console.log('🔍 Buscando por:', searchQuery);
      }

      const url = `http://localhost:8080/api/patrimony${params.toString() ? `?${params.toString()}` : ''}`;
      
      console.log('🔍 URL completa:', url);
      
      let headers;
      try {
        headers = getAuthHeaders();
      } catch (e: any) {
        console.warn('authentication header error', e.message);
        setError('Usuário não autenticado. Faça login novamente.');
        return;
      }

      const fetchResponse = await fetch(url, { headers });
  
      console.log('📥 Response status:', fetchResponse.status);
  
      if (handleAuthError(fetchResponse)) return;
  
      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        console.error('❌ Server error:', errorText);
        throw new Error(`Erro do servidor: ${fetchResponse.status} - ${errorText}`);
      }
  
      const data = await fetchResponse.json();
      console.log('✅ Data received:', data.length, 'items');
      
      const mappedData = data.map((item: any) => ({
        id: item.id,
        plate: item.plate,
        name: item.name,
        description: item.description,
        acquisitionDate: item.acquisition_date,
        value: item.value || 0,
        department: item.department,
        status: item.status,
        invoiceNumber: item.invoice_number || undefined,
        commitmentNumber: item.commitment_number || undefined,
        denfSeNumber: item.denf_se_number || undefined,
        invoiceFile: item.invoice_file || undefined,
        commitmentFile: item.commitment_file || undefined,
        denfSeFile: item.denf_se_file || undefined,
        imageUrl: item.image_url || undefined,
        sector: item.sector,
        nfIssueDate: item.nf_issue_date,
        supplier: item.supplier,
        isVehicle: item.is_vehicle || false,
        // ✅ NOVOS CAMPOS DA FROTA
        fleetNumber: item.fleet_number || undefined,
        fleetNotes: item.fleet_notes || undefined,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      })) as PatrimonyItem[];
  
      setAllPatrimonies(mappedData);
    } catch (error) {
      console.error('Error fetching patrimonies:', error);
      setError('Erro ao carregar os dados. Verifique se o servidor está rodando ou se você está autenticado.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este bem?')) return;
  
    try {
      const deleteResponse = await fetch(`http://localhost:8080/api/patrimony/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
  
      if (deleteResponse.ok) {
        fetchPatrimonies();
      } else if (handleAuthError(deleteResponse)) {
        return;
      } else {
        const errorText = await deleteResponse.text();
        alert(`Erro ao excluir o bem: ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting patrimony:', error);
      alert('Erro ao excluir o bem');
    }
  };
  
  const handleImageClick = (imageUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImage(imageUrl);
  };
  
  const handleDocumentClick = (documentUrl: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (documentUrl) {
      const baseUrl = 'http://localhost:8080';
      const fullUrl = documentUrl.startsWith('/') ? `${baseUrl}${documentUrl}` : `${baseUrl}/${documentUrl}`;
      window.open(fullUrl, '_blank');
    }
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const toggleExpand = (id: string) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(id)) {
      newExpandedItems.delete(id);
    } else {
      newExpandedItems.add(id);
    }
    setExpandedItems(newExpandedItems);
  };

  if (loading) return <div className={styles.loading}>Carregando...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.patrimonyList}>
      {selectedImage && (
        <div className={styles.imageModal} onClick={closeImageModal}>
          <div className={styles.imageModalContent} onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Visualização ampliada" className={styles.imageModalImg} />
            <button className={styles.imageModalClose} onClick={closeImageModal}>×</button>
          </div>
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.patrimonyTable}>
          <thead>
            <tr>
              <th>Veículo?</th>
              <th>Nome</th>
              <th>Placa</th>
              <th>Departamento</th>
              <th>Setor</th>
              <th>Frota</th>          {/* ✅ NOVO */}
              <th>Status</th>
              <th>Valor</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {patrimonies.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.emptyState}>
                  {searchQuery 
                    ? `Nenhum bem patrimonial encontrado para "${searchQuery}".` 
                    : 'Nenhum bem patrimonial encontrado.'
                  }
                </td>
              </tr>
            ) : (
              patrimonies.map((item, index) => {
                const isExpanded = expandedItems.has(item.id);
                const imageFullUrl = item.imageUrl 
                  ? (item.imageUrl.startsWith('http') ? item.imageUrl : `http://localhost:8080${item.imageUrl.startsWith('/') ? '' : '/'}${item.imageUrl}`)
                  : null;
                const rowClass = index % 2 === 0 ? styles.evenRow : styles.oddRow;

                return (
                  <React.Fragment key={item.id}>
                    <tr 
                      className={`${styles.tableRow} ${rowClass} ${isExpanded ? styles.expanded : ''}`}
                      onClick={() => toggleExpand(item.id)}
                    >
                      <td>{item.isVehicle ? '🚗' : ''}</td>
                      <td className={styles.nameCell}>
                        <div className={styles.nameContainer}>
                          <span className={styles.itemName}>{item.name}</span>
                          <span className={styles.expandIndicator}>{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </td>
                      <td>{item.plate}</td>
                      <td>{getDepartmentName(item.department)}</td>
                      <td>{item.sector || 'N/A'}</td>
                      <td>
                        {item.fleetNumber ? (
                          <span className={styles.fleetBadge}>
                            🚛 {item.fleetNumber}
                          </span>
                        ) : (
                          <span className={styles.emptyValue}>-</span>
                        )}
                      </td>
                      <td>
                        <span className={`${styles.status} ${getStatusClass(item.status)}`}>
                          {getStatusName(item.status)}
                        </span>
                      </td>
                      <td>R$ {item.value.toFixed(2)}</td>
                      <td>
                        <div className={styles.rowActions}>
                          <button 
                            className={`${styles.actionButton} ${styles.editButton}`} 
                            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button 
                            className={`${styles.actionButton} ${styles.transferButton}`} 
                            onClick={(e) => { e.stopPropagation(); onTransfer(item); }}
                            title="Transferir"
                          >
                            🔄
                          </button>
                          <button 
                            className={`${styles.actionButton} ${styles.deleteButton}`} 
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                            title="Excluir"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className={`${styles.expandedRow} ${rowClass}`}>
                        <td colSpan={9}>
                          <div className={styles.expandedContent}>
                            <div className={styles.imageSection}>
                              {imageFullUrl ? (
                                <>
                                  <img 
                                    src={imageFullUrl} 
                                    alt={item.name} 
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
                                <div className={styles.noImage}><span>📷 Sem imagem disponível</span></div>
                              )}
                              
                              <div className={styles.patrimonyNumberHighlight}>
                                <span className={styles.patrimonyNumberLabel}>Nº do Patrimonio</span>
                                <strong className={styles.patrimonyNumberValue}>{item.plate}</strong>
                              </div>
                            </div>

                            <div className={styles.detailsGrid}>
                              <div className={styles.detailItem}>
                                <strong>📅 Data de aquisição:</strong> {formatDate(item.acquisitionDate)}
                              </div>
                              
                              <div className={styles.organizationalSection}>
                                <h4 className={styles.sectionTitle}>🏛️ Informações Organizacionais</h4>
                                <div className={styles.organizationalGrid}>
                                  <div className={styles.orgDetail}>
                                    <strong>Departamento:</strong> {getDepartmentName(item.department)}
                                  </div>
                                  
                                  {item.sector && (
                                    <div className={styles.orgDetail}>
                                      <strong>Setor:</strong> 
                                      <span className={styles.sectorBadge}>{item.sector}</span>
                                    </div>
                                  )}
                                  
                                  {item.supplier && (
                                    <div className={styles.orgDetail}>
                                      <strong>Fornecedor:</strong> {item.supplier}
                                    </div>
                                  )}

                                  {/* ✅ INFORMAÇÕES DA FROTA */}
                                  {item.fleetNumber && (
                                    <div className={styles.orgDetail}>
                                      <strong>🚛 Frota:</strong> 
                                      <span className={styles.fleetBadge}>{item.fleetNumber}</span>
                                    </div>
                                  )}

                                  {item.fleetNotes && (
                                    <div className={styles.orgDetail}>
                                      <strong>📝 Obs. Frota:</strong> 
                                      <span className={styles.fleetNotesText}>{item.fleetNotes}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className={styles.fiscalSection}>
                                <h4 className={styles.sectionTitle}>📋 Informações Fiscais</h4>
                                <div className={styles.fiscalGrid}>
                                  {item.nfIssueDate && (
                                    <div className={styles.fiscalDetail}>
                                      <strong>Data emissão NF:</strong> {formatDate(item.nfIssueDate)}
                                    </div>
                                  )}
                                  
                                  {item.invoiceNumber && (
                                    <div className={styles.fiscalDetail}>
                                      <strong>Nº NF:</strong> {item.invoiceNumber}
                                      {item.invoiceFile && (
                                        <button 
                                          className={styles.documentButton}
                                          onClick={(e) => handleDocumentClick(item.invoiceFile, e)}
                                          title="Visualizar Nota Fiscal"
                                        >
                                          📄 Ver NF
                                        </button>
                                      )}
                                    </div>
                                  )}

                                  {item.commitmentNumber && (
                                    <div className={styles.fiscalDetail}>
                                      <strong>Nº Empenho:</strong> {item.commitmentNumber}
                                      {item.commitmentFile && (
                                        <button 
                                          className={styles.documentButton}
                                          onClick={(e) => handleDocumentClick(item.commitmentFile, e)}
                                          title="Visualizar Empenho"
                                        >
                                          📄 Ver Empenho
                                        </button>
                                      )}
                                    </div>
                                  )}

                                  {item.denfSeNumber && (
                                    <div className={styles.fiscalDetail}>
                                      <strong>Nº DENF/SE:</strong> {item.denfSeNumber}
                                      {item.denfSeFile && (
                                        <button 
                                          className={styles.documentButton}
                                          onClick={(e) => handleDocumentClick(item.denfSeFile, e)}
                                          title="Visualizar DENF/SE"
                                        >
                                          📄 Ver DENF/SE
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {item.description && (
                                <div className={styles.descriptionItem}>
                                  <strong>📝 Descrição:</strong>
                                  <p className={styles.descriptionText}>{item.description}</p>
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
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}