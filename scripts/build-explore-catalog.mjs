/**
 * Génère constants/exploreCatalog.json : les étagères par genre de l'onglet Explorer.
 *
 * Les livres sont choisis à la main (les plus lus en ce moment en France), puis
 * complétés ici une fois pour toutes : nombre de pages et année via Open
 * Library, couverture de l'édition française via Apple Books (Open Library
 * n'a souvent que l'anglaise). Le résultat est commité :
 * l'onglet s'affiche tout de suite, sans réseau, et ne dépend d'aucun quota.
 *
 * Mettre à jour les étagères : modifier SHELVES ci-dessous, puis
 *    node scripts/build-explore-catalog.mjs
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** title = titre affiché (français) ; search = titre à chercher s'il diffère */
const SHELVES = [
  {
    key: 'booktok',
    label: 'Populaire sur les réseaux',
    books: [
      { title: 'Fourth Wing', author: 'Rebecca Yarros' },
      { title: 'La Femme de ménage', author: 'Freida McFadden', search: 'The Housemaid' },
      { title: 'Tout le bleu du ciel', author: 'Mélissa Da Costa' },
      { title: 'Jamais plus', author: 'Colleen Hoover', search: 'It Ends with Us' },
      { title: 'Les Sept Maris d’Evelyn Hugo', author: 'Taylor Jenkins Reid', search: 'The Seven Husbands of Evelyn Hugo' },
      { title: 'Le Prince cruel', author: 'Holly Black', search: 'The Cruel Prince' },
      { title: 'Babel', author: 'R. F. Kuang' },
      { title: 'Heartstopper', author: 'Alice Oseman' },
      { title: 'Verity', author: 'Colleen Hoover' },
      { title: 'Love Hypothesis', author: 'Ali Hazelwood', search: 'The Love Hypothesis' },
      { title: 'Un palais d’épines et de roses', author: 'Sarah J. Maas', search: 'A Court of Thorns and Roses' },
      { title: 'Le Chant d’Achille', author: 'Madeline Miller', search: 'The Song of Achilles' },
      { title: 'Twisted Love', author: 'Ana Huang' },
      { title: 'Les Douleurs fantômes', author: 'Mélissa Da Costa' },
      { title: 'Captive', author: 'Sarah Rivens' },
      { title: 'Book Lovers', author: 'Emily Henry' },
      { title: 'Icebreaker', author: 'Hannah Grace' },
      { title: 'La Vie invisible d’Addie LaRue', author: 'V. E. Schwab', search: 'The Invisible Life of Addie LaRue' },
      { title: 'Iron Flame', author: 'Rebecca Yarros' },
      { title: 'La Bibliothèque de minuit', author: 'Matt Haig', search: 'The Midnight Library' },
      { title: 'Powerless', author: 'Lauren Roberts' },
      { title: 'Dans son silence', author: 'Alex Michaelides', search: 'The Silent Patient' },
    ],
  },
  {
    key: 'new',
    label: 'Nouveautés',
    books: [
      { title: 'Chère Debbie', author: 'Freida McFadden', search: 'Dear Debbie' },
      { title: 'Le Fondateur', author: 'Giuliano da Empoli' },
      { title: 'Mariposa', author: 'Azra Reed' },
      { title: 'La Vie est une grande aventure', author: 'Laurent Gounelle' },
      { title: 'La Boulangerie du pain d’épices', author: 'Laurie Gilmore', search: "La Boulangerie du pain d'épices" },
      { title: 'Les Évadées', author: 'Marc Levy' },
      { title: 'L’Éléphant', author: 'Patrick Modiano', search: "L'Éléphant" },
      { title: 'Lever de soleil sur la moisson', author: 'Suzanne Collins', search: 'Sunrise on the Reaping' },
      { title: 'Katabasis', author: 'R. F. Kuang' },
      { title: 'Alchemised', author: 'SenLinYu' },
      { title: 'La Très Catastrophique Visite du zoo', author: 'Joël Dicker' },
      { title: 'Onyx Storm', author: 'Rebecca Yarros' },
    ],
  },
  {
    key: 'contemporary',
    label: 'Contemporain',
    books: [
      { title: 'Tout le bleu du ciel', author: 'Mélissa Da Costa' },
      { title: 'Les Douleurs fantômes', author: 'Mélissa Da Costa' },
      { title: 'Changer l’eau des fleurs', author: 'Valérie Perrin', search: "Changer l'eau des fleurs" },
      { title: 'Trois', author: 'Valérie Perrin' },
      { title: 'Il est grand temps de rallumer les étoiles', author: 'Virginie Grimaldi' },
      { title: 'La Tresse', author: 'Laetitia Colombani' },
      { title: 'Là où chantent les écrevisses', author: 'Delia Owens', search: 'Where the Crawdads Sing' },
      { title: 'Demain, et demain, et demain', author: 'Gabrielle Zevin', search: 'Tomorrow, and Tomorrow, and Tomorrow' },
      { title: 'Petit Pays', author: 'Gaël Faye' },
      { title: 'Les Yeux de Mona', author: 'Thomas Schlesser' },
      { title: 'Les Femmes du bout du monde', author: 'Mélissa Da Costa' },
      { title: 'Normal People', author: 'Sally Rooney' },
      { title: 'Une vie comme les autres', author: 'Hanya Yanagihara', search: 'A Little Life' },
      { title: 'Les Choses humaines', author: 'Karine Tuil' },
      { title: 'La Vraie Vie', author: 'Adeline Dieudonné' },
    ],
  },
  {
    key: 'thriller',
    label: 'Thriller',
    books: [
      { title: 'La Femme de ménage', author: 'Freida McFadden', search: 'The Housemaid' },
      { title: 'Verity', author: 'Colleen Hoover' },
      { title: 'Dans son silence', author: 'Alex Michaelides', search: 'The Silent Patient' },
      { title: 'Les Apparences', author: 'Gillian Flynn', search: 'Gone Girl' },
      { title: 'La Vérité sur l’affaire Harry Quebert', author: 'Joël Dicker', search: "La vérité sur l'affaire Harry Quebert" },
      { title: 'L’Affaire Alaska Sanders', author: 'Joël Dicker', search: "L'affaire Alaska Sanders" },
      { title: 'Il était deux fois', author: 'Franck Thilliez' },
      { title: 'La Jeune Fille et la Nuit', author: 'Guillaume Musso' },
      { title: 'La Fille du train', author: 'Paula Hawkins', search: 'The Girl on the Train' },
      { title: 'Le Club des Crimes du jeudi', author: 'Richard Osman', search: 'The Thursday Murder Club' },
      { title: 'Le Silence des agneaux', author: 'Thomas Harris', search: 'The Silence of the Lambs' },
      { title: 'Les Rivières pourpres', author: 'Jean-Christophe Grangé' },
      { title: 'Big Little Lies', author: 'Liane Moriarty' },
      { title: 'Sharko', author: 'Franck Thilliez' },
      { title: 'Les Hommes qui n’aimaient pas les femmes', author: 'Stieg Larsson', search: 'Les hommes qui n\'aimaient pas les femmes' },
    ],
  },
  {
    key: 'romance',
    label: 'Romance',
    books: [
      { title: 'Jamais plus', author: 'Colleen Hoover', search: 'It Ends with Us' },
      { title: 'Ugly Love', author: 'Colleen Hoover' },
      { title: 'Love Hypothesis', author: 'Ali Hazelwood', search: 'The Love Hypothesis' },
      { title: 'Book Lovers', author: 'Emily Henry' },
      { title: 'Twisted Love', author: 'Ana Huang' },
      { title: 'Icebreaker', author: 'Hannah Grace' },
      { title: 'Les Sept Maris d’Evelyn Hugo', author: 'Taylor Jenkins Reid', search: 'The Seven Husbands of Evelyn Hugo' },
      { title: 'Rouge, blanc et bleu roi', author: 'Casey McQuiston', search: 'Red, White & Royal Blue' },
      { title: 'Captive', author: 'Sarah Rivens' },
      { title: 'After', author: 'Anna Todd' },
      { title: 'Regretting You', author: 'Colleen Hoover' },
      { title: 'Hopeless', author: 'Colleen Hoover' },
      { title: 'The Spanish Love Deception', author: 'Elena Armas' },
      { title: 'King of Wrath', author: 'Ana Huang' },
    ],
  },
  {
    key: 'young-adult',
    label: 'Young adult',
    books: [
      { title: 'Heartstopper', author: 'Alice Oseman' },
      { title: 'Nous étions les menteurs', author: 'E. Lockhart', search: 'We Were Liars' },
      { title: 'Hunger Games', author: 'Suzanne Collins', search: 'The Hunger Games' },
      { title: 'Nos étoiles contraires', author: 'John Green', search: 'The Fault in Our Stars' },
      { title: 'Aristote et Dante découvrent les secrets de l’univers', author: 'Benjamin Alire Sáenz', search: 'Aristotle and Dante Discover the Secrets of the Universe' },
      { title: 'La Sélection', author: 'Kiera Cass', search: 'The Selection' },
      { title: 'Le Prince cruel', author: 'Holly Black', search: 'The Cruel Prince' },
      { title: 'Divergente', author: 'Veronica Roth', search: 'Divergent' },
      { title: 'Le Labyrinthe', author: 'James Dashner', search: 'The Maze Runner' },
      { title: 'La Faucheuse', author: 'Neal Shusterman', search: 'Scythe' },
      { title: 'A Good Girl’s Guide to Murder', author: 'Holly Jackson', search: 'A Good Girl\'s Guide to Murder' },
      { title: 'Twilight', author: 'Stephenie Meyer' },
      { title: 'Miss Peregrine et les enfants particuliers', author: 'Ransom Riggs', search: 'Miss Peregrine\'s Home for Peculiar Children' },
      { title: 'Moi, Simon, 16 ans, Homo Sapiens', author: 'Becky Albertalli', search: 'Simon vs. the Homo Sapiens Agenda' },
    ],
  },
  {
    key: 'fantasy',
    label: 'Fantasy',
    books: [
      { title: 'Les Fiancés de l’hiver', author: 'Christelle Dabos', search: "Les fiancés de l'hiver" },
      { title: 'Babel', author: 'R. F. Kuang' },
      { title: 'Le Nom du vent', author: 'Patrick Rothfuss', search: 'The Name of the Wind' },
      { title: 'Six of Crows', author: 'Leigh Bardugo' },
      { title: 'Le Chant d’Achille', author: 'Madeline Miller', search: 'The Song of Achilles' },
      { title: 'Circé', author: 'Madeline Miller', search: 'Circe' },
      { title: 'L’Empire ultime', author: 'Brandon Sanderson', search: 'Mistborn The Final Empire' },
      { title: 'Harry Potter à l’école des sorciers', author: 'J. K. Rowling', search: 'Harry Potter and the Philosopher\'s Stone' },
      { title: 'Le Hobbit', author: 'J. R. R. Tolkien', search: 'The Hobbit' },
      { title: 'Le Trône de fer', author: 'George R. R. Martin', search: 'A Game of Thrones' },
      { title: 'L’Assassin royal', author: 'Robin Hobb', search: 'Assassin\'s Apprentice' },
      { title: 'Le Sorceleur', author: 'Andrzej Sapkowski', search: 'The Last Wish' },
      { title: 'Ombre et Os', author: 'Leigh Bardugo', search: 'Shadow and Bone' },
      { title: 'La Guerre du pavot', author: 'R. F. Kuang', search: 'The Poppy War' },
    ],
  },
  {
    key: 'romantasy',
    label: 'Romantasy',
    books: [
      { title: 'Fourth Wing', author: 'Rebecca Yarros' },
      { title: 'Iron Flame', author: 'Rebecca Yarros' },
      { title: 'Onyx Storm', author: 'Rebecca Yarros' },
      { title: 'Un palais d’épines et de roses', author: 'Sarah J. Maas', search: 'A Court of Thorns and Roses' },
      { title: 'Le Trône de verre', author: 'Sarah J. Maas', search: 'Throne of Glass' },
      { title: 'De sang et de cendre', author: 'Jennifer L. Armentrout', search: 'From Blood and Ash' },
      { title: 'Powerless', author: 'Lauren Roberts' },
      { title: 'Un palais de colère et de brume', author: 'Sarah J. Maas', search: 'A Court of Mist and Fury' },
      { title: 'Le Prince cruel', author: 'Holly Black', search: 'The Cruel Prince' },
      { title: 'Quicksilver', author: 'Callie Hart' },
      { title: 'Caraval', author: 'Stephanie Garber' },
      { title: 'Il était une fois un cœur brisé', author: 'Stephanie Garber', search: 'Once Upon a Broken Heart' },
      { title: 'Kingdom of the Wicked', author: 'Kerri Maniscalco' },
      { title: 'De chair et de feu', author: 'Jennifer L. Armentrout', search: 'A Kingdom of Flesh and Fire' },
    ],
  },
  {
    key: 'feel-good',
    label: 'Feel-good',
    books: [
      { title: 'Tant que le café est encore chaud', author: 'Toshikazu Kawaguchi', search: 'Before the Coffee Gets Cold' },
      { title: 'La Bibliothèque de minuit', author: 'Matt Haig', search: 'The Midnight Library' },
      { title: 'Les Délices de Tokyo', author: 'Durian Sukegawa' },
      { title: 'Ta deuxième vie commence quand tu comprends que tu n’en as qu’une', author: 'Raphaëlle Giordano', search: "Ta deuxième vie commence quand tu comprends que tu n'en as qu'une" },
      { title: 'Les gens heureux lisent et boivent du café', author: 'Agnès Martin-Lugand' },
      { title: 'Et que ne durent que les moments doux', author: 'Virginie Grimaldi' },
      { title: 'Ensemble, c’est tout', author: 'Anna Gavalda', search: "Ensemble, c'est tout" },
      { title: 'Bienvenue à la librairie Hyunam-dong', author: 'Hwang Bo-reum', search: 'Welcome to the Hyunam-dong Bookshop' },
      { title: 'Le Restaurant de l’amour retrouvé', author: 'Ito Ogawa', search: 'Le restaurant de l\'amour retrouvé' },
      { title: 'La Papeterie Tsubaki', author: 'Ito Ogawa' },
      { title: 'Le Liseur du 6h27', author: 'Jean-Paul Didierlaurent' },
      { title: 'Le Cercle littéraire des amateurs d’épluchures de patates', author: 'Mary Ann Shaffer', search: 'The Guernsey Literary and Potato Peel Pie Society' },
      { title: 'La Bibliothèque des cœurs cabossés', author: 'Katarina Bivald' },
      { title: 'La Librairie de la place aux herbes', author: 'Eric de Kermel' },
    ],
  },
  {
    key: 'science-fiction',
    label: 'Science-fiction',
    books: [
      { title: 'Dune', author: 'Frank Herbert' },
      { title: 'Le Problème à trois corps', author: 'Liu Cixin', search: 'The Three-Body Problem' },
      { title: 'Projet Dernière Chance', author: 'Andy Weir', search: 'Project Hail Mary' },
      { title: 'Seul sur Mars', author: 'Andy Weir', search: 'The Martian' },
      { title: '1984', author: 'George Orwell' },
      { title: 'Fahrenheit 451', author: 'Ray Bradbury' },
      { title: 'La Servante écarlate', author: 'Margaret Atwood', search: 'The Handmaid’s Tale' },
      { title: 'Klara et le Soleil', author: 'Kazuo Ishiguro', search: 'Klara and the Sun' },
      { title: 'Le Meilleur des mondes', author: 'Aldous Huxley', search: 'Brave New World' },
      { title: 'Fondation', author: 'Isaac Asimov', search: 'Foundation' },
      { title: 'Hypérion', author: 'Dan Simmons', search: 'Hyperion' },
      { title: 'Station Eleven', author: 'Emily St. John Mandel' },
      { title: 'Ready Player One', author: 'Ernest Cline' },
      { title: 'L’Anomalie', author: 'Hervé Le Tellier', search: 'L\'anomalie' },
      { title: 'La Horde du Contrevent', author: 'Alain Damasio' },
    ],
  },
  {
    key: 'historical',
    label: 'Historique',
    books: [
      { title: 'Le Pays des autres', author: 'Leïla Slimani' },
      { title: 'Au revoir là-haut', author: 'Pierre Lemaitre' },
      { title: 'Le Bal des folles', author: 'Victoria Mas' },
      { title: 'Le Rossignol', author: 'Kristin Hannah', search: 'The Nightingale' },
      { title: 'Les Piliers de la terre', author: 'Ken Follett', search: 'The Pillars of the Earth' },
      { title: 'Le Tatoueur d’Auschwitz', author: 'Heather Morris', search: 'The Tattooist of Auschwitz' },
      { title: 'L’Amie prodigieuse', author: 'Elena Ferrante', search: 'My Brilliant Friend' },
      { title: 'Toute la lumière que nous ne pouvons voir', author: 'Anthony Doerr', search: 'All the Light We Cannot See' },
      { title: 'La Voleuse de livres', author: 'Markus Zusak', search: 'The Book Thief' },
      { title: 'Le Chardon et le Tartan', author: 'Diana Gabaldon', search: 'Outlander' },
      { title: 'Pachinko', author: 'Min Jin Lee' },
      { title: 'L’Art de perdre', author: 'Alice Zeniter', search: 'L\'art de perdre' },
      { title: 'Les Oubliés du dimanche', author: 'Valérie Perrin' },
    ],
  },
  {
    key: 'classics',
    label: 'Classiques',
    books: [
      { title: 'Orgueil et Préjugés', author: 'Jane Austen', search: 'Pride and Prejudice' },
      { title: 'Jane Eyre', author: 'Charlotte Brontë' },
      { title: 'Les Hauts de Hurlevent', author: 'Emily Brontë', search: 'Wuthering Heights' },
      { title: 'Le Comte de Monte-Cristo', author: 'Alexandre Dumas' },
      { title: 'L’Étranger', author: 'Albert Camus', search: "L'Étranger" },
      { title: 'Les Misérables', author: 'Victor Hugo' },
      { title: 'Le Portrait de Dorian Gray', author: 'Oscar Wilde', search: 'The Picture of Dorian Gray' },
      { title: 'Le Petit Prince', author: 'Antoine de Saint-Exupéry' },
      { title: 'Madame Bovary', author: 'Gustave Flaubert' },
      { title: 'Le Rouge et le Noir', author: 'Stendhal' },
      { title: 'Gatsby le Magnifique', author: 'F. Scott Fitzgerald', search: 'The Great Gatsby' },
      { title: 'Les Quatre Filles du docteur March', author: 'Louisa May Alcott', search: 'Little Women' },
      { title: 'Crime et Châtiment', author: 'Fiodor Dostoïevski' },
      { title: 'Bel-Ami', author: 'Guy de Maupassant' },
      { title: 'Notre-Dame de Paris', author: 'Victor Hugo' },
    ],
  },
  {
    key: 'horror',
    label: 'Horreur',
    books: [
      { title: 'Ça', author: 'Stephen King', search: 'It' },
      { title: 'Shining', author: 'Stephen King', search: 'The Shining' },
      { title: 'Simetierre', author: 'Stephen King', search: 'Pet Sematary' },
      { title: 'Mexican Gothic', author: 'Silvia Moreno-Garcia' },
      { title: 'Dracula', author: 'Bram Stoker' },
      { title: 'Frankenstein', author: 'Mary Shelley' },
      { title: 'La Maison des feuilles', author: 'Mark Z. Danielewski', search: 'House of Leaves' },
      { title: 'Carrie', author: 'Stephen King' },
      { title: 'Misery', author: 'Stephen King' },
      { title: 'Maison hantée', author: 'Shirley Jackson', search: 'The Haunting of Hill House' },
      { title: 'Bird Box', author: 'Josh Malerman' },
      { title: 'Ring', author: 'Kōji Suzuki' },
      { title: 'Coraline', author: 'Neil Gaiman' },
      { title: 'Hex', author: 'Thomas Olde Heuvelt' },
    ],
  },
  {
    key: 'comics',
    label: 'BD & manga',
    books: [
      { title: 'One Piece', author: 'Eiichiro Oda' },
      { title: 'L’Arabe du futur', author: 'Riad Sattouf', search: "L'Arabe du futur" },
      { title: 'Persepolis', author: 'Marjane Satrapi' },
      { title: 'Spy x Family', author: 'Tatsuya Endo' },
      { title: 'Blue Period', author: 'Tsubasa Yamaguchi' },
      { title: 'Astérix le Gaulois', author: 'René Goscinny' },
      { title: 'Les Vieux Fourneaux', author: 'Wilfrid Lupano' },
      { title: 'Naruto', author: 'Masashi Kishimoto' },
      { title: 'L’Attaque des Titans', author: 'Hajime Isayama', search: 'L\'attaque des titans' },
      { title: 'Jujutsu Kaisen', author: 'Gege Akutami' },
      { title: 'Demon Slayer', author: 'Koyoharu Gotouge' },
      { title: 'Death Note', author: 'Tsugumi Ohba' },
      { title: 'Blacksad', author: 'Juan Díaz Canales' },
      { title: 'Les Cahiers d’Esther', author: 'Riad Sattouf', search: 'Les cahiers d\'Esther' },
      { title: 'Le Château des animaux', author: 'Xavier Dorison' },
    ],
  },
  {
    key: 'self-help',
    label: 'Développement perso',
    books: [
      { title: 'Atomic Habits', author: 'James Clear' },
      { title: 'Les Quatre Accords toltèques', author: 'Miguel Ruiz', search: 'The Four Agreements' },
      { title: 'L’Art subtil de s’en foutre', author: 'Mark Manson', search: 'The Subtle Art of Not Giving a F*ck' },
      { title: 'Le Pouvoir du moment présent', author: 'Eckhart Tolle', search: 'The Power of Now' },
      { title: 'Ikigai', author: 'Héctor García' },
      { title: 'L’Alchimiste', author: 'Paulo Coelho', search: 'The Alchemist' },
      { title: 'Miracle Morning', author: 'Hal Elrod', search: 'The Miracle Morning' },
      { title: 'Les Cinq Blessures qui empêchent d’être soi-même', author: 'Lise Bourbeau', search: 'Les 5 blessures qui empêchent d\'être soi-même' },
      { title: 'Le Charme discret de l’intestin', author: 'Giulia Enders', search: 'Le charme discret de l\'intestin' },
      { title: 'Cessez d’être gentil, soyez vrai', author: 'Thomas d’Ansembourg', search: 'Cessez d\'être gentil soyez vrai' },
      { title: 'Deep Work', author: 'Cal Newport' },
      { title: 'La Magie du rangement', author: 'Marie Kondo', search: 'The Life-Changing Magic of Tidying Up' },
    ],
  },
  {
    key: 'nonfiction',
    label: 'Récits & essais',
    books: [
      { title: 'Sapiens', author: 'Yuval Noah Harari' },
      { title: 'Devenir', author: 'Michelle Obama', search: 'Becoming' },
      { title: 'Une éducation', author: 'Tara Westover', search: 'Educated' },
      { title: 'L’Événement', author: 'Annie Ernaux', search: "L'Événement" },
      { title: 'Le Consentement', author: 'Vanessa Springora' },
      { title: 'Une chambre à soi', author: 'Virginia Woolf', search: 'A Room of One’s Own' },
      { title: 'Les Années', author: 'Annie Ernaux' },
      { title: 'Yoga', author: 'Emmanuel Carrère' },
      { title: 'King Kong Théorie', author: 'Virginie Despentes' },
      { title: 'Le Lambeau', author: 'Philippe Lançon' },
      { title: 'Sorcières', author: 'Mona Chollet' },
      { title: 'Homo Deus', author: 'Yuval Noah Harari' },
      { title: 'Réinventer l’amour', author: 'Mona Chollet', search: 'Réinventer l\'amour' },
    ],
  },
];

