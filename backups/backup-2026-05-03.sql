--
-- PostgreSQL database dump
--

\restrict cbW6f4YoWxwCXXkDSIAwnpljaec9YrC1R5naqcsLkdFYZ9XeneGgjGbfSVyabDB

-- Dumped from database version 13.23 (Debian 13.23-1.pgdg13+1)
-- Dumped by pg_dump version 15.16 (Debian 15.16-0+deb12u1)

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: fiscal_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fiscal_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patrimony_id uuid,
    invoice_number character varying,
    commitment_number character varying,
    invoice_file character varying,
    commitment_file character varying,
    nf_issue_date date,
    supplier character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.fiscal_documents OWNER TO postgres;

--
-- Name: patrimonies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patrimonies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plate character varying NOT NULL,
    name character varying NOT NULL,
    description text,
    acquisition_date date,
    value numeric(10,2),
    department character varying NOT NULL,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    invoice_number character varying,
    commitment_number character varying,
    denf_se_number character varying,
    invoice_file character varying,
    commitment_file character varying,
    denf_se_file character varying,
    image_url character varying,
    sector character varying,
    nf_issue_date date,
    supplier character varying,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_vehicle boolean DEFAULT false
);


ALTER TABLE public.patrimonies OWNER TO postgres;

--
-- Name: COLUMN patrimonies.sector; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patrimonies.sector IS 'Setor específico dentro do departamento';


--
-- Name: COLUMN patrimonies.nf_issue_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patrimonies.nf_issue_date IS 'Data de emissão da Nota Fiscal';


--
-- Name: COLUMN patrimonies.supplier; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patrimonies.supplier IS 'Fornecedor do bem patrimonial';


