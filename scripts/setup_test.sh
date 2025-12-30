#!/bin/bash
cd /Users/inesgomesoliveira/Desktop/LEI-SEM5-PI-2025-26-3DL-02/scripts
mkdir -p test_backups
cd test_backups

# Limpar ficheiros antigos se existirem
rm -f testdb_*.sql

# Criar backups diários (últimos 7 dias) - devem ser TODOS mantidos
touch testdb_20251224.sql
touch testdb_20251223.sql
touch testdb_20251222.sql
touch testdb_20251221.sql
touch testdb_20251220.sql
touch testdb_20251219.sql
touch testdb_20251218.sql

# Criar backups semanais (8-30 dias atrás)
touch testdb_20251214.sql
touch testdb_20251207.sql
touch testdb_20251130.sql
touch testdb_20251125.sql

# Criar duplicados na mesma semana (devem ser eliminados)
touch testdb_20251212.sql
touch testdb_20251210.sql

# Criar backups mensais (31-365 dias atrás)
touch testdb_20251120.sql
touch testdb_20251020.sql
touch testdb_20250920.sql
touch testdb_20250820.sql
touch testdb_20250720.sql

# Criar duplicados no mesmo mês (devem ser eliminados)
touch testdb_20251115.sql
touch testdb_20251015.sql

# Criar backups muito antigos (mais de 1 ano - devem ser eliminados)
touch testdb_20241220.sql
touch testdb_20241115.sql

echo "====================================="
echo "Ficheiros de teste criados: $(ls -1 testdb_*.sql | wc -l | tr -d ' ')"
echo "====================================="
echo ""
echo "Lista de ficheiros:"
ls -1 testdb_*.sql | sort

