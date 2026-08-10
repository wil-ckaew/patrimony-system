#!/bin/bash

echo "🚀 Iniciando migração do módulo de Leilões..."
echo "=================================================="
echo ""

# Rodar a migração via docker-compose
docker-compose exec -T postgres psql -U postgres -d patrimony_db < backend/migrations/20260725000000_create_auctions.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migração concluída com sucesso!"
    echo ""
    echo "📊 Tabelas criadas:"
    echo "   - auctions"
    echo "   - auction_vehicles"
    echo "   - auction_photos"
    echo "   - auction_documents"
    echo "   - auction_logs"
    echo ""
    echo "📝 Colunas adicionadas em fleet:"
    echo "   - auctioned (BOOLEAN)"
    echo "   - auction_date (DATE)"
    echo "   - read_only (BOOLEAN)"
    echo ""
    echo "🔒 Nenhum dado existente foi alterado ou removido!"
else
    echo "❌ Erro ao executar migração"
    exit 1
fi
