//types/Patrimony.ts
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
  written_off: number;
  totalValue: number;
  byDepartment: DepartmentStats[];
}