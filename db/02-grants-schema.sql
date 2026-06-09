--
-- DC Check — Restrição do schema `public` dentro do banco dccheck
--
-- Execute como SUPERUSUÁRIO, JÁ CONECTADO AO BANCO dccheck:
--   psql "postgresql://postgres:SENHA_ADMIN@HOST:5432/dccheck" -v ON_ERROR_STOP=1 -f db/02-grants-schema.sql
--
-- Garante que apenas o role `dccheck` tenha privilégios no schema public.
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
ALTER SCHEMA public OWNER TO dccheck;
GRANT ALL ON SCHEMA public TO dccheck;

-- Privilégios padrão para objetos criados futuramente pelo role dccheck
ALTER DEFAULT PRIVILEGES FOR ROLE dccheck IN SCHEMA public
    GRANT ALL ON TABLES TO dccheck;
ALTER DEFAULT PRIVILEGES FOR ROLE dccheck IN SCHEMA public
    GRANT ALL ON SEQUENCES TO dccheck;
