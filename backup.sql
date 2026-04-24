--
-- PostgreSQL database dump
--

\restrict wTQ5avWslt9afu7dlrARLkOmUoT3I056loaKQ8ALq0nMQ1PSg0hqgrqUrgUKoBF

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    appointment_id integer NOT NULL,
    clinic_id integer NOT NULL,
    doctor_id integer NOT NULL,
    patient_id integer NOT NULL,
    start_date_time timestamp with time zone NOT NULL,
    end_date_time timestamp with time zone NOT NULL,
    appointment_notes text,
    appointment_status character varying(100) NOT NULL,
    confirmation_status character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    patient_action_token character varying(64),
    patient_action_token_expires_at timestamp with time zone,
    patient_confirmation_status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    patient_confirmed_at timestamp with time zone,
    patient_cancelled_at timestamp with time zone,
    patient_reschedule_requested_at timestamp with time zone
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- Name: appointments_appointment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.appointments_appointment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointments_appointment_id_seq OWNER TO postgres;

--
-- Name: appointments_appointment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.appointments_appointment_id_seq OWNED BY public.appointments.appointment_id;


--
-- Name: clinic_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clinic_settings (
    clinic_id integer NOT NULL,
    timezone character varying(100) NOT NULL,
    default_channel_type character varying(50) NOT NULL,
    appointment_reminder_hours_before integer NOT NULL,
    follow_up_delay_days integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sms_provider_name character varying(255),
    sms_sender_name character varying(255),
    sms_username character varying(255),
    sms_password text,
    sms_token text,
    sms_is_primary_gateway boolean DEFAULT true,
    sms_patient_action_base_path character varying(255),
    sms_last_checked_at timestamp with time zone
);


ALTER TABLE public.clinic_settings OWNER TO postgres;

