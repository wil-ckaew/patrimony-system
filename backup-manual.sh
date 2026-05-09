#!/bin/bash
cd "$(dirname "$0")"
docker-compose exec db pg_dump -U postgres patrimony > backups/backup-latest.sql
echo "✅ Backup manual realizado!"
echo "📁 Backup salvo em: backups/backup-latest.sql"