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

-- Tabela de patrimônios (atualizada)
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
    image_url VARCHAR,               -- Imagem do bem
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

-- Inserir usuário administrador inicial (senha: admin123)
INSERT INTO users (company_name, department, username, password_hash, email, role) VALUES
('Prefeitura Municipal', 'Administração', 'admin', '$2b$12$L5V5c5u5c5u5c5u5c5u5uO5c5u5c5u5c5u5c5u5c5u5c5u5c5u5c5u', 'admin@prefeitura.gov.br', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Inserir dados iniciais de patrimônio (atualizado com os novos campos)
INSERT INTO patrimonies (
    plate, 
    name, 
    description, 
    acquisition_date, 
    value, 
    department, 
    status,
    invoice_number,
    commitment_number,
    denf_se_number,
    created_by
) VALUES
('EDU001', 'Cadeira Escolar', 'Cadeira para sala de aula', '2023-01-15', 150.00, 'education', 'active', 'NF20230115001', 'EMP20230115001', 'DENF20230115001', (SELECT id FROM users WHERE username = 'admin')),
('SAU001', 'Maca Hospitalar', 'Maca para atendimento', '2023-02-20', 1200.00, 'health', 'active', 'NF20230220001', 'EMP20230220001', 'DENF20230220001', (SELECT id FROM users WHERE username = 'admin')),
('ADM001', 'Computador', 'Computador para administração', '2023-03-10', 2500.00, 'administration', 'active', 'NF20230310001', 'EMP20230310001', 'DENF20230310001', (SELECT id FROM users WHERE username = 'admin')),
('EDU002', 'Projetor Multimídia', 'Projetor para sala de aula', '2023-04-05', 850.00, 'education', 'active', 'NF20230405001', 'EMP20230405001', 'DENF20230405001', (SELECT id FROM users WHERE username = 'admin')),
('SAU002', 'Estetoscópio', 'Estetoscópio profissional', '2023-05-12', 89.90, 'health', 'active', 'NF20230512001', 'EMP20230512001', 'DENF20230512001', (SELECT id FROM users WHERE username = 'admin')),
('URB001', 'Rolo Compactador', 'Rolo compactador para obras', '2023-06-20', 45000.00, 'urbanism', 'maintenance', 'NF20230620001', 'EMP20230620001', 'DENF20230620001', (SELECT id FROM users WHERE username = 'admin')),
('CUL001', 'Microfone', 'Microfone para eventos culturais', '2023-07-15', 320.00, 'culture', 'active', 'NF20230715001', 'EMP20230715001', 'DENF20230715001', (SELECT id FROM users WHERE username = 'admin')),
('ESP001', 'Bola de Futebol', 'Bola oficial para treinos', '2023-08-10', 79.90, 'sports', 'active', 'NF20230810001', 'EMP20230810001', 'DENF20230810001', (SELECT id FROM users WHERE username = 'admin')),
('ADM002', 'Impressora', 'Impressora multifuncional', '2023-09-25', 890.00, 'administration', 'active', 'NF20230925001', 'EMP20230925001', 'DENF20230925001', (SELECT id FROM users WHERE username = 'admin')),
('SAU003', 'Cadeira de Rodas', 'Cadeira de rodas hospitalar', '2023-10-30', 780.00, 'health', 'inactive', 'NF20231030001', 'EMP20231030001', 'DENF20231030001', (SELECT id FROM users WHERE username = 'admin'))
ON CONFLICT (plate) DO NOTHING;

-- Inserir algumas transferências de exemplo
INSERT INTO transfers (patrimony_id, from_department, to_department, reason, transferred_by) VALUES
((SELECT id FROM patrimonies WHERE plate = 'SAU003'), 'health', 'education', 'Transferência para uso na escola especial', (SELECT id FROM users WHERE username = 'admin')),
((SELECT id FROM patrimonies WHERE plate = 'ADM002'), 'administration', 'urbanism', 'Necessidade no departamento de urbanismo', (SELECT id FROM users WHERE username = 'admin'))
ON CONFLICT DO NOTHING;