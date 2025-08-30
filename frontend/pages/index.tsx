// pages/patrimony/index.tsx
import React, { useState } from 'react';
import Head from 'next/head';
import PatrimonyList from '../components/PatrimonyList';
import PatrimonyForm from '../components/PatrimonyForm';
import TransferModal from '../components/TransferModal';
import Dashboard from '../components/Dashboard';
import { PatrimonyItem } from '../types/Patrimony';

export default function PatrimonyPage() {
  const [showForm, setShowForm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PatrimonyItem | null>(null);
  const [refreshList, setRefreshList] = useState(0);
  const [activeTab, setActiveTab] = useState<'list' | 'dashboard'>('list');

  const handleEdit = (item: PatrimonyItem) => {
    setSelectedItem(item);
    setShowForm(true);
  };

  const handleTransfer = (item: PatrimonyItem) => {
    setSelectedItem(item);
    setShowTransferModal(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedItem(null);
    setRefreshList(prev => prev + 1);
  };

  const handleRefresh = () => setRefreshList(prev => prev + 1);

  const styles: { [key: string]: React.CSSProperties } = {
    container: { minHeight: '100vh', background: '#f9fafb', fontFamily: 'Inter, sans-serif' },
    topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1e3a8a', color: 'white', padding: '12px 24px', flexWrap: 'wrap' },
    logo: { fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '1px' },
    headerText: { display: 'flex', flexDirection: 'column', marginLeft: '12px' },
    headerTitle: { margin: 0, fontSize: '18px', fontWeight: 600 },
    headerSub: { margin: 0, fontSize: '13px', opacity: 0.8 },
    actionsContainer: { display: 'flex', justifyContent: 'flex-end', marginTop: '8px', gap: '10px', flexWrap: 'wrap' },
    btn: { padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' },
    btnPrimary: { background: '#2563eb', color: 'white' },
    btnSecondary: { background: '#6b7280', color: 'white' },
    tabs: { display: 'flex', background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 24px', gap: '10px' },
    tab: { padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#6b7280', borderBottom: '3px solid transparent', transition: 'all 0.3s ease' },
    tabActive: { color: '#2563eb', borderBottomColor: '#2563eb', fontWeight: 600 },
    mainContent: { padding: '24px' }
  };

  return (
    <div style={styles.container}>
      <Head>
        <title>Sistema de Gestão de Patrimônio</title>
        <meta name="description" content="Sistema de gestão de patrimônio para prefeitura" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={styles.topbar}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={styles.logo}>SGP</div>
          <div style={styles.headerText}>
            <h1 style={styles.headerTitle}>Sistema de Gestão de Patrimônio</h1>
            <p style={styles.headerSub}>Ambiente Oficial</p>
          </div>
        </div>
        <div style={styles.actionsContainer}>
          <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={handleRefresh}>Atualizar</button>
          <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => setShowForm(true)}>Novo Bem</button>
        </div>
      </div>

      <nav style={styles.tabs}>
        <button style={{ ...styles.tab, ...(activeTab === 'list' ? styles.tabActive : {}) }} onClick={() => setActiveTab('list')}>Lista de Bens</button>
        <button style={{ ...styles.tab, ...(activeTab === 'dashboard' ? styles.tabActive : {}) }} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
      </nav>

      <main style={styles.mainContent}>
        {activeTab === 'list' ? (
          <PatrimonyList onEdit={handleEdit} onTransfer={handleTransfer} refreshTrigger={refreshList} />
        ) : (
          <Dashboard />
        )}
      </main>

      {showForm && <PatrimonyForm item={selectedItem} onClose={handleFormClose} onRefresh={handleRefresh} />}

      {showTransferModal && selectedItem && (
        <TransferModal
          item={selectedItem}
          onClose={() => { setShowTransferModal(false); setSelectedItem(null); setRefreshList(prev => prev + 1); }}
        />
      )}
    </div>
  );
}
