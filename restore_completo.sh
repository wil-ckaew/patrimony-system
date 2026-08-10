#!/bin/bash

DB_CONTAINER="patrimony-system-db-1"
DB_NAME="patrimony"
DB_USER="postgres"
BACKUP_DIR="./backups"

echo "=========================================="
echo "🔄 Restauração Completa do Patrimony System"
echo "=========================================="
echo ""

# Listar backups disponíveis
echo "📋 Backups disponíveis:"
ls -lh "$BACKUP_DIR"/backup_completo_*.sql.gz 2>/dev/null | tail -10

echo ""
echo "Digite o nome do arquivo de backup (ex: backup_completo_20260101_120000.sql.gz)"
echo "Ou pressione Enter para usar o último backup"
read -r BACKUP_FILE

if [ -z "$BACKUP_FILE" ]; then
    BACKUP_FILE="backup-latest.sql.gz"
    echo "📂 Usando último backup: $BACKUP_FILE"
fi

BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

if [ ! -f "$BACKUP_PATH" ]; then
    # Tentar com .gz
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE.gz"
    if [ ! -f "$BACKUP_PATH" ]; then
        echo "❌ Arquivo não encontrado: $BACKUP_PATH"
        exit 1
    fi
fi

echo ""
echo "⚠️  ATENÇÃO: Isso irá substituir TODOS os dados atuais!"
echo "   - Patrimônios"
echo "   - Frota"
echo "   - Usuários"
echo "   - Transferências"
echo "   - Documentos Fiscais"
echo "   - Leilões e todos os dados relacionados"
echo ""
echo "📂 Backup a ser restaurado: $BACKUP_PATH"
echo ""
read -p "Deseja continuar? (s/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Operação cancelada."
    exit 1
fi

echo ""
echo "🔄 Restaurando backup..."

# Descomprimir e restaurar
if [[ "$BACKUP_PATH" == *.gz ]]; then
    gunzip -c "$BACKUP_PATH" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
else
    cat "$BACKUP_PATH" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Backup restaurado com sucesso!"
    echo "🔄 Reiniciando o backend..."
    docker-compose restart backend
    echo "✅ Restauração concluída!"
else
    echo "❌ Erro ao restaurar backup!"
    exit 1
fi
