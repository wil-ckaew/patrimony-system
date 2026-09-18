// frontend/lib/api.ts
const API_URL = '/api';
const BACKEND_URL = '';

if (typeof window !== 'undefined') {
  console.log('========================================');
  console.log('🔧 API_URL:', API_URL, '(relativa)');
  console.log('🌐 Host:', window.location.host);
  console.log('========================================');
}

export const API_BASE_URL = API_URL;
export const BACKEND_BASE_URL = BACKEND_URL;

export const apiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};

export const fileUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return cleanPath;
};

export default API_URL;
