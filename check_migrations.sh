#!/bin/bash

echo "🔍 Verificando migrations aplicadas..."

# Verificar tabela de migrations
if docker exec patrimony-db psql -U postgres -d patrimony -c "\dt _sqlx_migrations" > /dev/null 2>&1; then
    echo "✅ Tabela _sqlx_migrations encontrada"
    echo ""
    echo "📊 Migrations aplicadas:"
    docker exec patrimony-db psql -U postgres -d patrimony -c "SELECT version, applied_at FROM _sqlx_migrations ORDER BY version;"
else
    echo "⚠️ Tabela _sqlx_migrations não encontrada (pode ser que as migrations não foram aplicadas ainda)"
fi

echo ""
echo "📋 Tabelas existentes:"
docker exec patrimony-db psql -U postgres -d patrimony -c "\dt" | grep -E "(auction|patrimony|fleet|fiscal|users|transfers)"

echo ""
echo "✅ Verificação concluída!"
