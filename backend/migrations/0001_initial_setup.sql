-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR NOT NULL,
    department VARCHAR NOT NULL,
    username VARCHAR NOT NULL UNIQUE,
    password_hash VARCHAR NOT NULL,
    email VARCHAR,
    role VARCHAR NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
    invoice_number VARCHAR,          -- Nº NF
    commitment_number VARCHAR,       -- Nº empenho
    denf_se_number VARCHAR,          -- Nº DENF/SE
    invoice_file VARCHAR,            -- Arquivo NF (PDF)
    commitment_file VARCHAR,         -- Arquivo empenho (PDF)
    denf_se_file VARCHAR,            -- Arquivo DENF/SE (PDF)
    image_url VARCHAR,
    created_by UUID REFERENCES users(id),
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
    transferred_by UUID REFERENCES users(id),
    transferred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

