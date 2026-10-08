-- Vitrine pour les captures de la vidéo App Store : groupe « Les nuits blanches ».
-- Retire les notes d'essai de Lea, ajoute des notes crédibles des 4 membres de test.
begin;
delete from annotation_reactions where annotation_id in (select id from annotations where challenge_id='4c6650d1-a213-48d2-8f86-7aaf52cf2be9' and user_id='9b8c837f-0755-4d7a-972f-37cbe51395c1' and id not in ('7e3922ae-320a-4e9a-83de-efd699e38e36','5a2eac77-b909-4442-a526-4e07bc061ed8'));
delete from annotation_reads where annotation_id in (select id from annotations where challenge_id='4c6650d1-a213-48d2-8f86-7aaf52cf2be9' and user_id='9b8c837f-0755-4d7a-972f-37cbe51395c1' and id not in ('7e3922ae-320a-4e9a-83de-efd699e38e36','5a2eac77-b909-4442-a526-4e07bc061ed8'));
delete from annotations where challenge_id='4c6650d1-a213-48d2-8f86-7aaf52cf2be9' and user_id='9b8c837f-0755-4d7a-972f-37cbe51395c1' and id not in ('7e3922ae-320a-4e9a-83de-efd699e38e36','5a2eac77-b909-4442-a526-4e07bc061ed8');

insert into annotations (id, challenge_id, user_id, page, edition_total_pages, position, category, visibility, body, emoji, quote, created_at, updated_at) values
-- Plus loin que moi : verrouillées (auteur + page seulement)
('bbbbbbbb-2222-4000-a000-000000000001','4c6650d1-a213-48d2-8f86-7aaf52cf2be9','aaaaaaaa-1111-4000-a000-000000000001',27,58,0.4655,'larmes','club','Je pleure dans le métro, merci Fiodor','😭',null, now()-interval '3 hours', now()-interval '3 hours'),
('bbbbbbbb-2222-4000-a000-000000000002','4c6650d1-a213-48d2-8f86-7aaf52cf2be9','aaaaaaaa-1111-4000-a000-000000000002',38,96,0.3958,'theorie','club','Le locataire va revenir, j''en suis sûr',null,null, now()-interval '20 hours', now()-interval '20 hours'),
-- Lisibles
('bbbbbbbb-2222-4000-a000-000000000003','4c6650d1-a213-48d2-8f86-7aaf52cf2be9','aaaaaaaa-1111-4000-a000-000000000004',31,112,0.2768,'mdr','club','Il a répété son discours toute la journée et il bégaie 💀','😂',null, now()-interval '1 hour', now()-interval '1 hour'),
('bbbbbbbb-2222-4000-a000-000000000004','4c6650d1-a213-48d2-8f86-7aaf52cf2be9','aaaaaaaa-1111-4000-a000-000000000003',20,74,0.2703,'coup_de_coeur','club','La grand-mère qui l''épingle à sa robe pour qu''elle ne sorte pas… je suis morte','🥹',null, now()-interval '5 hours', now()-interval '5 hours'),
('bbbbbbbb-2222-4000-a000-000000000005','4c6650d1-a213-48d2-8f86-7aaf52cf2be9','9b8c837f-0755-4d7a-972f-37cbe51395c1',165,622,0.2653,'a_retenir','club','Relire la deuxième nuit à voix haute, c''est trop beau','📌',null, now()-interval '1 day', now()-interval '1 day'),
('bbbbbbbb-2222-4000-a000-000000000006','4c6650d1-a213-48d2-8f86-7aaf52cf2be9','aaaaaaaa-1111-4000-a000-000000000001',15,58,0.2586,'coup_de_coeur','club',null,'🫶',null, now()-interval '1 day 4 hours', now()-interval '1 day 4 hours'),
('bbbbbbbb-2222-4000-a000-000000000007','4c6650d1-a213-48d2-8f86-7aaf52cf2be9','aaaaaaaa-1111-4000-a000-000000000002',24,96,0.2500,'spicy','club','Nastenka qui pose ses conditions dès le premier soir, reine',null,null, now()-interval '2 days', now()-interval '2 days');

insert into annotation_reactions (annotation_id, user_id, emoji) values
('bbbbbbbb-2222-4000-a000-000000000003','aaaaaaaa-1111-4000-a000-000000000002','😂'),
('bbbbbbbb-2222-4000-a000-000000000003','aaaaaaaa-1111-4000-a000-000000000003','😂'),
('bbbbbbbb-2222-4000-a000-000000000004','aaaaaaaa-1111-4000-a000-000000000001','🥹'),
('bbbbbbbb-2222-4000-a000-000000000004','9b8c837f-0755-4d7a-972f-37cbe51395c1','❤️'),
('bbbbbbbb-2222-4000-a000-000000000007','aaaaaaaa-1111-4000-a000-000000000004','🔥');
commit;

-- Bibliothèque : deux beaux romans à la place du livre test et de la Bible.
update challenges set book_title='Les Sept Maris d''Evelyn Hugo', book_author='Taylor Jenkins Reid', total_pages=400, cover_url='https://covers.openlibrary.org/b/id/8354226-L.jpg', cover_palette=null where id='f76f5ecd-32c8-42b6-9014-4b8b0262408b';
update challenges set book_title='Bonjour tristesse', book_author='Françoise Sagan', total_pages=154, cover_url='https://covers.openlibrary.org/b/id/52680-L.jpg', cover_palette=null where id='9ffad21c-9458-49df-a56b-81c47dfd723d';
update user_progress set current_page=97, progress_percentage=62.99, total_pages=154 where challenge_id='9ffad21c-9458-49df-a56b-81c47dfd723d';

-- Top 3 : Emma, Lucas, Chloé (une seule fille de plus que de garçons dans le podium)
update user_progress set current_page=29, progress_percentage=39.19, last_updated_at=now() where challenge_id='4c6650d1-a213-48d2-8f86-7aaf52cf2be9' and user_id='aaaaaaaa-1111-4000-a000-000000000003';
