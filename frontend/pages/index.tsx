// pages/patrimony/index.tsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import PatrimonyList from '../components/PatrimonyList';
import PatrimonyForm from '../components/PatrimonyForm';
import TransferModal from '../components/TransferModal';
import Dashboard from '../components/Dashboard';
import { PatrimonyItem, LoginRequest, CreateUser, User } from '../types/Patrimony';

export default function PatrimonyPage() {
  const [showForm, setShowForm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
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

  // Verificar autenticação ao carregar a página
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
        const data = await response.json();
        alert('Usuário cadastrado com sucesso! Faça login para continuar.');
        setShowRegister(false);
        setShowLogin(true);
        // Limpar dados do formulário
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

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedItem(null);
    setRefreshList(prev => prev + 1);
  };

  const handleRefresh = () => setRefreshList(prev => prev + 1);

  const styles: { [key: string]: React.CSSProperties } = {
    container: { minHeight: '100vh', background: '#f9fafb', fontFamily: 'Inter, sans-serif' },
    topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1e3a8a', color: 'white', padding: '12px 24px', flexWrap: 'wrap', gap: '15px' },
    logo: { fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '1px' },
    headerText: { display: 'flex', flexDirection: 'column', marginLeft: '12px' },
    headerTitle: { margin: 0, fontSize: '18px', fontWeight: 600 },
    headerSub: { margin: 0, fontSize: '13px', opacity: 0.8 },
    userInfo: { display: 'flex', alignItems: 'center', gap: '10px', marginRight: '10px' },
    actionsContainer: { display: 'flex', gap: '10px', alignItems: 'center' },
    btn: { padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' },
    btnPrimary: { background: '#2563eb', color: 'white' },
    btnSecondary: { background: '#6b7280', color: 'white' },
    btnDanger: { background: '#dc2626', color: 'white' },
    btnSuccess: { background: '#059669', color: 'white' },
    tabs: { display: 'flex', background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 24px', gap: '10px' },
    tab: { padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#6b7280', borderBottom: '3px solid transparent', transition: 'all 0.3s ease' },
    tabActive: { color: '#2563eb', borderBottomColor: '#2563eb', fontWeight: 600 },
    mainContent: { padding: '24px' },
    loginOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    loginModal: { background: 'white', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '400px' },
    registerModal: { background: 'white', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' },
    modalTitle: { margin: '0 0 20px 0', textAlign: 'center', color: '#333' },
    formGroup: { marginBottom: '15px' },
    formLabel: { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' },
    formInput: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' },
    formSelect: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: 'white' },
    errorText: { color: '#dc2626', textAlign: 'center', margin: '10px 0', fontSize: '14px' },
    modalButtons: { display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' },
    switchFormText: { textAlign: 'center', marginTop: '15px', color: '#666', fontSize: '14px' },
    switchFormLink: { color: '#2563eb', cursor: 'pointer', textDecoration: 'underline', marginLeft: '5px' }
  };

  // Se não está autenticado, mostrar tela de login ou cadastro
  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <div style={styles.loginOverlay}>
          <div style={styles.registerModal}>
            <h2 style={styles.modalTitle}>Cadastrar Novo Usuário</h2>
            <form onSubmit={handleRegister}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Empresa/Órgão:</label>
                <input
                  type="text"
                  name="company_name"
                  value={registerData.company_name}
                  onChange={handleRegisterInputChange}
                  style={styles.formInput}
                  required
                  disabled={registerLoading}
                  placeholder="Prefeitura Municipal"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Departamento:</label>
                <select
                  name="department"
                  value={registerData.department}
                  onChange={handleRegisterInputChange}
                  style={styles.formSelect}
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
                  <option value="tourism">Turismo</option>
                  <option value="environment">Meio Ambiente</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Usuário:</label>
                <input
                  type="text"
                  name="username"
                  value={registerData.username}
                  onChange={handleRegisterInputChange}
                  style={styles.formInput}
                  required
                  disabled={registerLoading}
                  placeholder="Nome de usuário"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Senha:</label>
                <input
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterInputChange}
                  style={styles.formInput}
                  required
                  disabled={registerLoading}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Email (opcional):</label>
                <input
                  type="email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterInputChange}
                  style={styles.formInput}
                  disabled={registerLoading}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Tipo de Usuário:</label>
                <select
                  name="role"
                  value={registerData.role}
                  onChange={handleRegisterInputChange}
                  style={styles.formSelect}
                  required
                  disabled={registerLoading}
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {registerError && <div style={styles.errorText}>{registerError}</div>}
              
              <div style={styles.modalButtons}>
                <button 
                  type="button" 
                  style={{ ...styles.btn, ...styles.btnSecondary }}
                  onClick={() => setShowRegister(false)}
                  disabled={registerLoading}
                >
                  Voltar
                </button>
                <button 
                  type="submit" 
                  style={{ ...styles.btn, ...styles.btnSuccess }}
                  disabled={registerLoading}
                >
                  {registerLoading ? 'Cadastrando...' : 'Cadastrar'}
                </button>
              </div>

              <div style={styles.switchFormText}>
                Já tem uma conta?
                <span 
                  style={styles.switchFormLink}
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
      <div style={styles.loginOverlay}>
        <div style={styles.loginModal}>
          <h2 style={styles.modalTitle}>Sistema de Gestão de Patrimônio</h2>
          <form onSubmit={handleLogin}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Usuário:</label>
              <input
                type="text"
                name="username"
                value={loginData.username}
                onChange={handleLoginInputChange}
                style={styles.formInput}
                required
                disabled={loginLoading}
                placeholder="Digite seu usuário"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Senha:</label>
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginInputChange}
                style={styles.formInput}
                required
                disabled={loginLoading}
                placeholder="Digite sua senha"
              />
            </div>
            {loginError && <div style={styles.errorText}>{loginError}</div>}
            <div style={styles.modalButtons}>
              <button 
                type="submit" 
                style={{ ...styles.btn, ...styles.btnPrimary }}
                disabled={loginLoading}
              >
                {loginLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>

            <div style={styles.switchFormText}>
              Não tem uma conta?
              <span 
                style={styles.switchFormLink}
                onClick={() => { setShowLogin(false); setShowRegister(true); }}
              >
                Cadastre-se
              </span>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
          <div style={styles.userInfo}>
            <span>Olá, {currentUser?.username}</span>
          </div>
          
          {/* ✅ BOTÃO NOVO BEM ADICIONADO AQUI */}
          <button 
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={() => setShowForm(true)}
            title="Adicionar novo bem patrimonial"
          >
            Novo Bem
          </button>
          
          <button 
            style={{ ...styles.btn, ...styles.btnSecondary }}
            onClick={handleRefresh}
            title="Atualizar lista"
          >
            Atualizar
          </button>
          
          <button 
            style={{ ...styles.btn, ...styles.btnDanger }}
            onClick={handleLogout}
            title="Sair do sistema"
          >
            Sair
          </button>
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