const FIELDS = [
  'key',
  'title',
  'cover_i',
  'number_of_pages_median',
  'first_publish_year',
  'editions',
  'editions.cover_i',
  'editions.language',
].join(',');

async function lookup({ title, author, search }) {
  const params = new URLSearchParams({
    title: search ?? title,
    author,
    limit: '1',
    lang: 'fre',
    fields: FIELDS,
  });
  const response = await fetch(`https://openlibrary.org/search.json?${params}`, {
    headers: { 'User-Agent': 'bestie-book-battle (catalog script)' },
  });
  if (!response.ok) throw new Error(`${title}: HTTP ${response.status}`);
  const doc = (await response.json()).docs?.[0];
  if (!doc) return null;

  // Couverture de l'édition française si elle existe, sinon celle de l'œuvre
  const edition = doc.editions?.docs?.[0];
  const frenchCover = edition?.language?.includes('fre') ? edition.cover_i : undefined;
  const coverId = frenchCover ?? doc.cover_i;

  return {
    id: doc.key,
    title,
    author,
    pageCount: doc.number_of_pages_median ?? null,
    coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null,
    publisher: null,
    publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : null,
  };
}

/** Plié pour comparer : sans accents, majuscules ni ponctuation */
const fold = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Le premier livre Apple Books (France) du même titre et du même auteur */
async function appleBook({ title, author }) {
  const params = new URLSearchParams({ term: `${title} ${author}`, media: 'ebook', country: 'fr', limit: '10' });
  const response = await fetch(`https://itunes.apple.com/search?${params}`);
  if (!response.ok) return null;
  const lastName = fold(author.split(' ').pop());
  const wanted = fold(title);
  const match = (await response.json()).results.find(
    (r) => fold(r.artistName).includes(lastName) && fold(r.trackName).includes(wanted),
  );
  return match ?? null;
}

