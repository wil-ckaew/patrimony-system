#!/bin/bash
set -e

BACKUP_FILE="$1"
if [ -z "$BACKUP_FILE" ]; then
  echo "Uso: $0 <arquivo_backup>"
  exit 1
fi

BACKUP_PATH="backups/$BACKUP_FILE"
if [ ! -f "$BACKUP_PATH" ]; then
  echo "❌ Arquivo de backup não encontrado: $BACKUP_PATH"
  exit 1
fi

CONTAINER_ID=$(docker-compose ps -q db)
if [ -z "$CONTAINER_ID" ]; then
  echo "Container do banco não está rodando. Execute 'docker-compose up -d db' primeiro."
  exit 1
fi

echo "🔄 Restaurando backup: $BACKUP_FILE"

# Dropar e recriar o banco
docker exec -i $CONTAINER_ID psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS patrimony WITH (FORCE);"
docker exec -i $CONTAINER_ID psql -U postgres -d postgres -c "CREATE DATABASE patrimony;"

# Restaurar os dados
cat "$BACKUP_PATH" | docker exec -i $CONTAINER_ID psql -U postgres -d patrimony

# Garantir que a coluna is_vehicle exista
echo "🔧 Verificando/adicionando coluna is_vehicle..."
docker exec -i $CONTAINER_ID psql -U postgres -d patrimony -c "ALTER TABLE patrimonies ADD COLUMN IF NOT EXISTS is_vehicle BOOLEAN DEFAULT FALSE;"

# Garantir que a tabela users exista
# (alguns backups antigos podem não ter o sistema de usuários inicializado)
echo "🔧 Verificando/adicionando tabela users..."
docker exec -i $CONTAINER_ID psql -U postgres -d patrimony -c "CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_name VARCHAR NOT NULL, department VARCHAR NOT NULL, username VARCHAR NOT NULL UNIQUE, password_hash VARCHAR NOT NULL, email VARCHAR, role VARCHAR NOT NULL DEFAULT 'user', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());"

echo "🔧 Verificando/adicionando usuário admin padrão..."
docker exec -i $CONTAINER_ID psql -U postgres -d patrimony -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin') THEN INSERT INTO users (company_name, department, username, password_hash, email, role) VALUES ('Prefeitura Municipal', 'Administração', 'admin', '$2b$12$RYorMYDPBC1glg2HFF7PrOTrNIIAHCILhzvSte4y8VF2ZoneemgRu', 'admin@prefeitura.gov.br', 'admin'); END IF; END \$\$;"

# Garantir que a tabela transfers exista
echo "🔧 Verificando/adicionando tabela transfers..."
docker exec -i $CONTAINER_ID psql -U postgres -d patrimony -c "CREATE TABLE IF NOT EXISTS transfers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), patrimony_id UUID REFERENCES patrimonies(id) ON DELETE CASCADE, from_department VARCHAR NOT NULL, to_department VARCHAR NOT NULL, reason TEXT, transferred_by UUID REFERENCES users(id), transferred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());"

# Garantir que a tabela fiscal_documents exista
echo "🔧 Verificando/adicionando tabela fiscal_documents..."
docker exec -i $CONTAINER_ID psql -U postgres -d patrimony -c "CREATE TABLE IF NOT EXISTS fiscal_documents (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), patrimony_id UUID REFERENCES patrimonies(id) ON DELETE CASCADE, invoice_number VARCHAR, commitment_number VARCHAR, invoice_file VARCHAR, commitment_file VARCHAR, nf_issue_date DATE, supplier VARCHAR, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());"

# Garantir que a tabela fleets exista
echo "🔧 Verificando/adicionando tabela fleets..."
docker exec -i $CONTAINER_ID psql -U postgres -d patrimony -c "CREATE TABLE IF NOT EXISTS fleets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), fleet_number VARCHAR NOT NULL UNIQUE, patrimony_id UUID NOT NULL REFERENCES patrimonies(id) ON DELETE CASCADE, department VARCHAR NOT NULL, notes TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());"

echo "✅ Restauração concluída com sucesso!"
