-- Criar tabela de documentos fiscais para suportar múltiplos pares NF+Empenho
CREATE TABLE IF NOT EXISTS fiscal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patrimony_id UUID REFERENCES patrimonies(id) ON DELETE CASCADE,
    invoice_number VARCHAR,
    commitment_number VARCHAR,
    invoice_file VARCHAR,
    commitment_file VARCHAR,
    nf_issue_date DATE,
    supplier VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE fiscal_documents IS 'Tabela de documentos fiscais associados a um bem patrimonial';
COMMENT ON COLUMN fiscal_documents.invoice_number IS 'Número da nota fiscal';
COMMENT ON COLUMN fiscal_documents.commitment_number IS 'Número do empenho';
COMMENT ON COLUMN fiscal_documents.invoice_file IS 'URL do arquivo de nota fiscal';
COMMENT ON COLUMN fiscal_documents.commitment_file IS 'URL do arquivo de empenho';
COMMENT ON COLUMN fiscal_documents.nf_issue_date IS 'Data de emissão da nota fiscal associada';
COMMENT ON COLUMN fiscal_documents.supplier IS 'Fornecedor vinculado ao documento fiscal';
