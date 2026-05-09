//frontend/components/FleetForm.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { FleetItem, FleetFormData, PatrimonyItem } from '../types/Patrimony';
import styles from './FleetForm.module.css';
import { getAuthHeaders, handleAuthError } from '../utils/auth';

interface FleetFormProps {
  item: FleetItem | null;
  onClose: () => void;
  onRefresh: () => void;
}

const emptyForm: FleetFormData = {
  fleetNumber: '',
  patrimonyId: '',
  department: '',
  notes: '',
};

// ✅ ADICIONE ESTE MAPEAMENTO
const departmentTranslation: { [key: string]: string } = {
  // Saúde
  'health': 'Saúde',
  'saude': 'Saúde',
  
  // Educação
  'education': 'Educação',
  'educacao': 'Educação',
  
  // Infraestrutura
  'infrastructure': 'Infraestrutura',
  'infraestrutura': 'Infraestrutura',
  
  // Segurança
  'security': 'Segurança',
  'seguranca': 'Segurança',
  
  // Administração
  'administration': 'Administração',
  'administracao': 'Administração',
  
  // Finanças
  'finance': 'Finanças',
  'financas': 'Finanças',
  
  // Transporte
  'transport': 'Transporte',
  'transporte': 'Transporte',
  
  // Cultura
  'culture': 'Cultura',
  'cultura': 'Cultura',
  
  // Esportes
  'sports': 'Esportes',
  'esportes': 'Esportes',
  
  // Assistência Social
  'social': 'Assistência Social',
  'social assistance': 'Assistência Social',
  'assistencia social': 'Assistência Social',
  
  // Meio Ambiente
  'environment': 'Meio Ambiente',
  'meio ambiente': 'Meio Ambiente',
  
  // Turismo
  'tourism': 'Turismo',
  'turismo': 'Turismo',
  
  // Agricultura
  'agriculture': 'Agricultura',
  'agricultura': 'Agricultura',
  
  // Urbanismo
  'urbanism': 'Urbanismo',
  'urbanismo': 'Urbanismo',
  
  // Habitação
  'housing': 'Habitação',
  'habitacao': 'Habitação',
  
  // Obras
  'works': 'Obras',
  'obras': 'Obras',
  
  // Planejamento
  'planning': 'Planejamento',
  'planejamento': 'Planejamento',
  
  // Governo
  'government': 'Governo',
  'governo': 'Governo',
  
  // Comunicação
  'communication': 'Comunicação',
  'comunicacao': 'Comunicação',
  
  // Tecnologia
  'technology': 'Tecnologia',
  'tecnologia': 'Tecnologia',
  
  // Recursos Humanos
  'hr': 'Recursos Humanos',
  'human resources': 'Recursos Humanos',
  'recursos humanos': 'Recursos Humanos',
  
  // Jurídico
  'legal': 'Jurídico',
  'juridico': 'Jurídico',
  
  // Compras
  'procurement': 'Compras',
  'compras': 'Compras',
  
  // Controle Interno
  'internal_control': 'Controle Interno',
  'controle interno': 'Controle Interno',
  
  // Procuradoria
  'prosecutor': 'Procuradoria',
  'procuradoria': 'Procuradoria',
  
  // Ouvidoria
  'ombudsman': 'Ouvidoria',
  'ouvidoria': 'Ouvidoria',
  
  // Gestão de Pessoas
  'people_management': 'Gestão de Pessoas',
  'gestao de pessoas': 'Gestão de Pessoas',
  
  // Modernização
  'modernization': 'Modernização',
  'modernizacao': 'Modernização',
  
  // Parcerias
  'partnerships': 'Parcerias',
  'parcerias': 'Parcerias',
  
  // Projetos Especiais
  'special_projects': 'Projetos Especiais',
  'projetos especiais': 'Projetos Especiais',
};

// ✅ FUNÇÃO PARA TRADUZIR DEPARTAMENTO
const translateDepartment = (dept: string): string => {
  const lowerKey = dept.toLowerCase().trim();
  return departmentTranslation[lowerKey] || dept;
};

