#!/bin/bash

# Configurações do banco (conforme seu docker-compose.yml)
DB_USER="postgres"
DB_NAME="patrimony"
DB_PASSWORD="password"
CONTAINER_NAME="patrimony-db"  # CORRIGIDO: nome correto do container
SQL_FILE="insert_patrimonios.sql"

echo "========================================="
echo "   IMPORTADOR DE PATRIMÔNIOS"
echo "========================================="

# Verificar se o container existe
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "ERRO: Container $CONTAINER_NAME não está rodando!"
    echo "Containers disponíveis:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
    exit 1
fi

echo "✓ Container encontrado: $CONTAINER_NAME"

# Corrigir status 'Ativo' para 'active' se existir
if grep -q "'Ativo'" $SQL_FILE; then
    echo "✓ Corrigindo status 'Ativo' para 'active'..."
    sed -i "s/'Ativo'/'active'/g" $SQL_FILE
fi

echo "Copiando arquivo SQL para o container..."
docker cp $SQL_FILE $CONTAINER_NAME:/tmp/$SQL_FILE

echo "Executando inserção segura (não duplica registros existentes)..."
docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -f /tmp/$SQL_FILE

if [ $? -eq 0 ]; then
    echo "✓ Importação executada com sucesso!"
    
    # Verificar totais inseridos
    echo ""
    echo "Verificando patrimônios inseridos:"
    
    # Contar patrimônios da primeira faixa (28436-28570)
    TOTAL1=$(docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM patrimonies WHERE plate BETWEEN '28436' AND '28570';" | tr -d ' ')
    echo "  - Computadores (28436-28570): $TOTAL1 inseridos"
    
    # Contar patrimônios da segunda faixa (27807-27817)
    TOTAL2=$(docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM patrimonies WHERE plate BETWEEN '27807' AND '27817';" | tr -d ' ')
    echo "  - Instrumentos (27807-27817): $TOTAL2 inseridos"
    
    echo ""
    echo "========================================="
    echo "✅ IMPORTACAO CONCLUÍDA COM SUCESSO!"
    echo "========================================="
    echo "Os dados existentes foram preservados."
else
    echo ""
    echo "========================================="
    echo "❌ ERRO NA IMPORTACAO!"
    echo "========================================="
    exit 1
fi