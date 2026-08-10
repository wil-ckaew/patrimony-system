# 📁 Migrations do Sistema

## Resumo das Migrations

| Ordem | Arquivo | Descrição |
|-------|---------|-----------|
| 1 | 0001_initial_setup.sql | Configuração inicial do banco |
| 2 | 0002_permissions.sql | Permissões e roles |
| 3 | 0003_seed_data.sql | Dados iniciais |
| 4 | 0004_add_new_fields_to_patrimonies.sql | Novos campos para patrimônios |
| 5 | 0005_add_vehicle_flag.sql | Flag para veículos |
| 6 | 0006_create_fiscal_documents.sql | Documentos fiscais |
| 7 | 0007_create_fleet_table.sql | Tabela de frota |
| 8 | 20260725000000_create_auctions.sql | Criação inicial de leilões |
| 9 | 20260728000000_update_auctions.sql | Atualizações de leilões |
| 10 | 20260730000000_create_auction_tables.sql | Tabelas completas do módulo de leilões |

## Tabelas criadas

- `auctions` - Leilões
- `auction_vehicles` - Veículos em leilão
- `auction_pdfs` - Documentos PDF
- `auction_history` - Histórico
- `auction_logs` - Logs
- `patrimonies` - Patrimônios
- `fiscal_documents` - Documentos fiscais
- `fleets` - Frota
- `users` - Usuários
- `transfers` - Transferências

## Como verificar migrations aplicadas

```bash
docker exec -it patrimony-db psql -U postgres -d patrimony -c "SELECT version, applied_at FROM _sqlx_migrations ORDER BY version;"
Como aplicar manualmente
bash

docker exec -it patrimony-db psql -U postgres -d patrimony -f /app/migrations/NOME_DO_ARQUIVO.sql

