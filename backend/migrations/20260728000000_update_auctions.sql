-- ============================================
-- ATUALIZAÇÃO COMPLETA DO MÓDULO DE LEILÕES
-- Adiciona todos os campos necessários
-- ============================================

-- 1. Adicionar campos na tabela fleet (para veículos)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='fleet' AND column_name='chassi') THEN
        ALTER TABLE fleet ADD COLUMN chassi VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='fleet' AND column_name='renavam') THEN
        ALTER TABLE fleet ADD COLUMN renavam VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='fleet' AND column_name='model') THEN
        ALTER TABLE fleet ADD COLUMN model VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='fleet' AND column_name='year') THEN
        ALTER TABLE fleet ADD COLUMN year INTEGER;
    END IF;
END $$;

-- 2. Adicionar campos na tabela auction_vehicles
ALTER TABLE auction_vehicles 
ADD COLUMN IF NOT EXISTS chassi_photo_path TEXT,
ADD COLUMN IF NOT EXISTS plate_photo_path TEXT,
ADD COLUMN IF NOT EXISTS front_photo_path TEXT,
ADD COLUMN IF NOT EXISTS rear_photo_path TEXT,
ADD COLUMN IF NOT EXISTS engine_photo_path TEXT,
ADD COLUMN IF NOT EXISTS document_path TEXT,
ADD COLUMN IF NOT EXISTS detran_request_date DATE,
ADD COLUMN IF NOT EXISTS detran_protocol VARCHAR(100),
ADD COLUMN IF NOT EXISTS detran_observation TEXT,
ADD COLUMN IF NOT EXISTS sale_date DATE,
ADD COLUMN IF NOT EXISTS sale_value NUMERIC(12,2);

-- 3. Criar tabela de histórico de veículos leiloados
CREATE TABLE IF NOT EXISTS auction_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_vehicle_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    user_name VARCHAR(255),
    changes JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (auction_vehicle_id) REFERENCES auction_vehicles(id) ON DELETE CASCADE
);

-- 4. Criar tabela de documentos do leilão (PDFs)
CREATE TABLE IF NOT EXISTS auction_pdfs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_path TEXT NOT NULL,
    file_name VARCHAR(255),
    uploaded_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE
);

-- 5. Índices para pesquisa avançada
CREATE INDEX IF NOT EXISTS idx_fleet_chassi ON fleet(chassi);
CREATE INDEX IF NOT EXISTS idx_fleet_renavam ON fleet(renavam);
CREATE INDEX IF NOT EXISTS idx_auction_vehicles_buyer ON auction_vehicles(buyer_name);
CREATE INDEX IF NOT EXISTS idx_auction_vehicles_detran ON auction_vehicles(detran_status);
CREATE INDEX IF NOT EXISTS idx_auction_pdfs_auction ON auction_pdfs(auction_id);

-- 6. View para relatório completo de veículos leiloados
CREATE OR REPLACE VIEW vw_auction_full_report AS
SELECT 
    a.id AS auction_id,
    a.auction_number,
    a.edital_number,
    a.auction_date,
    a.auctioneer,
    a.company,
    a.status AS auction_status,
    a.notes AS auction_notes,
    f.id AS vehicle_id,
    f.fleet_number,
    f.patrimony_name,
    f.patrimony_plate,
    f.chassi,
    f.renavam,
    f.model,
    f.year,
    f.department,
    f.sector,
    av.id AS auction_vehicle_id,
    av.sold_value,
    av.buyer_name,
    av.buyer_document,
    av.detran_status,
    av.detran_protocol,
    av.detran_request_date,
    av.sale_date,
    av.chassi_photo_path,
    av.plate_photo_path,
    av.front_photo_path,
    av.rear_photo_path,
    av.engine_photo_path,
    av.document_path
FROM auctions a
LEFT JOIN auction_vehicles av ON av.auction_id = a.id
LEFT JOIN fleet f ON f.id = av.vehicle_id
WHERE a.status IN ('REALIZADO', 'FINALIZADO', 'BAIXA_CONCLUIDA');

-- 7. Função para registrar histórico automaticamente
CREATE OR REPLACE FUNCTION log_auction_history()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO auction_history (
            auction_vehicle_id,
            action,
            old_status,
            new_status,
            user_name,
            changes
        )
        VALUES (
            NEW.id,
            'ALTERACAO',
            OLD.detran_status,
            NEW.detran_status,
            CURRENT_USER,
            jsonb_build_object(
                'old', row_to_json(OLD),
                'new', row_to_json(NEW)
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para histórico automático
DROP TRIGGER IF EXISTS trigger_auction_history ON auction_vehicles;
CREATE TRIGGER trigger_auction_history
    AFTER UPDATE OF detran_status ON auction_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION log_auction_history();

-- 9. Mensagem de conclusão
DO $$
BEGIN
    RAISE NOTICE '✅ Atualização do módulo de Leilões concluída!';
    RAISE NOTICE '📊 Novas colunas adicionadas em fleet: chassi, renavam, model, year';
    RAISE NOTICE '📊 Novas colunas adicionadas em auction_vehicles: fotos, documentos, DETRAN';
    RAISE NOTICE '📊 Nova tabela: auction_history';
    RAISE NOTICE '📊 Nova tabela: auction_pdfs';
    RAISE NOTICE '📊 Nova view: vw_auction_full_report';
    RAISE NOTICE '🔒 Nenhum dado existente foi alterado ou removido!';
END $$;
