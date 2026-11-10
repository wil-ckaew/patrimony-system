// screens/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

const screenWidth = Dimensions.get('window').width;

// ============================================================
// HELPERS WEB/MOBILE
// ============================================================
const showAlert = (title, message, onOk) => {
  if (Platform.OS === 'web') {
    try { window.alert(`${title}\n\n${message}`); } catch (e) {}
    if (onOk) onOk();
  } else {
    Alert.alert(title, message, [{ text: 'OK', onPress: onOk }], { cancelable: false });
  }
};

const showConfirm = (title, message, onConfirm) => {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed && onConfirm) onConfirm();
  } else {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: onConfirm }
      ]
    );
  }
};

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, token, logout } = useAuth();

  // Recarrega stats quando volta para o Dashboard
  useFocusEffect(
    React.useCallback(() => {
      fetchStats();
    }, [token])
  );

  const fetchStats = async () => {
    console.log('[Dash] 🔄 Carregando estatísticas...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Dash] ✅ Stats carregadas:', data.total, 'bens');
        setStats(data);
      } else {
        console.log('[Dash] ❌ Status:', response.status);
      }
    } catch (error) {
      console.error('[Dash] ❌ Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('[Dash] 🚪 Logout solicitado');
    showConfirm(
      'Sair da Conta',
      'Tem certeza que deseja sair?',
      async () => {
        console.log('[Dash] ✅ Confirmou logout');
        await logout();
      }
    );
  };

  const getDepartmentName = (dept) => {
    const departmentNames = {
      'education': 'Educação',
      'health': 'Saúde',
      'administration': 'Administração',
      'urbanism': 'Urbanismo',
      'culture': 'Cultura',
      'sports': 'Esportes',
      'transportation': 'Transporte',
      'finance': 'Finanças',
      'assistenci': 'Assistência Comunitária',
      'tourism': 'Turismo',
      'environment': 'Meio Ambiente',
      'instituto_profissoes': 'Instituto de Profissões',
      'desenvolvimento': 'Desenvolvimento',
      'government': 'Governo',
    };
    return departmentNames[dept] || dept;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* HEADER COM BOTÃO LOGOUT */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcome}>Olá, {user?.username}</Text>
          <Text style={styles.role}>
            {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* BOTÕES DE AÇÃO */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('PatrimonyList')}
        >
          <Text style={styles.actionText}>📋 Ver Todos os Bens</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.newButton]}
          onPress={() => navigation.navigate('NewPatrimony')}
        >
          <Text style={styles.actionText}>➕ Novo Bem</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.bulkButton]}
          onPress={() => navigation.navigate('BulkPatrimony')}
        >
          <Text style={styles.actionText}>📦 Cadastro em Massa</Text>
        </TouchableOpacity>

        {/* BOTÃO FROTA */}
        <TouchableOpacity
          style={[styles.actionButton, styles.fleetButton]}
          onPress={() => navigation.navigate('Fleet')}
        >
          <Text style={styles.actionText}>🚘 Gestão de Frota</Text>
        </TouchableOpacity>

        {/* BOTÃO LEILÃO */}
        <TouchableOpacity
          style={[styles.actionButton, styles.auctionButton]}
          onPress={() => navigation.navigate('Leiloes')}
        >
          <Text style={styles.actionText}>🏷️ Leilões</Text>
        </TouchableOpacity>

        {/* ✅ NOVO BOTÃO - RELATÓRIOS */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#7c3aed' }]}
          onPress={() => navigation.navigate('Relatorios')}
        >
          <Text style={styles.actionText}>📊 Relatórios e Termos</Text>
        </TouchableOpacity>
      </View>

      {stats && (
        <>
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Estatísticas Gerais</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.total || 0}</Text>
                <Text style={styles.statLabel}>Total de Bens</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.active || 0}</Text>
                <Text style={styles.statLabel}>Ativos</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  R$ {Number(stats.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={styles.statLabel}>Valor Total</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.inactive || 0}</Text>
                <Text style={styles.statLabel}>Inativos</Text>
              </View>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Status dos Bens</Text>
            <View style={styles.chart}>
              {[
                { label: 'Ativos', value: stats.active || 0, color: '#22c55e' },
                { label: 'Inativos', value: stats.inactive || 0, color: '#ef4444' },
                { label: 'Manutenção', value: stats.maintenance || 0, color: '#f59e0b' },
                { label: 'Baixados', value: stats.written_off || 0, color: '#6b7280' },
              ].map((item, index) => {
                const percentage = stats.total ? (item.value / stats.total) * 100 : 0;
                return (
                  <View key={index} style={styles.chartItem}>
                    <View style={styles.chartInfo}>
                      <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
                      <Text style={styles.chartLabel}>{item.label}</Text>
                      <Text style={styles.chartValue}>{item.value}</Text>
                    </View>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          { width: `${percentage}%`, backgroundColor: item.color }
                        ]}
                      />
                    </View>
                    <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Top Departamentos</Text>
            <View style={styles.chart}>
              {stats.by_department?.slice(0, 5).map((dept, index) => {
                const percentage = stats.total ? (dept.count / stats.total) * 100 : 0;
                return (
                  <View key={index} style={styles.chartItem}>
                    <View style={styles.chartInfo}>
                      <Text style={styles.deptLabel}>
                        {getDepartmentName(dept.department)}
                      </Text>
                      <Text style={styles.chartValue}>{dept.count}</Text>
                    </View>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          {
                            width: `${percentage}%`,
                            backgroundColor: getDepartmentColor(dept.department)
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.departmentList}>
            <Text style={styles.sectionTitle}>Todos os Departamentos</Text>
            {stats.by_department?.map((dept, index) => (
              <View key={index} style={styles.deptItem}>
                <Text style={styles.deptName}>{getDepartmentName(dept.department)}</Text>
                <View style={styles.deptCountContainer}>
                  <Text style={styles.deptCount}>{dept.count}</Text>
                  <Text style={styles.deptLabel}>bens</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function getDepartmentColor(dept) {
  const colors = {
    'education': '#4caf50',
    'health': '#f44336',
    'administration': '#2196f3',
    'urbanism': '#ff9800',
    'culture': '#9c27b0',
    'sports': '#00bcd4',
    'transportation': '#607d8b',
    'finance': '#ffeb3b',
    'assistenci': '#607d8b',
    'tourism': '#795548',
    'environment': '#8bc34a',
  };
  return colors[dept] || '#cccccc';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header com logout
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerLeft: { flex: 1 },
  welcome: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  role: { fontSize: 14, color: '#6b7280' },

  // Botão de logout
  logoutButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutIcon: { fontSize: 16 },
  logoutText: { color: '#dc2626', fontSize: 14, fontWeight: '600' },

  actions: { marginBottom: 20, gap: 12 },
  actionButton: {
    backgroundColor: '#2563eb', padding: 16,
    borderRadius: 12, alignItems: 'center',
  },
  newButton: { backgroundColor: '#059669' },
  bulkButton: { backgroundColor: '#7c3aed' },
  fleetButton: { backgroundColor: '#ea580c' },
  auctionButton: { backgroundColor: '#8b5cf6' },
  actionText: { color: 'white', fontSize: 16, fontWeight: '600' },

  statsContainer: {
    backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5,
  },
  sectionTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#1f2937',
    marginBottom: 16, textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center',
  },
  statCard: {
    backgroundColor: '#f1f5f9', padding: 16, borderRadius: 8,
    minWidth: '45%', alignItems: 'center',
  },
  statNumber: {
    fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: '#6b7280', textAlign: 'center' },

  chartContainer: {
    backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5,
  },
  chart: { gap: 12 },
  chartItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chartInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8, width: 120,
  },
  colorIndicator: { width: 12, height: 12, borderRadius: 6 },
  chartLabel: {
    fontSize: 12, color: '#374151', fontWeight: '500', flex: 1,
  },
  deptLabel: { fontSize: 12, color: '#374151', fontWeight: '500' },
  chartValue: {
    fontSize: 12, fontWeight: 'bold', color: '#1f2937',
    minWidth: 20, textAlign: 'right',
  },
  barContainer: {
    flex: 1, height: 8, backgroundColor: '#e5e7eb',
    borderRadius: 4, overflow: 'hidden',
  },
  bar: { height: '100%', borderRadius: 4 },
  percentage: {
    fontSize: 12, color: '#6b7280', fontWeight: '600',
    width: 30, textAlign: 'right',
  },
  departmentList: {
    backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5,
  },
  deptItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  deptName: {
    fontSize: 14, color: '#374151', fontWeight: '500', flex: 1,
  },
  deptCountContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deptCount: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
  deptLabel: { fontSize: 12, color: '#6b7280' },
});
