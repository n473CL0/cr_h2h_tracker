--
-- PostgreSQL database dump
--

\restrict buzhGatWuBoofXZH82YR9bCSrUhx7zl3Bxrjh3HbVfhtlobs3r1yLivmh0Ji5sx

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

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
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: user
--

INSERT INTO public.users (id, username, player_tag, trophies, clan_name, email, hashed_password, created_at) VALUES (2, 'PIP123', '#2U9YPQJ82', 10118, 'Clan #GL0Q20GQ', 'pip@gay.com', '$2b$12$aXJ3ghylkQsJoKJydKE/rez82BqHj4Cplww/THM3SHHFUrZX9zuUe', '2026-01-30 19:37:47.526534+00');
INSERT INTO public.users (id, username, player_tag, trophies, clan_name, email, hashed_password, created_at) VALUES (3, 'Wolfgang', '#YJLQJ28JC', 10152, 'Clan #GL0Q20GQ', 'wmitra9@gmail.com', '$2b$12$gTIlgeBqtqIQerO/Soe4PednnmijPTUsbJ7.bjYo5xmFZsbWo1r2m', '2026-01-30 19:40:52.332397+00');
INSERT INTO public.users (id, username, player_tag, trophies, clan_name, email, hashed_password, created_at) VALUES (4, 'kirsty', '#9LQ2U980V', 8599, 'GimmeThemCheeks', 'kirsty@email.com', '$2b$12$7mKxA3pd4gR745DHpsrG8O.Yp83fuRrNU7242prg96yTIQe.ASUDm', '2026-01-30 19:57:50.344919+00');
INSERT INTO public.users (id, username, player_tag, trophies, clan_name, email, hashed_password, created_at) VALUES (1, 'n2splashy', '#9GLG0JGL0', 9560, 'Clan #GL0Q20GQ', 'n473.cl0@gmail.com', '$2b$12$5Fd7Rb0Sb/CDwTP3Muutsu5V9RFHWxvzeamViDKHBC3wxzFUTO0TW', '2026-01-30 19:36:57.360782+00');


--
-- Data for Name: friendships; Type: TABLE DATA; Schema: public; Owner: user
--

INSERT INTO public.friendships (id, user_id_1, user_id_2, created_at) VALUES (1, 1, 2, '2026-01-30 19:37:47.551021+00');
INSERT INTO public.friendships (id, user_id_1, user_id_2, created_at) VALUES (2, 2, 3, '2026-01-30 19:40:52.344076+00');
INSERT INTO public.friendships (id, user_id_1, user_id_2, created_at) VALUES (3, 1, 3, '2026-01-30 19:41:53.480455+00');
INSERT INTO public.friendships (id, user_id_1, user_id_2, created_at) VALUES (4, 1, 4, '2026-01-30 19:57:50.361411+00');


--
-- Data for Name: invites; Type: TABLE DATA; Schema: public; Owner: user
--

INSERT INTO public.invites (id, token, creator_id, target_tag, created_at, expires_at, max_uses, used_count) VALUES (1, 'Wqx9u4CdW6E', 1, '#2U9YPQJ82', '2026-01-30 19:37:17.453323+00', '2026-01-31 19:37:17.450639+00', 1, 1);
INSERT INTO public.invites (id, token, creator_id, target_tag, created_at, expires_at, max_uses, used_count) VALUES (2, 't73UY3QskEE', 2, '#YJLQJ28JC', '2026-01-30 19:38:17.762985+00', '2026-01-31 19:38:17.762153+00', 1, 1);
INSERT INTO public.invites (id, token, creator_id, target_tag, created_at, expires_at, max_uses, used_count) VALUES (3, 'YbbHs5qiJ6A', 1, '#9LQ2U980V', '2026-01-30 19:57:32.986756+00', '2026-01-31 19:57:32.9848+00', 1, 1);


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: user
--

INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (1, '4a67fa06fc17c25958624bb878a81e2f', '#9GLG0JGL0', '#YJLQJ28JC', '#YJLQJ28JC', '2026-01-30 19:29:51+00', 'friendly', 0, 2);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (2, 'e89dece7c0c09bbecf3e52f3820fba0b', '#9GLG0JGL0', '#2U9YPQJ82', '#9GLG0JGL0', '2026-01-30 18:40:52+00', 'friendly', 1, 0);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (3, '9da090651d3724b413c2f96c021405c4', '#9GLG0JGL0', '#2U9YPQJ82', '#9GLG0JGL0', '2026-01-29 21:30:33+00', 'friendly', 2, 1);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (4, '0ace052dd33e971cda2657253b82df9f', '#9GLG0JGL0', '#2U9YPQJ82', '#9GLG0JGL0', '2026-01-29 02:35:31+00', 'friendly', 2, 1);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (5, 'e531a57273aef166db4748b3bb8f5bbf', '#9GLG0JGL0', '#2U9YPQJ82', '#2U9YPQJ82', '2026-01-29 02:31:34+00', 'friendly', 0, 1);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (6, '203c31c5feb25c3a3289aa90a76d4154', '#2U9YPQJ82', '#YJLQJ28JC', '#YJLQJ28JC', '2026-01-30 18:52:56+00', 'friendly', 0, 1);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (7, '2e256eea870109d90d40f36663b82975', '#2U9YPQJ82', '#YJLQJ28JC', '#YJLQJ28JC', '2026-01-30 03:02:17+00', 'friendly', 0, 1);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (8, '8eb6818999e08bc66af7ad2024acca27', '#2U9YPQJ82', '#YJLQJ28JC', '#2U9YPQJ82', '2026-01-29 17:19:16+00', 'friendly', 2, 1);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (9, '6962db6c17b2156775df475175f8edf7', '#2U9YPQJ82', '#YJLQJ28JC', '#2U9YPQJ82', '2026-01-29 01:03:08+00', 'friendly', 1, 0);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (10, '0bc1093c8c4d3e9fe131ab758870030d', '#YJLQJ28JC', '#2U9YPQJ82', '#2U9YPQJ82', '2026-01-27 23:32:05+00', 'friendly', 1, 2);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (11, '4120356890be0f9f973658e5dfda829f', '#YJLQJ28JC', '#2U9YPQJ82', '#2U9YPQJ82', '2026-01-27 18:28:20+00', 'friendly', 0, 1);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (12, '55395918bc8d9ae7df21a0fda97542c8', '#YJLQJ28JC', '#2U9YPQJ82', '#2U9YPQJ82', '2026-01-27 18:21:45+00', 'friendly', 0, 1);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (13, '37e99dc1eee08057ac195353e3863a4a', '#YJLQJ28JC', '#2U9YPQJ82', '#YJLQJ28JC', '2026-01-26 22:57:52+00', 'friendly', 1, 0);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (14, '499b1c73b19bb576f086888c3c8cd1cb', '#YJLQJ28JC', '#2U9YPQJ82', '#2U9YPQJ82', '2026-01-26 22:52:18+00', 'friendly', 0, 3);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (15, '594fbe08a0063738ef023f41bad5e02b', '#9LQ2U980V', '#2U9YPQJ82', '#2U9YPQJ82', '2026-01-29 22:00:13+00', 'friendly', 1, 2);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (16, '03d46283d987caa5ff727839c53cb7c0', '#9LQ2U980V', '#YJLQJ28JC', '#YJLQJ28JC', '2026-01-29 20:30:00+00', 'friendly', 0, 2);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (17, 'bbb3cac6e08410937d2544733b41328e', '#9LQ2U980V', '#YJLQJ28JC', '#9LQ2U980V', '2026-01-29 20:26:20+00', 'friendly', 3, 0);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (18, '630b8bf4c77d6bb1231a4059906825c6', '#9LQ2U980V', '#9GLG0JGL0', '#9GLG0JGL0', '2026-01-28 19:56:22+00', 'friendly', 1, 3);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (19, '45e67ef7f00d8c1038842eae1e6eb5d5', '#9LQ2U980V', '#9GLG0JGL0', '#9GLG0JGL0', '2026-01-28 19:54:36+00', 'friendly', 0, 3);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (20, '88e27e627e6d126d5aec9ff5d2cecd2b', '#9LQ2U980V', '#9GLG0JGL0', '#9GLG0JGL0', '2026-01-28 19:52:02+00', 'friendly', 1, 3);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (21, 'beae294ae12ade95aa75a24abcfa58e3', '#9LQ2U980V', '#9GLG0JGL0', '#9GLG0JGL0', '2026-01-28 19:44:24+00', 'friendly', 1, 2);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (22, '9fb124668d1e4c6a04f653811fac66b0', '#9LQ2U980V', '#9GLG0JGL0', '#9GLG0JGL0', '2026-01-28 19:28:32+00', 'friendly', 0, 3);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (23, '53d6d5ce8629bfda516178ba20f1d8b4', '#9LQ2U980V', '#9GLG0JGL0', '#9GLG0JGL0', '2026-01-28 19:25:51+00', 'friendly', 0, 1);
INSERT INTO public.matches (id, battle_id, player_1_tag, player_2_tag, winner_tag, battle_time, game_mode, crowns_1, crowns_2) VALUES (24, 'b3785a760e3401d4194e0a54d2620f11', '#9LQ2U980V', '#9GLG0JGL0', '#9GLG0JGL0', '2026-01-28 19:21:15+00', 'friendly', 1, 2);


--
-- Name: friendships_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.friendships_id_seq', 4, true);


--
-- Name: invites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.invites_id_seq', 3, true);


--
-- Name: matches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.matches_id_seq', 24, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- PostgreSQL database dump complete
--

\unrestrict buzhGatWuBoofXZH82YR9bCSrUhx7zl3Bxrjh3HbVfhtlobs3r1yLivmh0Ji5sx