--
-- Name: transfers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transfers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patrimony_id uuid,
    from_department character varying NOT NULL,
    to_department character varying NOT NULL,
    reason text,
    transferred_by uuid,
    transferred_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.transfers OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_name character varying NOT NULL,
    department character varying NOT NULL,
    username character varying NOT NULL,
    password_hash character varying NOT NULL,
    email character varying,
    role character varying DEFAULT 'user'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: fiscal_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fiscal_documents (id, patrimony_id, invoice_number, commitment_number, invoice_file, commitment_file, nf_issue_date, supplier, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: patrimonies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patrimonies (id, plate, name, description, acquisition_date, value, department, status, invoice_number, commitment_number, denf_se_number, invoice_file, commitment_file, denf_se_file, image_url, sector, nf_issue_date, supplier, created_by, created_at, updated_at, is_vehicle) FROM stdin;
fbd02e60-913c-4a8a-a14c-641e1efa12c5	SAU001	Maca Hospitalar	Maca para atendimento	2023-02-20	1200.00	health	active	NF20230220001	EMP20230220001	DENF20230220001	\N	\N	\N	\N	Pronto Socorro	2023-02-15	Hospitalar Equipamentos SA	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-05 11:23:40.125865+00	2025-09-05 11:23:40.125865+00	f
61ca2343-4dd8-41f8-9993-b5bcd69b7e04	ADM001	Computador	Computador para administração	2023-03-10	2500.00	administration	active	NF20230310001	EMP20230310001	DENF20230310001	\N	\N	\N	\N	TI	2023-03-05	Tecnologia Informática Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-05 11:23:40.125865+00	2025-09-05 11:23:40.125865+00	f
4f7c72f5-5049-4210-b387-fca8dbc4721e	EDU002	Projetor Multimídia	Projetor para sala de aula	2023-04-05	850.00	education	active	NF20230405001	EMP20230405001	DENF20230405001	\N	\N	\N	\N	Laboratório de Informática	2023-04-01	Tech Audio Visual	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-05 11:23:40.125865+00	2025-09-05 11:23:40.125865+00	f
bede5ea4-bb31-4883-ac8e-841324c64179	SAU002	Estetoscópio	Estetoscópio profissional	2023-05-12	89.90	health	active	NF20230512001	EMP20230512001	DENF20230512001	\N	\N	\N	\N	Clínica Médica	2023-05-10	Med Equipment	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-05 11:23:40.125865+00	2025-09-05 11:23:40.125865+00	f
5ada5317-412f-443a-aa2b-74f0f8e76fba	URB001	Rolo Compactador	Rolo compactador para obras	2023-06-20	45000.00	urbanism	maintenance	NF20230620001	EMP20230620001	DENF20230620001	\N	\N	\N	\N	Obras Públicas	2023-06-15	Maquinários Pesados SA	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-05 11:23:40.125865+00	2025-09-05 11:23:40.125865+00	f
04c238eb-e7b3-46f3-8e83-d5e1d825964b	CUL001	Microfone	Microfone para eventos culturais	2023-07-15	320.00	culture	active	NF20230715001	EMP20230715001	DENF20230715001	\N	\N	\N	\N	Auditório Municipal	2023-07-10	Som Profissional	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-05 11:23:40.125865+00	2025-09-05 11:23:40.125865+00	f
9131aea4-f745-4a92-890d-dda6fad0e4f5	ESP001	Bola de Futebol	Bola oficial para treinos	2023-08-10	79.90	sports	active	NF20230810001	EMP20230810001	DENF20230810001	\N	\N	\N	\N	Quadra Poliesportiva	2023-08-05	Esportes Brasil	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-05 11:23:40.125865+00	2025-09-05 11:23:40.125865+00	f
db644860-f9d1-4d7d-87b3-13ff0b796d9c	ADM002	Impressora	Impressora multifuncional	2023-09-25	890.00	administration	active	NF20230925001	EMP20230925001	DENF20230925001	\N	\N	\N	\N	Recepção	2023-09-20	Office Solutions	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-05 11:23:40.125865+00	2025-09-05 11:23:40.125865+00	f
e110c966-7404-4b4f-ba31-57c79bd522c8	SAU003	Cadeira de Rodas	Cadeira de rodas hospitalar	2023-10-30	780.00	health	inactive	NF20231030001	EMP20231030001	DENF20231030001	\N	\N	\N	\N	Fisioterapia	2023-10-25	Médica Equipamentos	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-05 11:23:40.125865+00	2025-09-05 11:23:40.125865+00	f
ac57a507-33c3-4f88-b008-bc9aa024a539	EDU001	Mesa Escolar	Mesa para sala de aula	2023-01-15	150.00	education	active	NF20230115001	EMP20230115001	DENF20230115001	\N	\N	\N	/uploads/edd6dfb0-1f7f-40a9-9b3e-35a4f1f4ae85.jpg	Sala de Aula 101	2023-01-10	Móveis Educacionais Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-05 11:23:40.125865+00	2025-09-05 11:28:37.753967+00	f
563b0ca6-324d-4cd9-989f-b2719ca0a5b9	26074	Esmerilhadeira Angular Motor	Esmerilhadeira Angular Motor Brusheless Marca Stanley	2023-12-08	1349.99	urbanism	active	6541	10078	176843	\N	\N	\N	/uploads/ee225710-2d7b-4298-95b5-3c9c624f5c7d.jpeg	Eletricistas	2024-01-19	Rednov Ferramentas Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-05 11:39:13.40023+00	2025-09-05 11:39:13.55171+00	f
5d9065f3-e972-4e10-a1ee-df788fef2cb8	26072	Esmerilhadeira Angular	Esmerilhadeira - Ang. Bateria 20V 4 1/2" 220V	2025-05-28	1659.35	urbanism	active	357090	4515	3105/25	\N	\N	\N	\N	Eletricistas	2025-05-31	Ferragens São Carlos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-05 11:48:35.910044+00	2025-09-05 11:48:35.910044+00	f
7630923d-6256-48a1-b8c0-d2a1faf872ee	26086	Martelo Demolidor 5,4Kg	Martelo Demolidor 5,4kg Potencia 900W	2024-05-27	1795.00	urbanism	active	128657	4455	170543	\N	\N	\N	/uploads/ca955424-add3-4f6b-add4-55693e5007cd.jpeg	Obras	2024-05-31	RT Casa das Ferragens e Ferram. Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-05 12:20:09.947066+00	2025-09-05 12:20:10.120019+00	f
00db12d7-2247-4a35-a49d-88a608af6f03	26081	Gerador de Energia	Gerador de Energia Gasolina 8000 Elite Monof	2025-02-03	8767.88	urbanism	active	140854	906	373/25	\N	\N	\N	/uploads/bcefcede-f633-416f-874b-bfe98556346b.jpeg	Obras	2025-02-06	RT Casa das Ferragens e Ferram. Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-05 12:45:39.94703+00	2025-09-05 12:45:40.036822+00	f
1992e05d-1b02-4d66-841f-2c087150f74c	26080	Pulverizador Costal	Pulverizador costal Alav. 10L Capacidade do Tanque	2025-02-13	220.00	urbanism	active	3474	1152	601/25	\N	\N	\N	/uploads/c70211ea-dab1-4937-8946-507ecf767b86.jpeg	Obras	2025-02-14	Pemaq Maquinas e Ferramentas Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-05 13:03:50.966839+00	2025-09-05 13:03:51.028754+00	f
b9bc1a0e-7e24-46f9-a6d5-ec0dfd7deb80	26070	Bebedouro Industrial	Bebedouro Industrial Corpo e Estrutura em Aço Inox Pes Regulaveis 2 torneiras e aparador de agua(pingadeira em aço inox)	2023-12-01	2015.00	urbanism	active	8200	9851	176847	\N	\N	\N	/uploads/4460eb37-e4b0-469c-863a-a149d798cf16.jpeg	Obras	2024-03-21	Rednov Ferramentas Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-12 12:13:14.569582+00	2025-09-12 12:13:14.778928+00	f
95814f48-0860-4722-8513-ba043b8cc9b6	25837	Aparelho Ar Condicionado 12000BTU	Aparelho Ar Condicionado Refrigeração 12000BTU Tensão 220V	2023-12-05	1882.00	urbanism	active	1400	9948	170507	\N	\N	\N	/uploads/8d8c5eca-f48f-4cf8-8dda-e3ced3caaf21.jpeg	Obras - Secretaria	2024-01-23	Agaserv Comercio e Assistencia Tecnica Eireli	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-12 12:18:59.163015+00	2025-09-12 14:21:06.647195+00	f
ac5d5d2e-308b-4bd6-91fd-604a62aade18	26076	Nivel a Laser Vertical e Horizontal	Nivel a Laser Vertical e Horizontal	2025-05-28	771.44	urbanism	active	146013	4493	3085	\N	\N	\N	/uploads/0cfa214c-5a0f-4229-a0ee-5ff165aeabe0.jpeg	Obras - Carpintaria	2025-05-30	RT Casa das Ferragens e Ferram. Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-12 12:36:53.203253+00	2025-09-12 12:36:53.273201+00	f
ff452127-2ba3-4e57-9388-a2250086d46b	26071	Parafusadeira/Furadeira	Parafusadeira/Furadeira de Impacto 1/2" 20V c/Motor Brushless	2024-05-24	2430.00	urbanism	active	17691	4406	17053	\N	\N	\N	/uploads/9cb853e5-8b2b-4f70-8f8a-c2d0f87d6279.jpeg	Eletricistas	2024-06-27	Eficaz Prods. Eletricos e Hidraulicos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-05 11:44:05.715721+00	2025-09-12 12:29:08.088552+00	f
f62cd708-c2fc-4586-ad6f-9debd322c178	26073	Martelete 800W	Martelete SDS PLUS 800W MAKITA	2025-05-28	2648.34	urbanism	active	357090	4515	3105/25	\N	\N	\N	/uploads/61c4476a-f881-4ed0-afdb-4c481ca6e2f0.jpeg	Eletricistas	2025-05-31	Ferragens São Carlos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-05 11:51:16.779736+00	2025-09-12 12:29:46.808566+00	f
3ef7c0ba-9af3-47d4-b118-2c5afce96878	26079	Furadeira de Impacto 1/2 760W	Furadeira de Impacto 1/2 760W Makita HP1540 220V	2025-01-28	490.00	urbanism	active	3386	823	42	\N	\N	\N	/uploads/39431fbc-37e3-40dc-a4c8-9b2f93c5c200.jpeg	Obras - Carpintaria	2025-01-30	Pemaq Maquinas e Ferramentas Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-12 12:33:42.09239+00	2025-09-12 12:33:42.190882+00	f
e5b748f9-b081-4689-9ed5-569977b5a9a3	26077	Tripe Telesc.1/4 p/Nivel Stanley		2025-05-28	268.35	urbanism	active	146013	4493	3085	\N	\N	\N	/uploads/e8e2a948-415e-4c5c-b5db-6124bfe28202.jpeg	Obras - Carpintaria	2025-05-30	RT Casa das Ferragens e Ferram. Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-12 12:40:04.616547+00	2025-09-12 12:40:04.739416+00	f
8f9d3727-5992-4e38-b9f8-1ef3bd8d7c2b	26078	Transformador de Voltagem	Transformador de Voltagem 7000V Tecno	2024-02-20	350.00	urbanism	active	16718	1281	272015	\N	\N	\N	/uploads/a7621243-3fdd-4008-a5ff-004c9df63393.jpeg	Obras - Carpintaria	2024-03-25	Eficaz Prods. Eletricos e Hidraulicos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-12 12:46:09.022765+00	2025-09-12 12:46:09.115878+00	f
923e2983-383e-4fcc-af69-d440cdfad60c	26082	Soprador Ar Gasolina	Soprador Ar Gasolina Husqvarna	2025-06-03	1950.00	urbanism	active	3918	4733	3276	\N	\N	\N	/uploads/9e16fcff-dede-474b-89f1-dde391140fbf.jpeg	Obras - Tapa Buracos	2025-06-04	Pemaq Maquinas e Ferramentas Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-12 12:50:46.855518+00	2025-09-12 12:50:46.942469+00	f
765a49ed-e29f-40c1-bd34-e179c2f72a2b	26062	Carrinho de Carga 2 em 1 150KG	Carrinho de Carga 2 em 1 150KGF Modo carrinho em L	2024-04-19	2155.00	administration	active	17072	29	165341	\N	\N	\N	/uploads/2b86325c-afaa-438c-8f11-9baf12040eba.jpeg	Obras - Almoxarifado Central	2024-04-29	Eficaz Prods. Eletricos e Hidraulicos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-12 13:44:02.263979+00	2025-09-12 13:48:02.969028+00	f
56720ccb-46b4-438a-90da-ff7cb8b68a80	25838	Aparelho Ar Condicionado 12000BTU	Aparelho de Ar Condicionado 12000BTU 220V Tipo Split	2023-12-05	1882.00	urbanism	active	1400	9948	170507	\N	\N	\N	/uploads/3a6b8d87-05db-4f14-9b1a-9aaf3045a985.jpeg	Obras - Secretaria Apontadoria	2024-01-23	Agaserv Comercio e Assistencia Tecnica Eireli	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-12 12:21:48.171929+00	2025-09-12 14:22:07.28932+00	f
e2e47521-7808-41b3-8099-b05f5c4bfa64	25870	Aparelho Ar Condicionado 30000BTU	Aparelho Ar Condicionado 30000BTU Tensão 220V Tipo Split	2023-12-05	5673.00	administration	active	1403	9937	165311	\N	\N	\N	/uploads/a2ee32d1-2b20-44dd-a657-38056b96f45f.jpeg	Obras - Almoxarifado Central	2024-01-23	Agaserv Comercio e Assistencia Tecnica Eireli	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-12 14:02:27.429475+00	2025-09-12 14:03:50.577256+00	f
ffa0c7f7-aa0d-40e5-8bb5-0ecd4b7de956	25836	Aparelho Ar Condicionado 12000BTU	Aparelho Ar Condicionado 12000BTU Tensão 220V Split	2023-12-05	1882.00	administration	active	1403	9937	165311	\N	\N	\N	/uploads/ede385fa-56f1-433f-96da-b3a67ac36079.jpeg	Obras - Almoxarifado Central	2024-01-23	Agaserv Comercio e Assistencia Tecnica Eireli	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-12 13:57:33.587454+00	2025-09-12 14:09:20.510014+00	f
e698c467-d4ba-40c5-a84c-d0db89efdee7	25745	Aparelho Ar Condicionado 30000BTU	Aparelho Ar Condicionado 30000BTU 220V Split	2023-10-19	5673.00	assistenci	active	1318	8541	4574	\N	\N	\N	\N	Assistencia Social	2023-11-09	Agaserv Comercio e Assistencia Tecnica Eireli	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 16:39:47.898369+00	2025-09-15 16:39:47.898369+00	f
4311ca56-a970-41c8-835c-931e5fad1d23	25746	Aparelho Ar Condicionado 30000BTU	Aparelho Ar Condicionado 30000BTU 220V Spliti	2023-10-19	5673.00	assistenci	active	1318	8541	4574	\N	\N	\N	\N	Assistencia Social	2023-11-09	Agaserv Comercio e Assistencia Tecnica Eireli	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 16:41:41.147663+00	2025-09-15 16:41:59.341458+00	f
27b45e9f-8a3c-4fe3-8bf6-7a1dc6c6b9b3	25747	Aparelho Ar Condicionado 30000BTU	Aparelho Ar Condicionado 30000BTU 220V Split	2023-10-19	5673.00	assistenci	active	1318	8541	4574	\N	\N	\N	\N	Assistencia Social	2023-11-09	Agaserv Comercio e Assistencia Tecnica Eireli	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 16:43:29.830431+00	2025-09-15 16:43:29.830431+00	f
dba61ee4-51a0-4d59-9bda-13ae207898b8	26055	Impressora Lexmark Multifunicional	Impressora Lexmark Multifunicional Laser com Wifi	2025-08-01	3260.00	assistenci	active	752	6773	2695	\N	\N	\N	\N	Assistencia Social	2025-08-20	Publitek Teclogia Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 16:46:25.255459+00	2025-09-15 16:46:25.255459+00	f
50bc8973-4505-4784-8133-b19ea2846e0e	26101	Mesa em L com 2 gavetas	Mesa em L com 2 gavetas com chave em mdf com pes de aço cor cinza med. 1,80 x 140	2024-07-02	590.00	assistenci	active	334	5484	92130	\N	\N	\N	\N	Assistencia Social	2024-08-14	Prime Empreendimentos Ltda ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 16:49:15.569932+00	2025-09-15 16:49:15.569932+00	f
9cca6713-6da1-4409-aa4b-7460e4e8a909	26102	Micro Computador Atox g200	Micro Computador Atox g200 g7400/8gb/ssd250	2024-07-02	2740.00	assistenci	active	1290	5510	92133	\N	\N	\N	\N	Assistencia Social	2024-07-23	BX Distribuidora de Equipamentos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 16:54:19.561839+00	2025-09-15 16:54:19.561839+00	f
e14ba9d1-3188-4ea2-a595-011d2e2ee5e0	26104	Micro Computador Atox g200	Micro Computador Atox g200 g7400/8gb/ssd250	2024-07-02	2740.00	assistenci	active	1290	5510	92133	\N	\N	\N	\N	Assistencia Social	2024-07-23	BX Distribuidora de Equipamentos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 17:01:22.332153+00	2025-09-15 17:01:22.332153+00	f
5d234eaf-d220-4dc7-805e-c2a3f1f7b939	26103	Micro Computador Atox g200	Micro Computador Atox g200 g7400/8gb/ssd250	2024-07-02	2740.00	assistenci	active	1290	5510	92133	\N	\N	\N	\N	Assistencia Social	2024-07-23	BX Distribuidora de Equipamentos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 16:56:55.138669+00	2025-09-15 17:01:50.366357+00	f
528fc546-fa04-40b5-b0a3-d739cce2dc4d	26105	Micro Computador Atox g200	Micro Computador Atox g200 g7400/8gb/ssd250	2024-07-02	2740.00	assistenci	active	1290	5510	92133	\N	\N	\N	\N	Assistencia Social	2024-07-23	BX Distribuidora de Equipamentos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 17:03:07.047842+00	2025-09-15 17:03:07.047842+00	f
e3c30102-54e8-42e9-b73f-9b174fbde03a	26109	Tablet Samsung SM-T	Tablet Samsung SM-T 225 4G 32GB Grafite	2024-06-03	1099.00	assistenci	active	17030	4566	297895	\N	\N	\N	\N	Assistencia Social	2024-06-19	J Mahfuz Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 17:22:07.274199+00	2025-09-15 17:22:07.274199+00	f
ec45417b-d1ac-4594-9010-7f6d4c3d2b17	26110	Tablet Samsung SM-T	Tablet Samsung SM-T 225 4G 32GB Grafite	2024-06-03	1099.00	assistenci	active	17030	4566	297895	\N	\N	\N	\N	Assistencia Social	2024-06-19	J Mahfuz Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 17:23:57.978298+00	2025-09-15 17:23:57.978298+00	f
baf46bee-687c-4ad1-bdb1-b8c5a1b309cb	26111	Tablet Samsung SM-T	Tablet Samsung SM-T 225 4G 32GB Grafite	2024-06-03	1099.00	assistenci	active	17030	4566	297895	\N	\N	\N	\N	Assistencia Social	2024-06-19	J Mahfuz Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 17:25:20.841318+00	2025-09-15 17:25:20.841318+00	f
ed951f79-9d32-4cb0-9cb5-30346d61e325	26112	Tablet Samsung SM-T	Tablet Samsung SM-T 225 4G 32GB Grafite	2024-06-03	1099.00	assistenci	active	17030	4566	297895	\N	\N	\N	\N	Assistencia Social	2024-06-19	J Mahfuz Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 17:26:45.832663+00	2025-09-15 17:26:45.832663+00	f
f5bb44e9-c6ef-43d9-9a6e-85b82ecc6410	26113	Tablet Samsung SM-T	Tablet Samsung SM-T 225 4G 32GB Grafite	2024-06-03	1099.00	assistenci	active	17030	4566	297895	\N	\N	\N	\N	Assistencia Social	2024-06-19	J Mahfuz Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 17:28:04.308864+00	2025-09-15 17:28:04.308864+00	f
69d468a4-f511-491f-bf50-c59f5b5cd944	26116	Gaveteiro Organizador com Rodinhas	Gaveteiro Organizador com Rodinhas 4 Gavetas Marzo Vitorino	2024-07-19	465.00	assistenci	active	2876	6037	290157	\N	\N	\N	/uploads/47b7e78b-30b5-4e02-b794-710da0d049d7.jpeg	Assistencia Social sala Rosana e Luciana	2024-08-14	Dimac Comercio de Maquinas para Escritorio Ltda ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 18:11:56.514928+00	2025-09-17 12:28:02.776394+00	f
d1d17c9c-afaf-40fe-aa5f-22d57d5a01a0	26115	Gaveteiro Organizador com Rodinhas	Gaveteiro Organizador com Rodinhas 4 Gavetas Marzo Vitorino	2024-07-19	465.00	assistenci	active	2876	6037	290157	\N	\N	\N	/uploads/7744d40a-b7ec-4caa-874f-6a0e70d5984b.jpeg	Assistencia Social- sala mauro	2024-08-14	Dimac Comercio de Maquinas para Escritorio Ltda ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 18:10:12.640816+00	2025-09-17 12:19:25.346004+00	f
d73dbd4d-6d95-4e19-8185-2218bbe1e2bf	26121	Gaveteiro Organizador com Rodinhas	Gaveteiro Organizador com Rodinhas 4 Gavetas Marzo Vitorino	2024-07-19	465.00	assistenci	active	2876	6037	290157	\N	\N	\N	\N	Centro Dias	2024-08-14	Dimac Comercio de Maquinas para Escritorio Ltda ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 19:39:01.779343+00	2025-09-17 12:45:28.803322+00	f
f57824cf-068a-415d-a510-759aa07efc51	26117	Gaveteiro Organizador com Rodinhas	Gaveteiro Organizador com Rodinhas 4 Gavetas Marzo Vitorino	2024-07-19	465.00	assistenci	active	2876	6037	290157	\N	\N	\N	/uploads/11caa013-3cf1-4a94-a219-3445ac413028.jpeg	Assistencia Social - sala Rosana e Luciana	2024-08-14	Dimac Comercio de Maquinas para Escritorio Ltda ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 18:13:45.285478+00	2025-09-17 12:27:19.439086+00	f
2f3497a6-8574-43c9-847c-26f2cfe5a56a	26119	Gaveteiro Organizador com Rodinhas	Gaveteiro Organizador com Rodinhas 4 Gavetas Marzo Vitorino	2024-07-19	465.00	assistenci	active	2876	6037	290157	\N	\N	\N	/uploads/d43c1c8f-41d6-42a5-b0c2-e3461515333c.jpeg	Assistencia Social -sala Juliana	2024-08-14	Dimac Comercio de Maquinas para Escritorio Ltda ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 18:16:48.886736+00	2025-09-17 12:32:45.881485+00	f
e14e3859-ee3d-495d-8dd3-42799cd76407	26120	Gaveteiro Organizador com Rodinhas	Gaveteiro Organizador com Rodinhas 4 Gavetas Marzo Vitorino	2024-07-19	465.00	assistenci	active	2876	6037	290157	\N	\N	\N	/uploads/06c9f438-c407-405f-9497-ec75058ce642.jpeg	Assistencia Social -  sala Conselho Reunião	2024-08-14	Dimac Comercio de Maquinas para Escritorio Ltda ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 18:58:25.463612+00	2025-09-17 12:40:04.645171+00	f
026614d2-5016-477a-8426-a6cfc4c54090	26122	Impressora Multifuncional colorida jato de tinta	Impressora Multifuncional colorida jato de tinta	2024-07-02	1146.75	assistenci	active	001	5491	92131	\N	\N	\N	/uploads/5ca749cc-2f3c-4e64-9c7d-5d49d4fddfa4.jpeg	Assistencia Social - sala mauro	2024-07-11	Amiggo brasil Importação Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 10:28:46.750231+00	2025-09-17 13:47:16.023759+00	f
d4efab7c-3ad8-4afa-97c5-348658b38acd	26123	Lavadora de Alta Pressão tekna	Hidrolavadora Tekna de Alta Pressão	2024-07-02	579.00	assistenci	active	573	5505	92132	\N	\N	\N	/uploads/fe9d9eec-7531-4c38-82cf-ab87fc6ebf7f.jpeg	Assistencia Social - Depósito limpeza	2024-07-08	Lanca Produtos Comercio Serviços Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 10:33:21.588015+00	2025-09-17 13:34:22.346966+00	f
872a8f3c-64f7-488a-91bf-f701826326d7	26107	Tablet Samsung SM-T	Tablet Samsung SM-T 225 4G 32GB Grafite	2024-06-03	1099.00	assistenci	active	17030	4566	297895	\N	\N	\N	/uploads/0e8ce40a-9428-4e9d-8f00-fd2d1115b1e7.jpeg	Assistencia Social   sala Rosana	2024-06-19	J Mahfuz Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 17:18:11.537574+00	2025-09-17 13:57:00.782432+00	f
19257fab-2714-4bc2-ba81-8ae4e93d1bb9	26108	Tablet Samsung SM-T	Tablet Samsung SM-T 225 4G 32GB Grafite	2024-06-03	1099.00	assistenci	active	17030	4566	297895	\N	\N	\N	/uploads/962a82fc-847f-45ba-ac63-130eeeb78f94.jpeg	Creas	2024-06-19	J Mahfuz Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 17:19:41.289402+00	2025-09-17 13:59:22.388597+00	f
03d16fff-b837-44b9-8f13-c1abdc6d9922	26125	Mesa em L com 2 gavetas	Mesa em L com 2 gavetas	2024-07-02	590.00	assistenci	active	333	5509	92130	\N	\N	\N	\N	Centro do Idoso	2024-08-14	Prime Empreendimentos Ltda ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 10:39:27.743672+00	2025-09-17 10:52:59.351131+00	f
029d9dfc-0c18-4e0d-a313-3c14253d392d	26127	Micro Computador AIOX G200  G7400	Micro Computador AIOX G200  G7400 8GB SSD250  MONITOR 20.5 EST.1000VA	2024-07-02	2740.00	assistenci	active	1286	5495	92133	\N	\N	\N	\N	Assistencia Social	2024-07-23	BX Distribuidora de Equipamentos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 10:47:31.299429+00	2025-09-16 10:47:31.299429+00	f
16f73cac-f7a2-434c-96c5-9156f00a8b52	26128	Micro Computador AIOX G200  G7400	Micro Computador AIOX G200  G7400 8GB SSD250  MONITOR 20.5 EST.1000VA	2024-07-02	2740.00	assistenci	active	1286	5495	92133	\N	\N	\N	\N	Assistencia Social	2024-07-23	BX Distribuidora de Equipamentos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 10:48:57.195965+00	2025-09-16 10:48:57.195965+00	f
484c339e-dead-485d-adc9-40675cf6b794	26129	Micro Computador AIOX G200  G7400	Micro Computador AIOX G200  G7400 8GB SSD250  MONITOR 20.5 EST.1000VA	2024-07-02	2740.00	assistenci	active	1286	5495	92133	\N	\N	\N	\N	Assistencia Social	2024-07-23	BX Distribuidora de Equipamentos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 10:50:06.774264+00	2025-09-16 10:50:06.774264+00	f
b71e5f71-6647-4d82-b5f1-3dec6af77287	26130	Micro Computador AIOX G200  G7400	Micro Computador AIOX G200  G7400 8GB SSD250  MONITOR 20.5 EST.1000VA	2024-07-02	2740.00	assistenci	active	1286	5495	92133	\N	\N	\N	\N	Assistencia Social	2024-07-23	BX Distribuidora de Equipamentos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 10:51:11.735294+00	2025-09-16 10:51:11.735294+00	f
dde5954a-5f3e-4a68-b8d5-b406a6244bbe	26133	Painel para TV Caemmun Multiplus	Painel para TV Caemmun Multiplus 1,80x0,90 Jatoba	2023-12-07	299.00	assistenci	active	16301	10013	151051	\N	\N	\N	\N	Assistencia Social	2024-01-16	J Mahfuz Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:01:00.853509+00	2025-09-16 11:01:00.853509+00	f
08b772c9-a585-4c6d-be78-ffad103b47a3	26135	Ventilador de Parede 60cm 3 Pas	Ventilador de Parede 60cm 3 Pas Ventisol	2024-09-12	440.00	assistenci	active	569	7754	294545	\N	\N	\N	\N	Assistencia Social	2024-09-18	Delta Soluções Tecnologica Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:06:07.691192+00	2025-09-16 11:06:07.691192+00	f
14c770cd-fa48-4e37-b950-6867fc5ae660	26151	Projetor Led 3800 Lumens Full HD Betec	Projetor Led 3800 Lumens Full HD Betec	2025-07-14	1873.00	assistenci	active	8070	6039	4002	\N	\N	\N	\N	Assistencia Social	2025-07-23	Gassan M.A. Baqui Informatica Computronics	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:45:44.624788+00	2025-09-16 11:45:44.624788+00	f
b16c305a-494f-4fdc-81e9-f77abe6dda96	26152	Aparelho Ar Condicionado 9000BTUS	Aparelho Ar Condicionado 9000BTUS	2025-05-30	2300.00	assistenci	active	118591	4585	2062	\N	\N	\N	\N	Unidos pela Vida	2025-06-02	Teletusa Materiais para Construção Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:48:21.722732+00	2025-09-17 10:16:24.42166+00	f
5248e3dd-b5b9-4aca-8331-e25634b9c01a	26150	Projetor Led 3800 Lumens Full HD Betec	Projetor Led 3800 Lumens Full HD Betec	2025-07-14	1873.00	assistenci	active	8070	6039	4002	\N	\N	\N	/uploads/d50ef441-86a0-4797-879a-c607ae5689a1.jpeg	Assistencia Social - Pedro	2025-07-23	Gassan M.A. Baqui Informatica Computronics	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:44:35.126576+00	2025-09-17 22:34:45.672448+00	f
561ee99b-974d-404c-b22a-3d698db007be	26146	Bebedouro Industrial	Bebedouro Industrial Coluan Inox 25L com 2 torneiras de agua gelada 127V	2025-02-28	2299.70	assistenci	active	6398	1716	383	\N	\N	\N	\N	Moveca	2025-03-11	José carlos Janjacomo ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:31:46.498775+00	2025-09-17 10:16:58.930965+00	f
dc146a69-a816-46cd-ac9c-3b0e227db6f9	26153	Aparelho Ar Condicionado 9000BTUS	Aparelho Ar Condicionado 9000BTUS	2025-05-30	2300.00	assistenci	active	118591	4585	2062	\N	\N	\N	\N	Unidos pela Vida	2025-06-02	Teletusa Materiais para Construção Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:49:44.757827+00	2025-09-17 10:17:35.412646+00	f
53ba343a-dad2-4b2e-b730-6b472a96ce2a	26154	Aparelho Ar Condicionado 9000BTUS	Aparelho Ar Condicionado 9000BTUS	2025-05-30	2300.00	assistenci	active	118591	4585	2062	\N	\N	\N	\N	Unidos pela Vida	2025-06-02	Teletusa Materiais para Construção Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:50:54.683155+00	2025-09-17 10:17:56.492368+00	f
81845aea-c1fc-486c-af2c-ab04a4a3a0e1	26143	Aspirador de Pó Agua	Aspirador de Pó Agua Portatil Wap Gtw Compact 1400w 110v	2025-05-30	348.00	assistenci	active	6523	4579	2062	\N	\N	\N	\N	Unidos pela Vida	2025-06-09	José carlos Janjacomo ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:26:09.957551+00	2025-09-17 10:18:22.827144+00	f
4ef3be58-bf17-4bb7-83bf-8646e2048f1a	26144	Aspirador de Pó Agua	Aspirador de Pó Agua Portatil Wap Gtw Compact 1400w 110v	2025-05-30	348.00	assistenci	active	6523	4579	2062	\N	\N	\N	\N	Unidos pela Vida	2025-06-09	José carlos Janjacomo ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:27:28.166545+00	2025-09-17 10:18:45.324035+00	f
1afe316f-3ae0-45f3-8d5d-262146849a5a	26147	Bebedouro Esmaltec Coluna EGC 35	Bebedouro Esmaltec Coluna EGC 35 25lts med. 128x32x32 cm	2025-05-30	799.00	assistenci	active	18780	4577	2062	\N	\N	\N	\N	Unidos pela Vida	2025-06-04	J Mahfuz Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:35:58.180768+00	2025-09-17 10:20:58.098304+00	f
fda13db9-982b-4376-8730-29c0d5c57553	26148	Bebedouro Esmaltec Coluna EGC 35	Bebedouro Esmaltec Coluna EGC 35 25lts med. 128x32x32 cm	2025-05-30	799.00	assistenci	active	18780	4577	2062	\N	\N	\N	\N	Unidos pela Vida	2025-06-04	J Mahfuz Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:37:42.779049+00	2025-09-17 10:21:13.139898+00	f
edfe2329-6401-4b34-991b-615c2477ee2c	26149	Maquina para Lavar Roupa Panasonic	Maquina para Lavar Roupa Panasonic NA-F170B7W 17KG Branco 110V	2025-05-30	2599.00	assistenci	active	18780	4577	2062	\N	\N	\N	\N	Unidos pela Vida	2025-06-04	J Mahfuz Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:40:30.880538+00	2025-09-17 10:21:30.672282+00	f
9c3ae435-bfdd-4665-bcf9-687279e6a7cf	26142	Multiprocessador de Alimentos	Multiprocessador de Alimentos Cutter 6 lts JI Colombo	2025-05-16	2407.00	assistenci	active	6498	4040	2576	\N	\N	\N	\N	Unidos pela Vida	2025-05-30	José carlos Janjacomo ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:23:18.842197+00	2025-09-17 10:23:10.334858+00	f
4ae8cf26-6d47-4129-b54f-6e9e74804e2a	26131	Furadeira de Impacto 1/2 760W	Furadeira de Impacto 1/2 760W HP1640 220V Makita	2025-01-24	608.35	urbanism	active	141008	745	267	\N	\N	\N	/uploads/831553ec-6619-4ff7-afc7-ae227fc1c619.jpeg	Obras - Carpintaria	2025-02-13	RT Casa das Ferragens e Ferram. Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 10:54:58.252388+00	2025-09-18 10:30:52.818813+00	f
3bb60c63-133e-4c34-a2bb-18d7f6d9def4	26134	Nobreak TS Shara 4003 600va	Nobreak TS Shara 4003 600va	2024-09-20	460.00	assistenci	active	15430	7886	165696	\N	\N	\N	/uploads/5136a37d-c2d5-40cf-93be-40f074b8d72e.jpeg	Assistencia Social	2024-10-02	Inovamax Teleinformatica Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:03:59.894035+00	2025-09-17 13:37:21.8668+00	f
96e4c90e-a8be-4a9b-b4e0-2199b183e65a	26136	Servidor de Rede Storage NAS My Gloud	Servidor de Rede Storage NAS My Gloud EX2 Ultra c/HD 1TB	2024-09-20	3580.00	assistenci	active	576	7884	165698	\N	\N	\N	/uploads/4d0e5d9b-1076-46da-9c99-fe24c90cdacc.jpeg	Assistencia Social	2024-09-26	Delta Soluções Tecnologica Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:11:34.362962+00	2025-09-17 13:38:19.193677+00	f
c8b19638-44aa-445f-9399-fbf47fca3802	26137	Roteador TP-Link GB WIFI Dual Band	Roteador TP-Link GB WIFI Dual Band AX1500	2024-09-20	280.00	assistenci	active	576	7884	165697	\N	\N	\N	/uploads/9f15fa33-a89b-4a6c-aef8-f11450db9a63.jpeg	Assistencia Social	2024-09-26	Delta Soluções Tecnologica Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:13:58.711686+00	2025-09-17 13:39:06.53208+00	f
b925d72f-bf16-460d-ae79-5ae8224b20c2	26132	Smartphone Sansung GLX A35 5G 128GB Azul	Smartphone Sansung GLX A35 5G 128GB Azul	2024-08-30	1694.00	assistenci	active	143036	7355	295447	\N	\N	\N	/uploads/724b5f70-d920-480a-a054-10a1574e3b8b.jpeg	Assistencia Social	2024-09-04	Mauricio Sgavioli Rocchi	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 10:58:06.284935+00	2025-09-17 14:04:26.444274+00	f
4b73c66c-e590-459d-9ca8-4433d617dbfe	26138	WEBCAM  Full HD 1080p	WEBCAM  Full HD 1080p Microfone USB 2.0	2024-08-30	88.50	assistenci	active	6139	7354	295446	\N	\N	\N	/uploads/6074dd2f-6bba-4575-9b1e-3eacc891bd66.jpeg	Assistencia Social	2024-09-06	José carlos Janjacomo ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:16:29.675353+00	2025-09-17 14:07:12.576951+00	f
53ba1731-f936-49f1-910e-66007e613fd5	26139	WEBCAM  Full HD 1080p	WEBCAM  Full HD 1080p Microfone USB 2.0	2024-08-30	88.50	assistenci	active	6139	7354	295446	\N	\N	\N	/uploads/67880985-f42b-4c02-b070-fcb63f1914be.jpeg	Assistencia Social	2024-09-06	José carlos Janjacomo ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:17:58.40483+00	2025-09-17 14:09:04.562977+00	f
8849ec79-1c89-4156-b12b-0c33c10e117d	26140	WEBCAM  Full HD 1080p	WEBCAM  Full HD 1080p Microfone USB 2.0	2024-08-30	88.50	assistenci	active	6139	7354	295446	\N	\N	\N	/uploads/eb81f3e5-45db-41e6-8324-ed897ad4e179.jpeg	Assistencia Social	2024-09-06	José carlos Janjacomo ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:18:58.398852+00	2025-09-17 14:10:43.401538+00	f
ce12d2ce-0be9-427d-a711-edbf3b3d7290	26145	Mesa em MDF Formato L com Gavetas	Mesa em MDF Formato L com Gavetas Dimensões 1500x1200x800MM	2025-04-29	2000.00	assistenci	active	415	3419	2285	\N	\N	\N	/uploads/f6d27d82-ec2f-4a1a-8ce0-886965c2f6d4.jpeg	Assistencia Social - sala reunião	2025-05-05	Cortez Fabricação e Comercio de Moveis Ltda ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:29:58.07166+00	2025-09-16 17:47:16.484832+00	f
14349a9e-c518-448a-a827-74f245df3e4b	26166	Microondas Philco 36 lts 110V	Microondas Philco 36 lts 110V	2025-09-10	997.00	health	active	6671	8198	4157	\N	\N	\N	/uploads/41164779-8daa-4b20-8bad-ce641c5974c4.jpeg	Serviço de Ambulancia	2025-09-15	José carlos Janjacomo ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 12:18:07.786214+00	2025-09-16 12:25:32.574514+00	f
86d66897-d7b6-4c6e-b90c-da1527433893	26040	Mesa Tampo em L Estação Trabalho	Mesa Tampo em L Estação Trabalho 1,55 x 1,55 Maxxi Cristal	2025-07-18	778.00	assistenci	active	540	6193	4221	\N	\N	\N	\N	Assistencia Social	2025-08-01	Remaq Moveis para Escritorio Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 12:40:10.121596+00	2025-09-16 12:40:10.121596+00	f
8b51bc64-4cc4-4714-8a10-c51559515d45	26041	Mesa Tampo em L Estação Trabalho	Mesa Tampo em L Estação Trabalho 1,55 x 1,55 Maxxi Cristal	2025-07-18	778.00	assistenci	active	540	6193	4221	\N	\N	\N	\N	Assistencia Social	2025-08-01	Remaq Moveis para Escritorio Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 12:42:05.416669+00	2025-09-16 12:42:05.416669+00	f
3698c658-9665-4a58-9c6a-34f36b4e4470	26042	Mesa Tampo em L Estação Trabalho	Mesa Tampo em L Estação Trabalho 1,55 x 1,55 Maxxi Cristal	2025-07-18	778.00	assistenci	active	540	6193	4221	\N	\N	\N	\N	Assistencia Social	2025-08-01	Remaq Moveis para Escritorio Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 12:43:25.617199+00	2025-09-16 12:43:25.617199+00	f
267008ac-5039-4485-8af7-ce2a279ffe7a	25765	Aparelho Ar Condicionado 30000BTU	Aparelho Ar Condicionado 30000BTU Split Frio Elgin Inverter	2023-10-20	5673.00	assistenci	active	1322	8713	4612	\N	\N	\N	\N	Assistencia Social	2023-11-13	Agaserv Comercio e Assistencia Tecnica Eireli	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 12:48:26.519811+00	2025-09-16 12:48:26.519811+00	f
c97522ae-bad0-48f2-920f-1a1019417e37	25766	Aparelho Ar Condicionado 30000BTU	Aparelho Ar Condicionado 30000BTU Split Frio Elgin Inverter	2023-10-20	5673.00	assistenci	active	1322	8713	4612	\N	\N	\N	\N	Assistencia Social	2023-11-13	Agaserv Comercio e Assistencia Tecnica Eireli	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 12:49:52.49504+00	2025-09-16 12:49:52.49504+00	f
97a2ace2-b711-4aa1-9f40-748e3633146d	26106	Mesa em mdf 4,00 x 1,30 mts com Painel TV	Mesa em mdf 4,00 x 1,30 mts com Painel TV Acoplado	2024-10-02	7730.00	assistenci	active	388	8312	231	\N	\N	\N	/uploads/f8909216-de2e-435e-8317-5f08edec1543.jpeg	Assistencia Social - sala reunião	2024-10-29	Cortez Fabricação e Comercio de Moveis Ltda ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 17:08:30.446729+00	2025-09-16 17:49:51.425302+00	f
686d44d3-0a4b-4dbf-9b68-73b48196d5ee	26155	Mesa Escritorio em MDF em L	Mesa Escritorio em MDF em L	2025-07-21	2450.00	assistenci	active	423	6246	4103	\N	\N	\N	/uploads/9ad6de80-2aa9-4f8e-b913-45f44140cec2.jpeg	Assistencia Social - sala Pedro	2025-07-22	Cortez Fabricação e Comercio de Moveis Ltda ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:52:52.873373+00	2025-09-16 17:50:39.274486+00	f
c653eae0-ed02-48a1-8ee7-44d33a45cd7d	26159	Ventilador de Parede 60cm Ventsol	Ventilador de Parede 60cm Ventsol 200w	2025-05-30	276.55	assistenci	active	357111	4583	2062	\N	\N	\N	\N	Unidos pela Vida	2025-06-02	Ferragens São Carlos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:59:01.109431+00	2025-09-17 10:20:04.56357+00	f
cf7d2315-2372-4398-b958-fcee44d24cfa	26156	Mesa Escritorio em MDF	Mesa Escritorio em MDF	2025-07-21	2450.00	assistenci	active	423	6246	4103	\N	\N	\N	/uploads/c49cf2de-3bbc-43d7-a636-0535a01496df.jpeg	Assistencia Social - sala Pedro	2025-07-22	Cortez Fabricação e Comercio de Moveis Ltda ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:54:24.472638+00	2025-09-16 17:51:31.25287+00	f
d56db66a-775c-4951-af0c-42da72d34501	26162	Micro Computador G7400 8gb SSD 256gb	Micro Computador G7400 8gb SSD 256gb Monitor 21"	2025-06-30	3400.00	assistenci	active	2046	5638	965	\N	\N	\N	/uploads/4bd84f4b-588e-492b-b5c3-dfa8f04e702a.jpeg	Assistencia Social - sala Rosana e Luciana	2025-08-11	Aclara Comercio de Informatica Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 12:08:31.337055+00	2025-09-16 18:16:55.069837+00	f
0303c366-de60-49bd-a769-93ff9309d57d	26163	Micro Computador G7400 8gb SSD 256gb	Micro Computador G7400 8gb SSD 256gb Monitor 21"	2025-06-30	3400.00	assistenci	active	2046	5638	965	\N	\N	\N	/uploads/c94a4db7-70e4-46f4-8095-279af5967e2e.jpeg	Assistencia Social - sla Rosana e Luciana	2025-08-11	Aclara Comercio de Informatica Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 12:09:41.623961+00	2025-09-16 18:18:01.190224+00	f
7b230721-9388-405e-9319-e2a7fd506281	26161	Veiculo CHEV SPIN Zero KM Capacida 7 Lugares	Veiculo CHEV SPIN 1.8 AT LTZ Zero KM Capacida 7 Lugares Chassis: 9BGJC7520SB237310	2025-06-13	140000.00	assistenci	active	77472	5179	1358	\N	\N	\N	/uploads/1b67ef18-0123-41c8-846c-fb846423d69a.jpeg	Unidos pela Vida	2025-06-23	Safra São Francisco Veiculos Peças Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 12:05:23.581509+00	2025-09-16 18:25:37.881543+00	f
22c0ee39-03fd-4027-b40b-f40adb43750e	26165	Caixa Termica capacida 168lts	Caixa Termica capacida 168lts Material Aço Galvanizado	2025-05-16	1550.00	assistenci	active	20145	4009	2569	\N	\N	\N	\N	Unidos pela Vida	2025-05-29	M.C. Ferreira Bomente Penapolis ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 12:15:41.023338+00	2025-09-17 10:15:47.273509+00	f
75331541-9634-406d-9445-c31b76f32e41	26164	Notebook Acer Aspire	Notebook Acer Aspire AMD Ryzen 16gb ram ssd 512gb 15.6"	2025-07-14	3950.00	assistenci	active	6582	6038	4002	\N	\N	\N	/uploads/532672be-9986-4482-ade4-9316a14106f1.jpeg	Assistencia Social - Pedro	2025-07-21	José carlos Janjacomo ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 12:12:42.954507+00	2025-09-17 22:35:02.056498+00	f
140479ac-d5d1-4003-b169-11792ba2be8b	26157	Ventilador de Parede 60cm Ventsol	Ventilador de Parede 60cm Ventsol 200w	2025-05-30	276.55	assistenci	active	357111	4583	2062	\N	\N	\N	\N	Unidos pela Vida	2025-06-02	Ferragens São Carlos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:56:33.110536+00	2025-09-17 10:19:24.828858+00	f
1fad87cf-94b6-4a02-a503-950cb2a089e0	26158	Ventilador de Parede 60cm Ventsol	Ventilador de Parede 60cm Ventsol 200w	2025-05-30	276.55	assistenci	active	357111	4583	2062	\N	\N	\N	\N	Unidos pela Vida	2025-06-02	Ferragens São Carlos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:57:53.018359+00	2025-09-17 10:19:47.140283+00	f
dbf87a96-ed32-49cd-a951-ccf279e4761e	26160	Ventilador de Parede 60cm Ventsol	Ventilador de Parede 60cm Ventsol 200w	2025-05-30	276.55	assistenci	active	357111	4583	2062	\N	\N	\N	\N	Unidos pela Vida	2025-06-02	Ferragens São Carlos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 12:00:25.540193+00	2025-09-17 10:20:27.027135+00	f
005f13fa-040f-41d8-a465-bbffe5cb90e0	26126	Cafeteira - Expresso Genio S Basic DG51	Cafeteira - Expresso Genio S Basic DG51 Nescafe Multibebidas Digital	2024-11-21	723.00	assistenci	active	6257	9784	1308	\N	\N	\N	/uploads/4bbd831c-8b66-4751-ba33-daa4284c72cb.jpeg	Assistencia Social - sala reunião	2024-12-02	José carlos Janjacomo ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 10:43:44.229545+00	2025-09-17 12:13:25.758359+00	f
ffb9a155-be67-4216-8443-8391e5554717	26114	Gaveteiro Organizador com Rodinhas	Gaveteiro Organizador com Rodinhas 4 Gavetas Marzo Vitorino	2024-07-19	465.00	assistenci	active	2876	6037	290157	\N	\N	\N	/uploads/8ac73dd8-0f92-434a-b186-7bfb5031019c.jpeg	Assistencia Social - sala mauro	2024-08-14	Dimac Comercio de Maquinas para Escritorio Ltda ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 18:07:19.187879+00	2025-09-17 12:17:50.226022+00	f
476dc19f-c118-4f81-8f25-fdcd5e7ee396	26118	Gaveteiro Organizador com Rodinhas	Gaveteiro Organizador com Rodinhas 4 Gavetas Marzo Vitorino	2024-07-19	465.00	assistenci	active	2876	6037	290157	\N	\N	\N	/uploads/75fe4d3b-9404-44a0-a221-6178425a6362.jpeg	Assistencia Social - Sala  Leonice	2024-08-14	Dimac Comercio de Maquinas para Escritorio Ltda ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-15 18:15:33.062829+00	2025-09-17 12:30:19.108531+00	f
ea203e72-3bc9-4924-bc21-c74128ab9ece	26124	Impressora Multifuncional Laser MFC - L6912DW BROTHER	Impressora Multifuncional Laser Monocromatica MFC-L6912DW BROTHER	2024-07-02	4500.00	assistenci	active	2199	5506	92136	\N	\N	\N	/uploads/39b3a2f9-8b36-44da-a3ab-98737f9f1c47.jpeg	Assistencia Social - sala Juliana	2024-07-05	Seventec Comercio Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 10:36:57.16021+00	2025-09-17 13:51:20.396089+00	f
2c1e41f5-dcb4-4fc1-8cb5-bf73e71f1935	26141	WEBCAM  Full HD 1080p	WEBCAM  Full HD 1080p Microfone USB 2.0	2024-08-30	88.50	assistenci	active	6139	7354	295446	\N	\N	\N	/uploads/caf74888-d039-4521-906c-af68beae19b9.jpeg	Assistencia Social	2024-09-06	José carlos Janjacomo ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-16 11:20:11.799161+00	2025-09-17 14:12:22.510568+00	f
25c6f4b5-e346-4b03-92f1-5d98de1a258d	24823	Carrinho de CPU em MDF Branco	Suporte - Carrinho de CPU e Estabilizador em MDF Branco com rodizios	2021-08-27	177.80	assistenci	active	4097	4776	30452	\N	\N	\N	\N	Criança Feliz	2021-09-02	José carlos Janjacomo ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 11:14:02.72857+00	2025-09-22 11:14:02.72857+00	f
f42b9cd5-f74d-4880-996d-b5e69a850c8e	26192	Veiculo Tipo Sedan	Veiculo Tipo Sedan	2022-12-19	22100.00	assistenci	active		10260	156596	\N	\N	\N	\N	Assistencia Social	2022-12-19	Auto Zema Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 12:29:43.372439+00	2025-09-22 12:29:43.372439+00	f
3c688c91-413a-4c4e-9636-09cd707e4b90	26193	Veiculo Tipo Sedan	Veiculo Tipo Sedan	2022-12-19	70000.00	assistenci	active		10259	159596	\N	\N	\N	\N	Assistencia Social	2022-12-19	Auto Zema Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 12:31:18.783342+00	2025-09-22 12:31:18.783342+00	f
c2ebacf4-67db-4c14-ab82-3ecf11fe976d	26195	Arquivo de Aço com 4 gavetas	Arquivo de Aço com 4 gavetas refornçado	2022-09-20	990.00	assistenci	active	16459	7634	4297	\N	\N	\N	\N	Assistencia Social	2022-09-23	Remaq Moveis para Escritorio Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 12:49:09.588141+00	2025-09-22 12:49:09.588141+00	f
99393a2b-01df-467d-9369-1cdfbf5393ee	26194	Aparelho de Televisão Smart TV Led 32 Polegada	Aparelho de Televisão Smart TV Led 32 Polegada	2022-03-15	1976.00	assistenci	active	4496	1903	1093	\N	\N	\N	\N	Bolsa Familia	2022-03-28	José carlos Janjacomo ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 12:41:26.727931+00	2025-09-22 13:02:10.297688+00	f
24d76b42-2af8-4545-b522-2389bbdcefcc	26167	Porta Fechada com duas folhas de correr	Porta Fechada com duas folhas de correr para lateral do barracão	2023-05-25	2680.00	assistenci	active	55	4313	2887	\N	\N	\N	\N	Assistencia Social	2023-06-21	Julio Cezar Fernandes	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 18:06:18.415896+00	2025-09-22 18:09:24.855243+00	f
e7e73cc7-dba1-4900-8502-40d98c3ac7f4	2169	Portão Fechado de correr medindo 2.01x2.15	Portão Fechado de correr para entrada do Barracão medindo 2.01x2.15	2023-08-25	2580.00	assistenci	active	55	4313	2885	\N	\N	\N	\N	Assistencia Social	2023-06-21	Julio Cezar Fernandes	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 18:12:20.548991+00	2025-09-22 18:12:20.548991+00	f
2b056394-038f-418e-af18-4dfc7526f38a	26168	Portão Fechado para Frente medindo 1.00 x2.98	Portão Fechado para Frente do Terreno medindo 1.00 x2.98	2023-05-25	2100.00	assistenci	active	55	4313	2885	\N	\N	\N	\N	Assistencia Social	2023-06-21	Julio Cezar Fernandes	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 18:09:01.366167+00	2025-09-22 18:12:43.383509+00	f
fd857d44-7726-4d91-b4ac-427800b0d19f	26170	Porta Fechada de Abrir 0,80x2,08	Porta Fechada de Abrir Normal de 0,80x2,08	2023-05-25	2200.00	assistenci	active	55	4313	2888	\N	\N	\N	\N	Assistencia Social	2023-06-21	Julio Cezar Fernandes	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 18:15:10.093511+00	2025-09-22 18:15:10.093511+00	f
dfa089a9-f142-4c96-9468-4f2fc6fee24d	26171	Mesa para Reunião Cor Cinza	Mesa para Reunião em MDF na cor Cinza escuro comprimento de 3cm a base de ferro preto	2023-05-29	1522.35	assistenci	active	12359	4391	7949	\N	\N	\N	\N	Assistencia Social	2023-06-19	HGC Taveira Comercio de Moveis	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 18:21:21.123246+00	2025-09-22 18:21:21.123246+00	f
6ebfec1e-9f4a-4f2b-bc35-cbb2b1c9157d	26172	Frigobar branco 93 litros 110v	Frigobar branco 93 litros 110v	2023-05-29	1172.00	assistenci	active		4394	7877	\N	\N	\N	\N	Assistencia Social	2023-06-13	L A Pazinato Comercio de Materiais e Equipamentos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 18:25:26.184294+00	2025-09-22 18:25:26.184294+00	f
6bc3dfd3-57fe-4d88-a1dc-693312f96dc1	26173	Frigobar branco 93 litros 110v	Frigobar branco 93 litros 110v	2023-05-29	1172.00	assistenci	active		4394	7577	\N	\N	\N	\N	Assistencia Social	2023-06-13	L A Pazinato Comercio de Materiais e Equipamentos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 18:27:34.060232+00	2025-09-22 18:27:34.060232+00	f
e9e14898-40c5-4790-b241-f0fc07585531	26174	Frigobar branco 93 litros 110v	Frigobar branco 93 litros 110v	2023-05-29	1172.00	assistenci	active		4394	7877	\N	\N	\N	\N	Assistencia Social	2023-06-13	L A Pazinato Comercio de Materiais e Equipamentos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 18:28:47.544604+00	2025-09-22 18:28:47.544604+00	f
05a3728b-dabd-40c2-98ac-bf79f3799162	26175	NEW HB20 1.0 MT CONFORT  Sedan 4 Portas	NEW HB20 1.0 MT CONFORT  Sedan 4 Portas CHASSIS 9BHCP41AARP475045 SERIE P475045 Cor Branca Ano 2023 Modelo 2024	2023-06-19	89300.00	assistenci	active	892	5014/5015	159685	\N	\N	\N	\N	Assistencia Social	2023-08-07	Artha Empreendimentos Comercio e Locações Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 18:44:02.53221+00	2025-09-22 18:44:02.53221+00	f
b3753a05-cd47-4327-9815-ebfb0e793a34	26176	Porta de Madeira Medindo 2,18 x 0,80cm	Porta de Madeira Medindo 2,18 x 0,80cm	2023-07-10	466.63	assistenci	active	113828	5670	3230	\N	\N	\N	\N	Assistencia Social	2023-07-18	Finoka Center-Com. Materiais de Construção Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 18:47:33.410022+00	2025-09-22 18:47:33.410022+00	f
0da07c0b-4764-4df9-bcde-430920c81b85	26177	Smartphone Xiaomi Readmi 12C 128GB	Smartphone Xiaomi Readmi 12C 128GB	2023-07-27	890.00	assistenci	active	13989	6158	3818	\N	\N	\N	\N	Assistencia Social	2023-08-08	Inovamax Teleinformatica Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 18:49:45.722761+00	2025-09-22 18:49:45.722761+00	f
cefbe884-7d18-40a7-a6b0-abf9536c836e	26178	Cadeira Estofada com pes Cromados	Cadeira Estofada com pes Cromados Pendi Basalto	2023-08-14	398.00	assistenci	active	244	6740	830	\N	\N	\N	\N	Assistencia Social	2023-08-17	Remaq Moveis para Escritorio Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 18:52:23.413287+00	2025-09-22 18:52:23.413287+00	f
90e45e9d-43aa-4b63-9466-7941058b739d	26179	Cadeira Estofada com pes Cromados	Cadeira Estofada com pes Cromados Pendi Basalto	2023-08-14	398.00	assistenci	active	244	6740	830	\N	\N	\N	\N	Assistencia Social	2023-08-17	Remaq Moveis para Escritorio Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 18:53:40.925193+00	2025-09-22 18:53:40.925193+00	f
025dcfe2-f2f2-4b0b-abd1-35a645339cdc	26180	Impressora Multifuncional Eco Tank L3250	Impressora Multifuncional Eco Tank L3250 WIFI 4600	2023-08-24	915.40	assistenci	active	127	7107	5112	\N	\N	\N	\N	Assistencia Social	2023-08-29	3D Projetos e Assess. em Informatica Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 18:57:26.151739+00	2025-09-22 18:57:26.151739+00	f
4422c3a1-dc2d-45c9-941e-0583216975fb	26181	Micro Computador Intel Pentium g7400	Micro Computador Intel Pentium g7400 8gb Monitor 22"	2023-08-24	2762.00	assistenci	active	1711	7120	828	\N	\N	\N	\N	Assistencia Social	2023-09-21	Aclara Comercio de Informatica Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 19:00:07.792072+00	2025-09-22 19:00:07.792072+00	f
fe7f3ea7-e9ad-4a28-9ecd-8f7873d8655d	26182	Notebook Acer A315	Notebook Acer A315	2023-08-24	2588.97	assistenci	active	340	7122	5173	\N	\N	\N	\N	Assistencia Social	2023-09-06	Elith Informatica Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 19:02:22.999106+00	2025-09-22 19:02:22.999106+00	f
cfe09d61-d756-4be9-b63c-b8721dcc378f	26183	Impressora Multifuncional Laser Brother	Impressora Multifuncional Laser Brother Color MFCL8900CDW	2023-08-24	5233.00	assistenci	active	41	7123	827	\N	\N	\N	\N	Assistencia Social	2023-08-25	Serra Comercio de Eletronicos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 19:09:11.251153+00	2025-09-22 19:09:11.251153+00	f
8c4de92e-a3e2-406b-927c-cb8703649c04	26184	Aparelho Ar Condicionado 48000BTU	Aparelho Ar Condicionado 48000BTU 220V Tipo Split	2023-09-14	8689.00	assistenci	active	1280	7608	1381	\N	\N	\N	\N	Assistencia Social	2023-10-02	Agaserv Comercio e Assistencia Tecnica Eireli	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 19:12:06.631618+00	2025-09-22 19:12:06.631618+00	f
9a698951-bef6-46c3-9552-685eeab0b025	26185	Aparelho Ar Condicionado 30000BTU	Aparelho Ar Condicionado 30000BTU 220V Tipo Split	2023-10-20	5573.00	assistenci	active	1322	8713	4612	\N	\N	\N	\N	Assistencia Social	2023-11-13	Agaserv Comercio e Assistencia Tecnica Eireli	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 19:14:06.364135+00	2025-09-22 19:14:06.364135+00	f
92b6226b-4790-4dbf-a1b5-157751a28717	26186	Aparelho Ar Condicionado 30000BTU	Aparelho Ar Condicionado 30000BTU 220V Tipo Split	2023-10-20	5673.00	assistenci	active	1322	8713	4612	\N	\N	\N	\N	Assistencia Social	2023-11-13	Agaserv Comercio e Assistencia Tecnica Eireli	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 19:15:41.10699+00	2025-09-22 19:15:41.10699+00	f
9f6d9727-8cf1-4e6c-bf43-5153877398b6	26187	Aparelho Ar Condicionado 30000BTU	Aparelho Ar Condicionado 30000BTU 220V Tipo Split	2023-10-19	5673.00	assistenci	active	1318	8541	4574	\N	\N	\N	\N	Assistencia Social	2023-11-09	Agaserv Comercio e Assistencia Tecnica Eireli	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 19:17:54.928419+00	2025-09-22 19:17:54.928419+00	f
774552a6-410e-4c8a-b2ba-262bc98adc4d	26188	Aparelho Ar Condicionado 30000BTU	Aparelho Ar Condicionado 30000BTU 220V Tipo Split	2023-10-19	5673.00	assistenci	active	1318	8541	4574	\N	\N	\N	\N	Assistencia Social	2023-11-09	Agaserv Comercio e Assistencia Tecnica Eireli	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 19:19:32.015952+00	2025-09-22 19:19:32.015952+00	f
a6af7ed0-4e32-4ac9-a683-0e589c7f2fbd	26189	Aparelho Ar Condicionado 30000BTU	Aparelho Ar Condicionado 30000BTU 220V Tipo Split	2023-10-19	5673.00	assistenci	active	1318	8541	4574	\N	\N	\N	\N	Assistencia Social	2023-11-09	Agaserv Comercio e Assistencia Tecnica Eireli	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 19:21:11.881706+00	2025-09-22 19:21:11.881706+00	f
7871ad1a-4623-4161-91c8-e82fe3508450	26190	Frigobar Branco 47 litros 110v	Frigobar 47 litros Altura 47 cm e largura 48 cm Profundidade 49cm 110V cor Branca	2023-10-18	899.00	assistenci	active	1713	8504	4554	\N	\N	\N	\N	Assistencia Social	2023-10-23	Equipam Equipamentos e Artigos Eireli ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 19:24:48.386629+00	2025-09-22 19:24:48.386629+00	f
f0e86e9c-1d19-4ebb-8ccb-e720f9226626	26191	Cadeira Ergometrica para escritorio	Cadeira Ergometrica para escritorio Tela preta assento Space Preto	2023-10-19	469.00	assistenci	active	262	8554	81982	\N	\N	\N	\N	Assistencia Social	2023-11-23	Remaq Moveis para Escritorio Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-22 19:30:34.718865+00	2025-09-22 19:30:34.718865+00	f
e75b51aa-8f80-4a72-97db-88ac7e9152c3	26197	Mesa Retangular Reunião 2,50 x 90 Cristal	Mesa Retangular Reunião 2,50 x 90 Cristal na cor Cinza	2021-02-01	530.00	assistenci	active	13965	551	150518	\N	\N	\N	\N	Assistencia Social	2021-03-03	Remaq Moveis para Escritorio Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-23 10:33:33.050368+00	2025-09-23 10:33:33.050368+00	f
61fb8d61-ae82-4991-9fb0-ac7f43228bb4	26198	Celular Moto E7 PLUS Dual  Sim 64 gb Azul	Celular Moto E7 PLUS Dual  Sim 64 gb Azul navy 4gb ram	2021-03-04	1390.00	assistenci	active	3678	1175	139548	\N	\N	\N	\N	Assistencia Social	2021-03-11	José carlos Janjacomo ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-23 10:37:53.113363+00	2025-09-23 10:37:53.113363+00	f
1b6286c6-2cbc-41cb-80f0-6a28d0d53507	26199	Celular Moto E7 PLUS Dual  Sim 64 gb Azul	Celular Moto E7 PLUS Dual  Sim 64 gb Azul navy 4gb ram	2021-03-04	1390.00	assistenci	active	3677	1174	139547	\N	\N	\N	\N	Assistencia Social	2021-03-11	José carlos Janjacomo ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-23 10:40:23.980838+00	2025-09-23 10:40:23.980838+00	f
0bbd6ee2-fcf2-4983-aec6-30bfb7333d39	26200	Fogão Esmaltec Bali 4080 Facelit 4 bocas Branco	Fogão Esmaltec Bali 4080 Facelit 4 bocas Branco	2021-02-08	529.00	assistenci	active	11903	698	150512	\N	\N	\N	\N	Assistencia Social	2021-03-16	J Mahfuz Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-23 10:44:51.035514+00	2025-09-23 10:44:51.035514+00	f
93528826-7939-4388-ad6d-2d1754dbe100	26201	Celular Asus Max Shot  Zb634kl Dual Sim 64gb Azul	Celular Asus Max Shot  Zb634kl Dual Sim 64gb Azul 4gb Ram	2021-05-14	1316.00	assistenci	active	3837	2498	139671	\N	\N	\N	\N	Assistencia Social	2021-05-25	José carlos Janjacomo ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-23 10:51:11.572905+00	2025-09-23 10:51:11.572905+00	f
887ef5b6-b645-4034-8095-8ce1a50e8323	26202	Lavadoura de roupa tipo tanquinho 10kg	Lavadoura de roupa tipo tanquinho 10kg branco	2021-04-20	579.00	assistenci	active	12072	2026	153200	\N	\N	\N	\N	Assistencia Social	2021-04-26	J Mahfuz Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-23 10:54:21.341186+00	2025-09-23 10:54:21.341186+00	f
7e109ed7-3537-4921-b919-34a87fd7f7f1	26203	Armario Alto Fechado med. 160x0,90x0,40cm	Armário Alto Fechado med. 160x0,90x0,40cm Cor castanho em madeira com chave 2 portas com 4 repartições internas	2021-07-27	577.00	assistenci	active	6712	4053	29342	\N	\N	\N	\N	Assistencia Social	2021-08-21	A W Xavier Dias	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-23 11:01:22.130229+00	2025-09-23 11:01:22.130229+00	f
0c4d27c1-05cc-4ad8-822b-c006fca43981	26204	Armario Alto Fechado med. 160x0,90x0,40cm	Armário Alto Fechado med. 160x0,90x0,40cm Cor castanho em madeira com chave 2 portas com 4 repartições internas	2021-07-27	577.00	assistenci	active	6712	4053	29342	\N	\N	\N	\N	Assistencia Social	2021-08-21	A W Xavier Dias	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-23 11:02:58.173206+00	2025-09-23 11:02:58.173206+00	f
94d25480-7d31-4c49-af2a-cee8c7c1fe0f	26205	Conjunto de Mesa p/escritorio em L	Conjunto de Mesa p/escritorio em L med. 150 x 150cm com 2 gavetas em madeira cor castanho	2021-07-27	625.00	assistenci	active	6712	4053	29342	\N	\N	\N	\N	Assistencia Social	2021-08-21	A W Xavier Dias	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-23 11:06:04.679102+00	2025-09-23 11:06:04.679102+00	f
367d39c2-11c2-4446-82e5-7bc468c3793c	26206	Aparador em MDF TIPO Buffett para recepção	Aparador em MDF TIPO Buffett para recepção	2021-10-15	312.00	assistenci	active	363	5920	151104	\N	\N	\N	\N	Assistencia Social	2021-11-04	A C D de Paula Pultz ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-23 11:10:21.524452+00	2025-09-23 11:10:21.524452+00	f
4780c99a-9401-458f-869b-de225f1d18c7	26298	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
91287796-0f05-46f2-a22e-67ca715b3530	26299	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
5421a248-f224-4453-a470-d3c5b0e640b5	26300	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
7b05acd8-3a0d-49e4-a237-af723d968107	26301	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
c5e03a88-71c9-45ae-9b50-8757bc8c2c70	26302	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
5230901d-7284-465b-a8bc-47d0659250d1	26303	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
4628f902-ff1d-4ff3-8829-1b1160c67529	26304	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
3c189a50-60c5-4926-8fc7-f9cb4b5b564b	26305	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
2a74eb4c-49ba-415a-a51e-3470a7a8c99d	26306	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
fa631ca1-9ecf-4acb-9f28-e591e6851592	26307	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
b3c0af6c-5f28-4539-be80-e9fbcc568990	26308	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
23acd497-4afc-487a-8116-acdfba34ead5	26309	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
1368ae5d-df77-4efe-ab09-96bbc84b8d0f	26310	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
cb504169-d5e9-4ebe-a55b-a6f3edd7c1b5	26311	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
d3a32b85-75b2-4ff3-8f84-d3c6bda18398	26312	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
025484df-fb68-4c3c-a787-9f30307d5619	26313	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
f7dc01ce-2e48-40cd-b3f1-cee0e3b94b63	26314	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
4151b7e2-bde9-4e2a-8ff3-bae70ab88a50	26315	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
72339abd-6320-45ea-8132-f50cc1a4aa24	26316	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
2a27a392-ef8b-4078-815a-abb78e780a86	26317	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
10f7230a-06f1-4f63-92ff-141d4bbce713	26318	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
102dd78e-684b-4e6c-a9c5-99f0b2e1ab7d	26319	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
a79c6b8c-8328-442c-a63a-7b8753c69a3e	26320	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
52709bc7-7d16-4214-84e4-c785cca45608	26321	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
d9ef1bfc-b71c-4ed1-ba2c-c673e2b8b259	26322	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
3588d58f-a9ab-4de1-a3dd-9aa5bdc7e83f	26323	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
58b4c46b-b687-4619-870d-9fc97c07e517	26324	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
17987162-f059-4978-84ce-7147c6f45354	26325	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
8551ac63-0f66-45a3-85e4-91560d3649f4	26326	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
976dae4b-5b15-42c7-8021-f7789d434c67	26327	Ventilador de Parede 60 cm Preto	Ventilador de Parede 60cm Preto 210W Ventex	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
ca064d96-aba8-4a0f-9147-fd508b4e0e4c	26328	Ventilador de Teto	Ventilador de Teto Comercial Cinza Delta	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
2767419d-9cd2-4226-8dc9-56322a25b302	26329	Ventilador de Teto	Ventilador de Teto Comercial Cinza Delta	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
bd7e9939-0b1b-4953-89ac-c80111cc0bf4	26330	Ventilador de Teto	Ventilador de Teto Comercial Cinza Delta	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
5b73f6e4-a08e-4be7-b466-3ab4760e6037	26331	Ventilador de Teto	Ventilador de Teto Comercial Cinza Delta	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
dce4c68b-ae10-41c0-822f-87eb8a3cd3ed	26332	Ventilador de Teto	Ventilador de Teto Comercial Cinza Delta	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
a40a3e45-12ec-4d76-9e16-807019c4eacc	26333	Ventilador de Teto	Ventilador de Teto Comercial Cinza Delta	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
b481ff15-668d-4efd-bf24-6820a3477dab	26334	Ventilador de Teto	Ventilador de Teto Comercial Cinza Delta	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
ff7c13be-10a0-413e-9e1a-20da44f76d61	26335	Ventilador de Teto	Ventilador de Teto Comercial Cinza Delta	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
2b0c4540-5bda-4f38-b73f-2e3d487f2f83	26336	Ventilador de Teto	Ventilador de Teto Comercial Cinza Delta	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
caa8948b-e071-436e-8f17-adea103b14ee	26337	Ventilador de Teto	Ventilador de Teto Comercial Cinza Delta	2025-09-10	283.50	Educação	Ativo	121720	8188	5596	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Teletusa Mat. para Construção Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 16:19:02.910086+00	2025-09-24 16:19:02.910086+00	f
69093950-f2f6-4be0-8eea-a98d81d34cf6	26207	Mesa de Reunião	Mesa de Reunião	2024-08-07	2585.00	Educação	Ativo	18737	6517		\N	\N	\N	\N	Educação - Almoxarifado	2024-08-23	Remaq Moveis p/ Escritorio Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
e1fdccee-1116-410b-9ca7-d930130e163c	26208	Estação de Trabalho	Estação de Trabalho Tipo 01	2024-08-07	2080.00	Educação	Ativo	18792	6517		\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Remaq Moveis p/ Escritorio Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
697b93f0-6eea-483f-8f00-c9b79f7e4aa4	26209	Estação de Trabalho	Estação de Trabalho Tipo 01	2024-08-07	2080.00	Educação	Ativo	18792	6517		\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Remaq Moveis p/ Escritorio Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
0b0da683-6891-4946-9412-7da21d0250fa	26210	Estação de Trabalho	Estação de Trabalho Tipo 01	2024-08-07	2080.00	Educação	Ativo	18792	6517		\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Remaq Moveis p/ Escritorio Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
e5b1bd1c-f94f-4cc4-83dd-9dd669b3533e	26211	Estação de Trabalho	Estação de Trabalho Tipo 01	2024-08-07	2080.00	Educação	Ativo	18792	6517		\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Remaq Moveis p/ Escritorio Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
fc1c2790-df12-4bad-83f1-67faecf32cb4	26212	Estação de Trabalho	Estação de Trabalho Tipo 01	2024-08-07	2080.00	Educação	Ativo	18792	6517		\N	\N	\N	\N	Educação - Almoxarifado	2025-09-16	Remaq Moveis p/ Escritorio Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
57033536-be8e-406f-a86f-426a6c3d675e	26213	Cadeira Giratoria	Cadeira Giratorio com braço preto	2024-08-07	450.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
e7860102-bc07-469a-b90f-2723715dffe3	26214	Cadeira Giratoria	Cadeira Giratorio com braço preto	2024-08-07	450.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
fc4e446f-ce09-491f-b550-b6a87ea90940	26215	Cadeira Giratoria	Cadeira Giratorio com braço preto	2024-08-07	450.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
30e29056-5185-4945-a4d9-9cd8b085ffe3	26216	Cadeira Giratoria	Cadeira Giratorio com braço preto	2024-08-07	450.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
7e9c21cf-e895-4a02-a047-a0900e62935e	26217	Cadeira Giratoria	Cadeira Giratorio com braço preto	2024-08-07	450.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
aacbb9ee-7656-4cf7-987c-263cfe147fa2	26218	Cadeira Giratoria	Cadeira Giratorio com braço preto	2024-08-07	450.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
f2d33f2b-1376-4da1-a537-48c512913995	26219	Armario de Aço 2 portas	Armario de Aço 2 portas	2024-08-07	900.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
106f74fe-d677-4407-a2fa-1723ede23a2e	26220	Armario de Aço 2 portas	Armario de Aço 2 portas	2024-08-07	900.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
f091679c-1d7d-46d9-84cb-28668ea53597	26221	Armario de Aço 2 portas	Armario de Aço 2 portas	2024-08-07	900.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
01c902e4-2d5c-493a-ac34-dab06824e6f6	26222	Armario de Aço 2 portas	Armario de Aço 2 portas	2024-08-07	900.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
fcfbb1e9-7ef2-4c9e-ad8d-ceac5b01fd65	26223	Armario de Aço 2 portas	Armario de Aço 2 portas	2024-08-07	900.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
aa6af424-bad6-48d0-983c-5313c9935074	26224	Armario de Aço 2 portas	Armario de Aço 2 portas	2024-08-07	900.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
ffe37013-8463-4e27-909f-7cd41744d4d5	26225	Armario de Aço 2 portas	Armario de Aço 2 portas	2024-08-07	900.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
380a677d-6e1c-4a15-a8a7-2d55569c1e07	26226	Estante Simples de Aço	Estante Simple de Aço	2024-08-07	550.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
d9175e5b-8fa2-46b3-bd12-2e4ba1a52229	26227	Estante Simples de Aço	Estante Simple de Aço	2024-08-07	550.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
f878ca3e-c341-4210-93cd-0cf4db0808e9	26228	Estante Simples de Aço	Estante Simple de Aço	2024-08-07	550.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
7308c1f1-311f-44ae-b268-95e94a094644	26229	Estante Simples de Aço	Estante Simple de Aço	2024-08-07	550.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
914d8c5d-1320-4511-85eb-31d7cba311e2	26230	Estante Simples de Aço	Estante Simple de Aço	2024-08-07	550.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
ab13bb1b-9e05-4b17-a461-b76b4716f7d3	26231	Estante Simples de Aço	Estante Simple de Aço	2024-08-07	550.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
5d492f5e-77df-4dcb-830e-32b938b435d4	26232	Estante Simples de Aço	Estante Simple de Aço	2024-08-07	550.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
30dd6421-ecd3-45ce-95a5-d54c5e0ea0b2	26233	Estante Simples de Aço	Estante Simple de Aço	2024-08-07	550.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
a3d0931a-ecf1-4002-b7ed-cbd46c27ec27	26267	Cadeira de Uso Multiplo Azul	Cadeira de Uso Multiplo Azul	2024-08-07	150.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
720324b0-ab8a-4f9f-86bb-96fda754cbdb	26268	Cadeira de Uso Multiplo Azul	Cadeira de Uso Multiplo Azul	2024-08-07	150.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
c2888624-ed0b-417e-a07d-1fd95100c785	26269	Cadeira de Uso Multiplo Azul	Cadeira de Uso Multiplo Azul	2024-08-07	150.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
8aeae041-1271-4cc9-9903-2bfa9f47e3ca	26270	Cadeira de Uso Multiplo Azul	Cadeira de Uso Multiplo Azul	2024-08-07	150.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
ea992f35-ac5f-4dcd-9e0e-50f86bb4730a	26271	Cadeira de Uso Multiplo Azul	Cadeira de Uso Multiplo Azul	2024-08-07	150.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
12e6975a-a87d-41d3-8174-5a945a972ebf	26272	Cadeira de Uso Multiplo Azul	Cadeira de Uso Multiplo Azul	2024-08-07	150.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
24391342-f56c-4e24-bccc-f117722639fb	26273	Cadeira de Uso Multiplo Azul	Cadeira de Uso Multiplo Azul	2024-08-07	150.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
95ca7f17-c843-46c4-acbb-1898801f1b62	26274	Cadeira de Uso Multiplo Azul	Cadeira de Uso Multiplo Azul	2024-08-07	150.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
c9d83309-3a1e-4d7c-acfd-75bdd5cb7f5f	26275	Cadeira de Uso Multiplo Azul	Cadeira de Uso Multiplo Azul	2024-08-07	150.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
fc8d256b-f0e9-4020-86d7-35b2e320b307	26276	Cadeira de Uso Multiplo Azul	Cadeira de Uso Multiplo Azul	2024-08-07	150.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
7ed25780-6378-4616-8f46-e39c84735ff0	26237	Cadeira Fixa Espaldar Medio c/braço Preta	Cadeira Fixa Espaldar Medio c/braço Preta	2024-08-07	350.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
1fbbcfc7-b88f-44fd-b3ad-c535bc62ad9f	26238	Cadeira Fixa Espaldar Medio c/braço Preta	Cadeira Fixa Espaldar Medio c/braço Preta	2024-08-07	350.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
5670ddd2-96e1-418d-abf1-75f88cb013b4	26239	Cadeira Fixa Espaldar Medio c/braço Preta	Cadeira Fixa Espaldar Medio c/braço Preta	2024-08-07	350.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
89dc76e5-24e8-4454-a01a-24e40eceaf5f	26240	Cadeira Fixa Espaldar Medio c/braço Preta	Cadeira Fixa Espaldar Medio c/braço Preta	2024-08-07	350.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
2ae19885-1f35-4351-90cc-c289e1506367	26241	Cadeira Fixa Espaldar Medio c/braço Preta	Cadeira Fixa Espaldar Medio c/braço Preta	2024-08-07	350.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
da9ce5fd-ced4-4511-b96e-92fdc875a528	26196	Armario Alto com Plateleiras	Armario Alto com Plateleiras	2024-08-07	690.00	Educação	Ativo	241	6518	8132	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-09	Fer Mobiliarios e Equip. Corporativos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
01de3920-9c7c-4a81-8ea9-4b8a4f952ab8	26277	Sofa de 3 lugares	Sofa de 3 lugares	2024-08-07	1190.00	Educação	Ativo	55	6519	36436	\N	\N	\N	\N	Educação - Almoxarifado	2024-09-04	M&M Bombonato Moveis Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
38e1bb8f-7afb-4eb4-abc5-81cab5f0e101	26278	Sofa de 3 lugares	Sofa de 3 lugares	2024-08-07	1190.00	Educação	Ativo	55	6519	36436	\N	\N	\N	\N	Educação - Almoxarifado	2024-09-04	M&M Bombonato Moveis Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
238b4a8c-b5e0-470d-ae46-6473db886a27	26279	Sofa de 3 lugares	Sofa de 3 lugares	2024-08-07	1190.00	Educação	Ativo	55	6519	36436	\N	\N	\N	\N	Educação - Almoxarifado	2024-09-04	M&M Bombonato Moveis Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
b41e1ea5-38e2-411c-b066-074ba2e8b09b	26280	Sofa de 2 lugares	Sofa de 2 lugares	2024-08-07	840.00	Educação	Ativo	55	6519	36436	\N	\N	\N	\N	Educação - Almoxarifado	2024-09-04	M&M Bombonato Moveis Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
12a749c7-4bd0-42bf-ad74-fbf754e8008c	26281	Sofa de 2 lugares	Sofa de 2 lugares	2024-08-07	840.00	Educação	Ativo	55	6519	36436	\N	\N	\N	\N	Educação - Almoxarifado	2024-09-04	M&M Bombonato Moveis Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
c53d4479-cb5d-4546-b016-9981cae04e85	26234	Bebedouro Purificador Access Refrig 127v	Bebedouro Purificador Access Refrig 127v	2024-08-07	2930.00	Educação	Ativo	1758	6520		\N	\N	\N	\N	Educação - Almoxarifado	2024-08-14	Maquinas e Equipamentos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
13ca8dce-1161-4598-a527-2e8505105120	26235	Bebedouro Purificador Access Refrig 127v	Bebedouro Purificador Access Refrig 127v	2024-08-07	2930.00	Educação	Ativo	1758	6520		\N	\N	\N	\N	Educação - Almoxarifado	2024-08-14	Maquinas e Equipamentos Ltda	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-24 17:50:46.07386+00	2025-09-24 17:50:46.07386+00	f
e4a6aa9c-ec16-46f2-b0b3-4a2bb083851f	26236	Porta Paletes c/ 5 Planos em Aço	Porta Paletes c/ 5 Planos em Aço Conjunto Monofrontal de Estrutura Metalica Desmontavel	2024-08-07	162000.00	education	active	589	6522		\N	\N	\N	\N	Educação - Almoxarifado	2024-11-29	Starklinical do Brasil Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-24 17:55:22.376326+00	2025-09-24 17:55:22.376326+00	f
673995c2-8aec-4620-8a5b-acd4a226a7df	26282	Forno Micro-Ondas Agratto 127V 32 Lts	Forno Micro-Ondas Agratto 127V 32 Lts	2024-08-07	690.00	education	active	3232	6521	36435	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-28	Formigari Comercio de Moveis Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-24 17:58:17.660676+00	2025-09-24 17:58:17.660676+00	f
ba1ec477-fbfc-4f1f-be04-65a905b7f5cc	26283	Refrigerador Duplex Frost Free 340lts	Refrigerador Duplex Frost Free 340lts Branco Consul 127V	2024-08-07	2450.00	education	active	3232	6521	36435	\N	\N	\N	\N	Educação - Almoxarifado	2024-08-28	Formigari Comercio de Moveis Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-24 18:01:07.338603+00	2025-09-24 18:01:07.338603+00	f
6b18f182-696a-4bf8-96a4-67787538ee7a	26284	Robo Aspirador de Pó e Passa Pano Kabun Smart	Robo Aspirador de Pó e Passa Pano Kabun Smart 900 127V Preto	2025-06-18	2375.00	education	active	6545	5326	2375	\N	\N	\N	\N	Educação - Almoxarifado	2025-06-26	José carlos Janjacomo ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-24 18:07:52.620009+00	2025-09-24 18:07:52.620009+00	f
9b8af3de-45ff-4b8c-a0ae-1e820ed86a43	26285	Robo Aspirador de Pó e Passa Pano Kabun Smart	Robo Aspirador de Pó e Passa Pano Kabun Smart 900 127V Preto	2025-06-18	2375.00	education	active	6545	5326	2375	\N	\N	\N	\N	Educação - Almoxarifado	2025-06-26	José carlos Janjacomo ME	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-24 18:09:58.127666+00	2025-09-24 18:09:58.127666+00	f
a26f09a1-bb57-4282-9e6d-2f2cb69d4ed6	26286	Balcão de Entrada em MDF Branco TX	Balcão de Entrada em MDF Branco TX medindo 9,37mts com 4 gavetas corrediças largas e vão com plateleiras internas c/porta de 2mts p/passagem empilhadeira	2025-06-18	6317.54	education	active	1596	5330	2028	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-12	Rafael Cousso Rodrigues	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-24 18:19:56.399452+00	2025-09-24 18:19:56.399452+00	f
911ff210-9394-4334-9d55-4287bfc6f25a	26287	Balcão de Entrada em MDF Branco TX	Balcão de Entrada em MDF Branco TX medindo 6,05mts com 4 gavetas corrediças largas e vão com plateleiras internas c/porta de 2mts p/passagem empilhadeira	2025-06-18	4289.50	education	active	1596	5330	2028	\N	\N	\N	\N	Educação - Almoxarifado	2025-09-12	Rafael Cousso Rodrigues	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-24 18:21:42.256206+00	2025-09-24 18:21:42.256206+00	f
ad0bc19f-22b1-4d90-b97d-7efcab20c422	26288	Carrinho de Carga Plataforma de Aço 150 kg	Carrinho de Carga Plataforma de Aço 150 kg Riosul	2025-08-01	475.90	education	active	147956	5675	3437	\N	\N	\N	\N	Educação - Almoxarifado	2025-07-21	RT Casa das Ferragens e Ferram. Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-24 18:24:22.376801+00	2025-09-24 18:24:22.376801+00	f
a2b07fa5-77b0-4de7-b7fd-ec2ed6366109	26289	Carrinho de Carga Plataforma de Aço 150 kg	Carrinho de Carga Plataforma de Aço 150 kg Riosul	2025-07-01	475.90	education	active	147956	5675	3437	\N	\N	\N	\N	Educação - Almoxarifado	2025-07-21	RT Casa das Ferragens e Ferram. Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-24 18:26:06.013874+00	2025-09-24 18:26:06.013874+00	f
3c967664-9200-4f34-ab78-0b65b9ca8b9f	26290	Carrinho de Carga Plataforma de Aluminio 350 kg	Carrinho de Carga Plataforma de Aluminio 350 kg 3 posições Riosul	2025-07-01	1835.00	education	active	147956	5675	3437	\N	\N	\N	\N	Educação - Almoxarifado	2025-07-21	RT Casa das Ferragens e Ferram. Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-24 18:28:09.481766+00	2025-09-24 18:28:09.481766+00	f
d20e85b5-8330-41d8-9a4f-aac6783ddd59	26291	Gaveteiro Movel comm 4 gavetas modelo Slim Cristal	Gaveteiro Movel comm 4 gavetas modelo Slim Cristal	2025-07-03	458.00	education	active	525	5779	3794	\N	\N	\N	\N	Educação - Almoxarifado	2025-07-04	Remaq Moveis para Escritorio Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-24 18:30:13.406597+00	2025-09-24 18:30:13.406597+00	f
702121e3-4633-4225-9936-079a9880c5e2	26292	Gaveteiro Movel comm 4 gavetas modelo Slim Cristal	Gaveteiro Movel comm 4 gavetas modelo Slim Cristal	2025-07-03	458.00	education	active	525	5779	3794	\N	\N	\N	\N	Educação - Almoxarifado	2025-07-04	Remaq Moveis para Escritorio Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-24 18:31:37.069463+00	2025-09-24 18:31:37.069463+00	f
94140435-10f3-45b0-baa4-729077d00625	26293	Gaveteiro Movel comm 4 gavetas modelo Slim Cristal	Gaveteiro Movel comm 4 gavetas modelo Slim Cristal	2025-07-03	458.00	education	active	525	5779	3794	\N	\N	\N	\N	Educação - Almoxarifado	2025-07-04	Remaq Moveis para Escritorio Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2025-09-24 18:32:38.978991+00	2025-09-24 18:32:38.978991+00	f
e90787ef-b991-4512-ace9-747c3d1497b2	17411	Automovel Fiat/Uno Mille Economy nº 169	Placa EGI3759 Ano 2010/2011 CHASSIS: 9BD15822AB6458138 COR BRANCA FLEX	2010-04-16	27200.00	urbanism	active	1583	1359		\N	\N	\N	\N	Secretaria de Obras	2010-04-16	Bruna Veiculos	37e608de-71d8-4156-a8ee-01803c1308d7	2026-02-13 18:04:15.564639+00	2026-02-13 18:04:15.564639+00	f
10424ff4-9407-4335-9598-c1fd396918c5	27073	Automovel Renault Kwid ZEN 2	Placa QSR3F61 Ano 2025/26 CHASSIS; 93yrbb008tj349466 COR Branca FLEX	2025-07-14	71299.00	urbanism	active	1283	6043	231	\N	\N	\N	/uploads/d45325cd-1729-429c-85b1-c3d0d64f0ea5.jpeg	Fiscalização de Obras - Prefeitura	2025-08-22	THM Soluções Gerais Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2026-02-13 20:29:55.556748+00	2026-02-13 20:31:09.020066+00	f
027d6667-0fad-4d23-bc53-1cd45ac6ba16	14781	Automovel Chevrolet/Prisma 1.4L Lt	Placa EGI3770 Ano 211/2012 CHASSIS: 9BGRP69X0CG235045 COR BRANCA FLEX	2011-09-02	32744.70	urbanism	active	834465	5076		\N	\N	\N	/uploads/9cfa4b03-0541-4b64-833b-a056b6ad4998.jpeg	Secretaria de Obras	2011-09-02	General Motors do Brasil	37e608de-71d8-4156-a8ee-01803c1308d7	2026-02-13 15:04:49.135047+00	2026-02-23 15:12:59.460604+00	f
41709645-232d-4c9d-a670-c31c95494b4b	14657	Automovel Fiat/Uno Mille Economy	Nº 157 Placa CPV4195 2008/09 CHASSIS: 9BD15822A96211108 COR BRANCA FLEX	2008-12-30	24000.00	urbanism	active	50857	8553	76664	\N	\N	\N	/uploads/436d402d-723e-4a2e-bca2-77c59cf6eaaa.jpeg	Secretaria de Obras	2025-12-30	Bruna Veiculos	37e608de-71d8-4156-a8ee-01803c1308d7	2026-02-13 14:10:28.590167+00	2026-02-23 15:11:43.809586+00	f
000c341b-817d-4a90-8b6f-9d96831fa4c2	26480	Automovel I/Fiat Cronos Drive 1.3	Cor Branca Flex SHASSIS: 8AP359A1DLU091552	2020-08-18	64980.00	assistenci	active	30468	4493	140719	\N	\N	\N	/uploads/957e6274-fd4e-4de7-a594-30db407822bb.jpeg	Criança Feliz	2020-08-20	Bruna Veiculos	37e608de-71d8-4156-a8ee-01803c1308d7	2026-02-23 15:35:08.204112+00	2026-02-23 15:51:15.167506+00	f
4ae63586-901c-495b-a5e9-7805124ef21c	10880	Automovel Fiat/Uno Mille Fire	nº 114 PLACA BNZ3852 Cor Brabca Gasolina SHASSIS: 9BD15802534481189	2003-05-29	15560.85	urbanism	active	37016	3314	126656	\N	\N	\N	/uploads/77f46926-7487-4186-824a-fe9f1f234b94.jpeg	Secretaria de Obras	2003-05-29	Bruna Veiculos	37e608de-71d8-4156-a8ee-01803c1308d7	2026-02-23 15:25:14.050385+00	2026-02-23 18:40:09.727367+00	f
ff9ba248-8144-4f98-8caf-2eaa8ead8854	12594	Automvel Fiat/Uno Mille Economy	nº 169 PLACA EGI3759 Cor Branca Flex SHASSIS: 9BD15822AB658138	2010-04-16	27200.00	urbanism	active	1583	1359	6553	\N	\N	\N	/uploads/fe644e82-5d5a-4fd7-a8dc-cb2ce4f9ef9d.jpeg	Secretaria de Obras	2010-04-16	Bruna Veiculos	37e608de-71d8-4156-a8ee-01803c1308d7	2026-02-23 15:20:13.599424+00	2026-02-23 18:44:45.831857+00	f
bfe8f0fd-b337-431f-80d9-5b40473d3189	14659	Caminhão Ford/F4000 G	Carga Caminhão Placa CPV4190 Ano 2008/09 SHASSIS: 9BFLF47919B062232 COR BRANCA DIESEL	2008-11-18	95000.00	education	active	24374	7252	82063	\N	\N	\N	/uploads/a5c40168-6111-4ce4-b24d-eed63e5898ef.jpeg	Secretaria de Obras	2008-11-18	Comercial Araçatuba de Caminhões Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2026-02-24 12:48:18.323873+00	2026-02-24 12:48:18.583549+00	f
b2c50d71-946d-4c74-8caf-2c934ba359c1	22465	Automovel Chery/QQ 1.0 Look	PLaca GJT0814 Cor Branca Flex SHASSIS: 98RDB12B1JA002345	2017-09-21	33500.00	health	active	1281	4289	142330	\N	\N	\N	\N	Secretaria de Saúde	2017-09-21	Sullato Leste Comercio de Veiculos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2026-02-24 13:25:16.260192+00	2026-02-24 13:25:16.260192+00	f
15afa090-b546-41a9-b81d-f5c461f67aed	22466	Automovel Chery/QQ 1.0 Look	Placa GCD4456 COR BRANCA FLEX SHASSIS: 98RDB12BOJA002255	2017-09-21	33500.00	health	active	1282	4289	142330	\N	\N	\N	\N	Secretaria de Saúde	2017-09-21	Sullato Leste Comercio de Veiculos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2026-02-24 13:28:53.849538+00	2026-02-24 13:28:53.849538+00	f
3f770f2f-510d-423f-9b32-d9f74413158a	14267	Automovel Chery/QQ 1.0 Look	PLACA FIW7779 COR BRANCA FLEX SHASSIS: 98RDB12BXJA002263	2017-09-21	33500.00	health	active	1283	4289	142330	\N	\N	\N	\N	Secretaria de Saúde	2017-09-21	Sullato Leste Comercio de Veiculos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2026-02-24 13:32:11.255364+00	2026-02-24 13:32:11.255364+00	f
1fd10b61-4fc6-4caa-a429-aa244b2a0a45	22468	Automovel Chery/QQ 1.0 Look	PLACA GGD7553 COR BRANCA FLEX SHASSIS: 98RDB12B0JA001834	2017-09-21	33500.00	health	active	1284	4289	142330	\N	\N	\N	\N	Secretaria de Saúde	2017-09-21	Sullato Leste Comercio de Veiculos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2026-02-24 13:34:09.732337+00	2026-02-24 13:34:09.732337+00	f
d3d49677-0baf-4fac-84c4-eed179774525	27084	Chev/Onix Plus 10MT	Placa UEP1C50 ANO 2025/26 COR BRANCA FLEX SHASSIS: 9BGEA69A0T167866	2025-11-24	106000.00	administration	active	78967	8591	2309	\N	\N	\N	/uploads/6d11b744-8ba8-4285-862d-902268bd2b9b.jpeg	Banco do Povo	2025-11-24	Safra São Francisco Veiculos e Peças Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2026-02-24 14:24:35.248323+00	2026-02-24 14:35:06.013082+00	f
ddbf5c96-c486-47dd-bd93-80ed40a2188e	26039	Automovel Citroen Jumpy Ambulancia	MOD. 2025 DIESEL BRANCO CHASSIS: 9V7VPFC31SA006830	2025-11-18	250000.00	health	active	321	6068	1949	\N	\N	\N	\N	Cozinha Piloto	2025-11-18	Tawa Veiculos Especiais Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2026-11-25 14:23:42.071952+00	2026-11-25 14:23:42.071952+00	f
3fca4274-f16e-4098-8a85-9af2cefbfb95	26835	Automovel I/FIAT CRONOS DRIVE 1.3	PLACA TLO7D76 MOD.24/25 FLEX BRANCO SHASSIS: 8AP359AFRSU422171	2024-11-12	91500.00	urbanism	active	104278	8608		\N	\N	\N	\N	Secretaria de Obras	2024-11-12	Applauso Veiculos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2026-11-25 14:30:12.409924+00	2026-11-25 14:30:12.409924+00	f
3b15fc02-a929-4c76-9745-eab3cc320fd9	26794	Automovel I/FIAT CRONOS DRIVE 1.3	PLACA FEF7I56 MOD.22/23 FLEX BRANCO SHASSIS: 8AP359AFPPU231702	2022-08-24	87400.00	assistenci	active	33919	5086	159032	\N	\N	\N	\N	CRAS PLANALTO	2022-08-24	Bruma Veiculos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2026-11-25 14:36:49.538998+00	2026-11-25 14:36:49.538998+00	f
6faa827e-3544-44a5-96b7-e8b5cac2cb7e	26688	Automovel RENAULT/KWID ZEN 2	PLACA TKG6H77 MOD.25/26 FLEX BRANCO SHASSIS: 93YRBB00XTJ253953	2025-06-26	74950.00	assistenci	active	961	3913	8	\N	\N	\N	\N	Fundo Social e Solidariedade	2025-06-26	S3 Empreendimentos Com. e Locações Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2026-11-25 14:43:04.26579+00	2026-11-25 14:43:04.26579+00	f
f8e1c2e5-d37b-42da-b3cd-043caa1e8556	26689	CAMINHÃO  I/PEUGEOUT BOXER FURGÃO PK	PLACA TLI9J81 MOD.24/25 DIESEL BRANCO SHASSIS: VF3YEBRFCSMA32987	2025-06-11	227000.00	assistenci	active	5658	3912	8	\N	\N	\N	\N	Fundo Social e Solidariedade	2025-06-11	Mobile Automoveis e Serviços Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2026-11-25 14:48:02.794695+00	2026-11-25 14:48:02.794695+00	f
a0883855-61ed-408e-b1c2-b405988e6440	25447	ONIBUS  I/M.BENX 416 TAKO 20P	PLACA EXI3F71 MOD.22/22 DIESEL BRANCO SHASSIS: 8AC907643NE223996	2023-05-02	274000.00	sports	active	34	3374	177199	\N	\N	\N	\N	Secretaria de Esportes	2023-05-02	J.C.B. Maquinas e Equipamentos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2026-11-25 14:51:54.867542+00	2026-11-25 14:51:54.867542+00	f
ccc2915a-e74a-41be-93c7-ac0d70d23ec1	23656	Automovel CHEVROLET/MONTANA 1.4 LS FLEX	PLACA GEQ7H56 MOD.19/20 FLEX BRANCO SHASSIS: 9BGCA8030LB155414	2020-04-02	61000.00	health	active	78581	1943	162	\N	\N	\N	\N	Almoxarifado da Saúde	2020-04-02	Safira Veiculos e Peças Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2026-11-25 15:03:51.093207+00	2026-11-25 15:03:51.093207+00	f
7e384227-0daa-4717-bcc8-f71d52f6d136	17409	Automovel I/FIAT SIENA EL FLEX	PLACA EGI3766 MOD. 10/11 FLEX BRANCO SHASSIS: 8AP17202LB2150784	2010-08-30	35300.00	sports	active	2519	6826	101863	\N	\N	\N	/uploads/3cfbd725-4f5b-4ace-af9f-cb36631e2df0.jpeg	Secretaria de Esportes	2010-08-30	Bruma Veiculos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2026-11-25 18:42:18.540081+00	2026-11-25 18:42:18.671018+00	f
87018774-c616-4d28-9fa2-64c5e3d72317	17213	Automovel VW/KOMBI CAMIONETA	PLACA EGI3777 MOD.2010/11 FLEX BRANCO SHASSIS: 9BWF07X4BP010839	2010-08-24	46700.00	sports	active	657890	6827	101862	\N	\N	\N	\N	Secretaria de Esportes	2010-09-09	Volkswagen do Brasil Industria e Veicuos Automotores Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2026-11-25 18:53:05.17608+00	2026-11-25 18:53:05.17608+00	f
61e82c2a-5543-447f-8ffb-311876564cf9	14660	ONIBUS MARCOPOLO/VOLARE W9 ESC	PLACA BNZ3891 MOD.2008/08 DIESEL BRANCO SHASSIS: 93PB39E3P8C023904	2007-11-26	157700.00	sports	active	12050	6497	70423	\N	\N	\N	\N	Secretaria de Esportes	2008-02-17	La Place Veiculos	37e608de-71d8-4156-a8ee-01803c1308d7	2026-11-25 18:59:15.566186+00	2026-11-25 18:59:15.566186+00	f
9ef86ad3-fcf8-4e82-9a38-73b12130bfe1	25448	CARGA REBOQUE R/BRAVO RCA IE	PLACA BZA7J12 MOD.2022/22 COR PRETA SHASSIS: 9A9A0291NNBFS4109	2022-08-02	12150.00	sports	active	246	5827	7163	\N	\N	\N	\N	Secretaria de Esportes	2023-01-10	Supreme Unidades Moveis Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2026-11-25 19:03:58.118362+00	2026-11-25 19:03:58.118362+00	f
9ae5a363-e8b4-4677-91cd-f30f73d8d74b	22485	CAMIONETE FIAT TORO FREEDOM AT9	PLACA FRO3924 MOD.2019/19 DIESEL VERMELHA CHASSIS 988226165KKC49779	2019-02-01	122500.00	administration	active	27434	661	155548	\N	\N	\N	\N	Corpo de Bombeiros	2019-03-26	Bruma Veiculos Ltda	37e608de-71d8-4156-a8ee-01803c1308d7	2026-11-26 12:52:30.38017+00	2026-11-26 12:52:30.38017+00	f
90f99215-93ab-4bb5-b1dd-8dae890c0ca3	21799	FURGÃO AMBULANCIA COM ELEVADOR RANULT MASTER	PLACA CFZ6470 MOD.19/20 DIESEL BRANCA SHASSIS 93YMAF4XELJ037623	2019-06-25	192000.00	health	active	244	3853/3854	162021	\N	\N	\N	\N	Central de Ambulancia	2019-09-03	PGL Comercio de Veiculos Eireli ME	37e608de-71d8-4156-a8ee-01803c1308d7	2026-11-26 13:03:19.675931+00	2026-11-26 13:07:36.537212+00	f
\.


--
-- Data for Name: transfers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transfers (id, patrimony_id, from_department, to_department, reason, transferred_by, transferred_at) FROM stdin;
d1234139-b046-454a-a736-fdcf82a36b9c	e110c966-7404-4b4f-ba31-57c79bd522c8	health	education	Transferência para uso na escola especial	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-05 11:23:40.136935+00
15b4ce98-091e-4011-98d4-0178bfd1da2b	db644860-f9d1-4d7d-87b3-13ff0b796d9c	administration	urbanism	Necessidade no departamento de urbanismo	20b35cc3-5f15-430a-aaf3-60fdcedbc2db	2025-09-05 11:23:40.136935+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, company_name, department, username, password_hash, email, role, created_at, updated_at) FROM stdin;
20b35cc3-5f15-430a-aaf3-60fdcedbc2db	Prefeitura Municipal	Administração	admin	$2b$12$L5V5c5u5c5u5c5u5c5u5uO5c5u5c5u5c5u5c5u5c5u5c5u5c5u5c5u	admin@prefeitura.gov.br	admin	2025-09-05 11:23:40.099228+00	2025-09-05 11:23:40.099228+00
37e608de-71d8-4156-a8ee-01803c1308d7	Prefeitura Municipal de Penapolis	administration	wilson	$2b$12$jmbzs1Bd9EYJ4d0tCr6Wa.O95ncdsxAgLUPOzN9eKWDPvLsCpof5e	wil.kimel@hotmail.com	admin	2025-09-05 11:26:06.589093+00	2025-09-05 11:26:06.589093+00
\.


