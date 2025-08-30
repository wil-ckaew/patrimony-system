// components/PatrimonyForm.tsx
import React, { useState, useEffect } from 'react';
import { PatrimonyItem } from '../types/Patrimony';

interface PatrimonyFormProps {
  item?: PatrimonyItem | null;
  onClose: () => void;
  onRefresh: () => void;
}

export default function PatrimonyForm({ item, onClose, onRefresh }: PatrimonyFormProps) {
  const [formData, setFormData] = useState({
    plate: '',
    name: '',
    description: '',
    acquisition_date: '',
    value: '',
    department: '',
    status: 'active'
  });
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        plate: item.plate,
        name: item.name,
        description: item.description,
        acquisition_date: item.acquisitionDate.split('T')[0],
        value: item.value.toString(),
        department: item.department,
        status: item.status
      });
      if (item.imageUrl) {
        setPreviewUrl(item.imageUrl);
      }
    }
  }, [item]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadImageToServer = async (patrimonyId: string, imageFile: File): Promise<boolean> => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await fetch(`http://localhost:8080/api/patrimony/${patrimonyId}/image`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Imagem enviada com sucesso:', result);
        return true;
      } else {
        console.error('❌ Erro ao enviar imagem:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('❌ Erro no upload da imagem:', error);
      return false;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const patrimonyData = {
        plate: formData.plate,
        name: formData.name,
        description: formData.description,
        acquisition_date: formData.acquisition_date,
        value: parseFloat(formData.value) || 0,
        department: formData.department,
        status: formData.status
      };

      console.log('📤 Enviando dados para o backend:', patrimonyData);

      const url = item 
        ? `http://localhost:8080/api/patrimony/${item.id}`
        : 'http://localhost:8080/api/patrimony';
      
      const method = item ? 'PUT' : 'POST';
      
      console.log('🌐 Fazendo requisição para:', url, 'Método:', method);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patrimonyData),
      });

      console.log('📥 Resposta recebida. Status:', response.status, response.statusText);

      let responseData;
      try {
        const responseText = await response.text();
        console.log('📄 Conteúdo da resposta:', responseText);
        
        if (responseText) {
          responseData = JSON.parse(responseText);
          console.log('📊 Resposta parseada:', responseData);
        }
      } catch (jsonError) {
        console.error('❌ Erro ao parsear resposta JSON:', jsonError);
      }

      if (response.ok) {
        console.log('✅ Bem salvo com sucesso!');
        
        if (image) {
          const patrimonyId = responseData?.id || item?.id;
          if (patrimonyId) {
            console.log('📤 Enviando imagem para o patrimônio:', patrimonyId);
            const imageUploadSuccess = await uploadImageToServer(patrimonyId, image);
            if (!imageUploadSuccess) {
              alert('Bem salvo, mas houve erro no upload da imagem.');
            }
          }
        }
        
        onRefresh(); // ✅ Chama a função para atualizar a lista
        onClose();
      } else {
        console.error('❌ Erro na resposta:', response.status, responseData);
        const errorMessage = responseData?.error || 
                            responseData?.message || 
                            responseData?.details ||
                            `Erro ${response.status}: ${response.statusText}`;
        alert(`Erro ao salvar o bem: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Erro de conexão:', error);
      alert('Erro de conexão ao salvar o bem. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    } as React.CSSProperties,
    modal: {
      background: 'white',
      borderRadius: '8px',
      padding: '20px',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '90vh',
      overflowY: 'auto'
    } as React.CSSProperties,
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      borderBottom: '1px solid #eee',
      paddingBottom: '15px'
    } as React.CSSProperties,
    modalHeaderH2: {
      margin: 0
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      padding: 0,
      width: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    } as React.CSSProperties,
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    } as React.CSSProperties,
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '15px'
    } as React.CSSProperties,
    formGroup: {
      display: 'flex',
      flexDirection: 'column'
    } as React.CSSProperties,
    formLabel: {
      marginBottom: '5px',
      fontWeight: 'bold',
      color: '#333'
    },
    formInput: {
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px'
    } as React.CSSProperties,
    formTextarea: {
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      resize: 'vertical',
      minHeight: '80px'
    } as React.CSSProperties,
    imagePreview: {
      marginTop: '10px'
    },
    imagePreviewImg: {
      maxWidth: '100%',
      maxHeight: '200px',
      borderRadius: '4px'
    },
    formActions: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end',
      marginTop: '20px'
    } as React.CSSProperties,
    formButton: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px'
    } as React.CSSProperties,
    cancelButton: {
      background: '#6c757d',
      color: 'white'
    },
    submitButton: {
      background: '#007bff',
      color: 'white'
    },
    disabledButton: {
      opacity: 0.6,
      cursor: 'not-allowed'
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalHeaderH2}>{item ? 'Editar Bem' : 'Novo Bem'}</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label htmlFor="plate" style={styles.formLabel}>Placa de Patrimônio*</label>
              <input
                type="text"
                id="plate"
                name="plate"
                value={formData.plate}
                onChange={handleInputChange}
                required
                style={styles.formInput}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label htmlFor="name" style={styles.formLabel}>Nome do Bem*</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={styles.formInput}
              />
            </div>
          </div>
          
          <div style={styles.formGroup}>
            <label htmlFor="description" style={styles.formLabel}>Descrição</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              style={styles.formTextarea}
            />
          </div>
          
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label htmlFor="acquisition_date" style={styles.formLabel}>Data de Aquisição</label>
              <input
                type="date"
                id="acquisition_date"
                name="acquisition_date"
                value={formData.acquisition_date}
                onChange={handleInputChange}
                style={styles.formInput}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label htmlFor="value" style={styles.formLabel}>Valor (R$)</label>
              <input
                type="number"
                id="value"
                name="value"
                step="0.01"
                value={formData.value}
                onChange={handleInputChange}
                style={styles.formInput}
              />
            </div>
          </div>
          
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label htmlFor="department" style={styles.formLabel}>Secretaria/Setor*</label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
                style={styles.formInput}
              >
                <option value="">Selecione um setor</option>
                <option value="education">Educação</option>
                <option value="health">Saúde</option>
                <option value="administration">Administração</option>
                <option value="urbanism">Urbanismo</option>
                <option value="culture">Cultura</option>
                <option value="sports">Esportes</option>
                <option value="transportation">Transporte</option>
              </select>
            </div>
            
            <div style={styles.formGroup}>
              <label htmlFor="status" style={styles.formLabel}>Status*</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                style={styles.formInput}
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="maintenance">Manutenção</option>
                <option value="written_off">Baixado</option>
              </select>
            </div>
          </div>
          
          <div style={styles.formGroup}>
            <label htmlFor="image" style={styles.formLabel}>Foto do Bem</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              style={styles.formInput}
            />
            {previewUrl && (
              <div style={styles.imagePreview}>
                <img src={previewUrl} alt="Preview" style={styles.imagePreviewImg} />
                {uploadingImage && <p>Enviando imagem...</p>}
              </div>
            )}
          </div>
          
          <div style={styles.formActions}>
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading || uploadingImage}
              style={{
                ...styles.formButton,
                ...styles.cancelButton,
                ...((loading || uploadingImage) ? styles.disabledButton : {})
              }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading || uploadingImage}
              style={{
                ...styles.formButton,
                ...styles.submitButton,
                ...((loading || uploadingImage) ? styles.disabledButton : {})
              }}
            >
              {loading ? 'Salvando...' : uploadingImage ? 'Enviando imagem...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}