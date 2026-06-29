// utils/auth.ts

export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');

  if (!token) {
    console.error('No token found in localStorage');
    throw new Error('No token found');
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const clearAuth = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const handleAuthError = (response: Response): boolean => {
  if (response.status === 401 || response.status === 403) {
    clearAuth();
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

// ✅ CORREÇÃO: Verificação de placa com busca EXATA usando o novo endpoint
export const checkPlateExists = async (plate: string): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;

    // ✅ USANDO O NOVO ENDPOINT COM BUSCA EXATA
    const response = await fetch(`http://localhost:8080/api/patrimony/check-plate?plate=${encodeURIComponent(plate)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`🔍 Verificando placa "${plate}":`, data);
      return data.exists === true;
    }
    
    // ✅ FALLBACK: Se o novo endpoint não existir, faz a verificação manual
    console.warn('⚠️ Novo endpoint não disponível, usando fallback...');
    return await checkPlateExistsFallback(plate);
    
  } catch (error) {
    console.error('Erro ao verificar placa:', error);
    // ✅ FALLBACK: Se der erro, tenta a verificação manual
    try {
      return await checkPlateExistsFallback(plate);
    } catch (fallbackError) {
      console.error('Erro no fallback:', fallbackError);
      return false;
    }
  }
};

// ✅ FUNÇÃO DE FALLBACK: Busca todos e verifica exatamente
export const checkPlateExistsFallback = async (plate: string): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;

    // Buscar todos os patrimônios
    const response = await fetch('http://localhost:8080/api/patrimony', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      // ✅ VERIFICAÇÃO EXATA - comparação estrita
      return data.some((item: any) => item.plate === plate);
    }
    return false;
  } catch (error) {
    console.error('Erro no fallback ao verificar placa:', error);
    return false;
  }
};

// ✅ FUNÇÃO PARA VERIFICAR PLACA COM BUSCA PARCIAL (SE NECESSÁRIO PARA OUTROS FINS)
export const checkPlateExistsPartial = async (plate: string): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const response = await fetch(`http://localhost:8080/api/patrimony?plate=${encodeURIComponent(plate)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      // ⚠️ BUSCA PARCIAL - pode encontrar 6183 quando busca 26183
      return data.some((item: any) => item.plate.includes(plate));
    }
    return false;
  } catch (error) {
    console.error('Erro ao verificar placa (parcial):', error);
    return false;
  }
};

// ✅ FUNÇÃO PARA OBTER TODOS OS PATRIMÔNIOS (ÚTIL PARA DEBUG)
export const getAllPatrimonies = async (): Promise<any[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return [];

    const response = await fetch('http://localhost:8080/api/patrimony', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Erro ao buscar patrimônios:', error);
    return [];
  }
};