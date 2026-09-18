// utils/fiscalDocuments.ts
import { PatrimonyItem, FiscalDocument } from '../types/Patrimony';

/**
 * Converte dados antigos (campos únicos) para o novo formato de lista
 */
export function convertLegacyToFiscalDocuments(item: PatrimonyItem): FiscalDocument[] {
  const documents: FiscalDocument[] = [];
  
  // Se já existe o novo formato, usa ele
  if (item.fiscalDocuments && item.fiscalDocuments.length > 0) {
    return item.fiscalDocuments;
  }
  
  // Converte os dados antigos se existirem
  if (item.invoiceNumber || item.commitmentNumber || item.invoiceFile || item.commitmentFile) {
    documents.push({
      id: 'legacy-1',
      invoiceNumber: item.invoiceNumber || '',
      invoiceFile: item.invoiceFile,
      commitmentNumber: item.commitmentNumber || '',
      commitmentFile: item.commitmentFile,
      issueDate: item.nfIssueDate,
      isLegacy: true // Marca como dado legado
    });
  }
  
  return documents;
}

/**
 * Prepara os dados para envio ao backend (combina novo e antigo)
 */
export function prepareFiscalDataForSubmit(fiscalDocuments: FiscalDocument[], legacyData?: {
  invoiceNumber?: string;
  commitmentNumber?: string;
  invoiceFile?: string;
  commitmentFile?: string;
  nfIssueDate?: string;
}) {
  // Se tem documentos no novo formato, usa eles
  if (fiscalDocuments.length > 0) {
    return fiscalDocuments.filter(doc => 
      doc.invoiceNumber || doc.commitmentNumber || doc.invoiceFile || doc.commitmentFile
    );
  }
  
  // Se tem dados legados, converte
  if (legacyData && (legacyData.invoiceNumber || legacyData.commitmentNumber)) {
    return [{
      invoiceNumber: legacyData.invoiceNumber || '',
      commitmentNumber: legacyData.commitmentNumber || '',
      invoiceFile: legacyData.invoiceFile,
      commitmentFile: legacyData.commitmentFile,
      issueDate: legacyData.nfIssueDate
    }];
  }
  
  return [];
}