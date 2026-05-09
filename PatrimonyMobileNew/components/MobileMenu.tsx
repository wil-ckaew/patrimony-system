// components/MobileMenu.tsx
import React from 'react';
import styles from './PatrimonyPage.module.css';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ 
  isOpen, 
  onClose, 
  currentUser, 
  onNavigate, 
  onLogout 
}) => {
  return (
    <>
      <div className={`${styles.mobileMenuOverlay} ${isOpen ? styles.active : ''}`} onClick={onClose} />
      
      <div className={`${styles.mobileMenu} ${isOpen ? styles.open : ''}`}>
        <div className={styles.mobileMenuHeader}>
          <h3>Menu</h3>
          <button className={styles.mobileMenuClose} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.mobileMenuItems}>
          <div className={styles.mobileMenuItem} onClick={() => onNavigate('dashboard')}>
            <span className={styles.mobileMenuIcon}>📊</span>
            Dashboard
          </div>
          
          <div className={styles.mobileMenuItem} onClick={() => onNavigate('list')}>
            <span className={styles.mobileMenuIcon}>📋</span>
            Lista de Bens
          </div>
          
          <div className={styles.mobileMenuItem} onClick={() => onNavigate('new')}>
            <span className={styles.mobileMenuIcon}>+</span>
            Novo Bem
          </div>
          
          <div className={styles.mobileMenuItem} onClick={() => onNavigate('print')}>
            <span className={styles.mobileMenuIcon}>🖨️</span>
            Imprimir
          </div>
          
          <div className={styles.mobileMenuItem} onClick={() => onNavigate('profile')}>
            <span className={styles.mobileMenuIcon}>👤</span>
            Meu Perfil
          </div>
          
          <div className={styles.mobileMenuItem} onClick={() => onNavigate('settings')}>
            <span className={styles.mobileMenuIcon}>⚙️</span>
            Configurações
          </div>
          
          <div className={styles.mobileMenuItem} onClick={onLogout}>
            <span className={styles.mobileMenuIcon}>🚪</span>
            Sair
          </div>
        </div>
        
        <div style={{padding: '1.5rem', borderTop: '1px solid #eee', marginTop: 'auto'}}>
          <p style={{fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem'}}>
            Logado como: <strong>{currentUser?.username}</strong>
          </p>
          <p style={{fontSize: '0.8rem', color: '#888'}}>
            {currentUser?.role === 'admin' ? 'Administrador' : 'Usuário'}
          </p>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;