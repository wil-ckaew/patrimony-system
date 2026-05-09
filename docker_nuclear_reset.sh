#!/bin/bash

echo "Stopping all containers..."
sudo docker stop $(docker ps -aq) 2>/dev/null

echo "Removing containers..."
sudo docker rm -f $(docker ps -aq) 2>/dev/null

echo "Removing images..."
sudo docker rmi -f $(docker images -aq) 2>/dev/null

echo "Removing volumes..."
sudo docker volume rm $(docker volume ls -q) 2>/dev/null

echo "Docker system prune..."
sudo docker system prune -a -f --volumes

echo "Docker reset completed."
