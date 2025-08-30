-- Inserir dados iniciais
INSERT INTO patrimonies (plate, name, description, acquisition_date, value, department, status) VALUES
('EDU001', 'Cadeira Escolar', 'Cadeira para sala de aula', '2023-01-15', 150.00, 'education', 'active'),
('SAU001', 'Maca Hospitalar', 'Maca para atendimento', '2023-02-20', 1200.00, 'health', 'active'),
('ADM001', 'Computador', 'Computador para administração', '2023-03-10', 2500.00, 'administration', 'active')
ON CONFLICT (plate) DO NOTHING;