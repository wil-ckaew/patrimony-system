// frontend/utils/departments.ts

// Shared helper functions and data for department display
// This prevents duplication across components and keeps naming/colors consistent.

export const departmentNames: { [key: string]: string } = {
  education: 'Educação',
  health: 'Saúde',
  administration: 'Administração',
  urbanism: 'Urbanismo',
  culture: 'Cultura',
  sports: 'Esportes',
  transportation: 'Transporte',
  finance: 'Finanças',
  assistenci: 'Assitencia Comunitaria',
  tourism: 'Turismo',
  environment: 'Meio Ambiente',
  government: 'Governo',
};

export function getDepartmentName(dept: string) {
  return departmentNames[dept] || dept;
}

export const departmentColors: { [key: string]: string } = {
  education: '#4caf50',
  health: '#f44336',
  administration: '#2196f3',
  urbanism: '#ff9800',
  culture: '#9c27b0',
  sports: '#00bcd4',
  transportation: '#607d8b',
  finance: '#ffeb3b',
  tourism: '#795548',
  environment: '#8bc34a',
  government: '#c34ac3',
};

export function getDepartmentColor(dept: string) {
  return departmentColors[dept] || '#cccccc';
}
