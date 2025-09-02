// components/PatrimonyList.tsx
import React, { useState, useEffect } from 'react';
import { PatrimonyItem } from '../types/Patrimony';
import styles from './PatrimonyList.module.css';
import { getAuthHeaders, handleAuthError } from '../utils/auth';

interface PatrimonyListProps {
  onEdit: (item: PatrimonyItem) => void;
  onTransfer: (item: PatrimonyItem) => void;
  refreshTrigger: number;
}

export default function PatrimonyList({ onEdit, onTransfer, refreshTrigger }: PatrimonyListProps) {
  const [patrimonies, setPatrimonies] = useState<PatrimonyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState({ department: '', status: '' });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPatrimonies();
  }, [refreshTrigger, filter]);

  const getDepartmentName = (dept: string) => {
    const departmentNames: { [key: string]: string } = {
      'education': 'Educação',
      'health': 'Saúde',
      'administration': 'Administração',
      'urbanism': 'Urbanismo',
      'culture': 'Cultura',
      'sports': 'Esportes',
      'transportation': 'Transporte',
      'finance': 'Finanças',
      'tourism': 'Turismo',
      'environment': 'Meio Ambiente'
    };
    return departmentNames[dept] || dept;
  };

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

  const fetchPatrimonies = async () => {
    try {
      setLoading(true);
      setError('');
  
      // ✅ Move o import para o topo do arquivo, fora da função
      // import { getAuthHeaders, handleAuthError } from '../utils/auth';
  
      const params = new URLSearchParams();
      if (filter.department) params.append('department', filter.department);
      if (filter.status) params.append('status', filter.status);
  
      const url = `http://localhost:8080/api/patrimony${params.toString() ? `?${params.toString()}` : ''}`;
      
      console.log('🔍 Fetching patrimonies from:', url);
      
      // ✅ Use getAuthHeaders() e renomeie a variável para evitar conflito
      const fetchResponse = await fetch(url, {
        headers: getAuthHeaders()
      });
  
      console.log('📥 Response status:', fetchResponse.status);
  
      // ✅ Use handleAuthError() para tratamento consistente
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
        createdAt: item.created_at,
        updatedAt: item.updated_at
      })) as PatrimonyItem[];
  
      setPatrimonies(mappedData);
    } catch (error) {
      console.error('Error fetching patrimonies:', error);
      setError('Erro ao carregar os dados. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este bem?')) return;
  
    try {
      // ✅ Use getAuthHeaders() e renomeie a variável
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
      window.open(`http://localhost:8080${documentUrl}`, '_blank');
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
      {/* Modal para imagem ampliada */}
      {selectedImage && (
        <div className={styles.imageModal} onClick={closeImageModal}>
          <div className={styles.imageModalContent} onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Visualização ampliada" className={styles.imageModalImg} />
            <button className={styles.imageModalClose} onClick={closeImageModal}>×</button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className={styles.filters}>
        <select value={filter.department} onChange={(e) => setFilter({...filter, department: e.target.value})} className={styles.filterSelect}>
          <option value="">Todos os departamentos</option>
          <option value="education">Educação</option>
          <option value="health">Saúde</option>
          <option value="administration">Administração</option>
          <option value="urbanism">Urbanismo</option>
          <option value="culture">Cultura</option>
          <option value="sports">Esportes</option>
          <option value="transportation">Transporte</option>
          <option value="finance">Finanças</option>
          <option value="tourism">Turismo</option>
          <option value="environment">Meio Ambiente</option>
        </select>

        <select value={filter.status} onChange={(e) => setFilter({...filter, status: e.target.value})} className={styles.filterSelect}>
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
          <option value="maintenance">Manutenção</option>
          <option value="written_off">Baixado</option>
        </select>

        <button onClick={fetchPatrimonies} className={styles.refreshButton}>Atualizar</button>
      </div>

      {/* Lista de bens */}
      <div className={styles.list}>
        {patrimonies.length === 0 ? (
          <div className={styles.emptyState}>Nenhum bem patrimonial encontrado.</div>
        ) : (
          patrimonies.map(item => {
            const isExpanded = expandedItems.has(item.id);
            const imageFullUrl = item.imageUrl ? `http://localhost:8080${item.imageUrl.startsWith('/') ? '' : '/'}${item.imageUrl}` : null;

            return (
              <div key={item.id} className={`${styles.patrimonyCard} ${isExpanded ? styles.expanded : ''}`}>
                <div className={styles.cardHeader} onClick={() => toggleExpand(item.id)}>
                  <div className={styles.headerMain}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <span className={`${styles.status} ${getStatusClass(item.status)}`}>{getStatusName(item.status)}</span>
                  </div>
                  <div className={styles.headerDetails}>
                    <p className={styles.detailLine}><strong>Placa:</strong> {item.plate}</p>
                    <p className={styles.detailLine}><strong>Departamento:</strong> {getDepartmentName(item.department)}</p>
                  </div>
                  <div className={styles.expandIndicator}>{isExpanded ? '▲' : '▼'}</div>
                </div>

                {isExpanded && (
                  <div className={styles.expandedContent}>
                    <div className={styles.imageSection}>
                      {imageFullUrl ? (
                        <>
                          <img src={imageFullUrl} alt={item.name} className={styles.patrimonyImage} onClick={(e) => handleImageClick(imageFullUrl, e)} />
                          <button className={styles.viewImageButton} onClick={(e) => handleImageClick(imageFullUrl, e)}>Ampliar imagem</button>
                        </>
                      ) : (
                        <div className={styles.noImage}><span>📷 Sem imagem disponível</span></div>
                      )}
                    </div>

                    <div className={styles.detailsGrid}>
                      <div className={styles.detailItem}><strong>Valor:</strong> R$ {item.value.toFixed(2)}</div>
                      <div className={styles.detailItem}><strong>Data de aquisição:</strong> {new Date(item.acquisitionDate).toLocaleDateString('pt-BR')}</div>
                      
                      {item.invoiceNumber && (
                        <div className={styles.detailItem}>
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
                        <div className={styles.detailItem}>
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
                        <div className={styles.detailItem}>
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

                      {item.description && (
                        <div className={styles.descriptionItem}>
                          <strong>Descrição:</strong>
                          <p className={styles.descriptionText}>{item.description}</p>
                        </div>
                      )}
                    </div>

                    <div className={styles.actions}>
                      <button className={`${styles.actionButton} ${styles.editButton}`} onClick={(e) => { e.stopPropagation(); onEdit(item); }}>Editar</button>
                      <button className={`${styles.actionButton} ${styles.transferButton}`} onClick={(e) => { e.stopPropagation(); onTransfer(item); }}>Transferir</button>
                      <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>Excluir</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}