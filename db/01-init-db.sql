--
-- DC Check — Inicialização do PostgreSQL externo
--
-- Cria o role da aplicação e o banco `dccheck` com privilégios restritos:
-- o role `dccheck` tem acesso APENAS ao banco `dccheck` (não é superuser,
-- não cria bancos nem roles) e o acesso público é revogado.
--
-- Execute como SUPERUSUÁRIO (ex.: postgres) no servidor de destino:
--   psql "postgresql://postgres:SENHA_ADMIN@HOST:5432/postgres" -v ON_ERROR_STOP=1 -f db/01-init-db.sql
--
-- IMPORTANTE: troque 'TROCAR_POR_SENHA_FORTE' por uma senha forte e use a
-- MESMA senha no secret do OKD (okd/secret.yaml -> DATABASE_URL).
--

-- 1) Role da aplicação (login restrito, sem privilégios administrativos)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dccheck') THEN
        CREATE ROLE dccheck
            WITH LOGIN
                 PASSWORD 'TROCAR_POR_SENHA_FORTE'
                 NOSUPERUSER
                 NOCREATEDB
                 NOCREATEROLE
                 NOREPLICATION;
    END IF;
END
$$;

-- 2) Banco de dados pertencente ao role da aplicação
--    (CREATE DATABASE não roda dentro de bloco/transação; execute solto)
\set ON_ERROR_STOP on
SELECT 'CREATE DATABASE dccheck OWNER dccheck ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'dccheck')\gexec

-- 3) Restringir acesso ao banco: ninguém além de dccheck conecta
REVOKE ALL ON DATABASE dccheck FROM PUBLIC;
GRANT CONNECT, TEMP ON DATABASE dccheck TO dccheck;
