#!/bin/bash

echo "==============================="
echo "Docker Auto Fix Script"
echo "Project directory: $(pwd)"
echo "==============================="

# Verifica se existe docker-compose
if [ ! -f docker-compose.yml ] && [ ! -f compose.yml ]; then
  echo "Nenhum docker-compose encontrado neste diretório."
  exit 1
fi

echo "Verificando containers ativos..."
docker ps

echo "--------------------------------"

echo "Tentando parar containers do projeto..."
docker compose down -v 2>/dev/null

if [ $? -eq 0 ]; then
  echo "Containers parados com sucesso."
else
  echo "Erro ao parar containers. Tentando recuperação..."
  
  echo "Parando serviços docker..."
  sudo systemctl stop docker
  sudo systemctl stop docker.socket
  sudo systemctl stop containerd

  echo "Matando processos docker presos..."
  sudo pkill -f docker
  sudo pkill -f containerd
  sudo pkill -f runc

  echo "Reiniciando serviços..."
  sudo systemctl start containerd
  sudo systemctl start docker
fi

echo "--------------------------------"

echo "Containers restantes:"
docker ps

echo "--------------------------------"

echo "Removendo containers órfãos..."
docker container prune -f

echo "--------------------------------"

echo "Status final:"
docker ps

echo "==============================="
echo "Docker verificado e corrigido"
echo "==============================="
