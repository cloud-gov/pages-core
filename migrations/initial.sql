--
-- PostgreSQL database dump
--

--
-- Name: build; Type: TABLE; Schema: public; Tablespace:
--

CREATE TABLE build (
    "completedAt" timestamp with time zone,
    error text,
    branch text,
    state text,
    site integer,
    "user" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


--
-- Name: build_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE build_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: build_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE build_id_seq OWNED BY build.id;


--
-- Name: passport; Type: TABLE; Schema: public; Tablespace:
--

CREATE TABLE passport (
    protocol text,
    password text,
    "accessToken" text,
    provider text,
    identifier text,
    tokens json,
    "user" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


--
-- Name: passport_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE passport_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: passport_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE passport_id_seq OWNED BY passport.id;


--
-- Name: site; Type: TABLE; Schema: public; Tablespace:
--

CREATE TABLE site (
    owner text,
    repository text,
    engine text,
    "defaultBranch" text,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


--
-- Name: site_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE site_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE site_id_seq OWNED BY site.id;


--
-- Name: site_users__user_sites; Type: TABLE; Schema: public; Tablespace:
--

CREATE TABLE site_users__user_sites (
    id integer NOT NULL,
    site_users integer,
    user_sites integer
);


--
-- Name: site_users__user_sites_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE site_users__user_sites_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_users__user_sites_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE site_users__user_sites_id_seq OWNED BY site_users__user_sites.id;


--
-- Name: user; Type: TABLE; Schema: public; Tablespace:
--

CREATE TABLE "user" (
    username text,
    email text,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public
--

CREATE SEQUENCE user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public
--

ALTER SEQUENCE user_id_seq OWNED BY "user".id;


--
-- Name: id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY build ALTER COLUMN id SET DEFAULT nextval('build_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY passport ALTER COLUMN id SET DEFAULT nextval('passport_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY site ALTER COLUMN id SET DEFAULT nextval('site_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY site_users__user_sites ALTER COLUMN id SET DEFAULT nextval('site_users__user_sites_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public
--

ALTER TABLE ONLY "user" ALTER COLUMN id SET DEFAULT nextval('user_id_seq'::regclass);


--
-- Name: build_pkey; Type: CONSTRAINT; Schema: public; Tablespace:
--

ALTER TABLE ONLY build
    ADD CONSTRAINT build_pkey PRIMARY KEY (id);


--
-- Name: passport_pkey; Type: CONSTRAINT; Schema: public; Tablespace:
--

ALTER TABLE ONLY passport
    ADD CONSTRAINT passport_pkey PRIMARY KEY (id);


--
-- Name: site_pkey; Type: CONSTRAINT; Schema: public; Tablespace:
--

ALTER TABLE ONLY site
    ADD CONSTRAINT site_pkey PRIMARY KEY (id);


--
-- Name: site_users__user_sites_pkey; Type: CONSTRAINT; Schema: public; Tablespace:
--

ALTER TABLE ONLY site_users__user_sites
    ADD CONSTRAINT site_users__user_sites_pkey PRIMARY KEY (id);


--
-- Name: user_pkey; Type: CONSTRAINT; Schema: public; Tablespace:
--

ALTER TABLE ONLY "user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: user_username_key; Type: CONSTRAINT; Schema: public; Tablespace:
--

ALTER TABLE ONLY "user"
    ADD CONSTRAINT user_username_key UNIQUE (username);


--
-- PostgreSQL database dump complete
--
