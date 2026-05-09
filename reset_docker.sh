#!/bin/bash

echo "Parando todos os containers..."
docker stop $(docker ps -aq)

echo "Removendo todos os containers..."
docker rm $(docker ps -aq)

echo "Removendo todas as imagens..."
docker rmi -f $(docker images -aq)

echo "Removendo volumes..."
docker volume rm $(docker volume ls -q)

echo "Removendo redes não utilizadas..."
docker network prune -f

echo "Limpeza completa finalizada!"
