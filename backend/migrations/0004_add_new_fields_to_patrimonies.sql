-- Adicionar novos campos à tabela patrimonies, se ainda não existirem
ALTER TABLE patrimonies 
ADD COLUMN IF NOT EXISTS sector VARCHAR DEFAULT 'Setor Padrão',
ADD COLUMN IF NOT EXISTS nf_issue_date DATE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS supplier VARCHAR DEFAULT 'Fornecedor Padrão';

-- Comentários para documentação
COMMENT ON COLUMN patrimonies.sector IS 'Setor específico dentro do departamento';
COMMENT ON COLUMN patrimonies.nf_issue_date IS 'Data de emissão da Nota Fiscal';
COMMENT ON COLUMN patrimonies.supplier IS 'Fornecedor do bem patrimonial';

-- Atualizar dados existentes para os novos campos, se estiverem NULL
UPDATE patrimonies
SET 
    sector = COALESCE(sector, department),
    nf_issue_date = COALESCE(nf_issue_date, acquisition_date),
    supplier = COALESCE(supplier, 'Fornecedor Padrão')
WHERE sector IS NULL OR nf_issue_date IS NULL OR supplier IS NULL;
