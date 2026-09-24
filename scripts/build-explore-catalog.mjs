/**
 * Génère constants/exploreCatalog.json : les étagères par genre de l'onglet Explorer.
 *
 * Les livres sont choisis à la main (les plus lus en ce moment en France), puis
 * complétés ici une fois pour toutes via Open Library : couverture (l'édition
 * française quand elle existe), nombre de pages, année. Le résultat est commité :
 * l'onglet s'affiche tout de suite, sans réseau, et ne dépend d'aucun quota.
 *
 * Mettre à jour les étagères : modifier SHELVES ci-dessous, puis
 *    node scripts/build-explore-catalog.mjs
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** title = titre affiché (français) ; search = titre à chercher s'il diffère */
const SHELVES = [
  {
    key: 'now',
    label: 'En ce moment',
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

const cache = new Map();
const shelves = [];
for (const shelf of SHELVES) {
  const books = [];
  for (const book of shelf.books) {
    const cacheKey = `${book.title}|${book.author}`;
    if (!cache.has(cacheKey)) cache.set(cacheKey, await lookup(book).catch((e) => (console.warn(e.message), null)));
    const found = cache.get(cacheKey);
    if (found?.coverUrl) books.push(found);
    else console.warn(`✗ ${shelf.label} : ${book.title} (pas trouvé ou sans couverture)`);
  }
  shelves.push({ key: shelf.key, label: shelf.label, books });
  console.log(`✓ ${shelf.label} : ${books.length}/${shelf.books.length}`);
}

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'constants', 'exploreCatalog.json');
writeFileSync(out, `${JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), shelves }, null, 2)}\n`);
console.log(`→ ${out}`);
