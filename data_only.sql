--
-- PostgreSQL database dump
--

\restrict IvmWSb9ban1u6UwZ6AT6tmFpM1TazEZQw4BPhzDGVsozsmGwqC9kDBdX3SlYUq2

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

--
-- Data for Name: clinics; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.clinics VALUES (1, 'Clinica 1', true, '2026-04-16 08:30:59.269009+03', '2026-04-16 08:30:59.269009+03');


--
-- Data for Name: specializations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.specializations VALUES (1, 1, 'Cardiologie', '2026-04-16 09:05:13.633509+03', '2026-04-16 09:05:13.633509+03');
INSERT INTO public.specializations VALUES (2, 1, 'Dermatologie', '2026-04-16 09:09:54.957861+03', '2026-04-16 10:37:48.934583+03');
INSERT INTO public.specializations VALUES (3, 1, 'Gastroenterologie', '2026-04-16 10:38:13.839331+03', '2026-04-16 10:38:13.839331+03');
INSERT INTO public.specializations VALUES (4, 1, 'Urologie', '2026-04-16 22:07:22.597342+03', '2026-04-16 22:07:22.597342+03');


--
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.doctors VALUES (1, 1, 'Ionescu Andrei', 1, true, '2026-04-16 09:19:05.767578+03', '2026-04-16 09:28:09.808875+03');
INSERT INTO public.doctors VALUES (4, 1, 'Daniela Papa', 3, true, '2026-04-16 22:18:16.791207+03', '2026-04-16 22:18:16.791207+03');
INSERT INTO public.doctors VALUES (3, 1, 'Iancu Marin', 4, true, '2026-04-16 21:59:00.620686+03', '2026-04-16 22:43:54.582538+03');
INSERT INTO public.doctors VALUES (2, 1, 'Ileana Chiris', 2, true, '2026-04-16 09:24:44.317654+03', '2026-04-22 13:04:15.25028+03');


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.patients VALUES (1, 1, 'Pacient Schema Check', '0712345678', 'pacient.schema.check@test.local', 'created for schema verification', true, '2026-04-16 08:55:51.907628+03', '2026-04-16 08:55:51.907628+03', NULL, NULL, NULL, NULL);
INSERT INTO public.patients VALUES (4, 1, 'Pacient Debug 20260416162707', '0700162707', NULL, NULL, true, '2026-04-16 16:27:07.530498+03', '2026-04-16 16:27:07.530498+03', NULL, NULL, NULL, NULL);
INSERT INTO public.patients VALUES (5, 1, 'Eugenia Papa', '0777888999', NULL, NULL, true, '2026-04-16 17:09:44.360605+03', '2026-04-16 17:09:44.360605+03', NULL, NULL, NULL, NULL);
INSERT INTO public.patients VALUES (6, 1, 'Monica Petcu', '0723458458', NULL, NULL, true, '2026-04-16 18:56:32.460422+03', '2026-04-16 18:56:32.460422+03', NULL, NULL, NULL, NULL);
INSERT INTO public.patients VALUES (8, 1, 'Ionescu Marius', '0722411411', NULL, NULL, true, '2026-04-16 21:22:17.225945+03', '2026-04-16 21:22:17.225945+03', NULL, NULL, NULL, NULL);
INSERT INTO public.patients VALUES (7, 1, 'Gabriel Popa', '0799889988', 'gabriel@goolge.ro', NULL, true, '2026-04-16 18:59:41.062672+03', '2026-04-16 21:50:00.534948+03', NULL, NULL, NULL, NULL);
INSERT INTO public.patients VALUES (10, 1, 'Dorina Popa', '0722333222', NULL, NULL, true, '2026-04-18 11:08:55.888907+03', '2026-04-18 11:08:55.888907+03', NULL, NULL, NULL, NULL);
INSERT INTO public.patients VALUES (11, 1, 'Pacient Debug 20260418113139', '0700113139', NULL, NULL, true, '2026-04-18 11:31:39.097214+03', '2026-04-18 11:31:39.097214+03', NULL, NULL, NULL, NULL);
INSERT INTO public.patients VALUES (9, 1, 'Razvan', '0722333445', NULL, NULL, false, '2026-04-17 09:46:06.797886+03', '2026-04-18 13:13:48.379219+03', '1960502140014', 'Masculin', '1996-05-02', 'Craiova');
INSERT INTO public.patients VALUES (12, 1, 'Margareta Ion', '0741852963', NULL, NULL, true, '2026-04-18 13:22:28.196841+03', '2026-04-18 13:22:28.196841+03', '2491108478881', 'Feminin', '1949-11-08', 'craiova');
INSERT INTO public.patients VALUES (13, 1, 'Margareta Ion', '0745123450', NULL, NULL, true, '2026-04-18 13:23:30.340458+03', '2026-04-18 13:23:30.340458+03', '2491108478881', 'Feminin', '1949-11-08', 'craiova');
INSERT INTO public.patients VALUES (14, 1, 'Margareta Ion', '0756892345', NULL, NULL, true, '2026-04-18 13:29:44.332466+03', '2026-04-18 13:29:44.332466+03', '2491108478881', 'Feminin', '1949-11-08', 'craiova');
INSERT INTO public.patients VALUES (15, 1, 'Margareta Ion 3', '0788999444', NULL, NULL, true, '2026-04-18 13:42:01.525151+03', '2026-04-18 13:42:01.525151+03', '2491109140022', 'Feminin', '1949-11-09', 'craiova');
INSERT INTO public.patients VALUES (3, 1, 'Andrei Gheorghe', '0722333445', NULL, NULL, true, '2026-04-16 15:59:40.397238+03', '2026-04-18 14:01:47.755896+03', '1700202147874', 'Masculin', '1970-02-02', 'Craiova');
INSERT INTO public.patients VALUES (2, 1, 'Gicu Popescu', '0727888977', 'gicu@pacient.ro', NULL, true, '2026-04-16 09:04:49.086819+03', '2026-04-22 12:30:45.852646+03', '1881212160022', 'Masculin', '1988-12-12', 'Craiova');
INSERT INTO public.patients VALUES (16, 1, 'Margareta Ion', '0745123456', NULL, NULL, true, '2026-04-22 13:48:39.72755+03', '2026-04-22 13:48:39.72755+03', '2491108478881', 'Feminin', '1949-11-08', 'craiova');
INSERT INTO public.patients VALUES (17, 1, 'Dorina Popa', '0732225225', NULL, NULL, true, '2026-04-22 14:57:16.773479+03', '2026-04-22 14:57:16.773479+03', '2871212160001', 'Feminin', '1987-12-12', 'bals');


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.appointments VALUES (1, 1, 1, 2, '2026-04-16 01:40:00+03', '2026-04-16 01:43:00+03', NULL, 'Programată', 'Fără răspuns', '2026-04-16 09:37:44.278423+03', '2026-04-16 09:37:44.278423+03', NULL, NULL, 'pending', NULL, NULL, NULL);
INSERT INTO public.appointments VALUES (2, 1, 1, 2, '2026-04-20 10:30:00+03', '2026-04-20 11:00:00+03', 'pacientul vrea si ecograf', 'Programată', 'Fără răspuns', '2026-04-16 10:26:20.884408+03', '2026-04-16 10:26:20.884408+03', NULL, NULL, 'pending', NULL, NULL, NULL);
INSERT INTO public.appointments VALUES (3, 1, 1, 3, '2026-04-20 11:00:00+03', '2026-04-20 11:30:00+03', '', 'Programată', 'Fără răspuns', '2026-04-16 15:59:40.413794+03', '2026-04-16 15:59:40.413794+03', NULL, NULL, 'pending', NULL, NULL, NULL);
INSERT INTO public.appointments VALUES (4, 1, 1, 4, '2026-04-20 09:00:00.527171+03', '2026-04-20 09:30:00.527171+03', 'ETAPA 59 API verification', 'Programată', 'Fără răspuns', '2026-04-16 16:27:07.541788+03', '2026-04-16 16:27:07.541788+03', NULL, NULL, 'pending', NULL, NULL, NULL);
INSERT INTO public.appointments VALUES (6, 1, 2, 6, '2026-04-17 15:40:00+03', '2026-04-17 16:00:00+03', '', 'Programată', 'Fără răspuns', '2026-04-16 18:56:32.474742+03', '2026-04-16 18:56:32.474742+03', NULL, NULL, 'pending', NULL, NULL, NULL);
INSERT INTO public.appointments VALUES (7, 1, 2, 7, '2026-04-17 13:40:00+03', '2026-04-17 14:00:00+03', '', 'Programată', 'Fără răspuns', '2026-04-16 18:59:41.073638+03', '2026-04-16 18:59:41.073638+03', NULL, NULL, 'pending', NULL, NULL, NULL);
INSERT INTO public.appointments VALUES (8, 1, 2, 8, '2026-04-17 14:00:00+03', '2026-04-17 14:30:00+03', '', 'Programată', 'Fără răspuns', '2026-04-16 21:22:17.239209+03', '2026-04-16 21:22:17.239209+03', NULL, NULL, 'pending', NULL, NULL, NULL);
INSERT INTO public.appointments VALUES (9, 1, 2, 9, '2026-04-21 12:30:00+03', '2026-04-21 13:00:00+03', '', 'Programată', 'Fără răspuns', '2026-04-17 09:46:06.813476+03', '2026-04-17 09:46:06.813476+03', NULL, NULL, 'pending', NULL, NULL, NULL);
INSERT INTO public.appointments VALUES (10, 1, 2, 3, '2026-04-20 10:30:00+03', '2026-04-20 11:00:00+03', NULL, 'Programată', 'Fără răspuns', '2026-04-18 08:48:19.872606+03', '2026-04-18 08:48:19.872606+03', NULL, NULL, 'pending', NULL, NULL, NULL);
INSERT INTO public.appointments VALUES (5, 1, 2, 5, '2026-04-17 17:20:00+03', '2026-04-17 17:40:00+03', NULL, 'Programată', 'Fără răspuns', '2026-04-16 17:09:44.374205+03', '2026-04-18 08:49:39.308528+03', NULL, NULL, 'pending', NULL, NULL, NULL);
INSERT INTO public.appointments VALUES (11, 1, 1, 9, '2026-04-20 09:30:00+03', '2026-04-20 10:00:00+03', NULL, 'Programată', 'Fără răspuns', '2026-04-18 09:09:41.736718+03', '2026-04-18 09:09:41.736718+03', NULL, NULL, 'pending', NULL, NULL, NULL);
INSERT INTO public.appointments VALUES (12, 1, 2, 10, '2026-04-20 11:00:00+03', '2026-04-20 11:30:00+03', NULL, 'Programată', 'Fără răspuns', '2026-04-18 11:08:55.901508+03', '2026-04-18 11:08:55.901508+03', NULL, NULL, 'pending', NULL, NULL, NULL);
INSERT INTO public.appointments VALUES (14, 1, 4, 12, '2026-04-20 10:00:00+03', '2026-04-20 10:30:00+03', NULL, 'Programată', 'Fără răspuns', '2026-04-18 13:22:28.210876+03', '2026-04-18 13:22:28.210876+03', NULL, NULL, 'pending', NULL, NULL, NULL);
INSERT INTO public.appointments VALUES (15, 1, 4, 13, '2026-04-20 09:30:00+03', '2026-04-20 10:00:00+03', NULL, 'Programată', 'Fără răspuns', '2026-04-18 13:23:30.357043+03', '2026-04-18 13:23:30.357043+03', NULL, NULL, 'pending', NULL, NULL, NULL);
INSERT INTO public.appointments VALUES (16, 1, 4, 14, '2026-04-20 11:00:00+03', '2026-04-20 11:30:00+03', NULL, 'Programată', 'Fără răspuns', '2026-04-18 13:29:44.351111+03', '2026-04-18 13:29:44.351111+03', NULL, NULL, 'pending', NULL, NULL, NULL);
INSERT INTO public.appointments VALUES (17, 1, 4, 15, '2026-04-21 10:00:00+03', '2026-04-21 10:30:00+03', NULL, 'Programată', 'Fără răspuns', '2026-04-18 13:42:01.557837+03', '2026-04-18 13:42:01.557837+03', NULL, NULL, 'pending', NULL, NULL, NULL);
INSERT INTO public.appointments VALUES (18, 1, 2, 16, '2026-04-24 11:00:00+03', '2026-04-24 11:30:00+03', NULL, 'Programată', 'Fără răspuns', '2026-04-22 13:48:39.746988+03', '2026-04-22 13:48:39.746988+03', 'a66dc87a16fa2b39273a0bbfe311ce8c6a92c7a93f95c1dd8e8ccec437e3f1d4', '2026-04-24 13:48:39.746+03', 'pending', NULL, NULL, NULL);
INSERT INTO public.appointments VALUES (19, 1, 2, 17, '2026-04-24 11:30:00+03', '2026-04-24 12:00:00+03', NULL, 'Programată', 'Fără răspuns', '2026-04-22 14:57:16.791582+03', '2026-04-22 14:57:16.791582+03', '315cd4255e4adea1a490c62bd4659115065b8f10596c8b77c859a4f9270499c0', '2026-04-24 14:57:16.791+03', 'pending', NULL, NULL, NULL);


