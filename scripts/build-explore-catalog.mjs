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
    label: 'Populaire sur BookTok',
    books: [
      { title: 'Fourth Wing', author: 'Rebecca Yarros' },
      { title: 'La Femme de ménage', author: 'Freida McFadden', search: 'The Housemaid' },
      { title: 'Tout le bleu du ciel', author: 'Mélissa Da Costa' },
      { title: 'Jamais plus', author: 'Colleen Hoover', search: 'It Ends with Us' },
      { title: 'Les Sept Maris d’Evelyn Hugo', author: 'Taylor Jenkins Reid', search: 'The Seven Husbands of Evelyn Hugo' },
      { title: 'Le Prince cruel', author: 'Holly Black', search: 'The Cruel Prince' },
      { title: 'Babel', author: 'R. F. Kuang' },
      { title: 'Heartstopper', author: 'Alice Oseman' },
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

/** La couverture française en HD : le premier livre Apple Books du même titre et du même auteur */
async function appleCover({ title, author }) {
  const params = new URLSearchParams({ term: `${title} ${author}`, media: 'ebook', country: 'fr', limit: '10' });
  const response = await fetch(`https://itunes.apple.com/search?${params}`);
  if (!response.ok) return null;
  const lastName = fold(author.split(' ').pop());
  const wanted = fold(title);
  const match = (await response.json()).results.find(
    (r) => fold(r.artistName).includes(lastName) && fold(r.trackName).includes(wanted),
  );
  return match?.artworkUrl100?.replace(/\/\d+x\d+bb\./, '/600x600bb.') ?? null;
}

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
    const found = cache.get(cacheKey);
    const cover = await appleCover(book).catch(() => null);
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
