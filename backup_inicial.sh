#!/bin/bash
set -e

# Nome do container do banco de dados (obtido via docker-compose)
DB_CONTAINER="patrimony-system-db-1"
DB_NAME="patrimony"
DB_USER="postgres"

# Diretório de backups no host (relativo ao local do script)
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Nome do arquivo com data e hora
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/backup-$DATE.sql"

echo "💾 Gerando backup do banco $DB_NAME no container $DB_CONTAINER ..."

# Executa pg_dump dentro do container e redireciona a saída para o arquivo no host
docker exec -t "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup concluído: $BACKUP_FILE"
    # Cria/atualiza link simbólico para o último backup
    ln -sf "$(basename "$BACKUP_FILE")" "$BACKUP_DIR/backup-latest.sql"
    echo "🔗 Link simbólico atualizado: backups/backup-latest.sql"
else
    echo "❌ Erro ao gerar backup!"
    exit 1
fi
