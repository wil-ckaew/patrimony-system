#!/bin/bash
# rebuild-safe.sh - Script seguro para rebuild sem perder dados

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   REBUILD SEGURO - PATRIMONY SYSTEM${NC}"
echo -e "${BLUE}========================================${NC}"

# 1. Verificar se o banco está rodando e fazer backup
echo -e "${YELLOW}📦 Fazendo backup do banco de dados...${NC}"
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"

if docker ps | grep -q patrimony-db; then
    docker exec patrimony-db pg_dump -U postgres -d patrimony > "$BACKUP_FILE"
    if [ -f "$BACKUP_FILE" ]; then
        echo -e "${GREEN}✅ Backup criado: $BACKUP_FILE (${NC}$(du -h "$BACKUP_FILE" | cut -f1)${GREEN})${NC}"
    else
        echo -e "${RED}❌ Falha ao criar backup! Continuando mesmo assim...${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Container patrimony-db não está rodando. Pulando backup.${NC}"
fi

# 2. Verificar quantos registros existem antes
echo -e "\n${YELLOW}📊 Verificando dados atuais...${NC}"
if docker ps | grep -q patrimony-db; then
    TOTAL=$(docker exec patrimony-db psql -U postgres -d patrimony -t -c "SELECT COUNT(*) FROM patrimonies;" 2>/dev/null | tr -d ' ')
    echo -e "${GREEN}✅ Total de patrimônios no banco: ${TOTAL:-0}${NC}"
else
    echo -e "${YELLOW}⚠️  Banco não está rodando para verificar${NC}"
fi

# 3. Parar containers (dados permanecem)
echo -e "\n${YELLOW}⏹️  Parando containers...${NC}"
docker-compose down
echo -e "${GREEN}✅ Containers parados${NC}"

# 4. Limpar cache do Docker (somente build cache, NÃO volumes)
echo -e "\n${YELLOW}🧹 Limpando cache do Docker...${NC}"
docker builder prune -f
echo -e "${GREEN}✅ Cache do Docker limpo${NC}"

# 5. Reconstruir imagens sem cache
echo -e "\n${YELLOW}🔨 Reconstruindo imagens (sem cache)...${NC}"
docker-compose build --no-cache
echo -e "${GREEN}✅ Imagens reconstruídas${NC}"

# 6. Iniciar containers
echo -e "\n${YELLOW}🚀 Iniciando containers...${NC}"
docker-compose up -d
echo -e "${GREEN}✅ Containers iniciados${NC}"

# 7. Aguardar serviços iniciarem
echo -e "\n${YELLOW}⏳ Aguardando serviços iniciarem...${NC}"
sleep 5

# 8. Verificar status
echo -e "\n${BLUE}📊 Status dos containers:${NC}"
docker-compose ps

# 9. Verificar se o banco ainda tem os dados
echo -e "\n${YELLOW}📊 Verificando dados após rebuild...${NC}"
if docker ps | grep -q patrimony-db; then
    TOTAL_AFTER=$(docker exec patrimony-db psql -U postgres -d patrimony -t -c "SELECT COUNT(*) FROM patrimonies;" 2>/dev/null | tr -d ' ')
    echo -e "${GREEN}✅ Total de patrimônios no banco: ${TOTAL_AFTER:-0}${NC}"
    
    if [ "$TOTAL" = "$TOTAL_AFTER" ]; then
        echo -e "${GREEN}✅ DADOS INTACTOS! Nenhuma perda detectada.${NC}"
    else
        echo -e "${YELLOW}⚠️  Total de registros mudou: antes ${TOTAL:-0}, depois ${TOTAL_AFTER:-0}${NC}"
    fi
fi

# 10. Verificar saúde do backend
echo -e "\n${YELLOW}🏥 Verificando saúde do backend...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Backend OK (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Backend não respondeu (HTTP $HTTP_CODE)${NC}"
    echo -e "${YELLOW}📋 Verificando logs do backend:${NC}"
    docker-compose logs backend --tail=20
fi

# 11. Verificar saúde do frontend
echo -e "\n${YELLOW}🏥 Verificando saúde do frontend...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
    echo -e "${GREEN}✅ Frontend OK (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Frontend não respondeu (HTTP $HTTP_CODE)${NC}"
    echo -e "${YELLOW}📋 Verificando logs do frontend:${NC}"
    docker-compose logs frontend --tail=20
fi

# 12. Resumo final
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✅ REBUILD CONCLUÍDO COM SUCESSO!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}📦 Backup: $BACKUP_FILE${NC}"
echo -e "${GREEN}🌐 Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}🔧 Backend: http://localhost:8080${NC}"
echo -e "${GREEN}🐘 Banco: localhost:5433${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}💡 Dica: Se algo não funcionar, limpe o cache do navegador (Ctrl+F5)${NC}"
