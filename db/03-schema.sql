--
-- PostgreSQL database dump
--

\restrict NmRDUw1w0K3oOb9kf9qqhERTFBkmoKmfvraGauSa9KJqWTdIoTjszdahLbRG7LE

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: limpezastatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.limpezastatus AS ENUM (
    'limpo',
    'medio',
    'sujo'
);


--
-- Name: userrole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.userrole AS ENUM (
    'admin',
    'gestor',
    'tecnico'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


--
-- Name: fotos_evidencia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fotos_evidencia (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    registro_id uuid NOT NULL,
    filename character varying(255),
    path character varying(512),
    mimetype character varying(64),
    tamanho_bytes integer,
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: itens_sala; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.itens_sala (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sala_id uuid NOT NULL,
    tipo character varying(32),
    identificador character varying(64),
    dados_fixos jsonb,
    ativo boolean DEFAULT true NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    created_by uuid
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    used boolean DEFAULT false NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: registros_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registros_item (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ronda_id uuid NOT NULL,
    item_id uuid,
    tipo_secao character varying(32),
    falha boolean DEFAULT false NOT NULL,
    dados jsonb NOT NULL,
    observacao text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: rondas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rondas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sala_id uuid NOT NULL,
    data date NOT NULL,
    tecnico_id uuid NOT NULL,
    hora_entrada time without time zone NOT NULL,
    hora_saida time without time zone,
    limpeza public.limpezastatus NOT NULL,
    organizacao boolean NOT NULL,
    iluminacao boolean NOT NULL,
    vazamento boolean NOT NULL,
    falha_geral boolean DEFAULT false NOT NULL,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: salas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(32) NOT NULL,
    nome character varying(64) NOT NULL,
    descricao text,
    has_gerador boolean DEFAULT false NOT NULL,
    has_combustivel boolean DEFAULT false NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(64) NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    role public.userrole NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: fotos_evidencia fotos_evidencia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotos_evidencia
    ADD CONSTRAINT fotos_evidencia_pkey PRIMARY KEY (id);


--
-- Name: itens_sala itens_sala_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_sala
    ADD CONSTRAINT itens_sala_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: registros_item registros_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_item
    ADD CONSTRAINT registros_item_pkey PRIMARY KEY (id);


--
-- Name: rondas rondas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rondas
    ADD CONSTRAINT rondas_pkey PRIMARY KEY (id);


--
-- Name: salas salas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salas
    ADD CONSTRAINT salas_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_fotos_evidencia_registro_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_fotos_evidencia_registro_id ON public.fotos_evidencia USING btree (registro_id);


--
-- Name: ix_itens_sala_sala_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_itens_sala_sala_id ON public.itens_sala USING btree (sala_id);


--
-- Name: ix_password_reset_tokens_token_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_password_reset_tokens_token_hash ON public.password_reset_tokens USING btree (token_hash);


--
-- Name: ix_password_reset_tokens_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);


--
-- Name: ix_registros_item_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_registros_item_item_id ON public.registros_item USING btree (item_id);


--
-- Name: ix_registros_item_ronda_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_registros_item_ronda_id ON public.registros_item USING btree (ronda_id);


--
-- Name: ix_rondas_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_rondas_data ON public.rondas USING btree (data);


--
-- Name: ix_rondas_sala_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_rondas_sala_id ON public.rondas USING btree (sala_id);


--
-- Name: ix_rondas_tecnico_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_rondas_tecnico_id ON public.rondas USING btree (tecnico_id);


--
-- Name: ix_salas_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_salas_slug ON public.salas USING btree (slug);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: fotos_evidencia fotos_evidencia_registro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotos_evidencia
    ADD CONSTRAINT fotos_evidencia_registro_id_fkey FOREIGN KEY (registro_id) REFERENCES public.registros_item(id) ON DELETE CASCADE;


--
-- Name: fotos_evidencia fotos_evidencia_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotos_evidencia
    ADD CONSTRAINT fotos_evidencia_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: itens_sala itens_sala_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_sala
    ADD CONSTRAINT itens_sala_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: itens_sala itens_sala_sala_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_sala
    ADD CONSTRAINT itens_sala_sala_id_fkey FOREIGN KEY (sala_id) REFERENCES public.salas(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: registros_item registros_item_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_item
    ADD CONSTRAINT registros_item_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.itens_sala(id) ON DELETE SET NULL;


--
-- Name: registros_item registros_item_ronda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_item
    ADD CONSTRAINT registros_item_ronda_id_fkey FOREIGN KEY (ronda_id) REFERENCES public.rondas(id) ON DELETE CASCADE;


--
-- Name: rondas rondas_sala_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rondas
    ADD CONSTRAINT rondas_sala_id_fkey FOREIGN KEY (sala_id) REFERENCES public.salas(id) ON DELETE CASCADE;


--
-- Name: rondas rondas_tecnico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rondas
    ADD CONSTRAINT rondas_tecnico_id_fkey FOREIGN KEY (tecnico_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict NmRDUw1w0K3oOb9kf9qqhERTFBkmoKmfvraGauSa9KJqWTdIoTjszdahLbRG7LE

