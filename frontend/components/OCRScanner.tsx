import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

interface OCRScannerProps {
  onDataExtracted: (data: {
    commitmentNumber?: string;
    supplier?: string;
    value?: number;
    issueDate?: string;
    project?: string;
  }) => void;
  onClose: () => void;
}

const OCRScanner: React.FC<OCRScannerProps> = ({ onDataExtracted, onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
      setProgress(Math.floor((i / pdf.numPages) * 100));
    }
    
    return fullText;
  };

  const extractTextFromImage = async (file: File): Promise<string> => {
    const { data } = await Tesseract.recognize(file, 'por', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          setProgress(Math.floor(m.progress * 100));
        }
      },
    });
    return data.text;
  };

  const extractData = async (file: File) => {
    setProcessing(true);
    setProgress(0);
    setError(null);
    setFileName(file.name);

    try {
      let text = '';
      
      if (file.type === 'application/pdf') {
        setImage(null);
        text = await extractTextFromPDF(file);
      } else if (file.type.startsWith('image/')) {
        const imageUrl = URL.createObjectURL(file);
        setImage(imageUrl);
        text = await extractTextFromImage(file);
      } else {
        setError('Formato não suportado. Use PDF, JPG ou PNG.');
        setProcessing(false);
        return;
      }

      if (!text || text.trim().length === 0) {
        setError('Não foi possível extrair texto do arquivo.');
        setProcessing(false);
        return;
      }

      console.log('📄 ========== TEXTO COMPLETO EXTRAÍDO ==========');
      console.log(text);
      console.log('📄 ========== FIM DO TEXTO ==========');

      const result: any = {};

      // ========== 1. NÚMERO DO EMPENHO ==========
      // Buscar "Fonte Rec.:03 661" - o número é o último conjunto de dígitos
      const empenhoPatterns = [
        /Fonte Rec\.:\s*\d{2,4}\s*(\d{2,4})/i,
        /Fonte Rec\.:\s*(\d{2,4})\s+(\d{2,4})/i,
        /Fonte Rec\.:\s*(\d{3,4})/i,
        /EMPENHO\s*:?\s*(\d{3,9})/i
      ];
      for (const pattern of empenhoPatterns) {
        const match = text.match(pattern);
        if (match) {
          // Pega o último grupo de números (o maior)
          let num = match[1] || match[0];
          if (match[2] && match[2].length >= 3) {
            num = match[2];
          }
          if (num && num.length >= 3 && num !== '03' && num !== '00') {
            result.commitmentNumber = num.trim();
            console.log('✅ Número do Empenho:', result.commitmentNumber);
            break;
          }
        }
      }

      // Se não encontrou, buscar números de 3 dígitos após "Fonte Rec"
      if (!result.commitmentNumber) {
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('Fonte Rec')) {
            const numbers = lines[i].match(/\d{3,4}/g);
            if (numbers && numbers.length > 0) {
              // Pega o maior número
              const largest = numbers.reduce((a, b) => a.length >= b.length ? a : b, '');
              if (largest && largest !== '03') {
                result.commitmentNumber = largest;
                console.log('✅ Empenho (fallback):', result.commitmentNumber);
                break;
              }
            }
          }
        }
      }

      // ========== 2. FORNECEDOR ==========
      const supplierPatterns = [
        /FAVORECIDO\s*:?\s*([A-Z][A-Za-zÀ-ÖØ-öø-ÿ\s&.,-]{2,40})/i,
        /FORNECEDOR\s*:?\s*([A-Z][A-Za-zÀ-ÖØ-öø-ÿ\s&.,-]{2,40})/i
      ];
      for (const pattern of supplierPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          result.supplier = match[1].trim();
          console.log('✅ Fornecedor:', result.supplier);
          break;
        }
      }
      
      if (!result.supplier && text.toUpperCase().includes('BRUMA VEICULOS')) {
        result.supplier = 'BRUMA VEICULOS';
        console.log('✅ Fornecedor (específico):', result.supplier);
      }

      // ========== 3. VALOR ==========
      const valorPatterns = [
        /Total\.:\s*R?\$?\s*([\d.,]+)/i,
        /VALOR TOTAL\s*:?\s*R?\$?\s*([\d.,]+)/i,
        /TOTAL\s*:?\s*R?\$?\s*([\d.,]+)/i
      ];
      for (const pattern of valorPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          let rawValue = match[1].replace(/\./g, '').replace(',', '.');
          const numericValue = parseFloat(rawValue);
          if (!isNaN(numericValue) && numericValue > 0) {
            result.value = Math.round(numericValue * 100) / 100;
            console.log('✅ Valor:', result.value);
            break;
          }
        }
      }

      // ========== 4. DATA ==========
      const dataPatterns = [
        /Data Requisição\s*:?\s*(\d{2})\/(\d{2})\/(\d{4})/i,
        /DATA DE EMISSÃO\s*:?\s*(\d{2})\/(\d{2})\/(\d{4})/i
      ];
      for (const pattern of dataPatterns) {
        const match = text.match(pattern);
        if (match && match[1] && match[2] && match[3]) {
          result.issueDate = `${match[3]}-${match[2]}-${match[1]}`;
          console.log('✅ Data:', result.issueDate);
          break;
        }
      }

      // ========== 5. PROJETO/SETOR ==========
      const projectPatterns = [
        /Projeto\s*:[\s\d.]*-\s*([A-Z][A-Za-zÀ-ÖØ-öø-ÿ\s&.,-]{2,50})/i,
        /Destino\s*:[\s\d.]*-\s*([A-Z][A-Za-zÀ-ÖØ-öø-ÿ\s&.,-]{2,50})/i
      ];
      for (const pattern of projectPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          let project = match[1].trim();
          // Limpar "PROJ." do início se houver
          project = project.replace(/^PROJ\.\s*/i, '');
          if (project.length > 5) {
            result.project = project;
            console.log('✅ Projeto/Setor:', result.project);
            break;
          }
        }
      }
      
      // Se não encontrou, buscar linha que contém "BOMBEIROS"
      if (!result.project) {
        const bombeirosMatch = text.match(/CORPO\s+DE\s+BOMBEIROS\s+DE\s+PENAPOLIS/i);
        if (bombeirosMatch) {
          result.project = 'CORPO DE BOMBEIROS DE PENAPOLIS';
          console.log('✅ Projeto/Setor (Bombeiros):', result.project);
        }
      }

      console.log('📋 ========== RESULTADO FINAL ==========');
      console.log(result);
      console.log('📋 =====================================');

      // Mostrar alerta com os dados encontrados
      const summary = [
        result.commitmentNumber ? `📑 Empenho: ${result.commitmentNumber}` : '',
        result.supplier ? `🏢 Fornecedor: ${result.supplier}` : '',
        result.value ? `💰 Valor: R$ ${result.value.toFixed(2)}` : '',
        result.issueDate ? `📅 Data: ${result.issueDate}` : '',
        result.project ? `📍 Projeto/Setor: ${result.project}` : ''
      ].filter(Boolean).join('\n');

      alert(`✅ Documento processado!\n\n${summary || 'Nenhum dado encontrado'}`);

      if (Object.keys(result).length > 0) {
        onDataExtracted(result);
      } else {
        setError('Não foi possível identificar dados no documento.');
      }
      
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro ao processar o arquivo: ' + (err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) extractData(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) extractData(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    },
    modal: {
      background: 'white',
      borderRadius: '20px',
      width: '90%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflow: 'hidden' as const,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 1.5rem',
      borderBottom: '1px solid #e2e8f0',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: 'white',
    },
    content: {
      padding: '2rem',
      minHeight: '300px',
    },
    dropZone: {
      border: '2px dashed #cbd5e1',
      borderRadius: '12px',
      padding: '2rem',
      textAlign: 'center' as const,
      cursor: 'pointer',
    },
    dropZoneIcon: {
      fontSize: '3rem',
      marginBottom: '1rem',
    },
    processing: {
      textAlign: 'center' as const,
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid #e2e8f0',
      borderTopColor: '#667eea',
      borderRadius: '50%',
      margin: '0 auto 1rem',
      animation: 'spin 1s linear infinite',
    },
    progressBar: {
      background: '#e2e8f0',
      borderRadius: '10px',
      height: '8px',
      margin: '1rem 0',
    },
    progressFill: {
      background: 'linear-gradient(90deg, #667eea, #764ba2)',
      height: '100%',
      transition: 'width 0.3s ease',
    },
    error: {
      textAlign: 'center' as const,
      color: '#ef4444',
    },
    retryButton: {
      marginTop: '1rem',
      padding: '0.5rem 1rem',
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
    },
    footer: {
      padding: '1rem 1.5rem',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'flex-end',
    },
    cancelButton: {
      padding: '0.5rem 1rem',
      background: '#64748b',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
    },
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3>📄 Importar Documento Fiscal</h3>
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div style={styles.content}>
          {!processing && !image && !error && (
            <div style={styles.dropZone} onDrop={handleDrop} onDragOver={handleDragOver} onClick={() => fileInputRef.current?.click()}>
              <div style={styles.dropZoneIcon}>📄</div>
              <p>Clique ou arraste o arquivo (PDF da NF ou Empenho)</p>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Formatos: PDF, JPG, PNG</p>
              <input ref={fileInputRef} type="file" accept=".pdf,image/jpeg,image/jpg,image/png" onChange={handleFileChange} style={{ display: 'none' }} />
            </div>
          )}
          {processing && (
            <div style={styles.processing}>
              <div style={styles.spinner}></div>
              <p>Processando {fileName}...</p>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${progress}%` }} />
              </div>
              <p>{progress}%</p>
            </div>
          )}
          {error && (
            <div style={styles.error}>
              <p>❌ {error}</p>
              <button style={styles.retryButton} onClick={() => { setError(null); setImage(null); setFileName(''); }}>Tentar novamente</button>
            </div>
          )}
          {image && !processing && !error && (
            <div style={{ textAlign: 'center' }}>
              <img src={image} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
              <p style={{ color: '#10b981', marginTop: '1rem' }}>✅ Arquivo carregado!</p>
            </div>
          )}
        </div>
        <div style={styles.footer}>
          <button style={styles.cancelButton} onClick={onClose}>Fechar</button>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OCRScanner;
