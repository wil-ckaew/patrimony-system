#!/bin/bash

# Configurações do banco (conforme seu docker-compose.yml)
DB_USER="postgres"
DB_NAME="patrimony"
DB_PASSWORD="password"
CONTAINER_NAME="patrimony-system_db_1"
SQL_FILE="insert_patrimonios.sql"

echo "Copiando arquivo SQL para o container..."
docker cp $SQL_FILE $CONTAINER_NAME:/tmp/$SQL_FILE

echo "Executando inserção segura (não duplica registros existentes)..."
docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -f /tmp/$SQL_FILE

echo "Verificando quantos patrimônios foram inseridos..."
docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) as total_patrimonios FROM patrimonies WHERE plate BETWEEN '26298' AND '26337';"

echo "Importação concluída! Os dados existentes foram preservados."