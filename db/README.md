# DC Check — Provisionamento do banco PostgreSQL externo

Scripts para criar o banco `dccheck` em um PostgreSQL **externo**, com o schema
e os dados essenciais (usuários reais, salas e itens). As rondas/registros de
teste **não** são incluídos.

## Arquivos (ordem de execução)

| Arquivo | Conexão | Quem executa | O que faz |
|---|---|---|---|
| `01-init-db.sql` | `.../postgres` | superusuário | Cria role `dccheck` (restrito) e o banco `dccheck` |
| `02-grants-schema.sql` | `.../dccheck` | superusuário | Restringe o schema `public` ao role `dccheck` |
| `03-schema.sql` | `.../dccheck` | `dccheck` | Cria as tabelas, tipos, índices e FKs |
| `04-seed-essenciais.sql` | `.../dccheck` | `dccheck` | Insere usuários reais, salas e itens |

## Passo a passo

> Antes de tudo: edite `01-init-db.sql` e troque `TROCAR_POR_SENHA_FORTE` por uma
> senha forte. Use a **mesma** senha no `okd/secret.yaml` (campo `DATABASE_URL`).

```bash
# Variáveis do servidor externo
export PGHOST=db-host.intranet
export PGPORT=5432

# 1) Cria role + banco (como superusuário, ex.: postgres)
psql "postgresql://postgres@${PGHOST}:${PGPORT}/postgres" -v ON_ERROR_STOP=1 -f 01-init-db.sql

# 2) Restringe o schema public (como superusuário, conectado ao banco dccheck)
psql "postgresql://postgres@${PGHOST}:${PGPORT}/dccheck" -v ON_ERROR_STOP=1 -f 02-grants-schema.sql

# 3) Cria o schema (como o role dccheck)
psql "postgresql://dccheck@${PGHOST}:${PGPORT}/dccheck" -v ON_ERROR_STOP=1 -f 03-schema.sql

# 4) Popula os dados essenciais (como o role dccheck)
psql "postgresql://dccheck@${PGHOST}:${PGPORT}/dccheck" -v ON_ERROR_STOP=1 -f 04-seed-essenciais.sql
```

### Alternativa para o schema: migrations Alembic

Em vez do `03-schema.sql`, é possível aplicar o schema via migrations
(mantém o histórico do Alembic). A partir de `backend/`, com
`DATABASE_URL` apontando para o banco externo:

```bash
export DATABASE_URL="postgresql+asyncpg://dccheck:SENHA@db-host.intranet:5432/dccheck"
alembic upgrade head
# depois rode apenas o 04-seed-essenciais.sql (ele já tolera o alembic_version existente)
```

## Verificação

```bash
psql "postgresql://dccheck@${PGHOST}:${PGPORT}/dccheck" -c "
  SELECT 'users' t, count(*) FROM users
  UNION ALL SELECT 'salas', count(*) FROM salas
  UNION ALL SELECT 'itens_sala', count(*) FROM itens_sala;"
# Esperado: users=2, salas=5, itens_sala=20
```

## Conteúdo do seed

- **Usuários** (senhas em hash bcrypt): `matheus` e `noc` (ambos `admin`).
  As contas de teste `admin@empresa.com` e `tecnico@empresa.com` foram
  **omitidas** por segurança (senhas de seed conhecidas).
- **Salas**: 5 (Anti Sala, Telecom, Cofre, Energia, Gerador).
- **Itens**: 20 (ac, rack, nobreak, banco_bateria, qdi, exaustor, equipamento).
