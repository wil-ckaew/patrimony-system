// pages/index.tsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import PatrimonyList from '../components/PatrimonyList';
import PatrimonyForm from '../components/PatrimonyForm';
import TransferModal from '../components/TransferModal';
import PrintModal from '../components/PrintModal';
import Dashboard from '../components/Dashboard';
import { PatrimonyItem, LoginRequest, CreateUser, User } from '../types/Patrimony';
import styles from '../components/PatrimonyPage.module.css';
import { getAuthHeaders } from '../utils/auth';
import BackupModal from '../components/BackupModal';

// ✅ SIMPLIFICADO: Apenas um campo de busca
interface SearchFilters {
  searchQuery: string;
}

export default function PatrimonyPage() {
  const [showForm, setShowForm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PatrimonyItem | null>(null);
  const [refreshList, setRefreshList] = useState(0);
  const [activeTab, setActiveTab] = useState<'list' | 'dashboard'>('list');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
    company_name: '',
    department: '',
    username: '',
    password: '',
    email: '',
    role: 'user'
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // ✅ SIMPLIFICADO: Apenas um filtro de busca
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchQuery: ''
  });
  
  const [showSearchPanel, setShowSearchPanel] = useState(false);

  // ✅ Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(userData));
    } else {
      setShowLogin(true);
    }
  }, []);

  // ✅ Handler para busca
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchFilters({ searchQuery: value });
    setCurrentPage(1);
    setRefreshList(prev => prev + 1);
  };

  const clearSearch = () => {
    setSearchFilters({ searchQuery: '' });
    setCurrentPage(1);
    setRefreshList(prev => prev + 1);
  };

  const getActiveFilterCount = () => {
    return searchFilters.searchQuery ? 1 : 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const loginRequest: LoginRequest = {
        username: loginData.username,
        password: loginData.password
      };

      const response = await fetch('http://localhost:8080/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginRequest),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        setShowLogin(false);
        setRefreshList(prev => prev + 1);
      } else {
        const errorText = await response.text();
        setLoginError(errorText || 'Credenciais inválidas');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setLoginError('Erro de conexão. Verifique se o servidor está rodando.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError('');

    try {
      const registerRequest: CreateUser = {
        company_name: registerData.company_name,
        department: registerData.department,
        username: registerData.username,
        password: registerData.password,
        email: registerData.email || undefined,
        role: registerData.role
      };

      const response = await fetch('http://localhost:8080/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerRequest),
      });

      if (response.ok) {
        alert('Usuário cadastrado com sucesso! Faça login para continuar.');
        setShowRegister(false);
        setShowLogin(true);
        setRegisterData({
          company_name: '',
          department: '',
          username: '',
          password: '',
          email: '',
          role: 'user'
        });
      } else {
        const errorText = await response.text();
        setRegisterError(errorText || 'Erro ao cadastrar usuário');
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      setRegisterError('Erro de conexão. Verifique se o servidor está rodando.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setShowLogin(true);
    setLoginData({ username: '', password: '' });
  };

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (item: PatrimonyItem) => {
    setSelectedItem(item);
    setShowForm(true);
  };

  const handleTransfer = (item: PatrimonyItem) => {
    setSelectedItem(item);
    setShowTransferModal(true);
  };

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedItem(null);
    setRefreshList(prev => prev + 1);
  };

  const handleRefresh = () => setRefreshList(prev => prev + 1);

  // ✅ Funções para paginação
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const updateTotalItems = (total: number) => {
    setTotalItems(total);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <div className={styles.loginOverlay}>
          <div className={styles.registerModal}>
            <h2 className={styles.modalTitle}>Cadastrar Novo Usuário</h2>
            <form onSubmit={handleRegister}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Empresa/Órgão:</label>
                <input
                  type="text"
                  name="company_name"
                  value={registerData.company_name}
                  onChange={handleRegisterInputChange}
                  className={styles.formInput}
                  required
                  disabled={registerLoading}
                  placeholder="Prefeitura Municipal"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Departamento:</label>
                <select
                  name="department"
                  value={registerData.department}
                  onChange={handleRegisterInputChange}
                  className={styles.formSelect}
                  required
                  disabled={registerLoading}
                >
                  <option value="">Selecione o departamento</option>
                  <option value="education">Educação</option>
                  <option value="health">Saúde</option>
                  <option value="administration">Administração</option>
                  <option value="urbanism">Urbanismo</option>
                  <option value="culture">Cultura</option>
                  <option value="sports">Esportes</option>
                  <option value="transportation">Transporte</option>
                  <option value="finance">Finanças</option>
                  <option value="assistenci">Assistencia Comunitaria</option>
                  <option value="tourism">Turismo</option>
                  <option value="environment">Meio Ambiente</option>
                  <option value="government">Governo</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Usuário:</label>
                <input
                  type="text"
                  name="username"
                  value={registerData.username}
                  onChange={handleRegisterInputChange}
                  className={styles.formInput}
                  required
                  disabled={registerLoading}
                  placeholder="Nome de usuário"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Senha:</label>
                <input
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterInputChange}
                  className={styles.formInput}
                  required
                  disabled={registerLoading}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email (opcional):</label>
                <input
                  type="email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterInputChange}
                  className={styles.formInput}
                  disabled={registerLoading}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tipo de Usuário:</label>
                <select
                  name="role"
                  value={registerData.role}
                  onChange={handleRegisterInputChange}
                  className={styles.formSelect}
                  required
                  disabled={registerLoading}
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {registerError && <div className={styles.errorText}>{registerError}</div>}
              
              <div className={styles.modalButtons}>
                <button 
                  type="button" 
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => setShowRegister(false)}
                  disabled={registerLoading}
                >
                  Voltar
                </button>
                <button 
                  type="submit" 
                  className={`${styles.btn} ${styles.btnSuccess}`}
                  disabled={registerLoading}
                >
                  {registerLoading ? 'Cadastrando...' : 'Cadastrar'}
                </button>
              </div>

              <div className={styles.switchFormText}>
                Já tem uma conta?
                <span 
                  className={styles.switchFormLink}
                  onClick={() => { setShowRegister(false); setShowLogin(true); }}
                >
                  Fazer login
                </span>
              </div>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.loginOverlay}>
        <div className={styles.loginModal}>
          <h2 className={styles.modalTitle}>Sistema de Gestão de Patrimônio</h2>
          <form onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Usuário:</label>
              <input
                type="text"
                name="username"
                value={loginData.username}
                onChange={handleLoginInputChange}
                className={styles.formInput}
                required
                disabled={loginLoading}
                placeholder="Digite seu usuário"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Senha:</label>
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginInputChange}
                className={styles.formInput}
                required
                disabled={loginLoading}
                placeholder="Digite sua senha"
              />
            </div>
            {loginError && <div className={styles.errorText}>{loginError}</div>}
            <div className={styles.modalButtons}>
              <button 
                type="submit" 
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={loginLoading}
              >
                {loginLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>

            <div className={styles.switchFormText}>
              Não tem uma conta?
              <span 
                className={styles.switchFormLink}
                onClick={() => { setShowLogin(false); setShowRegister(true); }}
              >
                Cadastre-se
              </span>
            </div>
            <div className={styles.demoCredentials}>
              <p className={styles.demoTitle}>Credenciais de Demonstração:</p>
              <p className={styles.demoText}>Usuário: <strong>demo</strong></p>
              <p className={styles.demoText}>Senha: <strong>demo123</strong></p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Sistema de Gestão de Patrimônio</title>
        <meta name="description" content="Sistema de gestão de patrimônio para prefeitura" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.topbar}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>SGP</div>
          <div className={styles.headerText}>
            <h1 className={styles.headerTitle}>Sistema de Gestão de Patrimônio</h1>
            <p className={styles.headerSub}>Ambiente Oficial</p>
          </div>
        </div>
        
        <div className={styles.actionsContainer}>
          <div className={styles.userInfo}>
            <span className={styles.userWelcome}>Olá, {currentUser?.username}</span>
            <span className={styles.userRole}>{currentUser?.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
          </div>

          <div className={styles.actionMenu}>
            <button 
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => setShowForm(true)}
              title="Adicionar novo bem patrimonial"
            >
              <span className={styles.btnIcon}>+</span>
              Novo Bem
            </button>

            <button 
              className={`${styles.btn} ${styles.btnInfo}`}
              onClick={handlePrint}
              title="Imprimir relatório"
            >
              <span className={styles.btnIcon}>🖨️</span>
              Imprimir
            </button>

            <Link href="/frota">
              <span 
                className={`${styles.btn} ${styles.btnSecondary}`} 
                title="Ir para o módulo de frota"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
              >
                <span className={styles.btnIcon}>🚛</span>
                Frota
              </span>
            </Link>

            {currentUser?.role === 'admin' && (
              <button 
                className={`${styles.btn} ${styles.btnSuccess}`}
                onClick={() => setShowBackupModal(true)}
                title="Gerenciar backups"
              >
                <span className={styles.btnIcon}>💾</span>
                Backups
              </button>
            )}

            <button 
              className={`${styles.btn} ${styles.btnNeutral}`}
              onClick={handleRefresh}
              title="Atualizar lista"
            >
              <span className={styles.btnIcon}>🔄</span>
              Atualizar
            </button>
          </div>

          <button 
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={handleLogout}
            title="Sair do sistema"
          >
            <span className={styles.btnIcon}>🚪</span>
            Sair
          </button>
        </div>
      </div>

      <div className={styles.tabContainer}>
        <nav className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'list' ? styles.tabActive : ''}`} onClick={() => setActiveTab('list')}>
            <span className={styles.tabIcon}>📋</span>
            Lista de Bens
          </button>
          <button className={`${styles.tab} ${activeTab === 'dashboard' ? styles.tabActive : ''}`} onClick={() => setActiveTab('dashboard')}>
            <span className={styles.tabIcon}>📊</span>
            Dashboard
          </button>
          
          <div className={styles.tabFilter}>
            <button 
              className={styles.filterToggle}
              onClick={() => setShowSearchPanel(!showSearchPanel)}
            >
              <span className={styles.filterIcon}>🔍</span>
              Filtros
              {getActiveFilterCount() > 0 && (
                <span className={styles.filterBadge}>{getActiveFilterCount()}</span>
              )}
            </button>
          </div>
        </nav>

        {/* ✅ Painel de busca único */}
        {showSearchPanel && activeTab === 'list' && (
          <div className={styles.filterPanel}>
            <div className={styles.searchBar}>
              <input
                type="text"
                className={styles.searchInput}
                value={searchFilters.searchQuery}
                onChange={handleSearchChange}
                placeholder="Buscar patrimônio por placa, nome, descrição, departamento, setor, NF ou empenho..."
                autoFocus
              />
              {searchFilters.searchQuery && (
                <button className={styles.clearSearchButton} onClick={clearSearch} title="Limpar busca">
                  ✕
                </button>
              )}
              <div className={styles.searchSummary}>
                {totalItems} registros encontrados
              </div>
            </div>
          </div>
        )}
      </div>

      <main className={styles.mainContent}>
        {activeTab === 'list' ? (
          <>
            <PatrimonyList 
              onEdit={handleEdit} 
              onTransfer={handleTransfer} 
              refreshTrigger={refreshList}
              searchQuery={searchFilters.searchQuery}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onTotalItemsChange={updateTotalItems}
            />

            {totalItems > 0 && (
              <div className={styles.paginationContainer}>
                <div className={styles.paginationInfo}>
                  <span>Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} itens</span>
                </div>
                
                <div className={styles.paginationControls}>
                  <div className={styles.itemsPerPage}>
                    <label>Itens por página:</label>
                    <select 
                      value={itemsPerPage} 
                      onChange={handleItemsPerPageChange}
                      className={styles.itemsPerPageSelect}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className={styles.paginationButtons}>
                    <button
                      className={`${styles.paginationButton} ${styles.paginationPrev}`}
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      ← Anterior
                    </button>
                    
                    <div className={styles.pageNumbers}>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            className={`${styles.pageButton} ${currentPage === pageNum ? styles.pageButtonActive : ''}`}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      {totalPages > 5 && (
                        <span className={styles.pageEllipsis}>...</span>
                      )}
                    </div>
                    
                    <button
                      className={`${styles.paginationButton} ${styles.paginationNext}`}
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Próxima →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
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

      {showPrintModal && (
        <PrintModal
          filters={{ searchQuery: searchFilters.searchQuery }}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {showBackupModal && (
        <BackupModal onClose={() => setShowBackupModal(false)} />
      )}
    </div>   
  );
}