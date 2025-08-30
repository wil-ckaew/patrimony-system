#!/bin/bash

echo "Iniciando Sistema de Gestão de Patrimônio..."
echo "==========================================="

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "Docker não encontrado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se o Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose não encontrado. Por favor, instale o Docker Compose."
    exit 1
fi

# Construir e iniciar os containers
echo "Construindo e iniciando containers Docker..."
docker-compose up -d --build

echo "Aguardando inicialização dos serviços..."
sleep 15

echo "Sistema iniciado com sucesso!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8080/api"
echo "Serviço de IA: http://localhost:5000"
echo ""
echo "Use 'docker-compose logs' para ver os logs dos serviços"
echo "Use 'docker-compose down' para parar o sistema"