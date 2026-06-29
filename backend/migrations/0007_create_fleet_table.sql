-- Criar tabela de frota para registrar veículos vinculados ao patrimônio
CREATE TABLE IF NOT EXISTS fleets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fleet_number VARCHAR NOT NULL UNIQUE,
    patrimony_id UUID NOT NULL REFERENCES patrimonies(id) ON DELETE CASCADE,
    department VARCHAR NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE fleets IS 'Tabela de frota vinculada a bens patrimoniais';
COMMENT ON COLUMN fleets.fleet_number IS 'Número único da frota';
COMMENT ON COLUMN fleets.patrimony_id IS 'Referência ao patrimônio do veículo';
COMMENT ON COLUMN fleets.department IS 'Secretaria responsável pela frota';
COMMENT ON COLUMN fleets.notes IS 'Observações adicionais sobre a frota';
