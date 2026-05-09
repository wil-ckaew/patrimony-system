#!/bin/bash
set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ Especifique o arquivo de backup: ./restore.sh backups/backup-20250902-095458.sql"
  exit 1
fi

echo "🛠 Restaurando backup do banco patrimony ..."
docker exec -i db psql -U postgres -d patrimony < "$BACKUP_FILE"

echo "📂 Aplicando migrations ..."
for file in ./backend/migrations/*.sql; do
  echo "➡️ Rodando $file ..."
  docker exec -i db psql -U postgres -d patrimony < "$file"
done

echo "✅ Restore e migrations concluídos com sucesso!"
