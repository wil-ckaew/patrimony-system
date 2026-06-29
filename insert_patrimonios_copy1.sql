-- Insere apenas os patrimônios que não existem ainda (evita duplicatas)
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
    sector,
    nf_issue_date,
    supplier,
    created_by
) VALUES
('27807', 'TROMPETE', 'VOGGA VSTR701N LAQUEA', '2026-12-29', 816.76, 'Educação', 'active', '389', '12020', '', 'Secretaria de Cultura', '2026-04-08', 'Seresta Ltda', (SELECT id FROM users WHERE username = 'admin')),
('27808', 'TROMPETE', 'VOGGA VSTR701N LAQUEA', '2026-12-29', 816.76, 'Educação', 'active', '389', '12020', '', 'Secretaria de Cultura', '2026-04-08', 'Seresta Ltda', (SELECT id FROM users WHERE username = 'admin')),
('27809', 'TROMPETE', 'VOGGA VSTR701N LAQUEA', '2026-12-29', 816.76, 'Educação', 'active', '389', '12020', '', 'Secretaria de Cultura', '2026-04-08', 'Seresta Ltda', (SELECT id FROM users WHERE username = 'admin')),
('27810', 'TROMPETE', 'VOGGA VSTR701N LAQUEA', '2026-12-29', 816.76, 'Educação', 'active', '389', '12020', '', 'Secretaria de Cultura', '2026-04-08', 'Seresta Ltda', (SELECT id FROM users WHERE username = 'admin')),
('27811', 'SAX TENOR', 'VOGGA VSTS701N', '2026-12-29', 2980.90, 'Educação', 'active', '389', '12020', '', 'Secretaria de Cultura', '2026-04-08', 'Seresta Ltda', (SELECT id FROM users WHERE username = 'admin')),
('27812', 'SAX TENOR', 'VOGGA VSTS701N', '2026-12-29', 2980.90, 'Educação', 'active', '389', '12020', '', 'Secretaria de Cultura', '2026-04-08', 'Seresta Ltda', (SELECT id FROM users WHERE username = 'admin')),
('27813', 'FLAUTA', 'VOGGA VSFL701N NIQUELAD', '2026-12-29', 682.85, 'Educação', 'active', '389', '12020', '', 'Secretaria de Cultura', '2026-04-08', 'Seresta Ltda', (SELECT id FROM users WHERE username = 'admin')),
('27814', 'FLAUTA', 'VOGGA VSFL701N NIQUELAD', '2026-12-29', 682.85, 'Educação', 'active', '389', '12020', '', 'Secretaria de Cultura', '2026-04-08', 'Seresta Ltda', (SELECT id FROM users WHERE username = 'admin')),
('27815', 'FLAUTA', 'VOGGA VSFL701N NIQUELAD', '2026-12-29', 682.85, 'Educação', 'active', '389', '12020', '', 'Secretaria de Cultura', '2026-04-08', 'Seresta Ltda', (SELECT id FROM users WHERE username = 'admin')),
('27816', 'BOMBARDINO MICHAEL ', 'EUFONIUM WEPM40N SIB', '2026-12-29', 2174.36, 'Educação', 'active', '389', '12020', '', 'Secretaria de Cultura', '2026-04-08', 'Seresta Ltda', (SELECT id FROM users WHERE username = 'admin')),
('27817', 'BOMBARDINO MICHAEL ', 'EUFONIUM WEPM40N SIB', '2026-12-29', 2174.36, 'Educação', 'active', '389', '12020', '', 'Secretaria de Cultura', '2026-04-08', 'Seresta Ltda', (SELECT id FROM users WHERE username = 'admin'))
ON CONFLICT (plate) DO NOTHING;