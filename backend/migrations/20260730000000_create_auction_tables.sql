-- ============================================
-- MIGRAÇÃO: Tabelas do Módulo de Leilões
-- Data: 2026-07-30
-- ============================================

-- 1. Tabela de Leilões
CREATE TABLE IF NOT EXISTS auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_number VARCHAR(50) NOT NULL UNIQUE,
    edital_number VARCHAR(50),
    auction_date DATE,
    auctioneer VARCHAR(100),
    company VARCHAR(100),
    status VARCHAR(50) DEFAULT 'EM_PREPARACAO',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Veículos do Leilão
CREATE TABLE IF NOT EXISTS auction_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES patrimonies(id) ON DELETE CASCADE,
    sold_value DECIMAL(12,2),
    buyer_name VARCHAR(255),
    buyer_document VARCHAR(50),
    detran_status VARCHAR(50) DEFAULT 'PENDENTE',
    protocol_number VARCHAR(100),
    chassi_photo_path TEXT,
    plate_photo_path TEXT,
    front_photo_path TEXT,
    rear_photo_path TEXT,
    engine_photo_path TEXT,
    document_path TEXT,
    detran_request_date DATE,
    detran_protocol VARCHAR(100),
    detran_observation TEXT,
    sale_date DATE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de PDFs do Leilão
CREATE TABLE IF NOT EXISTS auction_pdfs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_path TEXT NOT NULL,
    file_name VARCHAR(255),
    uploaded_by VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Histórico do Leilão
CREATE TABLE IF NOT EXISTS auction_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_vehicle_id UUID REFERENCES auction_vehicles(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    user_name VARCHAR(100),
    changes JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Logs do Leilão
CREATE TABLE IF NOT EXISTS auction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES patrimonies(id) ON DELETE SET NULL,
    auction_id UUID REFERENCES auctions(id) ON DELETE SET NULL,
    user_name VARCHAR(100),
    action VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_auction_number ON auctions(auction_number);
CREATE INDEX IF NOT EXISTS idx_auction_vehicles_auction_id ON auction_vehicles(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_vehicles_vehicle_id ON auction_vehicles(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_auction_vehicles_detran_status ON auction_vehicles(detran_status);
CREATE INDEX IF NOT EXISTS idx_auction_pdfs_auction_id ON auction_pdfs(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_history_auction_vehicle_id ON auction_history(auction_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_auction_logs_auction_id ON auction_logs(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_logs_vehicle_id ON auction_logs(vehicle_id);

-- ============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE auctions IS 'Tabela principal de leilões';
COMMENT ON TABLE auction_vehicles IS 'Veículos associados aos leilões';
COMMENT ON TABLE auction_pdfs IS 'Documentos PDF dos leilões';
COMMENT ON TABLE auction_history IS 'Histórico de alterações dos veículos em leilão';
COMMENT ON TABLE auction_logs IS 'Logs de ações do módulo de leilões';

-- ============================================
-- VERIFICAR SE AS TABELAS FORAM CRIADAS
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration de leilões concluída com sucesso!';
    RAISE NOTICE '📊 Tabelas: auctions, auction_vehicles, auction_pdfs, auction_history, auction_logs';
END $$;