--
-- Name: clinics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clinics (
    clinic_id integer NOT NULL,
    display_name character varying(255) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.clinics OWNER TO postgres;

--
-- Name: clinics_clinic_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clinics_clinic_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinics_clinic_id_seq OWNER TO postgres;

--
-- Name: clinics_clinic_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clinics_clinic_id_seq OWNED BY public.clinics.clinic_id;


--
-- Name: doctor_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_schedules (
    doctor_schedule_id bigint NOT NULL,
    clinic_id bigint NOT NULL,
    doctor_id bigint NOT NULL,
    weekday integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    appointment_duration_minutes integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT doctor_schedules_appointment_duration_minutes_check CHECK ((appointment_duration_minutes > 0)),
    CONSTRAINT doctor_schedules_valid_range CHECK ((end_time > start_time)),
    CONSTRAINT doctor_schedules_weekday_check CHECK (((weekday >= 1) AND (weekday <= 7)))
);


ALTER TABLE public.doctor_schedules OWNER TO postgres;

--
-- Name: doctor_schedules_doctor_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctor_schedules_doctor_schedule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctor_schedules_doctor_schedule_id_seq OWNER TO postgres;

--
-- Name: doctor_schedules_doctor_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_schedules_doctor_schedule_id_seq OWNED BY public.doctor_schedules.doctor_schedule_id;


--
-- Name: doctors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctors (
    doctor_id integer NOT NULL,
    clinic_id integer NOT NULL,
    display_name character varying(255) NOT NULL,
    specialization_id integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.doctors OWNER TO postgres;

--
-- Name: doctors_doctor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctors_doctor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctors_doctor_id_seq OWNER TO postgres;

--
-- Name: doctors_doctor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctors_doctor_id_seq OWNED BY public.doctors.doctor_id;


--
-- Name: follow_ups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.follow_ups (
    follow_up_id integer NOT NULL,
    clinic_id integer NOT NULL,
    appointment_id integer NOT NULL,
    follow_up_status character varying(100) NOT NULL,
    scheduled_for timestamp with time zone NOT NULL,
    follow_up_notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.follow_ups OWNER TO postgres;

--
-- Name: follow_ups_follow_up_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.follow_ups_follow_up_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.follow_ups_follow_up_id_seq OWNER TO postgres;

--
-- Name: follow_ups_follow_up_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.follow_ups_follow_up_id_seq OWNED BY public.follow_ups.follow_up_id;


--
-- Name: imports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.imports (
    import_id integer NOT NULL,
    clinic_id integer NOT NULL,
    imported_by_user_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_type character varying(20) NOT NULL,
    import_status character varying(50) NOT NULL,
    imported_count integer DEFAULT 0 NOT NULL,
    failed_count integer DEFAULT 0 NOT NULL,
    error_details text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.imports OWNER TO postgres;

--
-- Name: imports_import_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.imports_import_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.imports_import_id_seq OWNER TO postgres;

--
-- Name: imports_import_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.imports_import_id_seq OWNED BY public.imports.import_id;


--
-- Name: message_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.message_templates (
    template_id integer NOT NULL,
    clinic_id integer NOT NULL,
    template_name character varying(255) NOT NULL,
    channel_type character varying(50) NOT NULL,
    message_subject character varying(255) NOT NULL,
    message_body text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.message_templates OWNER TO postgres;

--
-- Name: message_templates_template_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.message_templates_template_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.message_templates_template_id_seq OWNER TO postgres;

--
-- Name: message_templates_template_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.message_templates_template_id_seq OWNED BY public.message_templates.template_id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    message_id integer NOT NULL,
    clinic_id integer NOT NULL,
    appointment_id integer NOT NULL,
    channel_type character varying(50) NOT NULL,
    message_subject character varying(255) NOT NULL,
    message_body text NOT NULL,
    message_status character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: messages_message_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_message_id_seq OWNER TO postgres;

--
-- Name: messages_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_message_id_seq OWNED BY public.messages.message_id;


--
-- Name: patients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patients (
    patient_id integer NOT NULL,
    clinic_id integer NOT NULL,
    display_name character varying(255) NOT NULL,
    phone_number character varying(32) NOT NULL,
    email character varying(320),
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    cnp character varying(13),
    sex character varying(20),
    birth_date date,
    city character varying(255)
);


ALTER TABLE public.patients OWNER TO postgres;

--
-- Name: patients_patient_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.patients_patient_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.patients_patient_id_seq OWNER TO postgres;

--
-- Name: patients_patient_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.patients_patient_id_seq OWNED BY public.patients.patient_id;


--
-- Name: responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.responses (
    response_id integer NOT NULL,
    clinic_id integer NOT NULL,
    message_id integer NOT NULL,
    response_status character varying(100) NOT NULL,
    response_text text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.responses OWNER TO postgres;

--
-- Name: responses_response_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.responses_response_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.responses_response_id_seq OWNER TO postgres;

--
-- Name: responses_response_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.responses_response_id_seq OWNED BY public.responses.response_id;


--
-- Name: specialization_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.specialization_services (
    service_id integer NOT NULL,
    clinic_id integer NOT NULL,
    specialization_id integer NOT NULL,
    service_name character varying(255) NOT NULL,
    price numeric(12,2) DEFAULT 0 NOT NULL,
    duration_minutes integer,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT specialization_services_duration_check CHECK (((duration_minutes IS NULL) OR (duration_minutes > 0))),
    CONSTRAINT specialization_services_price_check CHECK ((price >= (0)::numeric))
);


ALTER TABLE public.specialization_services OWNER TO postgres;

--
-- Name: specialization_services_service_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.specialization_services_service_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.specialization_services_service_id_seq OWNER TO postgres;

--
-- Name: specialization_services_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.specialization_services_service_id_seq OWNED BY public.specialization_services.service_id;


--
-- Name: specializations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.specializations (
    specialization_id integer NOT NULL,
    clinic_id integer NOT NULL,
    display_name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.specializations OWNER TO postgres;

--
-- Name: specializations_specialization_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.specializations_specialization_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.specializations_specialization_id_seq OWNER TO postgres;

--
-- Name: specializations_specialization_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.specializations_specialization_id_seq OWNED BY public.specializations.specialization_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    clinic_id integer NOT NULL,
    email character varying(320) NOT NULL,
    password_hash text NOT NULL,
    user_role_label character varying(100) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: appointments appointment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments ALTER COLUMN appointment_id SET DEFAULT nextval('public.appointments_appointment_id_seq'::regclass);


--
-- Name: clinics clinic_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinics ALTER COLUMN clinic_id SET DEFAULT nextval('public.clinics_clinic_id_seq'::regclass);


--
-- Name: doctor_schedules doctor_schedule_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_schedules ALTER COLUMN doctor_schedule_id SET DEFAULT nextval('public.doctor_schedules_doctor_schedule_id_seq'::regclass);


--
-- Name: doctors doctor_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors ALTER COLUMN doctor_id SET DEFAULT nextval('public.doctors_doctor_id_seq'::regclass);


--
-- Name: follow_ups follow_up_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follow_ups ALTER COLUMN follow_up_id SET DEFAULT nextval('public.follow_ups_follow_up_id_seq'::regclass);


--
-- Name: imports import_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imports ALTER COLUMN import_id SET DEFAULT nextval('public.imports_import_id_seq'::regclass);


--
-- Name: message_templates template_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_templates ALTER COLUMN template_id SET DEFAULT nextval('public.message_templates_template_id_seq'::regclass);


--
-- Name: messages message_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN message_id SET DEFAULT nextval('public.messages_message_id_seq'::regclass);


--
-- Name: patients patient_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients ALTER COLUMN patient_id SET DEFAULT nextval('public.patients_patient_id_seq'::regclass);


--
-- Name: responses response_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.responses ALTER COLUMN response_id SET DEFAULT nextval('public.responses_response_id_seq'::regclass);


--
-- Name: specialization_services service_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specialization_services ALTER COLUMN service_id SET DEFAULT nextval('public.specialization_services_service_id_seq'::regclass);


--
-- Name: specializations specialization_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specializations ALTER COLUMN specialization_id SET DEFAULT nextval('public.specializations_specialization_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointments (appointment_id, clinic_id, doctor_id, patient_id, start_date_time, end_date_time, appointment_notes, appointment_status, confirmation_status, created_at, updated_at, patient_action_token, patient_action_token_expires_at, patient_confirmation_status, patient_confirmed_at, patient_cancelled_at, patient_reschedule_requested_at) FROM stdin;
1	1	1	2	2026-04-16 01:40:00+03	2026-04-16 01:43:00+03	\N	Programată	Fără răspuns	2026-04-16 09:37:44.278423+03	2026-04-16 09:37:44.278423+03	\N	\N	pending	\N	\N	\N
2	1	1	2	2026-04-20 10:30:00+03	2026-04-20 11:00:00+03	pacientul vrea si ecograf	Programată	Fără răspuns	2026-04-16 10:26:20.884408+03	2026-04-16 10:26:20.884408+03	\N	\N	pending	\N	\N	\N
3	1	1	3	2026-04-20 11:00:00+03	2026-04-20 11:30:00+03		Programată	Fără răspuns	2026-04-16 15:59:40.413794+03	2026-04-16 15:59:40.413794+03	\N	\N	pending	\N	\N	\N
4	1	1	4	2026-04-20 09:00:00.527171+03	2026-04-20 09:30:00.527171+03	ETAPA 59 API verification	Programată	Fără răspuns	2026-04-16 16:27:07.541788+03	2026-04-16 16:27:07.541788+03	\N	\N	pending	\N	\N	\N
6	1	2	6	2026-04-17 15:40:00+03	2026-04-17 16:00:00+03		Programată	Fără răspuns	2026-04-16 18:56:32.474742+03	2026-04-16 18:56:32.474742+03	\N	\N	pending	\N	\N	\N
7	1	2	7	2026-04-17 13:40:00+03	2026-04-17 14:00:00+03		Programată	Fără răspuns	2026-04-16 18:59:41.073638+03	2026-04-16 18:59:41.073638+03	\N	\N	pending	\N	\N	\N
8	1	2	8	2026-04-17 14:00:00+03	2026-04-17 14:30:00+03		Programată	Fără răspuns	2026-04-16 21:22:17.239209+03	2026-04-16 21:22:17.239209+03	\N	\N	pending	\N	\N	\N
9	1	2	9	2026-04-21 12:30:00+03	2026-04-21 13:00:00+03		Programată	Fără răspuns	2026-04-17 09:46:06.813476+03	2026-04-17 09:46:06.813476+03	\N	\N	pending	\N	\N	\N
10	1	2	3	2026-04-20 10:30:00+03	2026-04-20 11:00:00+03	\N	Programată	Fără răspuns	2026-04-18 08:48:19.872606+03	2026-04-18 08:48:19.872606+03	\N	\N	pending	\N	\N	\N
5	1	2	5	2026-04-17 17:20:00+03	2026-04-17 17:40:00+03	\N	Programată	Fără răspuns	2026-04-16 17:09:44.374205+03	2026-04-18 08:49:39.308528+03	\N	\N	pending	\N	\N	\N
11	1	1	9	2026-04-20 09:30:00+03	2026-04-20 10:00:00+03	\N	Programată	Fără răspuns	2026-04-18 09:09:41.736718+03	2026-04-18 09:09:41.736718+03	\N	\N	pending	\N	\N	\N
12	1	2	10	2026-04-20 11:00:00+03	2026-04-20 11:30:00+03	\N	Programată	Fără răspuns	2026-04-18 11:08:55.901508+03	2026-04-18 11:08:55.901508+03	\N	\N	pending	\N	\N	\N
14	1	4	12	2026-04-20 10:00:00+03	2026-04-20 10:30:00+03	\N	Programată	Fără răspuns	2026-04-18 13:22:28.210876+03	2026-04-18 13:22:28.210876+03	\N	\N	pending	\N	\N	\N
15	1	4	13	2026-04-20 09:30:00+03	2026-04-20 10:00:00+03	\N	Programată	Fără răspuns	2026-04-18 13:23:30.357043+03	2026-04-18 13:23:30.357043+03	\N	\N	pending	\N	\N	\N
16	1	4	14	2026-04-20 11:00:00+03	2026-04-20 11:30:00+03	\N	Programată	Fără răspuns	2026-04-18 13:29:44.351111+03	2026-04-18 13:29:44.351111+03	\N	\N	pending	\N	\N	\N
17	1	4	15	2026-04-21 10:00:00+03	2026-04-21 10:30:00+03	\N	Programată	Fără răspuns	2026-04-18 13:42:01.557837+03	2026-04-18 13:42:01.557837+03	\N	\N	pending	\N	\N	\N
18	1	2	16	2026-04-24 11:00:00+03	2026-04-24 11:30:00+03	\N	Programată	Fără răspuns	2026-04-22 13:48:39.746988+03	2026-04-22 13:48:39.746988+03	a66dc87a16fa2b39273a0bbfe311ce8c6a92c7a93f95c1dd8e8ccec437e3f1d4	2026-04-24 13:48:39.746+03	pending	\N	\N	\N
19	1	2	17	2026-04-24 11:30:00+03	2026-04-24 12:00:00+03	\N	Programată	Fără răspuns	2026-04-22 14:57:16.791582+03	2026-04-22 14:57:16.791582+03	315cd4255e4adea1a490c62bd4659115065b8f10596c8b77c859a4f9270499c0	2026-04-24 14:57:16.791+03	pending	\N	\N	\N
20	1	2	18	2026-04-23 12:30:00+03	2026-04-23 13:00:00+03	\N	Programată	Fără răspuns	2026-04-23 11:46:11.418804+03	2026-04-23 11:46:11.418804+03	b61de80a49c283c8463c1b7ff1ca83c27cb0cf97bcc1a8ff76e5aa3973fd7080	2026-04-25 11:46:11.418+03	pending	\N	\N	\N
21	1	2	19	2026-04-24 12:30:00+03	2026-04-24 13:00:00+03	\N	Programată	Fără răspuns	2026-04-23 12:07:11.389161+03	2026-04-23 12:07:11.389161+03	25a310645a0b31ff26186948c09eb0e436e77dca60382ac45112c4f7420a627d	2026-04-25 12:07:11.388+03	pending	\N	\N	\N
\.


--
-- Data for Name: clinic_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clinic_settings (clinic_id, timezone, default_channel_type, appointment_reminder_hours_before, follow_up_delay_days, created_at, updated_at, sms_provider_name, sms_sender_name, sms_username, sms_password, sms_token, sms_is_primary_gateway, sms_patient_action_base_path, sms_last_checked_at) FROM stdin;
1	Europe/Bucharest	Email	24	3	2026-04-16 08:55:37.848345+03	2026-04-16 09:00:36.608674+03	\N	\N	\N	\N	\N	t	\N	\N
\.


--
-- Data for Name: clinics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clinics (clinic_id, display_name, is_active, created_at, updated_at) FROM stdin;
1	Clinica 1	t	2026-04-16 08:30:59.269009+03	2026-04-16 08:30:59.269009+03
\.


--
-- Data for Name: doctor_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_schedules (doctor_schedule_id, clinic_id, doctor_id, weekday, start_time, end_time, appointment_duration_minutes, is_active, created_at, updated_at) FROM stdin;
6	1	2	2	10:00:00	15:00:00	30	t	2026-04-16 21:00:08.720934+03	2026-04-16 21:00:08.720934+03
7	1	2	3	10:00:00	15:00:00	30	t	2026-04-16 21:00:08.721664+03	2026-04-16 21:00:08.721664+03
3	1	2	5	10:00:00	15:00:00	30	t	2026-04-16 10:53:05.955758+03	2026-04-16 21:00:08.724116+03
9	1	2	4	10:00:00	15:00:00	30	t	2026-04-16 21:00:08.725087+03	2026-04-16 21:00:08.725087+03
10	1	2	1	10:00:00	15:00:00	30	t	2026-04-16 21:00:08.83618+03	2026-04-16 21:00:08.83618+03
11	1	4	3	09:00:00	13:00:00	30	t	2026-04-16 22:28:17.694362+03	2026-04-16 22:28:17.694362+03
12	1	4	4	09:00:00	13:00:00	30	t	2026-04-16 22:28:17.695651+03	2026-04-16 22:28:17.695651+03
13	1	4	2	09:00:00	14:00:00	30	t	2026-04-16 22:28:17.839215+03	2026-04-16 22:42:24.432654+03
16	1	3	4	10:00:00	14:00:00	30	t	2026-04-16 22:43:35.795919+03	2026-04-16 22:43:35.795919+03
18	1	1	3	09:00:00	15:00:00	30	t	2026-04-18 13:20:24.375716+03	2026-04-18 13:20:24.375716+03
19	1	1	4	09:00:00	15:00:00	30	t	2026-04-18 13:20:24.382115+03	2026-04-18 13:20:24.382115+03
1	1	1	1	09:00:00	15:00:00	30	t	2026-04-16 10:17:23.467587+03	2026-04-18 13:20:24.387659+03
20	1	1	5	09:00:00	15:00:00	30	t	2026-04-18 13:20:24.387401+03	2026-04-18 13:20:24.387401+03
2	1	1	2	09:00:00	15:00:00	30	t	2026-04-16 10:25:17.57001+03	2026-04-18 13:20:24.515678+03
23	1	3	2	11:00:00	15:00:00	30	t	2026-04-18 13:21:10.430278+03	2026-04-18 13:21:10.430278+03
24	1	3	1	11:00:00	15:00:00	30	t	2026-04-18 13:21:10.433266+03	2026-04-18 13:21:10.433266+03
15	1	3	5	14:00:00	20:00:00	30	t	2026-04-16 22:43:35.688163+03	2026-04-18 13:21:10.437139+03
26	1	3	3	11:00:00	15:00:00	30	t	2026-04-18 13:21:10.572786+03	2026-04-18 13:21:10.572786+03
27	1	4	1	09:00:00	15:00:00	30	t	2026-04-18 13:21:28.485943+03	2026-04-18 13:21:28.485943+03
\.


--
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctors (doctor_id, clinic_id, display_name, specialization_id, is_active, created_at, updated_at) FROM stdin;
1	1	Ionescu Andrei	1	t	2026-04-16 09:19:05.767578+03	2026-04-16 09:28:09.808875+03
4	1	Daniela Papa	3	t	2026-04-16 22:18:16.791207+03	2026-04-16 22:18:16.791207+03
3	1	Iancu Marin	4	t	2026-04-16 21:59:00.620686+03	2026-04-16 22:43:54.582538+03
2	1	Ileana Chiris	2	t	2026-04-16 09:24:44.317654+03	2026-04-22 13:04:15.25028+03
\.


--
-- Data for Name: follow_ups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.follow_ups (follow_up_id, clinic_id, appointment_id, follow_up_status, scheduled_for, follow_up_notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: imports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.imports (import_id, clinic_id, imported_by_user_id, file_name, file_type, import_status, imported_count, failed_count, error_details, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: message_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.message_templates (template_id, clinic_id, template_name, channel_type, message_subject, message_body, created_at, updated_at) FROM stdin;
10	1	Email - Follow-up după consultație	Email	Cum vă simțiți după vizită?	Bună ziua,\n\nSperăm că vă simțiți bine după vizită. Dacă au apărut întrebări sau aveți nevoie de lămuriri suplimentare, vă rugăm să ne răspundeți.\n\nRevenim cu grijă, pentru că sănătatea și confortul dumneavoastră contează.\n\nCu considerație,\nEchipa clinicii	2026-04-16 18:24:28.910387+03	2026-04-16 18:34:49.302085+03
11	1	SMS - Absență și reprogramare	SMS	Putem reprograma vizita	Ne pare rău că nu ne-am văzut astăzi. Dacă doriți, vă ajutăm rapid să găsim o nouă programare potrivită.	2026-04-16 18:24:28.913203+03	2026-04-16 18:34:49.306359+03
12	1	Email - Cerere feedback pacient	Email	Experiența dumneavoastră contează	Vă mulțumim pentru încrederea acordată.\n\nDacă doriți, ne puteți trimite un scurt feedback despre experiența avută.\n\nPentru noi contează să oferim fiecărui pacient o experiență caldă, clară și profesionistă.\n\nCu respect,\nEchipa clinicii	2026-04-16 18:24:28.915832+03	2026-04-16 18:34:49.309678+03
1	1	WhatsApp - Confirmare programare	WhatsApp	Confirmarea programării	Bună ziua! Vă confirmăm programarea și vă așteptăm cu drag. Dacă aveți nevoie de ajutor sau doriți reprogramare, ne puteți scrie direct.	2026-04-16 18:24:28.876615+03	2026-04-16 18:34:49.261707+03
2	1	SMS - Confirmare programare	SMS	Programarea este confirmată	Bună ziua! Programarea dvs. este confirmată. Pentru ajutor sau reprogramare, vă rugăm să ne contactați.	2026-04-16 18:24:28.883943+03	2026-04-16 18:34:49.267524+03
3	1	Email - Confirmare programare premium	Email	Programarea dumneavoastră este confirmată	Bună ziua,\n\nVă mulțumim pentru încredere. Programarea dumneavoastră este confirmată, iar echipa noastră vă așteaptă cu atenție și grijă.\n\nDacă aveți întrebări înainte de vizită sau aveți nevoie de sprijin pentru reprogramare, ne puteți răspunde direct la acest email.\n\nCu considerație,\nEchipa clinicii	2026-04-16 18:24:28.886744+03	2026-04-16 18:34:49.271761+03
4	1	WhatsApp - Reamintire cu 24h înainte	WhatsApp	Reamintire programare	Bună ziua! Vă reamintim de programarea de mâine. Dacă doriți reconfirmare sau reprogramare, ne puteți răspunde direct.	2026-04-16 18:24:28.889755+03	2026-04-16 18:34:49.275876+03
5	1	SMS - Reamintire în ziua vizitei	SMS	Reamintire vizită	Bună ziua! Vă așteptăm astăzi la clinică. Dacă întârziați sau aveți nevoie de ajutor, vă rugăm să ne anunțați.	2026-04-16 18:24:28.893334+03	2026-04-16 18:34:49.280884+03
6	1	WhatsApp - Solicitare reconfirmare	WhatsApp	Reconfirmarea programării	Bună ziua! Pentru a vă pregăti vizita cât mai bine, vă rugăm să ne confirmați disponibilitatea. Un răspuns scurt ne ajută mult.	2026-04-16 18:24:28.896858+03	2026-04-16 18:34:49.285376+03
7	1	WhatsApp - Reprogramare elegantă	WhatsApp	Actualizare programare	Bună ziua! A apărut o modificare de program și dorim să vă oferim rapid o variantă convenabilă de reprogramare. Vă mulțumim pentru înțelegere.	2026-04-16 18:24:28.899702+03	2026-04-16 18:34:49.289609+03
8	1	Email - Bun venit pacient nou	Email	Bine ați venit la clinică	Bun venit!\n\nNe bucurăm că ne-ați ales. Echipa noastră vă stă la dispoziție pentru o experiență calmă, clară și atentă la nevoile dumneavoastră.\n\nDacă aveți întrebări înainte de vizită, ne puteți răspunde direct la acest email.\n\nCu drag,\nEchipa clinicii	2026-04-16 18:24:28.902736+03	2026-04-16 18:34:49.293793+03
9	1	WhatsApp - Mulțumire după consultație	WhatsApp	Vă mulțumim pentru vizită	Vă mulțumim pentru vizita de astăzi. Pentru noi este important să vă simțiți ascultat și bine îngrijit. Dacă aveți întrebări, ne puteți scrie direct.	2026-04-16 18:24:28.907033+03	2026-04-16 18:34:49.297698+03
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (message_id, clinic_id, appointment_id, channel_type, message_subject, message_body, message_status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patients (patient_id, clinic_id, display_name, phone_number, email, notes, is_active, created_at, updated_at, cnp, sex, birth_date, city) FROM stdin;
1	1	Pacient Schema Check	0712345678	pacient.schema.check@test.local	created for schema verification	t	2026-04-16 08:55:51.907628+03	2026-04-16 08:55:51.907628+03	\N	\N	\N	\N
4	1	Pacient Debug 20260416162707	0700162707	\N	\N	t	2026-04-16 16:27:07.530498+03	2026-04-16 16:27:07.530498+03	\N	\N	\N	\N
5	1	Eugenia Papa	0777888999	\N	\N	t	2026-04-16 17:09:44.360605+03	2026-04-16 17:09:44.360605+03	\N	\N	\N	\N
6	1	Monica Petcu	0723458458	\N	\N	t	2026-04-16 18:56:32.460422+03	2026-04-16 18:56:32.460422+03	\N	\N	\N	\N
8	1	Ionescu Marius	0722411411	\N	\N	t	2026-04-16 21:22:17.225945+03	2026-04-16 21:22:17.225945+03	\N	\N	\N	\N
7	1	Gabriel Popa	0799889988	gabriel@goolge.ro	\N	t	2026-04-16 18:59:41.062672+03	2026-04-16 21:50:00.534948+03	\N	\N	\N	\N
10	1	Dorina Popa	0722333222	\N	\N	t	2026-04-18 11:08:55.888907+03	2026-04-18 11:08:55.888907+03	\N	\N	\N	\N
11	1	Pacient Debug 20260418113139	0700113139	\N	\N	t	2026-04-18 11:31:39.097214+03	2026-04-18 11:31:39.097214+03	\N	\N	\N	\N
9	1	Razvan	0722333445	\N	\N	f	2026-04-17 09:46:06.797886+03	2026-04-18 13:13:48.379219+03	1960502140014	Masculin	1996-05-02	Craiova
12	1	Margareta Ion	0741852963	\N	\N	t	2026-04-18 13:22:28.196841+03	2026-04-18 13:22:28.196841+03	2491108478881	Feminin	1949-11-08	craiova
13	1	Margareta Ion	0745123450	\N	\N	t	2026-04-18 13:23:30.340458+03	2026-04-18 13:23:30.340458+03	2491108478881	Feminin	1949-11-08	craiova
14	1	Margareta Ion	0756892345	\N	\N	t	2026-04-18 13:29:44.332466+03	2026-04-18 13:29:44.332466+03	2491108478881	Feminin	1949-11-08	craiova
15	1	Margareta Ion 3	0788999444	\N	\N	t	2026-04-18 13:42:01.525151+03	2026-04-18 13:42:01.525151+03	2491109140022	Feminin	1949-11-09	craiova
3	1	Andrei Gheorghe	0722333445	\N	\N	t	2026-04-16 15:59:40.397238+03	2026-04-18 14:01:47.755896+03	1700202147874	Masculin	1970-02-02	Craiova
2	1	Gicu Popescu	0727888977	gicu@pacient.ro	\N	t	2026-04-16 09:04:49.086819+03	2026-04-22 12:30:45.852646+03	1881212160022	Masculin	1988-12-12	Craiova
16	1	Margareta Ion	0745123456	\N	\N	t	2026-04-22 13:48:39.72755+03	2026-04-22 13:48:39.72755+03	2491108478881	Feminin	1949-11-08	craiova
17	1	Dorina Popa	0732225225	\N	\N	t	2026-04-22 14:57:16.773479+03	2026-04-22 14:57:16.773479+03	2871212160001	Feminin	1987-12-12	bals
18	1	Dorina Popa	0722333227	\N	\N	t	2026-04-23 11:46:11.392917+03	2026-04-23 11:46:11.392917+03	2871212160001	Feminin	1987-12-12	bals
19	1	Margareta Ion 4	0745123458	\N	\N	t	2026-04-23 12:07:11.369854+03	2026-04-23 12:07:11.369854+03	2550606160038	Feminin	1955-06-06	slatina
\.


--
-- Data for Name: responses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.responses (response_id, clinic_id, message_id, response_status, response_text, created_at) FROM stdin;
\.


--
-- Data for Name: specialization_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.specialization_services (service_id, clinic_id, specialization_id, service_name, price, duration_minutes, description, is_active, created_at, updated_at) FROM stdin;
1	1	3	Consult initial	250.00	15	\N	t	2026-04-22 09:06:59.704573+03	2026-04-22 09:06:59.704573+03
3	1	3	Colonoscopie	600.00	60	\N	t	2026-04-22 09:07:36.173506+03	2026-04-22 09:07:36.173506+03
4	1	3	Endoscopie	500.00	30	\N	t	2026-04-22 09:08:02.786213+03	2026-04-22 09:08:02.786213+03
2	1	3	Ecografie	250.00	400	\N	t	2026-04-22 09:07:16.472199+03	2026-04-22 09:09:06.332164+03
5	1	2	Consult	290.00	15	\N	t	2026-04-22 12:44:44.101607+03	2026-04-22 12:44:44.101607+03
6	1	2	Ecografie	350.00	20	\N	t	2026-04-22 12:44:58.248457+03	2026-04-22 12:44:58.248457+03
7	1	2	Cauterizare	50.00	10	\N	t	2026-04-22 12:45:14.858498+03	2026-04-22 12:45:14.858498+03
8	1	2	Servicii speciale	90.00	10	\N	t	2026-04-22 12:45:27.883605+03	2026-04-22 12:45:27.883605+03
\.


--
-- Data for Name: specializations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.specializations (specialization_id, clinic_id, display_name, created_at, updated_at) FROM stdin;
1	1	Cardiologie	2026-04-16 09:05:13.633509+03	2026-04-16 09:05:13.633509+03
2	1	Dermatologie	2026-04-16 09:09:54.957861+03	2026-04-16 10:37:48.934583+03
3	1	Gastroenterologie	2026-04-16 10:38:13.839331+03	2026-04-16 10:38:13.839331+03
4	1	Urologie	2026-04-16 22:07:22.597342+03	2026-04-16 22:07:22.597342+03
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, clinic_id, email, password_hash, user_role_label, is_active, created_at, updated_at) FROM stdin;
1	1	clinica1@gmail.com	$2b$10$pr8Bm9EILajRN6Qe5eWf9uoKAr0n5NY/7lGtNiqQTH22JCGhw8emi	administrator	t	2026-04-16 08:30:59.269009+03	2026-04-16 08:30:59.269009+03
\.


--
-- Name: appointments_appointment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.appointments_appointment_id_seq', 21, true);


--
-- Name: clinics_clinic_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clinics_clinic_id_seq', 1, true);


--
-- Name: doctor_schedules_doctor_schedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_schedules_doctor_schedule_id_seq', 27, true);


--
-- Name: doctors_doctor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctors_doctor_id_seq', 4, true);


--
-- Name: follow_ups_follow_up_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.follow_ups_follow_up_id_seq', 1, false);


--
-- Name: imports_import_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.imports_import_id_seq', 1, false);


--
-- Name: message_templates_template_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.message_templates_template_id_seq', 12, true);


--
-- Name: messages_message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_message_id_seq', 1, false);


--
-- Name: patients_patient_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.patients_patient_id_seq', 19, true);


--
-- Name: responses_response_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.responses_response_id_seq', 1, false);


--
-- Name: specialization_services_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.specialization_services_service_id_seq', 8, true);


--
-- Name: specializations_specialization_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.specializations_specialization_id_seq', 4, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 1, true);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (appointment_id);


--
-- Name: clinic_settings clinic_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_settings
    ADD CONSTRAINT clinic_settings_pkey PRIMARY KEY (clinic_id);


--
-- Name: clinics clinics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_pkey PRIMARY KEY (clinic_id);


--
-- Name: doctor_schedules doctor_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_pkey PRIMARY KEY (doctor_schedule_id);


--
-- Name: doctor_schedules doctor_schedules_unique_day; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_unique_day UNIQUE (clinic_id, doctor_id, weekday);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (doctor_id);


--
-- Name: follow_ups follow_ups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_pkey PRIMARY KEY (follow_up_id);


--
-- Name: imports imports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imports
    ADD CONSTRAINT imports_pkey PRIMARY KEY (import_id);


--
-- Name: message_templates message_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_templates
    ADD CONSTRAINT message_templates_pkey PRIMARY KEY (template_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (message_id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (patient_id);


--
-- Name: responses responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.responses
    ADD CONSTRAINT responses_pkey PRIMARY KEY (response_id);


--
-- Name: specialization_services specialization_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specialization_services
    ADD CONSTRAINT specialization_services_pkey PRIMARY KEY (service_id);


--
-- Name: specializations specializations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specializations
    ADD CONSTRAINT specializations_pkey PRIMARY KEY (specialization_id);


--
-- Name: users users_clinic_id_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_clinic_id_email_key UNIQUE (clinic_id, email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: appointments_patient_action_token_expires_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX appointments_patient_action_token_expires_at_idx ON public.appointments USING btree (patient_action_token_expires_at) WHERE (patient_action_token_expires_at IS NOT NULL);


--
-- Name: appointments_patient_action_token_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX appointments_patient_action_token_uq ON public.appointments USING btree (patient_action_token) WHERE (patient_action_token IS NOT NULL);


--
-- Name: appointments_patient_confirmation_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX appointments_patient_confirmation_status_idx ON public.appointments USING btree (clinic_id, patient_confirmation_status);


--
-- Name: doctor_schedules_doctor_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX doctor_schedules_doctor_id_idx ON public.doctor_schedules USING btree (doctor_id);


--
-- Name: specialization_services_specialization_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX specialization_services_specialization_idx ON public.specialization_services USING btree (clinic_id, specialization_id);


--
-- Name: appointments appointments_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- Name: appointments appointments_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE RESTRICT;


--
-- Name: appointments appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE RESTRICT;


--
-- Name: clinic_settings clinic_settings_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinic_settings
    ADD CONSTRAINT clinic_settings_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- Name: doctor_schedules doctor_schedules_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- Name: doctor_schedules doctor_schedules_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- Name: doctors doctors_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- Name: doctors doctors_specialization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_specialization_id_fkey FOREIGN KEY (specialization_id) REFERENCES public.specializations(specialization_id) ON DELETE RESTRICT;


--
-- Name: follow_ups follow_ups_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id) ON DELETE CASCADE;


--
-- Name: follow_ups follow_ups_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- Name: imports imports_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imports
    ADD CONSTRAINT imports_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- Name: imports imports_imported_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imports
    ADD CONSTRAINT imports_imported_by_user_id_fkey FOREIGN KEY (imported_by_user_id) REFERENCES public.users(user_id) ON DELETE RESTRICT;


--
-- Name: message_templates message_templates_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_templates
    ADD CONSTRAINT message_templates_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- Name: messages messages_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id) ON DELETE CASCADE;


--
-- Name: messages messages_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- Name: patients patients_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- Name: responses responses_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.responses
    ADD CONSTRAINT responses_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- Name: responses responses_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.responses
    ADD CONSTRAINT responses_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(message_id) ON DELETE CASCADE;


--
-- Name: specialization_services specialization_services_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specialization_services
    ADD CONSTRAINT specialization_services_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- Name: specialization_services specialization_services_specialization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specialization_services
    ADD CONSTRAINT specialization_services_specialization_id_fkey FOREIGN KEY (specialization_id) REFERENCES public.specializations(specialization_id) ON DELETE CASCADE;


--
-- Name: specializations specializations_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specializations
    ADD CONSTRAINT specializations_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- Name: users users_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict wTQ5avWslt9afu7dlrARLkOmUoT3I056loaKQ8ALq0nMQ1PSg0hqgrqUrgUKoBF