--
-- Name: fiscal_documents fiscal_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiscal_documents
    ADD CONSTRAINT fiscal_documents_pkey PRIMARY KEY (id);


--
-- Name: patrimonies patrimonies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patrimonies
    ADD CONSTRAINT patrimonies_pkey PRIMARY KEY (id);


--
-- Name: patrimonies patrimonies_plate_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patrimonies
    ADD CONSTRAINT patrimonies_plate_key UNIQUE (plate);


--
-- Name: transfers transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: fiscal_documents fiscal_documents_patrimony_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiscal_documents
    ADD CONSTRAINT fiscal_documents_patrimony_id_fkey FOREIGN KEY (patrimony_id) REFERENCES public.patrimonies(id) ON DELETE CASCADE;


--
-- Name: patrimonies patrimonies_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patrimonies
    ADD CONSTRAINT patrimonies_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: transfers transfers_patrimony_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_patrimony_id_fkey FOREIGN KEY (patrimony_id) REFERENCES public.patrimonies(id) ON DELETE CASCADE;


--
-- Name: transfers transfers_transferred_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_transferred_by_fkey FOREIGN KEY (transferred_by) REFERENCES public.users(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict cbW6f4YoWxwCXXkDSIAwnpljaec9YrC1R5naqcsLkdFYZ9XeneGgjGbfSVyabDB

