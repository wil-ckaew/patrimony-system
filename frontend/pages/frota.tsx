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

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <>
      <Head>
        <title>Gestão de Frota</title>
      </Head>

      <main className={styles.pageWrapper}>
        {/* HEADER */}
        <div className={styles.topbar}>
          <div className={styles.headerLeft}>
            <div className={styles.logo}>
              🚘
            </div>

            <div className={styles.headerText}>
              <h1 className={styles.headerTitle}>
                Sistema de Gestão de Frota
              </h1>

              <p className={styles.headerSub}>
                Controle completo de veículos oficiais
              </p>
            </div>
          </div>

          <div className={styles.topbarActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={openNewForm}
            >
              ➕ Nova Frota
            </button>

            <Link href="/" className={styles.secondaryButton}>
              ← Voltar ao Patrimônio
            </Link>
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className={styles.contentCard}>
          <FleetList
            onEdit={handleEdit}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* MODAL FORM */}
        {showForm && (
          <FleetForm
            item={selectedItem}
            onClose={() => setShowForm(false)}
            onRefresh={() => {
              handleRefresh();
              setShowForm(false);
            }}
          />
        )}
      </main>
    </>
  );
}