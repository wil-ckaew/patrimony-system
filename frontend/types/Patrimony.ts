// types/Patrimony.ts
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
  isVehicle?: boolean;
  fiscalDocuments?: FiscalDocument[];
  // ✅ ADICIONE OS NOVOS CAMPOS
  fleetNumber?: string;
  fleetNotes?: string;
}

// =========================
// DOCUMENTOS FISCAIS
// =========================
export interface FiscalDocument {
  id?: string;
  invoiceNumber: string;
  invoiceFile?: string;
  invoiceFileName?: string;
  commitmentNumber: string;
  commitmentFile?: string;
  commitmentFileName?: string;
  issueDate?: string;
  isLegacy?: boolean;

  _invoiceFile?: File;
  _commitmentFile?: File;
}

// =========================
// TRANSFERÊNCIA
// =========================
export interface TransferRequest {
  patrimonyId: string;
  fromDepartment: string;
  toDepartment: string;
  reason: string;
}

// =========================
// DEPARTAMENTO
// =========================
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

// =========================
// USUÁRIO
// =========================
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

// =========================
// FORMULÁRIO
// =========================
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

// =========================
// 🚨 FROTA CORRIGIDA (IMPORTANTE)
// =========================
export interface FleetItem {
  id: string;

  fleet_number: string;
  patrimony_id: string;

  // 👇 nomes corretos usados no print
  patrimony_plate?: string;
  patrimony_name?: string;
  patrimony_description?: string;

  department: string;

  // 👇 AGORA EXISTE PARA NÃO QUEBRAR SEU PRINT
  sector?: string;

  notes?: string;

  created_at: string;
  updated_at: string;
}

// =========================
// FORM FROTA
// =========================
export interface FleetFormData {
  fleetNumber: string;
  patrimonyId: string;
  department: string;
  notes: string;
}

// =========================
// ERRO API
// =========================
export interface ApiError {
  message: string;
  field?: string;
  type?: string;
}

// =========================
// FILTROS
// =========================
export interface SearchFilters {
  plate: string;
  name: string;
  department: string;
  status: string;
  sector: string;
  supplier: string;
}