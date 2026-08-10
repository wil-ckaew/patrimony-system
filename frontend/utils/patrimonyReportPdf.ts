import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePatrimonyPDF = (data: any[], title = 'Relatório de Patrimônio') => {
  const doc = new jsPDF();

  const now = new Date().toLocaleString();

  doc.setFontSize(16);
  doc.text('SISTEMA DE PATRIMÔNIO', 14, 15);

  doc.setFontSize(12);
  doc.text(title, 14, 25);

  doc.setFontSize(10);
  doc.text(`Gerado em: ${now}`, 14, 32);
  doc.text(`Total: ${data.length}`, 14, 38);

  autoTable(doc, {
    startY: 45,
    head: [[
      'Placa',
      'Nome',
      'Departamento',
      'Status',
      'Valor'
    ]],
    body: data.map(item => [
      item.plate || '',
      item.name || '',
      item.department || '',
      item.status || '',
      item.value || ''
    ])
  });

  doc.save(`relatorio-patrimonio-${Date.now()}.pdf`);
};