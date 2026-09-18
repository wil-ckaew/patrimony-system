// components/PdfSignerDemo.tsx
import React, { useState } from 'react';
import PdfSigner from './PdfSigner';

export default function PdfSignerDemo() {
  const [showSigner, setShowSigner] = useState(false);
  const [signedFiles, setSignedFiles] = useState<File[]>([]);

  const handleSigned = (file: File) => {
    setSignedFiles(prev => [...prev, file]);
    console.log('📄 PDF assinado:', file.name);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
        📄 Assinatura Digital de PDF
      </h1>
      
      <button
        onClick={() => setShowSigner(true)}
        style={{
          padding: '16px 32px',
          background: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
        }}
      >
        ✍️ Abrir Assinador de PDF
      </button>

      {signedFiles.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
            📋 PDFs Assinados
          </h2>
          {signedFiles.map((file, index) => (
            <div
              key={index}
              style={{
                padding: '12px 16px',
                background: '#f1f5f9',
                borderRadius: '8px',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ color: '#0f172a' }}>📄 {file.name}</span>
              <span style={{ color: '#059669', fontSize: '14px', fontWeight: 600 }}>
                ✅ Assinado
              </span>
            </div>
          ))}
        </div>
      )}

      {showSigner && (
        <PdfSigner
          onClose={() => setShowSigner(false)}
          onSigned={handleSigned}
        />
      )}
    </div>
  );
}