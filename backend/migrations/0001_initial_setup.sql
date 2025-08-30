-- Tabela de patrimônios
CREATE TABLE IF NOT EXISTS patrimonies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    description TEXT,
    acquisition_date DATE,
    value DECIMAL(10, 2),
    department VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'active',
    image_url VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de transferências
CREATE TABLE IF NOT EXISTS transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patrimony_id UUID REFERENCES patrimonies(id) ON DELETE CASCADE,
    from_department VARCHAR NOT NULL,
    to_department VARCHAR NOT NULL,
    reason TEXT,
    transferred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

