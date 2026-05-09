#!/bin/bash
set -e

# Configurações do banco de dados (acessível via nome do serviço 'db')
DB_HOST="db"
DB_PORT="5432"
DB_NAME="patrimony"
DB_USER="postgres"
DB_PASS="password"

# Pasta de backups (dentro do container, montada em /app/backups)
BACKUP_DIR="/app/backups"
mkdir -p "$BACKUP_DIR"

# Arquivo de backup com data do dia (YYYY-MM-DD)
DATE=$(date +%Y-%m-%d)
BACKUP_FILE="$BACKUP_DIR/backup-$DATE.sql"

echo "💾 Gerando backup do banco $DB_NAME ..."

export PGPASSWORD="$DB_PASS"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup concluído: $BACKUP_FILE"
    # Link simbólico para o último backup (dentro do container)
    ln -sf "$(basename "$BACKUP_FILE")" "$BACKUP_DIR/backup-latest.sql"
else
    echo "❌ Erro ao gerar backup!"
fi