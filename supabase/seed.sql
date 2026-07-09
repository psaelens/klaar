-- Contenu de depart global — GENERE par supabase/generate-seed.mjs depuis
-- src/data/vocab.json, grammar.json, listening.json et writing.json. Ne pas editer a la main.
insert into public.content_items (id, household_id, type, theme, front, back, choices, question, checklist, difficulty, curriculum_unit) values
  ('school-01', null, 'vocab', 'Op school', 'de school', 'l''école', null, null, null, 1, null),
  ('school-02', null, 'vocab', 'Op school', 'het huiswerk', 'les devoirs', null, null, null, 1, null),
  ('school-03', null, 'vocab', 'Op school', 'de leraar', 'le professeur', null, null, null, 1, null),
  ('school-04', null, 'vocab', 'Op school', 'de klas', 'la classe', null, null, null, 1, null),
  ('school-05', null, 'vocab', 'Op school', 'het boek', 'le livre', null, null, null, 1, null),
  ('school-06', null, 'vocab', 'Op school', 'de pen', 'le stylo', null, null, null, 1, null),
  ('school-07', null, 'vocab', 'Op school', 'het examen', 'l''examen', null, null, null, 1, null),
  ('school-08', null, 'vocab', 'Op school', 'leren', 'apprendre, étudier', null, null, null, 1, null),
  ('eten-01', null, 'vocab', 'Eten en drinken', 'het brood', 'le pain', null, null, null, 1, null),
  ('eten-02', null, 'vocab', 'Eten en drinken', 'de kaas', 'le fromage', null, null, null, 1, null),
  ('eten-03', null, 'vocab', 'Eten en drinken', 'de appel', 'la pomme', null, null, null, 1, null),
  ('eten-04', null, 'vocab', 'Eten en drinken', 'het water', 'l''eau', null, null, null, 1, null),
  ('eten-05', null, 'vocab', 'Eten en drinken', 'de melk', 'le lait', null, null, null, 1, null),
  ('eten-06', null, 'vocab', 'Eten en drinken', 'het ontbijt', 'le petit-déjeuner', null, null, null, 2, null),
  ('eten-07', null, 'vocab', 'Eten en drinken', 'eten', 'manger', null, null, null, 1, null),
  ('eten-08', null, 'vocab', 'Eten en drinken', 'drinken', 'boire', null, null, null, 1, null),
  ('familie-01', null, 'vocab', 'De familie', 'de moeder', 'la mère', null, null, null, 1, null),
  ('familie-02', null, 'vocab', 'De familie', 'de vader', 'le père', null, null, null, 1, null),
  ('familie-03', null, 'vocab', 'De familie', 'de broer', 'le frère', null, null, null, 1, null),
  ('familie-04', null, 'vocab', 'De familie', 'de zus', 'la sœur', null, null, null, 1, null),
  ('familie-05', null, 'vocab', 'De familie', 'de grootouders', 'les grands-parents', null, null, null, 2, null),
  ('familie-06', null, 'vocab', 'De familie', 'het gezin', 'la famille (le foyer)', null, null, null, 2, null),
  ('familie-07', null, 'vocab', 'De familie', 'de oom', 'l''oncle', null, null, null, 1, null),
  ('familie-08', null, 'vocab', 'De familie', 'de tante', 'la tante', null, null, null, 1, null),
  ('vrijetijd-01', null, 'vocab', 'Vrije tijd', 'het spel', 'le jeu', null, null, null, 1, null),
  ('vrijetijd-02', null, 'vocab', 'Vrije tijd', 'de film', 'le film', null, null, null, 1, null),
  ('vrijetijd-03', null, 'vocab', 'Vrije tijd', 'de muziek', 'la musique', null, null, null, 1, null),
  ('vrijetijd-04', null, 'vocab', 'Vrije tijd', 'voetballen', 'jouer au football', null, null, null, 1, null),
  ('vrijetijd-05', null, 'vocab', 'Vrije tijd', 'zwemmen', 'nager', null, null, null, 1, null),
  ('vrijetijd-06', null, 'vocab', 'Vrije tijd', 'lezen', 'lire', null, null, null, 1, null),
  ('vrijetijd-07', null, 'vocab', 'Vrije tijd', 'de hobby', 'le passe-temps', null, null, null, 1, null),
  ('vrijetijd-08', null, 'vocab', 'Vrije tijd', 'fietsen', 'faire du vélo', null, null, null, 1, null),
  ('weer-01', null, 'vocab', 'Het weer', 'de zon', 'le soleil', null, null, null, 1, null),
  ('weer-02', null, 'vocab', 'Het weer', 'de regen', 'la pluie', null, null, null, 1, null),
  ('weer-03', null, 'vocab', 'Het weer', 'de wind', 'le vent', null, null, null, 1, null),
  ('weer-04', null, 'vocab', 'Het weer', 'de sneeuw', 'la neige', null, null, null, 1, null),
  ('weer-05', null, 'vocab', 'Het weer', 'het onweer', 'l''orage', null, null, null, 2, null),
  ('weer-06', null, 'vocab', 'Het weer', 'warm', 'chaud', null, null, null, 1, null),
  ('weer-07', null, 'vocab', 'Het weer', 'koud', 'froid', null, null, null, 1, null),
  ('weer-08', null, 'vocab', 'Het weer', 'de wolk', 'le nuage', null, null, null, 2, null),
  ('stad-01', null, 'vocab', 'In de stad', 'de winkel', 'le magasin', null, null, null, 1, null),
  ('stad-02', null, 'vocab', 'In de stad', 'de straat', 'la rue', null, null, null, 1, null),
  ('stad-03', null, 'vocab', 'In de stad', 'het station', 'la gare', null, null, null, 1, null),
  ('stad-04', null, 'vocab', 'In de stad', 'de bushalte', 'l''arrêt de bus', null, null, null, 2, null),
  ('stad-05', null, 'vocab', 'In de stad', 'het ziekenhuis', 'l''hôpital', null, null, null, 2, null),
  ('stad-06', null, 'vocab', 'In de stad', 'de markt', 'le marché', null, null, null, 1, null),
  ('stad-07', null, 'vocab', 'In de stad', 'links', 'à gauche', null, null, null, 1, null),
  ('stad-08', null, 'vocab', 'In de stad', 'rechts', 'à droite', null, null, null, 1, null),
  ('tijd-01', null, 'vocab', 'De tijd', 'vandaag', 'aujourd''hui', null, null, null, 1, null),
  ('tijd-02', null, 'vocab', 'De tijd', 'morgen', 'demain', null, null, null, 1, null),
  ('tijd-03', null, 'vocab', 'De tijd', 'gisteren', 'hier', null, null, null, 1, null),
  ('tijd-04', null, 'vocab', 'De tijd', 'de week', 'la semaine', null, null, null, 1, null),
  ('tijd-05', null, 'vocab', 'De tijd', 'het jaar', 'l''année', null, null, null, 1, null),
  ('tijd-06', null, 'vocab', 'De tijd', 'het uur', 'l''heure', null, null, null, 1, null),
  ('tijd-07', null, 'vocab', 'De tijd', 'de maand', 'le mois', null, null, null, 1, null),
  ('tijd-08', null, 'vocab', 'De tijd', 'altijd', 'toujours', null, null, null, 2, null),
  ('gevoel-01', null, 'vocab', 'Gevoelens', 'blij', 'content, heureux', null, null, null, 1, null),
  ('gevoel-02', null, 'vocab', 'Gevoelens', 'verdrietig', 'triste', null, null, null, 2, null),
  ('gevoel-03', null, 'vocab', 'Gevoelens', 'moe', 'fatigué', null, null, null, 1, null),
  ('gevoel-04', null, 'vocab', 'Gevoelens', 'bang', 'effrayé (avoir peur)', null, null, null, 1, null),
  ('gevoel-05', null, 'vocab', 'Gevoelens', 'boos', 'fâché', null, null, null, 1, null),
  ('gevoel-06', null, 'vocab', 'Gevoelens', 'ziek', 'malade', null, null, null, 1, null),
  ('gevoel-07', null, 'vocab', 'Gevoelens', 'graag', 'volontiers, avec plaisir', null, null, null, 2, null),
  ('gevoel-08', null, 'vocab', 'Gevoelens', 'leuk', 'chouette, amusant', null, null, null, 1, null),
  ('gram-pres-01', null, 'grammar', 'Le présent', 'Hij ___ in Brussel. (wonen)', 'woont', '["woon","woont","wonen"]'::jsonb, null, null, 1, null),
  ('gram-pres-02', null, 'grammar', 'Le présent', 'Ik ___ graag naar muziek. (luisteren)', 'luister', '["luister","luistert","luisteren"]'::jsonb, null, null, 1, null),
  ('gram-pres-03', null, 'grammar', 'Le présent', '___ jij morgen naar school? (gaan)', 'Ga', '["Ga","Gaat","Gaan"]'::jsonb, null, null, 2, null),
  ('gram-pres-04', null, 'grammar', 'Le présent', 'Wij ___ Nederlands op school. (leren)', 'leren', '["leer","leert","leren"]'::jsonb, null, null, 1, null),
  ('gram-pres-05', null, 'grammar', 'Le présent', 'Zij ___ een boek. (lezen — zij = elle)', 'leest', '["lees","leest","lezen"]'::jsonb, null, null, 1, null),
  ('gram-pres-06', null, 'grammar', 'Le présent', 'Jij ___ altijd te laat. (komen)', 'komt', '["kom","komt","komen"]'::jsonb, null, null, 1, null),
  ('gram-zijn-01', null, 'grammar', 'Hebben & zijn', 'Ik ___ veertien jaar.', 'ben', '["ben","bent","is"]'::jsonb, null, null, 1, null),
  ('gram-zijn-02', null, 'grammar', 'Hebben & zijn', 'Hij ___ twee zussen.', 'heeft', '["heb","hebt","heeft"]'::jsonb, null, null, 1, null),
  ('gram-zijn-03', null, 'grammar', 'Hebben & zijn', 'Wij ___ moe na de sportles.', 'zijn', '["ben","is","zijn"]'::jsonb, null, null, 1, null),
  ('gram-zijn-04', null, 'grammar', 'Hebben & zijn', '___ je een fiets?', 'Heb', '["Heb","Hebt","Heeft"]'::jsonb, null, null, 2, null),
  ('gram-neg-01', null, 'grammar', 'La négation (niet / geen)', 'Ik heb ___ fiets.', 'geen', '["niet","geen","nee"]'::jsonb, null, null, 2, null),
  ('gram-neg-02', null, 'grammar', 'La négation (niet / geen)', 'Hij komt ___ naar het feest.', 'niet', '["geen","niet","nee"]'::jsonb, null, null, 2, null),
  ('gram-neg-03', null, 'grammar', 'La négation (niet / geen)', 'Zij drinkt ___ koffie.', 'geen', '["niet","geen","nee"]'::jsonb, null, null, 2, null),
  ('gram-neg-04', null, 'grammar', 'La négation (niet / geen)', 'Wij hebben vandaag ___ huiswerk.', 'geen', '["niet","geen","nee"]'::jsonb, null, null, 2, null),
  ('gram-neg-05', null, 'grammar', 'La négation (niet / geen)', 'Ik begrijp de vraag ___.', 'niet', '["geen","niet","nee"]'::jsonb, null, null, 2, null),
  ('gram-orde-01', null, 'grammar', 'L''ordre des mots (inversion)', 'Morgen ___ naar zee.', 'gaan wij', '["wij gaan","gaan wij","gaat wij"]'::jsonb, null, null, 2, null),
  ('gram-orde-02', null, 'grammar', 'L''ordre des mots (inversion)', 'Vandaag ___ thuis.', 'blijf ik', '["ik blijf","blijf ik","blijft ik"]'::jsonb, null, null, 2, null),
  ('gram-orde-03', null, 'grammar', 'L''ordre des mots (inversion)', 'In de zomer ___ vaak in het meer.', 'zwemmen we', '["we zwemmen","zwemmen we","zwemt we"]'::jsonb, null, null, 2, null),
  ('gram-orde-04', null, 'grammar', 'L''ordre des mots (inversion)', 'Na school ___ mijn huiswerk.', 'maak ik', '["ik maak","maak ik","maakt ik"]'::jsonb, null, null, 2, null),
  ('gram-perf-01', null, 'grammar', 'Le perfectum', 'Ik ___ gisteren gevoetbald.', 'heb', '["heb","ben","hebt"]'::jsonb, null, null, 3, null),
  ('gram-perf-02', null, 'grammar', 'Le perfectum', 'Wij ___ naar Antwerpen gefietst.', 'zijn', '["hebben","zijn","is"]'::jsonb, null, null, 3, null),
  ('gram-perf-03', null, 'grammar', 'Le perfectum', 'Hij heeft een boek ___. (lezen)', 'gelezen', '["gelezen","geleest","lezen"]'::jsonb, null, null, 3, null),
  ('gram-perf-04', null, 'grammar', 'Le perfectum', 'Zij heeft haar huiswerk ___. (maken)', 'gemaakt', '["gemaakt","gemaakd","maken"]'::jsonb, null, null, 3, null),
  ('gram-perf-05', null, 'grammar', 'Le perfectum', 'Ik heb gisteravond tv ___. (kijken)', 'gekeken', '["gekeken","gekijkt","kijken"]'::jsonb, null, null, 3, null),
  ('gram-perf-06', null, 'grammar', 'Le perfectum', 'Wij ___ gisteren thuis gebleven.', 'zijn', '["hebben","zijn","heeft"]'::jsonb, null, null, 3, null),
  ('gram-modal-01', null, 'grammar', 'Les verbes modaux', 'Ik ___ goed zwemmen. (savoir / pouvoir)', 'kan', '["kan","kun","kunt"]'::jsonb, null, null, 2, null),
  ('gram-modal-02', null, 'grammar', 'Les verbes modaux', 'Jij ___ eerst je huiswerk maken. (devoir)', 'moet', '["moet","mag","wil"]'::jsonb, null, null, 2, null),
  ('gram-modal-03', null, 'grammar', 'Les verbes modaux', '___ ik naar het toilet? (demander la permission)', 'Mag', '["Mag","Moet","Wil"]'::jsonb, null, null, 2, null),
  ('gram-modal-04', null, 'grammar', 'Les verbes modaux', 'Wij ___ een film kijken. (vouloir)', 'willen', '["wil","willen","wilt"]'::jsonb, null, null, 2, null),
  ('gram-modal-05', null, 'grammar', 'Les verbes modaux', 'Hij kan vandaag niet ___. (komen — attention à la place du verbe)', 'komen', '["komt","komen","kwam"]'::jsonb, null, null, 2, null),
  ('gram-pron-01', null, 'grammar', 'Les pronoms', '___ woont in Gent. (il)', 'Hij', '["Hij","Hem","Zij"]'::jsonb, null, null, 1, null),
  ('gram-pron-02', null, 'grammar', 'Les pronoms', 'Ik zie ___ morgen. (lui)', 'hem', '["hij","hem","zij"]'::jsonb, null, null, 2, null),
  ('gram-pron-03', null, 'grammar', 'Les pronoms', 'Dat is ___ boek. (mon)', 'mijn', '["mijn","mij","ik"]'::jsonb, null, null, 1, null),
  ('gram-pron-04', null, 'grammar', 'Les pronoms', '___ fiets is rood. (sa — à elle)', 'Haar', '["Haar","Zijn","Hun"]'::jsonb, null, null, 2, null),
  ('gram-plur-01', null, 'grammar', 'Le pluriel', 'één boek, twee ___', 'boeken', '["boeks","boeken","boekken"]'::jsonb, null, null, 1, null),
  ('gram-plur-02', null, 'grammar', 'Le pluriel', 'één tafel, twee ___', 'tafels', '["tafels","tafelen","tafells"]'::jsonb, null, null, 1, null),
  ('gram-plur-03', null, 'grammar', 'Le pluriel', 'één kind, twee ___', 'kinderen', '["kinds","kinden","kinderen"]'::jsonb, null, null, 2, null),
  ('gram-vraag-01', null, 'grammar', 'Les mots interrogatifs', '___ woon je? — In Luik.', 'Waar', '["Waar","Wanneer","Wie"]'::jsonb, null, null, 1, null),
  ('gram-vraag-02', null, 'grammar', 'Les mots interrogatifs', '___ oud ben je?', 'Hoe', '["Hoe","Wat","Waar"]'::jsonb, null, null, 1, null),
  ('gram-vraag-03', null, 'grammar', 'Les mots interrogatifs', '___ kom je niet? — Omdat ik ziek ben.', 'Waarom', '["Waarom","Wanneer","Waar"]'::jsonb, null, null, 2, null),
  ('gram-vraag-04', null, 'grammar', 'Les mots interrogatifs', '___ is dat meisje? — Mijn zus.', 'Wie', '["Wie","Wat","Waar"]'::jsonb, null, null, 1, null),
  ('lis-01', null, 'listening', 'Se présenter', 'Hallo, ik heet Emma. Ik ben dertien jaar en ik woon in Gent.', '13 ans', '["12 ans","13 ans","30 ans"]'::jsonb, 'Quel âge a Emma ?', null, 1, null),
  ('lis-02', null, 'listening', 'La famille', 'Mijn broer werkt in een winkel in Antwerpen.', 'dans un magasin', '["dans un magasin","dans une école","dans un hôpital"]'::jsonb, 'Où travaille le frère ?', null, 1, null),
  ('lis-03', null, 'listening', 'Les déplacements', 'We gaan zaterdag met de trein naar zee.', 'en train', '["en train","en voiture","à vélo"]'::jsonb, 'Comment vont-ils à la mer ?', null, 1, null),
  ('lis-04', null, 'listening', 'La météo', 'Het is vandaag koud en het regent.', 'froid et pluvieux', '["froid et pluvieux","chaud et ensoleillé","il neige"]'::jsonb, 'Quel temps fait-il aujourd''hui ?', null, 1, null),
  ('lis-05', null, 'listening', 'Les loisirs', 'De film begint om acht uur.', 'à 8 h', '["à 8 h","à 10 h","à 18 h"]'::jsonb, 'À quelle heure commence le film ?', null, 1, null),
  ('lis-06', null, 'listening', 'Au restaurant', 'Ik wil graag twee broodjes met kaas, alstublieft.', '2 sandwichs au fromage', '["2 sandwichs au fromage","2 sandwichs au jambon","1 sandwich au fromage"]'::jsonb, 'Que commande-t-il ?', null, 2, null),
  ('lis-07', null, 'listening', 'Les loisirs', 'Mijn zus speelt elke woensdag tennis.', 'du tennis', '["du tennis","du football","de la natation"]'::jsonb, 'Que fait la sœur le mercredi ?', null, 1, null),
  ('lis-08', null, 'listening', 'En ville', 'De bibliotheek is naast het station.', 'à côté de la gare', '["à côté de la gare","derrière l''école","en face du parc"]'::jsonb, 'Où est la bibliothèque ?', null, 2, null),
  ('lis-09', null, 'listening', 'La routine', 'Ik sta elke dag om zeven uur op.', 'à 7 h', '["à 7 h","à 6 h","à 8 h"]'::jsonb, 'À quelle heure se lève-t-il ?', null, 1, null),
  ('lis-10', null, 'listening', 'Manger et boire', 'Wij eten vanavond frietjes met vis.', 'des frites avec du poisson', '["des frites avec du poisson","des frites avec du poulet","de la soupe"]'::jsonb, 'Que mangent-ils ce soir ?', null, 1, null),
  ('lis-11', null, 'listening', 'Se présenter', 'Mijn lievelingskleur is groen.', 'le vert', '["le vert","le rouge","le jaune"]'::jsonb, 'Quelle est sa couleur préférée ?', null, 1, null),
  ('lis-12', null, 'listening', 'Les déplacements', 'De bus naar Brussel vertrekt over tien minuten.', 'dans 10 minutes', '["dans 10 minutes","dans 5 minutes","dans une heure"]'::jsonb, 'Quand part le bus pour Bruxelles ?', null, 2, null),
  ('lis-13', null, 'listening', 'Au quotidien', 'Ik kan niet komen, want ik ben ziek.', 'il est malade', '["il est malade","il est fatigué","il doit travailler"]'::jsonb, 'Pourquoi ne vient-il pas ?', null, 2, null),
  ('lis-14', null, 'listening', 'Faire les courses', 'Hoeveel kost dat boek? — Het kost twaalf euro.', '12 €', '["12 €","2 €","20 €"]'::jsonb, 'Combien coûte le livre ?', null, 2, null),
  ('lis-15', null, 'listening', 'La famille', 'Mijn vader kookt elke zondag spaghetti.', 'il cuisine des spaghettis', '["il cuisine des spaghettis","il lave la voiture","il joue au football"]'::jsonb, 'Que fait le père le dimanche ?', null, 1, null),
  ('lis-16', null, 'listening', 'À l''école', 'Volgende week hebben we een toets Nederlands.', 'un test de néerlandais', '["un test de néerlandais","une fête à l''école","un match de football"]'::jsonb, 'Qu''y a-t-il la semaine prochaine ?', null, 2, null),
  ('lis-17', null, 'listening', 'Au quotidien', 'Ik zoek mijn sleutels. Heb jij ze gezien?', 'ses clés', '["ses clés","son GSM","son sac"]'::jsonb, 'Que cherche la personne ?', null, 2, null),
  ('lis-18', null, 'listening', 'Les loisirs', 'Het zwembad is op maandag gesloten.', 'le lundi', '["le lundi","le mardi","le week-end"]'::jsonb, 'Quand la piscine est-elle fermée ?', null, 1, null),
  ('lis-19', null, 'listening', 'La famille', 'Mijn oma heeft drie katten en een hond.', '3 chats et 1 chien', '["3 chats et 1 chien","1 chat et 3 chiens","2 chats et 2 chiens"]'::jsonb, 'Quels animaux a la grand-mère ?', null, 2, null),
  ('lis-20', null, 'listening', 'Les déplacements', 'We vertrekken morgen heel vroeg, om zes uur al.', 'demain à 6 h', '["demain à 6 h","demain à 16 h","ce soir à 6 h"]'::jsonb, 'Quand partent-ils ?', null, 3, null),
  ('lis-21', null, 'listening', 'Au quotidien', 'Sorry, ik versta u niet goed. Kunt u dat herhalen?', 'de répéter', '["de répéter","de parler plus vite","d''écrire le mot"]'::jsonb, 'Que demande la personne ?', null, 3, null),
  ('lis-22', null, 'listening', 'Les vacances', 'In de zomer ga ik twee weken naar Spanje.', '2 semaines', '["2 semaines","2 mois","2 jours"]'::jsonb, 'Combien de temps part-il en Espagne ?', null, 2, null),
  ('lis-23', null, 'listening', 'En ville', 'Je mag hier niet fietsen, dat is verboden.', 'faire du vélo', '["faire du vélo","marcher","jouer au ballon"]'::jsonb, 'Qu''est-ce qui est interdit ici ?', null, 2, null),
  ('lis-24', null, 'listening', 'À l''école', 'Mijn beste vriend heet Lucas en hij zit in mijn klas.', 'son meilleur ami', '["son meilleur ami","son frère","son professeur"]'::jsonb, 'Qui est Lucas ?', null, 1, null),
  ('wri-01', null, 'writing', 'Se présenter', 'Tu écris un petit texte pour te présenter à ta classe partenaire en Flandre (±60 mots).
• Dis ton nom et ton âge
• Dis où tu habites
• Parle de ta famille
• Dis ce que tu aimes faire', 'Hallo! Ik heet Lucas en ik ben dertien jaar. Ik woon in Namen, in België. Wij zijn met vier thuis: mijn papa, mijn mama, mijn zus en ik. Mijn zus heet Nora en ze is tien. Na school speel ik voetbal met mijn vrienden. Ik hou ook van muziek en games. En jij? Schrijf me snel! Groetjes, Lucas', null, null, '["J''ai dit mon nom et mon âge","J''ai dit où j''habite","J''ai parlé de ma famille","J''ai dit ce que j''aime faire","J''ai une formule pour commencer et pour finir (Hallo…, Groetjes…)"]'::jsonb, 1, null),
  ('wri-02', null, 'writing', 'Les loisirs', 'Ton correspondant te demande ce que tu fais le week-end. Réponds-lui (±60 mots).
• Dis quels sont tes hobbys
• Dis quand tu les pratiques
• Dis avec qui
• Pose-lui une question', 'Hoi Emma! In het weekend heb ik veel vrije tijd. Op zaterdag speel ik tennis met mijn broer. Daarna kijk ik een film of lees ik een strip. Op zondag ga ik zwemmen met mijn vrienden. Dat vind ik super leuk! En jij, wat doe je in het weekend? Doe je ook aan sport? Groetjes, Thomas', null, null, '["J''ai dit quels sont mes hobbys","J''ai dit quand je les pratique","J''ai dit avec qui","J''ai posé une question à mon correspondant"]'::jsonb, 1, null),
  ('wri-03', null, 'writing', 'Les vacances', 'Tu es en vacances. Écris une carte postale à ton correspondant (±60 mots).
• Dis où tu es et avec qui
• Décris le temps qu''il fait
• Raconte ce que tu fais
• Dis ce que tu en penses', 'Dag Sofie! Ik ben op vakantie aan zee, in Oostende. Ik ben hier met mijn ouders en mijn broer. Het weer is mooi: de zon schijnt en het is warm. Elke dag zwem ik in de zee en we eten een ijsje op het strand. Gisteren heb ik een zandkasteel gemaakt. Het is hier echt super! Tot volgende week. Groetjes, Léa', null, null, '["J''ai dit où je suis et avec qui","J''ai décrit le temps qu''il fait","J''ai raconté ce que je fais","J''ai donné mon avis"]'::jsonb, 2, null),
  ('wri-04', null, 'writing', 'La météo', 'Ton correspondant veut savoir quel temps il fait chez toi. Écris-lui un petit message (±60 mots).
• Décris le temps aujourd''hui
• Dis ce que tu portes
• Dis ce que tu vas faire à cause de ce temps
• Pose-lui une question sur le temps chez lui', 'Hallo Daan! Vandaag is het slecht weer in België. Het regent en het waait hard. Het is maar tien graden! Ik draag een dikke trui, een jas en laarzen. Vanmiddag blijf ik binnen: ik ga een film kijken en een spel spelen met mijn zus. En bij jou? Is het ook koud in Nederland? Groetjes, Noah', null, null, '["J''ai décrit le temps qu''il fait aujourd''hui","J''ai dit ce que je porte","J''ai dit ce que je vais faire","J''ai posé une question sur le temps chez lui"]'::jsonb, 2, null),
  ('wri-05', null, 'writing', 'Le week-end', 'Raconte ton week-end dernier à ton correspondant (±60 mots, au passé composé).
• Dis ce que tu as fait samedi
• Dis ce que tu as fait dimanche
• Dis avec qui
• Donne ton avis sur ce week-end', 'Hoi Lien! Ik heb een leuk weekend gehad. Zaterdag heb ik met mijn team gevoetbald. We hebben gewonnen! Daarna heb ik bij mijn oma gegeten. Zondag ben ik met mijn vader naar de cinema geweest. We hebben een grappige film gezien. Het was een super weekend. En jij? Wat heb je gedaan? Groetjes, Arthur', null, null, '["J''ai raconté samedi ET dimanche","J''ai dit avec qui","J''ai donné mon avis","J''ai utilisé le passé composé (ik heb… / ik ben…)"]'::jsonb, 3, null),
  ('wri-06', null, 'writing', 'La santé', 'Tu es malade et tu ne peux pas aller à l''école. Écris un message à ton professeur (±60 mots).
• Explique ce que tu as
• Dis depuis quand tu es malade
• Dis ce que dit le docteur
• Dis quand tu reviens à l''école', 'Dag meneer Peeters, Ik kan vandaag niet naar school komen, want ik ben ziek. Ik heb koorts en veel hoofdpijn. Ik ben al ziek sinds zondag. De dokter zegt dat ik drie dagen in bed moet blijven en veel water moet drinken. Ik kom donderdag terug naar school. Kan u mij de taken sturen? Dank u wel. Lotte', null, null, '["J''ai expliqué ce que j''ai (symptômes)","J''ai dit depuis quand je suis malade","J''ai dit ce que dit le docteur","J''ai dit quand je reviens","Mon message est poli (Dag meneer/mevrouw…, Dank u wel)"]'::jsonb, 2, null),
  ('wri-07', null, 'writing', 'La nourriture', 'Ton correspondant te demande ce que tu manges en Belgique. Réponds-lui (±60 mots).
• Dis ce que tu manges le matin et le soir
• Dis ce que tu aimes et ce que tu n''aimes pas
• Parle de ton plat préféré', 'Hallo Finn! ''s Morgens eet ik boterhammen met choco en ik drink melk. ''s Avonds eten we warm: vaak soep, vlees met groenten en aardappelen. Ik hou van pizza en van frietjes, maar ik lust geen spruitjes. Mijn lievelingseten is spaghetti. Mijn mama maakt die elke woensdag. Wat eet jij graag? Groetjes, Emma', null, null, '["J''ai dit ce que je mange le matin","J''ai dit ce que je mange le soir","J''ai dit ce que j''aime et ce que je n''aime pas","J''ai parlé de mon plat préféré"]'::jsonb, 1, null),
  ('wri-08', null, 'writing', 'Les achats', 'Tu as fait du shopping samedi. Raconte à ton correspondant (±60 mots).
• Dis où tu es allé et avec qui
• Dis ce que tu as acheté (couleurs, prix)
• Donne ton avis', 'Hoi Milan! Zaterdag ben ik met mijn mama naar het winkelcentrum geweest. Ik heb nieuwe kleren gekocht voor school: een blauwe broek, een wit T-shirt en zwarte schoenen. De broek was in solden en kostte maar twintig euro! De schoenen vind ik echt cool. En jij, koop je graag kleren? Groetjes, Nina', null, null, '["J''ai dit où je suis allé et avec qui","J''ai dit ce que j''ai acheté","J''ai donné au moins une couleur et un prix","J''ai donné mon avis"]'::jsonb, 2, null),
  ('wri-09', null, 'writing', 'Les achats', 'C''est bientôt l''anniversaire de ton meilleur ami. Écris un message à ton correspondant (±60 mots).
• Dis pour qui tu cherches un cadeau et pourquoi
• Dis ce que tu penses acheter et où
• Dis combien tu peux payer
• Demande-lui une idée', 'Dag Jules! Zaterdag is mijn vriend Nathan jarig. Hij wordt veertien. Ik zoek een cadeau voor hem, maar het is moeilijk! Hij houdt van muziek en van basketbal. Misschien koop ik een pet of een game in het winkelcentrum. Ik heb vijftien euro. Heb jij een idee? Wat koop jij voor je vrienden? Groetjes, Chloé', null, null, '["J''ai dit pour qui je cherche un cadeau et pourquoi","J''ai dit ce que je pense acheter et où","J''ai dit combien je peux payer","J''ai demandé une idée"]'::jsonb, 2, null),
  ('wri-10', null, 'writing', 'L''itinéraire', 'Ton correspondant vient chez toi en train samedi. Explique-lui le chemin de la gare à ta maison (±60 mots).
• Dis quand tu l''attends
• Explique le chemin (au moins 3 indications : tout droit, à gauche, à droite…)
• Dis combien de temps ça prend', 'Hoi Stan! Super dat je zaterdag komt! Ik wacht op je om tien uur. Van het station is het makkelijk: ga rechtdoor tot aan het plein. Sla dan links af, de Schoolstraat in. Neem daarna de tweede straat rechts. Ik woon op nummer acht, naast de bakkerij. Het is maar tien minuten te voet. Tot zaterdag! Victor', null, null, '["J''ai dit quand je l''attends","J''ai donné au moins 3 indications de chemin","J''ai dit combien de temps ça prend"]'::jsonb, 3, null),
  ('wri-11', null, 'writing', 'Les sorties', 'Tu as fait une excursion avec ta classe. Raconte à ton correspondant (±60 mots, au passé).
• Dis où vous êtes allés et comment
• Raconte ce que vous avez vu ou fait
• Donne ton avis sur la journée', 'Dag Fleur! Vrijdag ben ik met mijn klas naar Brugge geweest. We zijn met de bus gegaan. ''s Morgens hebben we het museum bezocht en daarna hebben we een boottocht gemaakt. Ik heb veel foto''s genomen. Het was een toffe dag, maar ik was ''s avonds heel moe! Ben jij al in Brugge geweest? Groetjes, Maxime', null, null, '["J''ai dit où nous sommes allés et comment","J''ai raconté ce que nous avons vu ou fait","J''ai donné mon avis","J''ai utilisé le passé composé (we hebben… / we zijn…)"]'::jsonb, 2, null),
  ('wri-12', null, 'writing', 'L''école', 'Décris ta journée d''école à ton correspondant (±60 mots).
• Dis à quelle heure l''école commence et finit
• Parle de tes cours préférés
• Dis ce que tu fais à midi', 'Hallo Roos! Mijn school begint om half negen en stopt om vier uur. Mijn lievelingsvakken zijn sport en wiskunde. Nederlands is moeilijk, maar interessant! Om twaalf uur eet ik boterhammen met mijn vrienden in de refter. Daarna spelen we voetbal op de speelplaats. En jij? Hoe is jouw school? Groetjes, Hugo', null, null, '["J''ai dit quand l''école commence et finit","J''ai parlé de mes cours préférés","J''ai dit ce que je fais à midi"]'::jsonb, 1, null)
on conflict (id) do update set
  type = excluded.type,
  theme = excluded.theme,
  front = excluded.front,
  back = excluded.back,
  choices = excluded.choices,
  question = excluded.question,
  checklist = excluded.checklist,
  difficulty = excluded.difficulty,
  curriculum_unit = excluded.curriculum_unit;