--
-- Data for Name: clinic_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.clinic_settings VALUES (1, 'Europe/Bucharest', 'Email', 24, 3, '2026-04-16 08:55:37.848345+03', '2026-04-16 09:00:36.608674+03');


--
-- Data for Name: doctor_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.doctor_schedules VALUES (6, 1, 2, 2, '10:00:00', '15:00:00', 30, true, '2026-04-16 21:00:08.720934+03', '2026-04-16 21:00:08.720934+03');
INSERT INTO public.doctor_schedules VALUES (7, 1, 2, 3, '10:00:00', '15:00:00', 30, true, '2026-04-16 21:00:08.721664+03', '2026-04-16 21:00:08.721664+03');
INSERT INTO public.doctor_schedules VALUES (3, 1, 2, 5, '10:00:00', '15:00:00', 30, true, '2026-04-16 10:53:05.955758+03', '2026-04-16 21:00:08.724116+03');
INSERT INTO public.doctor_schedules VALUES (9, 1, 2, 4, '10:00:00', '15:00:00', 30, true, '2026-04-16 21:00:08.725087+03', '2026-04-16 21:00:08.725087+03');
INSERT INTO public.doctor_schedules VALUES (10, 1, 2, 1, '10:00:00', '15:00:00', 30, true, '2026-04-16 21:00:08.83618+03', '2026-04-16 21:00:08.83618+03');
INSERT INTO public.doctor_schedules VALUES (11, 1, 4, 3, '09:00:00', '13:00:00', 30, true, '2026-04-16 22:28:17.694362+03', '2026-04-16 22:28:17.694362+03');
INSERT INTO public.doctor_schedules VALUES (12, 1, 4, 4, '09:00:00', '13:00:00', 30, true, '2026-04-16 22:28:17.695651+03', '2026-04-16 22:28:17.695651+03');
INSERT INTO public.doctor_schedules VALUES (13, 1, 4, 2, '09:00:00', '14:00:00', 30, true, '2026-04-16 22:28:17.839215+03', '2026-04-16 22:42:24.432654+03');
INSERT INTO public.doctor_schedules VALUES (16, 1, 3, 4, '10:00:00', '14:00:00', 30, true, '2026-04-16 22:43:35.795919+03', '2026-04-16 22:43:35.795919+03');
INSERT INTO public.doctor_schedules VALUES (18, 1, 1, 3, '09:00:00', '15:00:00', 30, true, '2026-04-18 13:20:24.375716+03', '2026-04-18 13:20:24.375716+03');
INSERT INTO public.doctor_schedules VALUES (19, 1, 1, 4, '09:00:00', '15:00:00', 30, true, '2026-04-18 13:20:24.382115+03', '2026-04-18 13:20:24.382115+03');
INSERT INTO public.doctor_schedules VALUES (1, 1, 1, 1, '09:00:00', '15:00:00', 30, true, '2026-04-16 10:17:23.467587+03', '2026-04-18 13:20:24.387659+03');
INSERT INTO public.doctor_schedules VALUES (20, 1, 1, 5, '09:00:00', '15:00:00', 30, true, '2026-04-18 13:20:24.387401+03', '2026-04-18 13:20:24.387401+03');
INSERT INTO public.doctor_schedules VALUES (2, 1, 1, 2, '09:00:00', '15:00:00', 30, true, '2026-04-16 10:25:17.57001+03', '2026-04-18 13:20:24.515678+03');
INSERT INTO public.doctor_schedules VALUES (23, 1, 3, 2, '11:00:00', '15:00:00', 30, true, '2026-04-18 13:21:10.430278+03', '2026-04-18 13:21:10.430278+03');
INSERT INTO public.doctor_schedules VALUES (24, 1, 3, 1, '11:00:00', '15:00:00', 30, true, '2026-04-18 13:21:10.433266+03', '2026-04-18 13:21:10.433266+03');
INSERT INTO public.doctor_schedules VALUES (15, 1, 3, 5, '14:00:00', '20:00:00', 30, true, '2026-04-16 22:43:35.688163+03', '2026-04-18 13:21:10.437139+03');
INSERT INTO public.doctor_schedules VALUES (26, 1, 3, 3, '11:00:00', '15:00:00', 30, true, '2026-04-18 13:21:10.572786+03', '2026-04-18 13:21:10.572786+03');
INSERT INTO public.doctor_schedules VALUES (27, 1, 4, 1, '09:00:00', '15:00:00', 30, true, '2026-04-18 13:21:28.485943+03', '2026-04-18 13:21:28.485943+03');


