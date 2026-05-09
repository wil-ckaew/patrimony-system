//frontend/pages/frota.tsx
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import FleetList from '../components/FleetList';
import FleetForm from '../components/FleetForm';
import { FleetItem } from '../types/Patrimony';
import styles from './FrotaPage.module.css';

export default function FrotaPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FleetItem | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const openNewForm = () => {
    setSelectedItem(null);
    setShowForm(true);
  };

  const handleEdit = (item: FleetItem) => {
    setSelectedItem(item);
    setShowForm(true);
  };

  const handleRefresh = () => setRefreshTrigger((prev) => prev + 1);

  return (
    <>
      <Head>
        <title>Gestão de Frota</title>
      </Head>

      <main className={styles.pageWrapper}>
        <div className={styles.topbar}>
          <div className={styles.headerLeft}>
            <div className={styles.logo}>SGF</div>
            <div className={styles.headerText}>
              <h1 className={styles.headerTitle}>Sistema de Gestão de Frota</h1>
              <p className={styles.headerSub}>Ambiente Oficial</p>
            </div>
          </div>

          <div className={styles.topbarActions}>
            <button type="button" className={styles.actionButton} onClick={openNewForm}>
              Nova frota
            </button>
            <Link href="/">
              <a className={styles.actionButton}>Voltar ao patrimônio</a>
            </Link>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 30px 80px rgba(15, 23, 42, 0.06)' }}>
          <FleetList onEdit={handleEdit} refreshTrigger={refreshTrigger} />
        </div>

        {showForm && (
          <FleetForm
            item={selectedItem}
            onClose={() => setShowForm(false)}
            onRefresh={() => { handleRefresh(); setShowForm(false); }}
          />
        )}
      </main>
    </>
  );
}
