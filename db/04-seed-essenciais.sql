--
-- DC Check — Seed de dados essenciais (schema + dados mínimos para produção)
--
-- Conteúdo:
--   * alembic_version  -> marca a versão de migration aplicada (002)
--   * salas            -> as 5 salas do datacenter
--   * users            -> apenas usuários reais (matheus, noc). NÃO inclui as
--                         contas de teste admin@empresa.com / tecnico@empresa.com.
--   * itens_sala       -> os 20 itens monitorados
--
-- Pré-requisito: o schema já deve existir (aplicar db/schema.sql ou rodar
-- `alembic upgrade head` ANTES deste arquivo).
--
-- Uso:
--   psql "postgresql://dccheck:SENHA@HOST:5432/dccheck" -v ON_ERROR_STOP=1 -f db/seed-essenciais.sql
--

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET search_path = public;

BEGIN;

--
-- Versão da migration (alembic)
--
INSERT INTO alembic_version (version_num) VALUES ('002')
    ON CONFLICT DO NOTHING;

--
-- Salas
--
INSERT INTO salas (id, slug, nome, descricao, has_gerador, has_combustivel) VALUES
    ('00000000-0000-0000-0000-000000000001', 'antisala',    'Anti Sala',       'Sala com Racks',                              false, false),
    ('00000000-0000-0000-0000-000000000002', 'salatelecom', 'Sala Telecom',    'Equipamentos de telecomunicações',            false, false),
    ('00000000-0000-0000-0000-000000000003', 'salacofre',   'Sala Cofre',      'Servidores e storage (datacenter)',           false, false),
    ('00000000-0000-0000-0000-000000000004', 'salaenergia', 'Sala de Energia', 'Nobreaks, gerador e quadros elétricos',       false, false),
    ('00000000-0000-0000-0000-000000000005', 'salagerador', 'Sala do Gerador', 'Gerador principal e combustível',             true,  true)
ON CONFLICT (id) DO NOTHING;

--
-- Usuários reais (senhas já em hash bcrypt). Contas de teste foram omitidas.
--
INSERT INTO users (id, username, email, hashed_password, role, is_active, created_at, updated_at) VALUES
    ('8a5d497d-70ce-41c8-8fbc-d32a89c525d9', 'matheus', 'matheuscorteletti@gmail.com', '$2b$12$HvdgKBXolJS4qkNJHvI.j.UemDyyDqkuHbWfOv/6kVRPbhsNeooOu', 'admin', true, now(), now()),
    ('02d89241-25dd-4cf9-bf41-48b319f53561', 'noc',     'noc@noc.com',                 '$2b$12$ouc74AZv6SsbnsbJ/Y.F0.f5o//ixg7Tr3P8gDm7SSEwHyuhoMQa2', 'admin', true, now(), now())
ON CONFLICT (id) DO NOTHING;

--
-- Itens das salas
--
INSERT INTO itens_sala (id, sala_id, tipo, identificador, dados_fixos, ativo, ordem, created_by) VALUES
    ('38f6a78c-43ed-4269-86e6-bf9bfb0f569b', '00000000-0000-0000-0000-000000000004', 'ac',            'AC-01',  '{}', true, 10, NULL),
    ('f8f556b2-201c-4a90-a722-86616a7615f7', '00000000-0000-0000-0000-000000000004', 'ac',            'AC-02',  '{}', true, 11, NULL),
    ('3406092e-018e-4d46-92d8-b9d24151fe49', '00000000-0000-0000-0000-000000000004', 'equipamento',   'QE-01',  '{}', true, 20, NULL),
    ('32dd9da4-c9e1-4763-9d5d-c186dac45fc1', '00000000-0000-0000-0000-000000000004', 'nobreak',       'UPS-01', '{}', true, 30, NULL),
    ('a411eda5-e182-4b65-b2a6-8a3eaa266df2', '00000000-0000-0000-0000-000000000004', 'nobreak',       'UPS-02', '{}', true, 31, NULL),
    ('18d91582-d054-4510-845b-9aac51f35108', '00000000-0000-0000-0000-000000000004', 'banco_bateria', 'BB-01',  '{}', true, 40, NULL),
    ('d014dd82-5846-4037-8b21-ee18c71417a3', '00000000-0000-0000-0000-000000000004', 'exaustor',      'EXA-01', '{}', true, 50, NULL),
    ('b06ee861-e1b8-4a2e-bfae-344ba153932e', '00000000-0000-0000-0000-000000000001', 'ac',            'AC-01',  '{}', true, 10, NULL),
    ('70afe97b-9fdf-4805-8525-b3da680b8175', '00000000-0000-0000-0000-000000000001', 'ac',            'AC-02',  '{}', true, 11, NULL),
    ('5caf179b-a3b8-4e1d-8708-82955b6893d1', '00000000-0000-0000-0000-000000000001', 'rack',          'RACK-01','{}', true, 20, NULL),
    ('dcb36854-7e05-4142-892b-b46c4299c058', '00000000-0000-0000-0000-000000000002', 'ac',            'AC-01',  '{}', true, 10, NULL),
    ('16bb191e-3991-406c-aa51-f596a2d0903f', '00000000-0000-0000-0000-000000000002', 'rack',          'RACK-01','{}', true, 20, NULL),
    ('b0506281-1f34-404a-8cb7-a1818a76f7f7', '00000000-0000-0000-0000-000000000002', 'rack',          'RACK-02','{}', true, 21, NULL),
    ('d55bc5c3-96d7-45cf-b9a6-71edb6251c89', '00000000-0000-0000-0000-000000000002', 'rack',          'RACK-03','{}', true, 22, NULL),
    ('f3118541-5ace-4cce-a80a-eca9125911f1', '00000000-0000-0000-0000-000000000003', 'ac',            'AC-01',  '{}', true, 10, NULL),
    ('ba2c12c7-112c-49cf-8713-69d6aa8f02fb', '00000000-0000-0000-0000-000000000003', 'ac',            'AC-02',  '{}', true, 11, NULL),
    ('ed315644-50e5-454c-bb64-fbaf50512a37', '00000000-0000-0000-0000-000000000003', 'rack',          'RACK-01','{}', true, 20, NULL),
    ('9a1546b7-ac06-4a4e-a397-29531dbebf86', '00000000-0000-0000-0000-000000000003', 'rack',          'RACK-02','{}', true, 21, NULL),
    ('8c7049bf-c9fd-4362-96b8-255871a8168a', '00000000-0000-0000-0000-000000000003', 'qdi',           'QDI-01', '{}', true, 30, NULL),
    ('8d9820f3-083e-482b-8f33-b1aada227c70', '00000000-0000-0000-0000-000000000002', 'ac',            'AC-02',  '{}', true, 15, NULL)
ON CONFLICT (id) DO NOTHING;

COMMIT;
