// types/Patrimony.ts
export interface PatrimonyItem {
  id: string;
  plate: string;
  name: string;
  description: string;
  acquisitionDate: string;
  value: number;
  department: string;
  status: 'active' | 'inactive' | 'maintenance' | 'written_off';
  imageUrl?: string;
  invoiceNumber?: string;
  commitmentNumber?: string;
  denfSeNumber?: string;
  invoiceFile?: string;
  commitmentFile?: string;
  denfSeFile?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferRequest {
  patrimonyId: string;
  fromDepartment: string;
  toDepartment: string;
  reason: string;
}

export interface Department {
  id: string;
  name: string;
  manager: string;
  phone: string;
}

export interface DepartmentStats {
  department: string;
  count: number;
  totalValue: number;
}

export interface Stats {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
  writtenOff: number;
  totalValue: number;
  byDepartment: DepartmentStats[];
}

export interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
  company_name: string;
  department: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateUser {
  company_name: string;
  department: string;
  username: string;
  password: string;
  email?: string;
  role?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// Interface para o formulário de patrimônio (opcional)
export interface PatrimonyFormData {
  plate: string;
  name: string;
  description: string;
  acquisition_date: string;
  value: string;
  department: string;
  status: string;
}