/** Sa couverture française en HD */
const coverOf = (match) => match?.artworkUrl100?.replace(/\/\d+x\d+bb\./, '/600x600bb.') ?? null;

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'constants', 'exploreCatalog.json');

// Les livres déjà complétés ne repassent pas par Open Library (lent)
const cache = new Map();
if (existsSync(out)) {
  for (const book of JSON.parse(readFileSync(out, 'utf8')).shelves.flatMap((s) => s.books)) {
    cache.set(`${book.title}|${book.author}`, book);
  }
}

const shelves = [];
for (const shelf of SHELVES) {
  const books = [];
  for (const book of shelf.books) {
    const cacheKey = `${book.title}|${book.author}`;
    if (!cache.has(cacheKey)) cache.set(cacheKey, await lookup(book).catch((e) => (console.warn(e.message), null)));
    const apple = await appleBook(book).catch(() => null);
    // Trop récent pour Open Library (une nouveauté) : la fiche Apple Books suffit
    if (!cache.get(cacheKey) && apple) {
      cache.set(cacheKey, {
        id: `apple:${apple.trackId}`,
        title: book.title,
        author: book.author,
        pageCount: null,
        coverUrl: null,
        publisher: null,
        publishedDate: apple.releaseDate?.slice(0, 4) ?? null,
      });
    }
    const found = cache.get(cacheKey);
    const cover = coverOf(apple);
    if (found && cover) found.coverUrl = cover;
    else if (found) console.warn(`  (pas de couverture française pour ${book.title})`);
    if (found?.coverUrl) books.push(found);
    else console.warn(`✗ ${shelf.label} : ${book.title} (pas trouvé ou sans couverture)`);
  }
  shelves.push({ key: shelf.key, label: shelf.label, books });
  console.log(`✓ ${shelf.label} : ${books.length}/${shelf.books.length}`);
}

writeFileSync(out, `${JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), shelves }, null, 2)}\n`);
console.log(`→ ${out}`);
