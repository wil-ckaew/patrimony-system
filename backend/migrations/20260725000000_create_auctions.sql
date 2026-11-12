-- ============================================
-- MÓDULO DE LEILÕES - MIGRAÇÃO COMPLETA
-- ============================================
-- Esta migração NÃO apaga dados existentes
-- Apenas ADICIONA novas tabelas e colunas
-- ============================================

-- 1. Criar tabela de leilões
CREATE TABLE IF NOT EXISTS auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_number VARCHAR(100) NOT NULL UNIQUE,
    edital_number VARCHAR(100),
    auction_date DATE,
    auctioneer VARCHAR(255),
    company VARCHAR(255),
    status VARCHAR(50) DEFAULT 'EM_PREPARACAO',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Criar tabela de relação leilão-veículos
CREATE TABLE IF NOT EXISTS auction_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID NOT NULL,
    vehicle_id UUID NOT NULL,
    sold_value NUMERIC(12,2),
    buyer_name VARCHAR(255),
    buyer_document VARCHAR(50),
    detran_status VARCHAR(50) DEFAULT 'PENDENTE',
    protocol_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES fleet(id) ON DELETE CASCADE,
    UNIQUE(auction_id, vehicle_id)
);

-- 3. Criar tabela de fotos do veículo no leilão
CREATE TABLE IF NOT EXISTS auction_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_vehicle_id UUID NOT NULL,
    photo_type VARCHAR(50) NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (auction_vehicle_id) REFERENCES auction_vehicles(id) ON DELETE CASCADE
);

-- 4. Criar tabela de documentos do leilão
CREATE TABLE IF NOT EXISTS auction_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_path TEXT NOT NULL,
    file_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE
);

-- 5. ADICIONAR COLUNAS NA TABELA fleet (SEM APAGAR DADOS EXISTENTES)
-- Verifica se a coluna existe antes de adicionar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='fleet' AND column_name='auctioned') THEN
        ALTER TABLE fleet ADD COLUMN auctioned BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='fleet' AND column_name='auction_date') THEN
        ALTER TABLE fleet ADD COLUMN auction_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='fleet' AND column_name='read_only') THEN
        ALTER TABLE fleet ADD COLUMN read_only BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 6. Criar tabela de histórico de auditoria
CREATE TABLE IF NOT EXISTS auction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID,
    auction_id UUID,
    user_name VARCHAR(255),
    action VARCHAR(100),
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (vehicle_id) REFERENCES fleet(id) ON DELETE SET NULL,
    FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE SET NULL
);

-- 7. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auction_vehicles_auction ON auction_vehicles(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_vehicles_vehicle ON auction_vehicles(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_auctioned ON fleet(auctioned);
CREATE INDEX IF NOT EXISTS idx_fleet_read_only ON fleet(read_only);
CREATE INDEX IF NOT EXISTS idx_auction_logs_vehicle ON auction_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_auction_logs_auction ON auction_logs(auction_id);

-- 8. Criar função para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Triggers para updated_at
DROP TRIGGER IF EXISTS update_auctions_updated_at ON auctions;
CREATE TRIGGER update_auctions_updated_at
    BEFORE UPDATE ON auctions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_auction_vehicles_updated_at ON auction_vehicles;
CREATE TRIGGER update_auction_vehicles_updated_at
    BEFORE UPDATE ON auction_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Criar view para relatório de veículos leiloados
CREATE OR REPLACE VIEW vw_auctioned_vehicles AS
SELECT 
    f.id AS vehicle_id,
    f.fleet_number,
    f.patrimony_name,
    f.patrimony_plate,
    f.department,
    f.auctioned,
    f.auction_date,
    a.id AS auction_id,
    a.auction_number,
    a.edital_number,
    a.auction_date AS auction_date_realized,
    av.sold_value,
    av.buyer_name,
    av.buyer_document,
    av.detran_status,
    av.protocol_number
FROM fleet f
LEFT JOIN auction_vehicles av ON av.vehicle_id = f.id
LEFT JOIN auctions a ON a.id = av.auction_id
WHERE f.auctioned = TRUE;

-- 11. Mensagem de conclusão
DO $$
BEGIN
    RAISE NOTICE '✅ Migração do módulo de Leilões concluída com sucesso!';
    RAISE NOTICE '📊 Tabelas criadas: auctions, auction_vehicles, auction_photos, auction_documents, auction_logs';
    RAISE NOTICE '📝 Colunas adicionadas em fleet: auctioned, auction_date, read_only';
    RAISE NOTICE '🔒 Nenhum dado existente foi alterado ou removido';
END $$;