--
-- Data for Name: follow_ups; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users VALUES (1, 1, 'clinica1@gmail.com', '$2b$10$pr8Bm9EILajRN6Qe5eWf9uoKAr0n5NY/7lGtNiqQTH22JCGhw8emi', 'administrator', true, '2026-04-16 08:30:59.269009+03', '2026-04-16 08:30:59.269009+03');


--
-- Data for Name: imports; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: message_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.message_templates VALUES (10, 1, 'Email - Follow-up după consultație', 'Email', 'Cum vă simțiți după vizită?', 'Bună ziua,

Sperăm că vă simțiți bine după vizită. Dacă au apărut întrebări sau aveți nevoie de lămuriri suplimentare, vă rugăm să ne răspundeți.

Revenim cu grijă, pentru că sănătatea și confortul dumneavoastră contează.

Cu considerație,
Echipa clinicii', '2026-04-16 18:24:28.910387+03', '2026-04-16 18:34:49.302085+03');
INSERT INTO public.message_templates VALUES (11, 1, 'SMS - Absență și reprogramare', 'SMS', 'Putem reprograma vizita', 'Ne pare rău că nu ne-am văzut astăzi. Dacă doriți, vă ajutăm rapid să găsim o nouă programare potrivită.', '2026-04-16 18:24:28.913203+03', '2026-04-16 18:34:49.306359+03');
INSERT INTO public.message_templates VALUES (12, 1, 'Email - Cerere feedback pacient', 'Email', 'Experiența dumneavoastră contează', 'Vă mulțumim pentru încrederea acordată.

Dacă doriți, ne puteți trimite un scurt feedback despre experiența avută.

Pentru noi contează să oferim fiecărui pacient o experiență caldă, clară și profesionistă.

Cu respect,
Echipa clinicii', '2026-04-16 18:24:28.915832+03', '2026-04-16 18:34:49.309678+03');
INSERT INTO public.message_templates VALUES (1, 1, 'WhatsApp - Confirmare programare', 'WhatsApp', 'Confirmarea programării', 'Bună ziua! Vă confirmăm programarea și vă așteptăm cu drag. Dacă aveți nevoie de ajutor sau doriți reprogramare, ne puteți scrie direct.', '2026-04-16 18:24:28.876615+03', '2026-04-16 18:34:49.261707+03');
INSERT INTO public.message_templates VALUES (2, 1, 'SMS - Confirmare programare', 'SMS', 'Programarea este confirmată', 'Bună ziua! Programarea dvs. este confirmată. Pentru ajutor sau reprogramare, vă rugăm să ne contactați.', '2026-04-16 18:24:28.883943+03', '2026-04-16 18:34:49.267524+03');
INSERT INTO public.message_templates VALUES (3, 1, 'Email - Confirmare programare premium', 'Email', 'Programarea dumneavoastră este confirmată', 'Bună ziua,

Vă mulțumim pentru încredere. Programarea dumneavoastră este confirmată, iar echipa noastră vă așteaptă cu atenție și grijă.

Dacă aveți întrebări înainte de vizită sau aveți nevoie de sprijin pentru reprogramare, ne puteți răspunde direct la acest email.

Cu considerație,
Echipa clinicii', '2026-04-16 18:24:28.886744+03', '2026-04-16 18:34:49.271761+03');
INSERT INTO public.message_templates VALUES (4, 1, 'WhatsApp - Reamintire cu 24h înainte', 'WhatsApp', 'Reamintire programare', 'Bună ziua! Vă reamintim de programarea de mâine. Dacă doriți reconfirmare sau reprogramare, ne puteți răspunde direct.', '2026-04-16 18:24:28.889755+03', '2026-04-16 18:34:49.275876+03');
INSERT INTO public.message_templates VALUES (5, 1, 'SMS - Reamintire în ziua vizitei', 'SMS', 'Reamintire vizită', 'Bună ziua! Vă așteptăm astăzi la clinică. Dacă întârziați sau aveți nevoie de ajutor, vă rugăm să ne anunțați.', '2026-04-16 18:24:28.893334+03', '2026-04-16 18:34:49.280884+03');
INSERT INTO public.message_templates VALUES (6, 1, 'WhatsApp - Solicitare reconfirmare', 'WhatsApp', 'Reconfirmarea programării', 'Bună ziua! Pentru a vă pregăti vizita cât mai bine, vă rugăm să ne confirmați disponibilitatea. Un răspuns scurt ne ajută mult.', '2026-04-16 18:24:28.896858+03', '2026-04-16 18:34:49.285376+03');
INSERT INTO public.message_templates VALUES (7, 1, 'WhatsApp - Reprogramare elegantă', 'WhatsApp', 'Actualizare programare', 'Bună ziua! A apărut o modificare de program și dorim să vă oferim rapid o variantă convenabilă de reprogramare. Vă mulțumim pentru înțelegere.', '2026-04-16 18:24:28.899702+03', '2026-04-16 18:34:49.289609+03');
INSERT INTO public.message_templates VALUES (8, 1, 'Email - Bun venit pacient nou', 'Email', 'Bine ați venit la clinică', 'Bun venit!

Ne bucurăm că ne-ați ales. Echipa noastră vă stă la dispoziție pentru o experiență calmă, clară și atentă la nevoile dumneavoastră.

Dacă aveți întrebări înainte de vizită, ne puteți răspunde direct la acest email.

Cu drag,
Echipa clinicii', '2026-04-16 18:24:28.902736+03', '2026-04-16 18:34:49.293793+03');
INSERT INTO public.message_templates VALUES (9, 1, 'WhatsApp - Mulțumire după consultație', 'WhatsApp', 'Vă mulțumim pentru vizită', 'Vă mulțumim pentru vizita de astăzi. Pentru noi este important să vă simțiți ascultat și bine îngrijit. Dacă aveți întrebări, ne puteți scrie direct.', '2026-04-16 18:24:28.907033+03', '2026-04-16 18:34:49.297698+03');


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: responses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: specialization_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.specialization_services VALUES (1, 1, 3, 'Consult initial', 250.00, 15, NULL, true, '2026-04-22 09:06:59.704573+03', '2026-04-22 09:06:59.704573+03');
INSERT INTO public.specialization_services VALUES (3, 1, 3, 'Colonoscopie', 600.00, 60, NULL, true, '2026-04-22 09:07:36.173506+03', '2026-04-22 09:07:36.173506+03');
INSERT INTO public.specialization_services VALUES (4, 1, 3, 'Endoscopie', 500.00, 30, NULL, true, '2026-04-22 09:08:02.786213+03', '2026-04-22 09:08:02.786213+03');
INSERT INTO public.specialization_services VALUES (2, 1, 3, 'Ecografie', 250.00, 400, NULL, true, '2026-04-22 09:07:16.472199+03', '2026-04-22 09:09:06.332164+03');
INSERT INTO public.specialization_services VALUES (5, 1, 2, 'Consult', 290.00, 15, NULL, true, '2026-04-22 12:44:44.101607+03', '2026-04-22 12:44:44.101607+03');
INSERT INTO public.specialization_services VALUES (6, 1, 2, 'Ecografie', 350.00, 20, NULL, true, '2026-04-22 12:44:58.248457+03', '2026-04-22 12:44:58.248457+03');
INSERT INTO public.specialization_services VALUES (7, 1, 2, 'Cauterizare', 50.00, 10, NULL, true, '2026-04-22 12:45:14.858498+03', '2026-04-22 12:45:14.858498+03');
INSERT INTO public.specialization_services VALUES (8, 1, 2, 'Servicii speciale', 90.00, 10, NULL, true, '2026-04-22 12:45:27.883605+03', '2026-04-22 12:45:27.883605+03');


--
-- Name: appointments_appointment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.appointments_appointment_id_seq', 19, true);


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

SELECT pg_catalog.setval('public.patients_patient_id_seq', 17, true);


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
-- PostgreSQL database dump complete
--

\unrestrict IvmWSb9ban1u6UwZ6AT6tmFpM1TazEZQw4BPhzDGVsozsmGwqC9kDBdX3SlYUq2

