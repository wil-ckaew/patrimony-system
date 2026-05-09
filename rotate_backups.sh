#!/bin/bash
# Manter apenas os últimos 7 backups
BACKUP_DIR="./backups"
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete