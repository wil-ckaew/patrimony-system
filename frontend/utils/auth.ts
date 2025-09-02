// utils/auth.ts
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const handleAuthError = (response: Response): boolean => {
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert('Sessão expirada. Faça login novamente.');
    window.location.reload();
    return true;
  }
  return false;
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

// ✅ CORREÇÃO: Função para verificar validade do token
export const checkTokenValidity = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const response = await fetch('http://localhost:8080/api/health', {
      headers: getAuthHeaders(),
    });

    return response.ok;
  } catch (error) {
    return false;
  }
};

// Adicione esta função em utils/auth.ts ou no mesmo arquivo
export const checkPlateExists = async (plate: string): Promise<boolean> => {
  try {
    const response = await fetch(`http://localhost:8080/api/patrimony?plate=${plate}`, {
      headers: getAuthHeaders(),
    });
    
    if (response.ok) {
      const patrimonies = await response.json();
      return patrimonies.length > 0;
    }
    return false;
  } catch (error) {
    console.error('Erro ao verificar placa:', error);
    return false;
  }
};