#!/bin/bash

echo "🔐 Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Falha no login. Verifique as credenciais."
    exit 1
fi

echo "✅ Login realizado com sucesso!"
echo "📝 Token: ${TOKEN:0:20}..."

echo ""
echo "🚀 Criando leilão..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auctions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "auction_number": "LEILAO-001/2026",
    "edital_number": "EDITAL-001/2026",
    "auction_date": "2026-08-15",
    "auctioneer": "João Silva Leiloeiro",
    "company": "Leilões Premium LTDA",
    "notes": "Primeiro leilão do sistema - Teste"
  }')

echo "📥 Resposta:"
echo $CREATE_RESPONSE | jq '.'

echo ""
echo "📋 Listando todos os leilões..."
curl -s -X GET http://localhost:8080/api/auctions \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
