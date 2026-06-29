// components/PatrimonyList.tsx
import React, { useState, useEffect } from 'react';
import { PatrimonyItem } from '../types/Patrimony';
import styles from './PatrimonyList.module.css';

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
      
      const params = new URLSearchParams();
      if (filter.department) params.append('department', filter.department);
      if (filter.status) params.append('status', filter.status);
      
      const url = `http://localhost:8080/api/patrimony${params.toString() ? `?${params.toString()}` : ''}`;
      
      console.log('Fetching URL:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      
      const mappedData = data.map((item: any) => ({
        id: item.id,
        plate: item.plate,
        name: item.name,
        description: item.description,
        acquisitionDate: item.acquisition_date,
        value: item.value || 0,
        department: item.department,
        status: item.status,
        imageUrl: item.image_url,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      })) as PatrimonyItem[];
      
      console.log('Mapped data:', mappedData);
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
      const response = await fetch(`http://localhost:8080/api/patrimony/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchPatrimonies();
      } else {
        alert('Erro ao excluir o bem');
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
            <button className={styles.imageModalClose} onClick={closeImageModal}>
              ×
            </button>
          </div>
        </div>
      )}

      <div className={styles.filters}>
        <select 
          value={filter.department} 
          onChange={(e) => setFilter({...filter, department: e.target.value})}
          className={styles.filterSelect}
        >
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
        
        <select 
          value={filter.status} 
          onChange={(e) => setFilter({...filter, status: e.target.value})}
          className={styles.filterSelect}
        >
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
          <option value="maintenance">Manutenção</option>
          <option value="written_off">Baixado</option>
        </select>

        <button onClick={fetchPatrimonies} className={styles.refreshButton}>
          Atualizar
        </button>
      </div>
      
      <div className={styles.list}>
        {patrimonies.length === 0 && !loading ? (
          <div className={styles.emptyState}>
            Nenhum bem patrimonial encontrado.
          </div>
        ) : (
          patrimonies.map(item => (
            <div key={item.id} className={styles.patrimonyCard}>
              {/* Cabeçalho clicável */}
              <div 
                className={styles.cardHeader} 
                onClick={() => toggleExpand(item.id)}
                style={{cursor: 'pointer'}}
              >
                <h3 className={styles.detailsH3}>
                  {item.name}
                  <span className={`${styles.status} ${getStatusClass(item.status)}`}>
                    {getStatusName(item.status)}
                  </span>
                </h3>
                <p className={styles.detailsP}><strong>Placa:</strong> {item.plate}</p>
                <p className={styles.detailsP}><strong>Departamento:</strong> {getDepartmentName(item.department)}</p>
              </div>
              
              {/* Conteúdo expansível */}
              {expandedItems.has(item.id) && (
                <div className={styles.expandedContent}>
                  {/* Seção da imagem */}
                  {item.imageUrl && (
                    <div className={styles.imageSection}>
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className={styles.patrimonyImage}
                        onClick={(e) => handleImageClick(item.imageUrl!, e)}
                      />
                      <button 
                        className={styles.viewImageButton}
                        onClick={(e) => handleImageClick(item.imageUrl!, e)}
                      >
                        Ampliar imagem
                      </button>
                    </div>
                  )}
                  
                  <div className={styles.details}>
                    <p className={styles.detailsP}><strong>Valor:</strong> R$ {item.value.toFixed(2)}</p>
                    <p className={styles.detailsP}><strong>Data de aquisição:</strong> {new Date(item.acquisitionDate).toLocaleDateString('pt-BR')}</p>
                    
                    {/* Descrição */}
                    {item.description && (
                      <div className={styles.descriptionSection}>
                        <p className={styles.descriptionText}>
                          <strong>Descrição:</strong> {item.description}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.actions}>
                    <button 
                      className={`${styles.actionButton} ${styles.editButton}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item);
                      }}
                    >
                      Editar
                    </button>
                    <button 
                      className={`${styles.actionButton} ${styles.transferButton}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTransfer(item);
                      }}
                    >
                      Transferir
                    </button>
                    <button 
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}