#!/bin/bash

echo "Parando containers..."
docker stop $(docker ps -aq) 2>/dev/null

echo "Removendo containers..."
docker rm -f $(docker ps -aq) 2>/dev/null

echo "Removendo imagens..."
docker rmi -f $(docker images -aq) 2>/dev/null

echo "Removendo volumes..."
docker volume rm $(docker volume ls -q) 2>/dev/null

echo "Removendo redes..."
docker network rm $(docker network ls -q) 2>/dev/null

echo "Limpando sistema Docker..."
docker system prune -a -f --volumes

echo "Docker completamente limpo."
