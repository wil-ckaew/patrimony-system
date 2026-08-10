-- ============================================
-- 1. SAXOFONES (2 unidades: 27114 a 27115)
-- ============================================
INSERT INTO patrimonies (
    plate, name, description, acquisition_date, value, department, status,
    invoice_number, commitment_number, denf_se_number, sector,
    nf_issue_date, supplier, created_by
)
SELECT 
    s.numero::text,
    'SAXOFONE',
    'ALTO MIB VEDO VD-SKS',
    '2025-12-29'::date,
    1800.00,
    'Educação',
    'active',
    '1378',
    '12021',
    '',
    'Secretaria de Cultura',
    '2026-03-02'::date,
    'MVB MUSIC LTDA',
    (SELECT id FROM users WHERE username = 'admin')
FROM generate_series(27114, 27115) AS s(numero)
ON CONFLICT (plate) DO NOTHING;

-- ============================================
-- 2. JOGO DE SAPATILHA (1 unidade: 27753)
-- ============================================
INSERT INTO patrimonies (
    plate, name, description, acquisition_date, value, department, status,
    invoice_number, commitment_number, denf_se_number, sector,
    nf_issue_date, supplier, created_by
) VALUES (
    '27753',
    'JOGO DE SAPATILHA PARA CLARINETE',
    'WERIL 17 CHAVES',
    '2025-12-29',
    249.00,
    'Educação',
    'active',
    '1401',
    '12022',
    '',
    'Secretaria de Cultura',
    '2026-05-06',
    'ALESSANDRA B. TONIETTI INSTRUMENTOS MUSICAIS EPP',
    (SELECT id FROM users WHERE username = 'admin')
)
ON CONFLICT (plate) DO NOTHING;

-- ============================================
-- 3. BAQUETAS DE BUMBO (2 unidades: 27754 a 27755)
-- ============================================
INSERT INTO patrimonies (
    plate, name, description, acquisition_date, value, department, status,
    invoice_number, commitment_number, denf_se_number, sector,
    nf_issue_date, supplier, created_by
)
SELECT 
    s.numero::text,
    'BAQUETAS DE BUMBO CABEÇA DE BORRACHA',
    'ZELLMER COMBET PAR MAÇANETA CABO MADEIRA MARFIM CABEÇA BORRACHA',
    '2025-12-29'::date,
    48.00,
    'Educação',
    'active',
    '1401',
    '12022',
    '',
    'Secretaria de Cultura',
    '2026-05-06'::date,
    'ALESSANDRA B. TONIETTI INSTRUMENTOS MUSICAIS EPP',
    (SELECT id FROM users WHERE username = 'admin')
FROM generate_series(27754, 27755) AS s(numero)
ON CONFLICT (plate) DO NOTHING;

-- ============================================
-- 4. BAQUETAS DE CAIXA (30 unidades: 27756 a 27785)
-- ============================================
INSERT INTO patrimonies (
    plate, name, description, acquisition_date, value, department, status,
    invoice_number, commitment_number, denf_se_number, sector,
    nf_issue_date, supplier, created_by
)
SELECT 
    s.numero::text,
    'BAQUETAS DE CAIXA',
    'ZELLMER VANGUARDA ECO PAR',
    '2025-12-29'::date,
    360.00,
    'Educação',
    'active',
    '1401',
    '12022',
    '',
    'Secretaria de Cultura',
    '2026-05-06'::date,
    'ALESSANDRA B. TONIETTI INSTRUMENTOS MUSICAIS EPP',
    (SELECT id FROM users WHERE username = 'admin')
FROM generate_series(27756, 27785) AS s(numero)
ON CONFLICT (plate) DO NOTHING;

-- ============================================
-- 4. BAQUETAS DE SURDO (24 unidades: 27786 a 27805)
-- ============================================
INSERT INTO patrimonies (
    plate, name, description, acquisition_date, value, department, status,
    invoice_number, commitment_number, denf_se_number, sector,
    nf_issue_date, supplier, created_by
)
SELECT 
    s.numero::text,
    'BAQUETAS DE SURDO',
    'ZELLMER COMBAT 4080 PAR',
    '2025-12-29'::date,
    24.00,
    'Educação',
    'active',
    '1401',
    '12022',
    '',
    'Secretaria de Cultura',
    '2026-05-06'::date,
    'ALESSANDRA B. TONIETTI INSTRUMENTOS MUSICAIS EPP',
    (SELECT id FROM users WHERE username = 'admin')
FROM generate_series(27756, 27785) AS s(numero)
ON CONFLICT (plate) DO NOTHING;