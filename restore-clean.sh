#!/bin/bash
echo "🧹 Limpando banco de dados..."
docker-compose exec db psql -U postgres -d patrimony -c "TRUNCATE TABLE patrimonies, transfers, users CASCADE;"

echo "🔄 Restaurando backup..."
docker-compose exec -T db psql -U postgres -d patrimony < backups/backup-latest.sql

echo "✅ Restauração completa! Todos os dados foram restaurados."