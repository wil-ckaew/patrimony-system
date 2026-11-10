import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';
import WebSignaturePad from '../components/WebSignaturePad';

export default function RelatoriosScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [patrimonies, setPatrimonies] = useState([]);
  const [filtroSetor, setFiltroSetor] = useState('PROCON-SP');
  const [assinaturaImagem, setAssinaturaImagem] = useState(null);
  const [mostrarAssinatura, setMostrarAssinatura] = useState(false);
  const [nomeResponsavel, setNomeResponsavel] = useState('Wilson Kimel');
  const [cargoResponsavel, setCargoResponsavel] = useState('Chefe do Patrimônio');
  
  // Estados para as datas
  const [dataInicial, setDataInicial] = useState(null);
  const [dataFinal, setDataFinal] = useState(null);
  const [showDatePickerInicial, setShowDatePickerInicial] = useState(false);
  const [showDatePickerFinal, setShowDatePickerFinal] = useState(false);

  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    fetchPatrimonies();
  }, []);

  const fetchPatrimonies = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/patrimony`, { headers });
      if (response.ok) {
        const data = await response.json();
        setPatrimonies(data);
      }
    } catch (error) {
      console.error('Erro ao buscar bens:', error);
    } finally {
      setLoading(false);
    }
  };

  const bensFiltrados = patrimonies.filter(item => {
    // Filtro por Setor
    const matchSetor = item.sector && item.sector.toLowerCase().includes(filtroSetor.toLowerCase());
    if (!matchSetor) return false;

    // Filtro por Data (se alguma data foi preenchida)
    const itemDateStr = item.acquisition_date ? item.acquisition_date.split('T')[0] : null;
    
    if (dataInicial || dataFinal) {
      if (!itemDateStr) return false;
      
      const itemDate = new Date(itemDateStr + 'T12:00:00'); // Usa meio-dia para evitar fuso horário
      
      if (dataInicial) {
        const start = new Date(dataInicial);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) return false;
      }
      
      if (dataFinal) {
        const end = new Date(dataFinal);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }
    }

    return true;
  });

  const bensComFoto = bensFiltrados.filter(item => item.image_url);

  const formatDateBR = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('pt-BR');
  };

  const formatDateISO = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const gerarPDF = (tipo) => {
    if (bensFiltrados.length === 0) {
      Alert.alert('Aviso', 'Nenhum bem encontrado para este filtro.');
      return;
    }

    if (Platform.OS !== 'web') {
      Alert.alert('Aviso', 'A geração de PDF está disponível apenas no modo web (Safari).');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let html = '';

    const assinaturaHtml = assinaturaImagem 
      ? `<img src="${assinaturaImagem}" style="max-height: 80px; max-width: 200px;" />`
      : '';

    const periodoTexto = (dataInicial || dataFinal) 
      ? `, adquiridos no período de ${dataInicial ? formatDateBR(dataInicial) : 'início'} a ${dataFinal ? formatDateBR(dataFinal) : 'hoje'}`
      : '';

    if (tipo === 'termo') {
      const rows = bensFiltrados.map(item => `
        <tr>
          <td>${item.plate || '-'}</td>
          <td>${item.name || '-'}</td>
          <td>${item.description || '-'}</td>
          <td>${item.department || '-'}</td>
          <td>${item.sector || '-'}</td>
        </tr>
      `).join('');

      html = `
        <html>
          <head>
            <title>Termo de Incorporação</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; font-size: 11px; line-height: 1.4; }
              h1 { text-align: center; font-size: 14px; text-transform: uppercase; margin-bottom: 20px; }
              .content { text-align: justify; margin-bottom: 15px; }
              .table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 30px; }
              .table th, .table td { border: 1px solid #000; padding: 6px; text-align: left; }
              .table th { background: #f0f0f0; }
              .signature-box { margin-top: 50px; text-align: center; width: 80%; margin-left: auto; margin-right: auto; }
              .obs { font-size: 9px; color: #555; margin-top: 10px; }
            </style>
          </head>
          <body>
            <h1>TERMO DE INCORPORAÇÃO DE BENS</h1>
            <div class="content">
              <p>Aos ${new Date().toLocaleDateString('pt-BR')}, o setor responsável pelo patrimônio da Prefeitura Municipal, declara que recebeu em doação os bens abaixo relacionados, provenientes do <strong>${filtroSetor}</strong>${periodoTexto}, os quais passam a integrar o patrimônio público municipal a partir desta data.</p>
            </div>
            <table class="table">
              <thead>
                <tr>
                  <th>Nº Patrimônio</th>
                  <th>Nome do Bem</th>
                  <th>Descrição</th>
                  <th>Departamento</th>
                  <th>Setor</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <div class="content">
              <p>Os bens acima descritos encontram-se em perfeito estado de conservação e funcionamento.</p>
              <p class="obs">* Observação: Os bens foram incorporados sem valor monetário atribuído.</p>
            </div>
            <div class="signature-box">
              <div style="height: 60px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 5px;">
                ${assinaturaHtml}
              </div>
              <div style="border-top: 1px solid #000; width: 80%; margin: 0 auto; padding-top: 5px;">
                <strong>${nomeResponsavel}</strong><br>
                ${cargoResponsavel}
              </div>
            </div>
          </body>
        </html>
      `;
    } else {
      const rows = bensComFoto.map(item => {
        const imageUrl = item.image_url.startsWith('http') 
          ? item.image_url 
          : `${API_BASE_URL}${item.image_url}`;

        return `
          <div class="item-card">
            <div class="item-info">
              <h3>${item.name}</h3>
              <p><strong>Placa/Nº:</strong> ${item.plate}</p>
              <p><strong>Descrição:</strong> ${item.description || 'N/A'}</p>
              <p><strong>Setor:</strong> ${item.sector || 'N/A'}</p>
            </div>
            <div class="item-photo">
              <img src="${imageUrl}" alt="Foto" />
            </div>
          </div>
        `;
      }).join('');

      html = `
        <html>
          <head>
            <title>Relatório Fotográfico</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 15px; font-size: 11px; }
              h1 { text-align: center; font-size: 14px; margin-bottom: 15px; }
              .item-card { display: flex; border: 1px solid #ccc; margin-bottom: 15px; border-radius: 6px; overflow: hidden; page-break-inside: avoid; }
              .item-info { flex: 1; padding: 10px; }
              .item-photo { width: 120px; display: flex; align-items: center; justify-content: center; background: #f9f9f9; border-left: 1px solid #ccc; }
              .item-photo img { max-width: 100%; max-height: 100px; object-fit: contain; }
              h3 { margin-top: 0; font-size: 12px; color: #1e3a8a; }
              p { margin: 3px 0; }
              .signature-box { margin-top: 40px; text-align: center; width: 80%; margin-left: auto; margin-right: auto; }
            </style>
          </head>
          <body>
            <h1>RELATÓRIO FOTOGRÁFICO - ${filtroSetor}</h1>
            <p style="text-align: center;">Data: ${new Date().toLocaleDateString('pt-BR')} ${periodoTexto ? '| ' + periodoTexto.replace(', adquiridos no período de ', 'Período: ') : ''}</p>
            ${rows || '<p style="text-align:center;">Nenhum item com foto encontrado.</p>'}
            <div class="signature-box">
              <div style="height: 60px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 5px;">
                ${assinaturaHtml}
              </div>
              <div style="border-top: 1px solid #000; width: 80%; margin: 0 auto; padding-top: 5px;">
                <strong>${nomeResponsavel}</strong><br>
                ${cargoResponsavel}
              </div>
            </div>
          </body>
        </html>
      `;
    }

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const onChangeDataInicial = (event, selectedDate) => {
    setShowDatePickerInicial(Platform.OS === 'ios');
    if (selectedDate) setDataInicial(selectedDate);
  };

  const onChangeDataFinal = (event, selectedDate) => {
    setShowDatePickerFinal(Platform.OS === 'ios');
    if (selectedDate) setDataFinal(selectedDate);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Relatórios e Termos</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Filtrar por Setor (Doador):</Text>
        <TextInput
          style={styles.input}
          value={filtroSetor}
          onChangeText={setFiltroSetor}
          placeholder="Ex: PROCON-SP"
        />
        
        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <Text style={styles.label}>Data Inicial:</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={dataInicial ? formatDateISO(dataInicial) : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setDataInicial(new Date(e.target.value + 'T12:00:00'));
                  } else {
                    setDataInicial(null);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  fontSize: '16px',
                }}
              />
            ) : (
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePickerInicial(true)}>
                <Text style={styles.dateText}>{dataInicial ? formatDateBR(dataInicial) : 'Selecionar'}</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.dateCol}>
            <Text style={styles.label}>Data Final:</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={dataFinal ? formatDateISO(dataFinal) : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setDataFinal(new Date(e.target.value + 'T12:00:00'));
                  } else {
                    setDataFinal(null);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  fontSize: '16px',
                }}
              />
            ) : (
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePickerFinal(true)}>
                <Text style={styles.dateText}>{dataFinal ? formatDateBR(dataFinal) : 'Selecionar'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity onPress={() => { setDataInicial(null); setDataFinal(null); }}>
          <Text style={styles.clearDates}>Limpar datas</Text>
        </TouchableOpacity>

        <Text style={[styles.hint, { marginTop: 8 }]}>
          Bens encontrados: {bensFiltrados.length} (com foto: {bensComFoto.length})
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Nome do Responsável:</Text>
        <TextInput
          style={styles.input}
          value={nomeResponsavel}
          onChangeText={setNomeResponsavel}
          placeholder="Seu nome completo"
        />
        
        <Text style={styles.label}>Cargo:</Text>
        <TextInput
          style={styles.input}
          value={cargoResponsavel}
          onChangeText={setCargoResponsavel}
          placeholder="Ex: Chefe do Patrimônio"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Assinatura Digital:</Text>
        {assinaturaImagem ? (
          <View style={styles.assinaturaPreview}>
            <img src={assinaturaImagem} style={{ width: '100%', height: 100, objectFit: 'contain' }} alt="Assinatura" />
            <TouchableOpacity style={styles.btnLimparAssinatura} onPress={() => setAssinaturaImagem(null)}>
              <Text style={styles.btnText}>🗑️ Limpar Assinatura</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.btnAssinar} 
            onPress={() => setMostrarAssinatura(!mostrarAssinatura)}
          >
            <Text style={styles.btnText}>{mostrarAssinatura ? '❌ Fechar Assinatura' : '✍️ Assinar com o dedo'}</Text>
          </TouchableOpacity>
        )}

        {mostrarAssinatura && !assinaturaImagem && (
          <View style={{ marginTop: 12 }}>
            <WebSignaturePad 
              onSave={(dataUrl) => {
                setAssinaturaImagem(dataUrl);
                setMostrarAssinatura(false);
              }} 
              onClear={() => {}}
            />
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.button, styles.buttonTermo]} 
        onPress={() => gerarPDF('termo')}
        disabled={bensFiltrados.length === 0}
      >
        <Text style={styles.buttonText}>📜 Gerar Termo de Incorporação</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.buttonRelatorio]} 
        onPress={() => gerarPDF('relatorio')}
        disabled={bensComFoto.length === 0}
      >
        <Text style={styles.buttonText}>📸 Gerar Relatório Fotográfico</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.buttonCancel]} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Voltar</Text>
      </TouchableOpacity>

      {showDatePickerInicial && (
        <DateTimePicker
          value={dataInicial || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeDataInicial}
        />
      )}
      {showDatePickerFinal && (
        <DateTimePicker
          value={dataFinal || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeDataFinal}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 16 },
  header: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 3 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }, 
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 8 },
  hint: { fontSize: 12, color: '#6b7280', fontStyle: 'italic' },
  
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  dateCol: { width: '48%' },
  dateButton: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, alignItems: 'center' },
  dateText: { fontSize: 14, color: '#1f2937' },
  clearDates: { fontSize: 12, color: '#dc2626', marginTop: 8, textAlign: 'center' },

  button: { padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  buttonTermo: { backgroundColor: '#7c3aed' },
  buttonRelatorio: { backgroundColor: '#0891b2' },
  buttonCancel: { backgroundColor: '#ef4444' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  
  assinaturaPreview: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  btnLimparAssinatura: { backgroundColor: '#ef4444', padding: 10, borderRadius: 8, marginTop: 8, width: '100%', alignItems: 'center' },
  btnAssinar: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
});
