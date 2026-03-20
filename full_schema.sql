--
-- PostgreSQL database cluster dump
--

\restrict ssu5YzPxxzUGEqonKRGPPhJGSwa1rgNMxXg2KDw6aTQRJUGq8q3Vw5rDpwa5jGf

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:mBLIXDIH3Ua/RdTHHprbDw==$ciPl/2Vt5DL9oD+DvIs0Iqn81Kl+fUY2UhxLE27HH/E=:rRiud3+b6a70tWBLgsadchczT1TnJ1jIo0rpByz/riE=';

--
-- User Configurations
--








\unrestrict ssu5YzPxxzUGEqonKRGPPhJGSwa1rgNMxXg2KDw6aTQRJUGq8q3Vw5rDpwa5jGf

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict eQd4eJAjIVgrLU8vQnOIGW5hDw5wHebaV0bffrVJaUXV4pfBtGhdsmmITBpy4tq

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict eQd4eJAjIVgrLU8vQnOIGW5hDw5wHebaV0bffrVJaUXV4pfBtGhdsmmITBpy4tq

--
-- Database "matrixmatch" dump
--

--
-- PostgreSQL database dump
--

\restrict Etl9ue9pP0ZzADg5WDqXv3mH5iucv6IsIS0bOj0rcbl0CE8b9TzTzmYsAR4zu7b

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: matrixmatch; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE matrixmatch WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.1252';


ALTER DATABASE matrixmatch OWNER TO postgres;

\unrestrict Etl9ue9pP0ZzADg5WDqXv3mH5iucv6IsIS0bOj0rcbl0CE8b9TzTzmYsAR4zu7b
\connect matrixmatch
\restrict Etl9ue9pP0ZzADg5WDqXv3mH5iucv6IsIS0bOj0rcbl0CE8b9TzTzmYsAR4zu7b

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: matrixmatch; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA matrixmatch;


ALTER SCHEMA matrixmatch OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: matrixmatch; Owner: postgres
--

CREATE TYPE matrixmatch.user_role AS ENUM (
    'Admin',
    'Researcher'
);


ALTER TYPE matrixmatch.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: comparison_history; Type: TABLE; Schema: matrixmatch; Owner: postgres
--

