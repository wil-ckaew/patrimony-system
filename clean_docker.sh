#!/bin/bash

echo "🚀 Iniciando limpeza total do Docker..."

# Parar containers ativos
containers=$(docker ps -q)
if [ -n "$containers" ]; then
    echo "Parando containers..."
    docker stop $containers
fi

# Remover todos os containers
all_containers=$(docker ps -aq)
if [ -n "$all_containers" ]; then
    echo "Removendo containers..."
    docker rm -f $all_containers
fi

# Remover todas as imagens
images=$(docker images -q)
if [ -n "$images" ]; then
    echo "Removendo imagens..."
    docker rmi -f $images
fi

# Remover todos os volumes
volumes=$(docker volume ls -q)
if [ -n "$volumes" ]; then
    echo "Removendo volumes..."
    docker volume rm $volumes
fi

# Limpeza final de redes e cache
docker system prune -f

echo "✨ Docker limpo com sucesso!"
