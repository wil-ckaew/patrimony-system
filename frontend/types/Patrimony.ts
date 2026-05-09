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
  sector?: string;
  nfIssueDate?: string;
  supplier?: string;
  invoiceNumber?: string;
  commitmentNumber?: string;
  denfSeNumber?: string;
  invoiceFile?: string;
  commitmentFile?: string;
  denfSeFile?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  isVehicle?: boolean; // indica se o bem é um veículo
  
  // NOVO: Lista de pares (Nota Fiscal + Empenho) para suportar múltiplos documentos
  fiscalDocuments?: FiscalDocument[];
}

// NOVA INTERFACE: Representa um par de Nota Fiscal e Empenho
export interface FiscalDocument {
  id?: string;                 // Identificador único (opcional para novos)
  invoiceNumber: string;      // Número da Nota Fiscal
  invoiceFile?: string;       // URL do arquivo da NF
  invoiceFileName?: string;   // Nome original do arquivo
  commitmentNumber: string;   // Número do Empenho
  commitmentFile?: string;    // URL do arquivo do Empenho
  commitmentFileName?: string;
  issueDate?: string;         // Data de emissão da NF (opcional)
  isLegacy?: boolean;         // Indica se veio do sistema antigo (para compatibilidade)
  
  // Campos internos para upload (não enviar ao backend)
  _invoiceFile?: File;
  _commitmentFile?: File;
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

export interface PatrimonyFormData {
  plate: string;
  name: string;
  description: string;
  acquisition_date: string;
  value: string;
  department: string;
  status: string;
  sector?: string;
  nf_issue_date?: string;
  supplier?: string;
  invoice_number?: string;
  commitment_number?: string;
  denf_se_number?: string;
  is_vehicle?: boolean;
}

export interface FleetItem {
  id: string;
  fleet_number: string;
  patrimony_id: string;
  patrimony_plate?: string;
  patrimony_name?: string;
  patrimony_description?: string; // ✅ Adicionar este campo
  department: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FleetFormData {
  fleetNumber: string;
  patrimonyId: string;
  department: string;
  notes: string;
}

export interface ApiError {
  message: string;
  field?: string;
  type?: string;
}

export interface SearchFilters {
  plate: string;
  name: string;
  department: string;
  status: string;
  sector: string;
  supplier: string;
}