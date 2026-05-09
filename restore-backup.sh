#!/bin/bash
set -e

# Configurações do banco de dados (acessível via nome do serviço 'db')
DB_HOST="db"
DB_PORT="5432"
DB_NAME="patrimony"
DB_USER="postgres"
DB_PASS="password"

BACKUP_FILE="/app/backups/${1:-backup-latest.sql}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Arquivo de backup não encontrado: $BACKUP_FILE"
  exit 1
fi

echo "🔄 Restaurando backup: $BACKUP_FILE"

export PGPASSWORD="$DB_PASS"

# Dropar e recriar o banco
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE);"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"

# Restaurar os dados
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE"

# Garantir que a coluna is_vehicle exista
echo "🔧 Verificando/adicionando coluna is_vehicle..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "ALTER TABLE patrimonies ADD COLUMN IF NOT EXISTS is_vehicle BOOLEAN DEFAULT FALSE;"

echo "✅ Restauração concluída com sucesso!"