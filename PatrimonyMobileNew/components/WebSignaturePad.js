import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

export default function WebSignaturePad({ onSave, onClear }) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getCoords = (e) => {
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      if (e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const start = (e) => {
      e.preventDefault();
      const { x, y } = getCoords(e);
      isDrawing.current = true;
      lastX.current = x;
      lastY.current = y;
      setHasDrawn(true);
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
    };

    const move = (e) => {
      if (!isDrawing.current) return;
      e.preventDefault();
      const { x, y } = getCoords(e);
      ctx.beginPath();
      ctx.moveTo(lastX.current, lastY.current);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastX.current = x;
      lastY.current = y;
    };

    const end = (e) => {
      e.preventDefault();
      isDrawing.current = false;
    };

    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end, { passive: false });
    canvas.addEventListener('touchcancel', end, { passive: false });
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);

    return () => {
      canvas.removeEventListener('touchstart', start);
      canvas.removeEventListener('touchmove', move);
      canvas.removeEventListener('touchend', end);
      canvas.removeEventListener('touchcancel', end);
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', move);
      canvas.removeEventListener('mouseup', end);
      canvas.removeEventListener('mouseleave', end);
    };
  }, []);

  const handleClear = () => {
    if (Platform.OS !== 'web') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    if (onClear) onClear();
  };

  const handleSave = () => {
    if (Platform.OS !== 'web') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!hasDrawn) {
      alert('⚠️ Por favor, assine no espaço antes de confirmar');
      return;
    }

    try {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    } catch (err) {
      console.error('Erro ao salvar assinatura:', err);
      alert('Erro ao gerar a imagem da assinatura.');
    }
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.notAvailable}>
        <Text style={styles.notAvailableText}>Assinatura disponível apenas no modo web.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.canvasContainer}>
        {/* @ts-ignore */}
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '250px',
            touchAction: 'none',
            cursor: 'crosshair',
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '2px dashed #ccc',
          }}
        />
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.btn, styles.btnClear]} onPress={handleClear}>
          <Text style={styles.btnText}>🗑️ Limpar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={handleSave}>
          <Text style={styles.btnText}>✅ Confirmar Assinatura</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  canvasContainer: { marginBottom: 12 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnClear: { backgroundColor: '#6b7280' },
  btnSave: { backgroundColor: '#059669' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  notAvailable: { padding: 20, alignItems: 'center' },
  notAvailableText: { color: '#6b7280', fontStyle: 'italic' },
});