export default function FleetForm({ item, onClose, onRefresh }: FleetFormProps) {
  const [formData, setFormData] = useState<FleetFormData>(emptyForm);
  const [vehicles, setVehicles] = useState<PatrimonyItem[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDepartments();
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (item) {
      setFormData({
        fleetNumber: item.fleet_number,
        patrimonyId: item.patrimony_id,
        department: item.department,
        notes: item.notes || '',
      });
    } else {
      setFormData(emptyForm);
      setVehicleSearch('');
    }
  }, [item]);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === formData.patrimonyId),
    [vehicles, formData.patrimonyId]
  );

  const filteredVehicles = useMemo(() => {
    const query = vehicleSearch.trim().toLowerCase();
    if (!query) return vehicles;
    return vehicles.filter((vehicle) =>
      vehicle.plate.toLowerCase().includes(query) ||
      vehicle.name.toLowerCase().includes(query) ||
      vehicle.description?.toLowerCase().includes(query)
    );
  }, [vehicles, vehicleSearch]);

  useEffect(() => {
    if (item && selectedVehicle) {
      setVehicleSearch(`${selectedVehicle.plate} — ${selectedVehicle.name}`);
    }
  }, [item, selectedVehicle]);

  // ✅ MODIFIQUE ESTA FUNÇÃO PARA TRADUZIR OS DEPARTAMENTOS
  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/departments', {
        headers: getAuthHeaders(),
      });
      if (handleAuthError(response)) return;
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Departamentos originais:', data);
        
        // Garantir que data é um array de strings
        const departmentsList = Array.isArray(data) ? data : [];
        
        // Traduzir os departamentos
        const translatedDepartments = departmentsList.map((dept: string) => translateDepartment(dept));
        
        // Remover duplicatas
        const uniqueDepartments = Array.from(new Set(translatedDepartments));
        
        // Ordenar alfabeticamente em português
        const sortedDepartments = uniqueDepartments.sort((a: string, b: string) => 
          a.localeCompare(b, 'pt-BR')
        );
        
        console.log('📋 Departamentos traduzidos:', sortedDepartments);
        setDepartments(sortedDepartments);
      }
    } catch (err) {
      console.error('Erro ao buscar departamentos:', err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/patrimony?is_vehicle=true', {
        headers: getAuthHeaders(),
      });
      if (handleAuthError(response)) return;
      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (field: keyof FleetFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.patrimonyId) {
      setError('Selecione um veículo patrimonial antes de salvar.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const endpoint = item ? `http://localhost:8080/api/fleet/${item.id}` : 'http://localhost:8080/api/fleet';
      const method = item ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fleet_number: formData.fleetNumber,
          patrimony_id: formData.patrimonyId,
          department: formData.department,
          notes: formData.notes || null,
        }),
      });

      if (handleAuthError(response)) return;
      if (!response.ok) {
        const errorText = await response.text();
        setError(errorText || 'Falha ao salvar frota');
        return;
      }

      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar os dados da frota');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <p className={styles.badge}>Frota</p>
            <h2>{item ? 'Editar registro de frota' : 'Cadastrar novo registro de frota'}</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label>Número da frota</label>
            <input
              type="text"
              value={formData.fleetNumber}
              onChange={(e) => handleChange('fleetNumber', e.target.value)}
              placeholder="Ex: FRT-001"
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label>Buscar veículo patrimonial</label>
            <input
              type="text"
              value={vehicleSearch}
              onChange={(e) => setVehicleSearch(e.target.value)}
              placeholder="Digite placa, nome ou descrição do veículo"
            />
            <div className={styles.searchHelper}>Selecione o veículo desejado abaixo.</div>
            <div className={styles.vehicleOptions}>
              {filteredVehicles.length === 0 ? (
                <div className={styles.emptyOption}>Nenhum veículo encontrado.</div>
              ) : (
                filteredVehicles.slice(0, 4).map((vehicle) => (
                  <button
                    type="button"
                    key={vehicle.id}
                    className={`${styles.vehicleOption} ${vehicle.id === formData.patrimonyId ? styles.vehicleOptionActive : ''}`}
                    onClick={() => {
                      handleChange('patrimonyId', vehicle.id);
                      setVehicleSearch(`${vehicle.plate} — ${vehicle.name} — ${vehicle.description || 'Sem descrição'}`);
                    }}
                  >
                    <div className={styles.vehicleInfo}>
                      <strong>{vehicle.plate}</strong>
                      <span>{vehicle.name}</span>
                      <small className={styles.vehicleDescription}>{vehicle.description || 'Sem descrição'}</small>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {selectedVehicle && (
            <div className={styles.sidecar}>
              <div>
                <strong>{selectedVehicle.name}</strong>
                <p>{selectedVehicle.description}</p>
              </div>
              <div className={styles.metaList}>
                <span>Placa: {selectedVehicle.plate || 'N/A'}</span>
                <span>Setor: {selectedVehicle.sector || 'N/A'}</span>
                <span>Status: {selectedVehicle.status}</span>
              </div>
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label>Secretaria / Departamento</label>
            <select
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              required
            >
              <option value="">Selecione a secretaria</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label>Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              placeholder="Anotações sobre este veículo ou sua frota"
            />
          </div>

          {error && <div className={styles.errorText}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" className={styles.buttonSecondary} onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className={styles.buttonPrimary} disabled={loading}>
              {loading ? 'Salvando...' : item ? 'Salvar alterações' : 'Cadastrar frota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}