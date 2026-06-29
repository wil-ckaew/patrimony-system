// components/PdfSigner.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import SignaturePad from 'signature_pad';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfSignerProps {
  onClose: () => void;
  onSigned: (file: File) => void;
}

export default function PdfSigner({ onClose, onSigned }: PdfSignerProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');
  const [signaturePosition, setSignaturePosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [signatureSize, setSignatureSize] = useState(180);
  const [signatureColor, setSignatureColor] = useState('#1e3a8a');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signaturePadImage, setSignaturePadImage] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [pdfRendered, setPdfRendered] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);

  // Cores disponíveis
  const colors = [
    '#1e3a8a', '#1e40af', '#2563eb', '#3b82f6', 
    '#0f172a', '#1e293b', '#334155', '#475569',
    '#991b1b', '#b91c1c', '#dc2626', '#ef4444',
    '#065f46', '#047857', '#059669', '#10b981'
  ];

  // Função auxiliar para converter Uint8Array para ArrayBuffer
  const toArrayBuffer = (uint8Array: Uint8Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(uint8Array.length);
    const view = new Uint8Array(buffer);
    view.set(uint8Array);
    return buffer;
  };

  // Inicializar Signature Pad
  useEffect(() => {
    if (showSignaturePad && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 500;
      canvas.height = 250;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(20, canvas.height / 2);
        ctx.lineTo(canvas.width - 20, canvas.height / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: 'transparent',
        penColor: signatureColor,
        minWidth: 1,
        maxWidth: 3,
      });
    }
  }, [showSignaturePad]);

  // Atualizar cor da assinatura
  useEffect(() => {
    if (signaturePadRef.current) {
      signaturePadRef.current.penColor = signatureColor;
    }
  }, [signatureColor]);

  // Renderizar PDF quando mudar página ou zoom
  useEffect(() => {
    if (pdfData) {
      renderPdfPage(currentPage);
    }
  }, [pdfData, currentPage, zoomLevel]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Por favor, selecione um arquivo PDF válido.');
      return;
    }

    setPdfFile(file);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      setPdfData(uint8Array);
      
      const doc = await PDFDocument.load(arrayBuffer);
      setPdfDoc(doc);
      
      const pages = doc.getPages();
      setTotalPages(pages.length);
      setIsSigning(true);
      setCurrentPage(1);
      setSignaturePosition({ x: 100, y: 100 });
      setPdfRendered(false);
      
    } catch (error) {
      console.error('Erro ao carregar PDF:', error);
      alert('Erro ao carregar o PDF. Tente novamente.');
    }
  };

  const renderPdfPage = async (pageNum: number) => {
    if (!pdfData || !pdfCanvasRef.current) return;
    
    try {
      const canvas = pdfCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;
      
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: zoomLevel / 100 });
      
      const containerWidth = pdfContainerRef.current?.clientWidth || 800;
      const scale = containerWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale: scale * (zoomLevel / 100) });
      
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      
      // Salvar o tamanho do canvas para calcular a posição correta
      setCanvasSize({ width: canvas.width, height: canvas.height });
      
      const renderContext = {
        canvasContext: ctx,
        viewport: scaledViewport,
      };
      
      await page.render(renderContext).promise;
      
      setPdfRendered(true);
      
      // Atualizar posição da assinatura
      setSignaturePosition(prev => ({
        x: Math.min(prev.x, canvas.width - signatureSize - 20),
        y: Math.min(prev.y, canvas.height - signatureSize / 2 - 20)
      }));
      
    } catch (error) {
      console.error('Erro ao renderizar PDF:', error);
      renderFallback();
    }
  };

  const renderFallback = () => {
    const canvas = pdfCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = pdfContainerRef.current?.clientWidth || 800;
    canvas.height = 600;
    setCanvasSize({ width: canvas.width, height: canvas.height });
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`📄 Página ${currentPage}`, canvas.width / 2, 250);
    
    ctx.fillStyle = '#64748b';
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText('PDF carregado com sucesso', canvas.width / 2, 300);
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('Use os controles para navegar e posicionar a assinatura', canvas.width / 2, 340);
    
    if (pdfFile) {
      ctx.fillStyle = '#475569';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(`📎 ${pdfFile.name}`, canvas.width / 2, canvas.height - 30);
    }
  };

  const handleSignatureSave = () => {
    if (signaturePadRef.current) {
      const data = signaturePadRef.current.toDataURL('image/png');
      setSignatureData(data);
      setSignaturePadImage(data);
      setShowSignaturePad(false);
      setIsSigned(true);
    }
  };

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setSignatureData('');
      setSignaturePadImage('');
      setIsSigned(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const overlay = e.currentTarget;
    const rect = overlay.getBoundingClientRect();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && pdfContainerRef.current) {
      const containerRect = pdfContainerRef.current.getBoundingClientRect();
      const canvasRect = pdfCanvasRef.current?.getBoundingClientRect();
      
      if (canvasRect) {
        let newX = e.clientX - containerRect.left - dragOffset.x;
        let newY = e.clientY - containerRect.top - dragOffset.y;
        
        const containerWidth = pdfContainerRef.current.clientWidth || 800;
        const containerHeight = pdfContainerRef.current.clientHeight || 600;
        
        newX = Math.max(10, Math.min(newX, containerWidth - signatureSize - 10));
        newY = Math.max(10, Math.min(newY, containerHeight - signatureSize / 2 - 10));
        
        setSignaturePosition({ x: newX, y: newY });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseInt(e.target.value);
    setZoomLevel(newZoom);
  };

  const handleDownload = async () => {
    if (!pdfFile || !signatureData) {
      alert('Por favor, faça o upload de um PDF e adicione uma assinatura.');
      return;
    }

    setIsDownloading(true);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuffer);
      const pages = doc.getPages();
      
      if (pages.length === 0) {
        alert('O PDF não tem páginas.');
        setIsDownloading(false);
        return;
      }
      
      const page = pages[currentPage - 1];
      const { width, height } = page.getSize();

      // Carregar a assinatura
      const signatureResponse = await fetch(signatureData);
      const signatureBlob = await signatureResponse.blob();
      const signatureArrayBuffer = await signatureBlob.arrayBuffer();
      const pngImage = await doc.embedPng(signatureArrayBuffer);

      // Calcular posição correta da assinatura
      const scale = signatureSize / 180;
      
      // Usar o tamanho real do canvas para calcular a posição
      const canvasW = canvasSize.width || 800;
      const canvasH = canvasSize.height || 600;
      
      // Posição da assinatura no canvas (em pixels)
      const sigX = signaturePosition.x;
      const sigY = signaturePosition.y;
      
      // Converter para coordenadas do PDF
      const pdfX = (sigX / canvasW) * width;
      const pdfY = (sigY / canvasH) * height;

      console.log('Canvas:', canvasW, canvasH);
      console.log('PDF:', width, height);
      console.log('Posição canvas:', sigX, sigY);
      console.log('Posição PDF:', pdfX, pdfY);

      // Desenhar a assinatura
      page.drawImage(pngImage, {
        x: pdfX,
        y: pdfY,
        width: 180 * scale,
        height: 90 * scale,
        opacity: 1,
      });

      // Adicionar data e hora
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR');
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const text = `Assinado digitalmente em: ${dateStr} às ${timeStr}`;

      page.drawText(text, {
        x: pdfX,
        y: pdfY - 35,
        size: 10,
        color: rgb(0.3, 0.3, 0.3),
      });

      const pdfBytes = await doc.save();
      const pdfArrayBuffer = toArrayBuffer(pdfBytes);
      const blob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `assinado_${pdfFile.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const signedFile = new File([blob], `assinado_${pdfFile.name}`, { type: 'application/pdf' });
      onSigned(signedFile);

      setIsDownloading(false);
      alert('✅ PDF assinado com sucesso!');
    } catch (error) {
      console.error('Erro ao assinar PDF:', error);
      alert('Erro ao assinar o PDF. Tente novamente.');
      setIsDownloading(false);
    }
  };

  // ==================== STYLES ====================
  const styles = {
    modalOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(16, 24, 40, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modal: {
      background: '#ffffff',
      borderRadius: '24px',
      padding: '28px',
      width: '100%',
      maxWidth: '1200px',
      maxHeight: '92vh',
      overflow: 'hidden',
      boxShadow: '0 40px 110px rgba(15, 23, 42, 0.3)',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      paddingBottom: '16px',
      borderBottom: '1px solid #e2e8f0',
      flexShrink: 0,
    },
    modalTitle: {
      margin: 0,
      fontSize: '24px',
      fontWeight: 700,
      color: '#0f172a',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    closeBtn: {
      background: '#f1f5f9',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#64748b',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
    },
    mainContent: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '24px',
      flex: 1,
      minHeight: 0,
    },
    pdfSection: {
      background: '#f8fafc',
      borderRadius: '16px',
      padding: '16px',
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      minHeight: 0,
    },
    controlsSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
      overflowY: 'auto' as const,
    },
    uploadArea: {
      border: '2px dashed #cbd5e1',
      borderRadius: '16px',
      padding: '40px 20px',
      textAlign: 'center' as const,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      minHeight: '300px',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
    },
    uploadIcon: {
      fontSize: '56px',
      marginBottom: '16px'
    },
    uploadText: {
      color: '#475569',
      fontSize: '16px'
    },
    uploadSubtext: {
      color: '#94a3b8',
      fontSize: '13px',
      marginTop: '4px'
    },
    scrollContainer: {
      overflow: 'auto' as const,
      flex: 1,
      minHeight: 0,
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      background: '#ffffff',
      position: 'relative' as const,
      padding: '10px',
      scrollBehavior: 'smooth' as const,
    },
    pdfContainer: {
      position: 'relative' as const,
      width: '100%',
      minHeight: '400px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pdfCanvas: {
      width: '100%',
      height: 'auto',
      display: 'block',
    },
    signatureOverlay: {
      position: 'absolute' as const,
      cursor: 'grab',
      border: '2px dashed rgba(30, 58, 138, 0.3)',
      borderRadius: '8px',
      padding: '4px',
      background: 'rgba(30, 58, 138, 0.05)',
      transition: 'border-color 0.3s ease',
      zIndex: 10,
    },
    signatureImage: {
      width: '100%',
      height: '100%',
      objectFit: 'contain' as const,
      borderRadius: '4px',
    },
    controlsBar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap' as const,
      gap: '12px',
      padding: '10px 16px',
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      flexShrink: 0,
    },
    pageControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    pageButton: {
      padding: '6px 14px',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      background: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s ease',
    },
    pageInfo: {
      color: '#475569',
      fontSize: '14px',
      fontWeight: 500,
      minWidth: '80px',
      textAlign: 'center' as const
    },
    zoomControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    zoomLabel: {
      fontSize: '13px',
      color: '#475569',
      fontWeight: 500
    },
    zoomRange: {
      width: '100px',
      accentColor: '#2563eb',
      cursor: 'pointer'
    },
    zoomValue: {
      fontSize: '13px',
      color: '#2563eb',
      fontWeight: 600,
      minWidth: '40px',
      textAlign: 'center' as const
    },
    signaturePadContainer: {
      background: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      padding: '16px',
    },
    signatureCanvas: {
      width: '100%',
      height: '250px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      cursor: 'crosshair',
      background: 'transparent',
    },
    controls: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap' as const,
      marginTop: '12px'
    },
    btn: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 600,
      transition: 'all 0.2s ease'
    },
    btnPrimary: {
      background: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
      color: 'white',
    },
    btnSuccess: {
      background: 'linear-gradient(135deg, #059669 0%, #065f46 100%)',
      color: 'white',
    },
    btnDanger: {
      background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      color: 'white',
    },
    btnOutline: {
      background: 'transparent',
      color: '#475569',
      border: '1px solid #cbd5e1',
    },
    colorPicker: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap' as const,
      marginTop: '8px'
    },
    colorOption: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      border: '2px solid transparent',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    colorOptionActive: {
      border: '2px solid #0f172a',
    },
    sizeControl: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginTop: '8px'
    },
    sizeRange: {
      flex: 1,
      accentColor: '#2563eb'
    },
    sizeLabel: {
      color: '#475569',
      fontSize: '14px',
      fontWeight: 500,
      minWidth: '60px'
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600
    },
    badgeSuccess: {
      background: '#d1fae5',
      color: '#065f46'
    },
    badgeWarning: {
      background: '#fef3c7',
      color: '#92400e'
    },
    badgeInfo: {
      background: '#dbeafe',
      color: '#1e40af'
    },
    card: {
      background: '#f8fafc',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid #e2e8f0'
    },
    tips: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 12px',
      background: '#f8fafc',
      borderRadius: '8px',
      fontSize: '12px',
      color: '#94a3b8',
      flexShrink: 0,
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>✍️ Assinatura Digital de PDF</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div style={styles.mainContent}>
          {/* Seção do PDF */}
          <div style={styles.pdfSection}>
            {!pdfFile ? (
              <div 
                style={styles.uploadArea}
                onClick={() => fileInputRef.current?.click()}
              >
                <div style={styles.uploadIcon}>📄</div>
                <div style={styles.uploadText}>
                  <strong>Clique aqui</strong> ou arraste seu PDF
                </div>
                <div style={styles.uploadSubtext}>
                  Formatos suportados: .pdf (até 10MB)
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <>
                {/* Barra de Controles */}
                <div style={styles.controlsBar}>
                  <div style={styles.pageControls}>
                    <button 
                      style={styles.pageButton}
                      onClick={goToPrevPage}
                      disabled={currentPage <= 1}
                    >
                      ◀
                    </button>
                    <span style={styles.pageInfo}>
                      Pág {currentPage} de {totalPages}
                    </span>
                    <button 
                      style={styles.pageButton}
                      onClick={goToNextPage}
                      disabled={currentPage >= totalPages}
                    >
                      ▶
                    </button>
                  </div>
                  <div style={styles.zoomControls}>
                    <span style={styles.zoomLabel}>🔍 Zoom</span>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={zoomLevel}
                      onChange={handleZoomChange}
                      style={styles.zoomRange}
                    />
                    <span style={styles.zoomValue}>{zoomLevel}%</span>
                  </div>
                </div>

                {/* Scroll Container */}
                <div 
                  ref={scrollContainerRef}
                  style={styles.scrollContainer}
                >
                  <div 
                    ref={pdfContainerRef}
                    style={styles.pdfContainer}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <canvas
                      ref={pdfCanvasRef}
                      style={styles.pdfCanvas}
                    />

                    {signaturePadImage && (
                      <div 
                        style={{
                          ...styles.signatureOverlay,
                          left: `${signaturePosition.x}px`,
                          top: `${signaturePosition.y}px`,
                          width: `${signatureSize}px`,
                          height: `${signatureSize / 2}px`,
                        }}
                        onMouseDown={handleMouseDown}
                      >
                        <img 
                          src={signaturePadImage} 
                          alt="Assinatura" 
                          style={styles.signatureImage}
                        />
                      </div>
                    )}

                    {signaturePadImage && (
                      <div style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        ...styles.badgeSuccess,
                        ...styles.statusBadge,
                        zIndex: 20,
                      }}>
                        ✅ Assinado
                      </div>
                    )}
                  </div>
                </div>

                {/* Dicas de uso */}
                <div style={styles.tips}>
                  <span>💡 Role para baixo para ver todo o conteúdo</span>
                  <span>🖱️ Arraste a assinatura para posicionar</span>
                  <span>🔍 Use o zoom para ver detalhes</span>
                </div>
              </>
            )}
          </div>

          {/* Seção de Controles */}
          <div style={styles.controlsSection}>
            {/* Status */}
            <div style={styles.card}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                📊 Status
              </h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {!pdfFile && (
                  <span style={{ ...styles.badgeWarning, ...styles.statusBadge }}>
                    ⏳ Aguardando PDF
                  </span>
                )}
                {pdfFile && !signatureData && (
                  <span style={{ ...styles.badgeInfo, ...styles.statusBadge }}>
                    📄 PDF carregado
                  </span>
                )}
                {pdfFile && signatureData && (
                  <span style={{ ...styles.badgeSuccess, ...styles.statusBadge }}>
                    ✅ Assinado
                  </span>
                )}
                {pdfFile && (
                  <span style={{ ...styles.badgeInfo, ...styles.statusBadge }}>
                    📄 {pdfFile.name}
                  </span>
                )}
              </div>
            </div>

            {/* Assinatura Digital */}
            <div style={styles.card}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                ✍️ Assinatura Digital
              </h3>
              
              {!showSignaturePad ? (
                <button
                  onClick={() => setShowSignaturePad(true)}
                  style={{ ...styles.btn, ...styles.btnPrimary, width: '100%' }}
                  disabled={!pdfFile}
                >
                  🖊️ Criar Assinatura
                </button>
              ) : (
                <div style={styles.signaturePadContainer}>
                  <canvas
                    ref={canvasRef}
                    style={styles.signatureCanvas}
                  />
                  <div style={styles.controls}>
                    <button
                      onClick={handleSignatureSave}
                      style={{ ...styles.btn, ...styles.btnSuccess }}
                    >
                      ✅ Salvar
                    </button>
                    <button
                      onClick={clearSignature}
                      style={{ ...styles.btn, ...styles.btnDanger }}
                    >
                      🗑️ Limpar
                    </button>
                    <button
                      onClick={() => setShowSignaturePad(false)}
                      style={{ ...styles.btn, ...styles.btnOutline }}
                    >
                      ❌ Fechar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cores */}
            <div style={styles.card}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                🎨 Cor da Assinatura
              </h3>
              <div style={styles.colorPicker}>
                {colors.map((color) => (
                  <div
                    key={color}
                    style={{
                      ...styles.colorOption,
                      background: color,
                      ...(signatureColor === color ? styles.colorOptionActive : {})
                    }}
                    onClick={() => setSignatureColor(color)}
                  />
                ))}
              </div>
            </div>

            {/* Tamanho */}
            <div style={styles.card}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                📏 Tamanho da Assinatura
              </h3>
              <div style={styles.sizeControl}>
                <span style={styles.sizeLabel}>{signatureSize}px</span>
                <input
                  type="range"
                  min="80"
                  max="350"
                  value={signatureSize}
                  onChange={(e) => setSignatureSize(parseInt(e.target.value))}
                  style={styles.sizeRange}
                />
              </div>
            </div>

            {/* Ações */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleDownload}
                disabled={!pdfFile || !signatureData || isDownloading}
                style={{
                  ...styles.btn,
                  ...styles.btnPrimary,
                  width: '100%',
                  ...((!pdfFile || !signatureData || isDownloading) ? { opacity: 0.5, cursor: 'not-allowed' } : {})
                }}
              >
                {isDownloading ? '⏳ Baixando...' : '📥 Baixar PDF Assinado'}
              </button>
              <button
                onClick={() => {
                  setPdfFile(null);
                  setPdfData(null);
                  setPdfDoc(null);
                  setSignatureData('');
                  setSignaturePadImage('');
                  setIsSigned(false);
                  setIsSigning(false);
                  setCurrentPage(1);
                  setTotalPages(0);
                  setZoomLevel(100);
                  setPdfRendered(false);
                  setCanvasSize({ width: 0, height: 0 });
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                style={{ ...styles.btn, ...styles.btnOutline, width: '100%' }}
              >
                🔄 Novo PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}