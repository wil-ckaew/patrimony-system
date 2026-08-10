#!/bin/bash
set -e

# Nome correto do container do banco de dados
DB_CONTAINER="patrimony-db"
DB_NAME="patrimony"
DB_USER="postgres"

# Diretório de backups
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Nome do arquivo com data e hora
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/backup_completo_$DATE.sql"

echo "=========================================="
echo "💾 Backup Completo do Patrimony System"
echo "=========================================="
echo ""
echo "📦 Banco: $DB_NAME"
echo "📁 Container: $DB_CONTAINER"
echo "📄 Arquivo: $BACKUP_FILE"
echo ""

echo "📋 Tabelas incluídas:"
echo "   - patrimonies (Patrimônios)"
echo "   - fleets (Frota)"
echo "   - users (Usuários)"
echo "   - transfers (Transferências)"
echo "   - fiscal_documents (Documentos Fiscais)"
echo "   - auctions (Leilões) 🆕"
echo "   - auction_vehicles (Veículos em Leilão) 🆕"
echo "   - auction_history (Histórico de Leilões) 🆕"
echo "   - auction_logs (Logs do Sistema) 🆕"
echo "   - auction_pdfs (PDFs de Leilões) 🆕"
echo ""

# Verificar se o container está rodando
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo "❌ Container $DB_CONTAINER não está rodando!"
    echo "   Executando docker-compose up -d db..."
    docker-compose up -d db
    sleep 5
fi

echo "✅ Container encontrado. Iniciando backup..."
echo ""

# Executa pg_dump dentro do container
docker exec "$DB_CONTAINER" pg_dump \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --clean \
    --if-exists \
    > "$BACKUP_FILE" 2>&1

if [ $? -eq 0 ] && [ -s "$BACKUP_FILE" ]; then
    # Comprimir o backup
    gzip -f "$BACKUP_FILE"
    BACKUP_GZ="${BACKUP_FILE}.gz"
    
    echo ""
    echo "✅ Backup concluído com sucesso!"
    echo "📦 Arquivo: $BACKUP_GZ"
    echo "📊 Tamanho: $(du -h $BACKUP_GZ | cut -f1)"
    
    # Cria link simbólico para o último backup
    ln -sf "$(basename "$BACKUP_GZ")" "$BACKUP_DIR/backup-latest.sql.gz"
    echo "🔗 Link simbólico: backups/backup-latest.sql.gz"
    
    # Manter apenas os últimos 30 backups
    echo ""
    echo "🧹 Limpando backups antigos (mantendo 30)..."
    cd "$BACKUP_DIR"
    ls -t backup_completo_*.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm -f
    cd ..
    
    echo "✅ Limpeza concluída!"
    echo ""
    echo "📋 Para restaurar:"
    echo "   gunzip -c $BACKUP_GZ | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME"
    echo ""
    echo "   OU use o script: ./restore_completo.sh"
else
    echo "❌ Erro ao gerar backup!"
    exit 1
fi