CREATE TABLE matrixmatch.comparison_history (
    history_id bigint NOT NULL,
    user_id bigint CONSTRAINT comparison_history_researcher_id_not_null NOT NULL,
    keywords text NOT NULL,
    user_abstract text NOT NULL,
    academic_program_filter character varying(255) NOT NULL,
    similarity_threshold numeric(5,2) NOT NULL,
    top_matches text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE matrixmatch.comparison_history OWNER TO postgres;

--
-- Name: comparison_history_history_id_seq; Type: SEQUENCE; Schema: matrixmatch; Owner: postgres
--

CREATE SEQUENCE matrixmatch.comparison_history_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE matrixmatch.comparison_history_history_id_seq OWNER TO postgres;

--
-- Name: comparison_history_history_id_seq; Type: SEQUENCE OWNED BY; Schema: matrixmatch; Owner: postgres
--

ALTER SEQUENCE matrixmatch.comparison_history_history_id_seq OWNED BY matrixmatch.comparison_history.history_id;


--
-- Name: documents; Type: TABLE; Schema: matrixmatch; Owner: postgres
--

CREATE TABLE matrixmatch.documents (
    document_id bigint NOT NULL,
    title character varying(500) NOT NULL,
    abstract text NOT NULL,
    academic_program character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE matrixmatch.documents OWNER TO postgres;

--
-- Name: documents_document_id_seq; Type: SEQUENCE; Schema: matrixmatch; Owner: postgres
--

CREATE SEQUENCE matrixmatch.documents_document_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE matrixmatch.documents_document_id_seq OWNER TO postgres;

--
-- Name: documents_document_id_seq; Type: SEQUENCE OWNED BY; Schema: matrixmatch; Owner: postgres
--

ALTER SEQUENCE matrixmatch.documents_document_id_seq OWNED BY matrixmatch.documents.document_id;


--
-- Name: documents_log; Type: TABLE; Schema: matrixmatch; Owner: postgres
--

CREATE TABLE matrixmatch.documents_log (
    log_id integer NOT NULL,
    document_id integer,
    document_title character varying(255) NOT NULL,
    action character varying(50) NOT NULL,
    modified_by character varying(255) NOT NULL,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE matrixmatch.documents_log OWNER TO postgres;

--
-- Name: documents_log_log_id_seq; Type: SEQUENCE; Schema: matrixmatch; Owner: postgres
--

CREATE SEQUENCE matrixmatch.documents_log_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE matrixmatch.documents_log_log_id_seq OWNER TO postgres;

--
-- Name: documents_log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: matrixmatch; Owner: postgres
--

ALTER SEQUENCE matrixmatch.documents_log_log_id_seq OWNED BY matrixmatch.documents_log.log_id;


--
-- Name: messages; Type: TABLE; Schema: matrixmatch; Owner: postgres
--

CREATE TABLE matrixmatch.messages (
    id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    content text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now(),
    is_read boolean DEFAULT false
);


ALTER TABLE matrixmatch.messages OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: matrixmatch; Owner: postgres
--

CREATE SEQUENCE matrixmatch.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE matrixmatch.messages_id_seq OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: matrixmatch; Owner: postgres
--

ALTER SEQUENCE matrixmatch.messages_id_seq OWNED BY matrixmatch.messages.id;


--
-- Name: user; Type: TABLE; Schema: matrixmatch; Owner: postgres
--

CREATE TABLE matrixmatch."user" (
    user_id bigint CONSTRAINT user_researcher_id_not_null NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password character varying(100) NOT NULL,
    role matrixmatch.user_role DEFAULT 'Researcher'::matrixmatch.user_role NOT NULL,
    registered_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    profile_pic character varying(255),
    last_seen timestamp with time zone
);


ALTER TABLE matrixmatch."user" OWNER TO postgres;

--
-- Name: user_user_id_seq; Type: SEQUENCE; Schema: matrixmatch; Owner: postgres
--

CREATE SEQUENCE matrixmatch.user_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE matrixmatch.user_user_id_seq OWNER TO postgres;

--
-- Name: user_user_id_seq; Type: SEQUENCE OWNED BY; Schema: matrixmatch; Owner: postgres
--

ALTER SEQUENCE matrixmatch.user_user_id_seq OWNED BY matrixmatch."user".user_id;


--
-- Name: comparison_history history_id; Type: DEFAULT; Schema: matrixmatch; Owner: postgres
--

ALTER TABLE ONLY matrixmatch.comparison_history ALTER COLUMN history_id SET DEFAULT nextval('matrixmatch.comparison_history_history_id_seq'::regclass);


--
-- Name: documents document_id; Type: DEFAULT; Schema: matrixmatch; Owner: postgres
--

ALTER TABLE ONLY matrixmatch.documents ALTER COLUMN document_id SET DEFAULT nextval('matrixmatch.documents_document_id_seq'::regclass);


--
-- Name: documents_log log_id; Type: DEFAULT; Schema: matrixmatch; Owner: postgres
--

ALTER TABLE ONLY matrixmatch.documents_log ALTER COLUMN log_id SET DEFAULT nextval('matrixmatch.documents_log_log_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: matrixmatch; Owner: postgres
--

ALTER TABLE ONLY matrixmatch.messages ALTER COLUMN id SET DEFAULT nextval('matrixmatch.messages_id_seq'::regclass);


--
-- Name: user user_id; Type: DEFAULT; Schema: matrixmatch; Owner: postgres
--

ALTER TABLE ONLY matrixmatch."user" ALTER COLUMN user_id SET DEFAULT nextval('matrixmatch.user_user_id_seq'::regclass);


--
-- Name: documents_log documents_log_pkey; Type: CONSTRAINT; Schema: matrixmatch; Owner: postgres
--

ALTER TABLE ONLY matrixmatch.documents_log
    ADD CONSTRAINT documents_log_pkey PRIMARY KEY (log_id);


--
-- Name: comparison_history idx_16392_primary; Type: CONSTRAINT; Schema: matrixmatch; Owner: postgres
--

ALTER TABLE ONLY matrixmatch.comparison_history
    ADD CONSTRAINT idx_16392_primary PRIMARY KEY (history_id);


--
-- Name: documents idx_16400_primary; Type: CONSTRAINT; Schema: matrixmatch; Owner: postgres
--

ALTER TABLE ONLY matrixmatch.documents
    ADD CONSTRAINT idx_16400_primary PRIMARY KEY (document_id);


--
-- Name: user idx_16408_primary; Type: CONSTRAINT; Schema: matrixmatch; Owner: postgres
--

ALTER TABLE ONLY matrixmatch."user"
    ADD CONSTRAINT idx_16408_primary PRIMARY KEY (user_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: matrixmatch; Owner: postgres
--

ALTER TABLE ONLY matrixmatch.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: idx_16392_researcher_id; Type: INDEX; Schema: matrixmatch; Owner: postgres
--

CREATE INDEX idx_16392_researcher_id ON matrixmatch.comparison_history USING btree (user_id);


--
-- Name: idx_16408_email; Type: INDEX; Schema: matrixmatch; Owner: postgres
--

CREATE UNIQUE INDEX idx_16408_email ON matrixmatch."user" USING btree (email);


--
-- Name: idx_messages_receiver; Type: INDEX; Schema: matrixmatch; Owner: postgres
--

CREATE INDEX idx_messages_receiver ON matrixmatch.messages USING btree (receiver_id);


--
-- Name: idx_messages_sender; Type: INDEX; Schema: matrixmatch; Owner: postgres
--

CREATE INDEX idx_messages_sender ON matrixmatch.messages USING btree (sender_id);


--
-- Name: comparison_history comparison_history_ibfk_1; Type: FK CONSTRAINT; Schema: matrixmatch; Owner: postgres
--

ALTER TABLE ONLY matrixmatch.comparison_history
    ADD CONSTRAINT comparison_history_ibfk_1 FOREIGN KEY (user_id) REFERENCES matrixmatch."user"(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: matrixmatch; Owner: postgres
--

ALTER TABLE ONLY matrixmatch.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES matrixmatch."user"(user_id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: matrixmatch; Owner: postgres
--

ALTER TABLE ONLY matrixmatch.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES matrixmatch."user"(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Etl9ue9pP0ZzADg5WDqXv3mH5iucv6IsIS0bOj0rcbl0CE8b9TzTzmYsAR4zu7b

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict cxwx3RXhhdeI6ft5p6gBY3lIQYc2vrxPK7a80lvHeBD5Y39aueKBZe7vAxlpSxJ

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: matrixmatch; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA matrixmatch;


ALTER SCHEMA matrixmatch OWNER TO postgres;

--
-- PostgreSQL database dump complete
--

\unrestrict cxwx3RXhhdeI6ft5p6gBY3lIQYc2vrxPK7a80lvHeBD5Y39aueKBZe7vAxlpSxJ

--
-- PostgreSQL database cluster dump complete
--

