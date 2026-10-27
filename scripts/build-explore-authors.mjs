/**
 * Génère constants/exploreAuthors.json : les auteur·ices de l'onglet Explorer,
 * avec leur photo quand on en trouve une.
 *
 * La photo vient de Wikidata (propriété P18, image libre de Wikimedia Commons),
 * en vignette carrée de 240 px. Pas de photo trouvée → `photoUrl: null`, et
 * l'app affiche les initiales à la place. Le résultat est commité : l'onglet
 * ne fait aucun appel réseau pour ces noms.
 *
 * Mettre à jour la liste : modifier AUTHORS ci-dessous, puis
 *    node scripts/build-explore-authors.mjs
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Les plus lu·es, dans l'ordre d'affichage ; `wikidata` force l'entité si la recherche se trompe */
const AUTHORS = [
  { name: 'Colleen Hoover' },
  { name: 'Freida McFadden' },
  { name: 'Rebecca Yarros' },
  { name: 'Sarah J. Maas' },
  { name: 'Mélissa Da Costa' },
  { name: 'Joël Dicker' },
  { name: 'Valérie Perrin' },
  { name: 'Madeline Miller' },
  { name: 'Emily Henry' },
  { name: 'Holly Black' },
];

const HEADERS = { 'User-Agent': 'BestieBookBattle-catalog/1.0 (https://github.com/leasnts/bestie-book-battle)' };
const PHOTO_WIDTH = 240;

async function json(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

/** Premier résultat Wikidata dont la description parle d'écriture */
async function findEntity(name) {
  const search = await json(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=fr&uselang=fr&limit=5&search=${encodeURIComponent(name)}`,
  );
  const writer = search.search.find((hit) => /écri|auteur|autri|roman|novel|writer|author/i.test(hit.description ?? ''));
  return (writer ?? search.search[0])?.id ?? null;
}

async function photoOf(entity) {
  const claims = await json(
    `https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&property=P18&entity=${entity}`,
  );
  const file = claims.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  if (!file) return null;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file.replace(/ /g, '_'))}?width=${PHOTO_WIDTH}`;
}

const authors = [];
for (const author of AUTHORS) {
  const entity = author.wikidata ?? (await findEntity(author.name));
  const photoUrl = entity ? await photoOf(entity) : null;
  console.log(`${photoUrl ? '✓' : '·'} ${author.name}${entity ? ` (${entity})` : ''}`);
  authors.push({ name: author.name, photoUrl });
}

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'constants', 'exploreAuthors.json');
writeFileSync(out, `${JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), authors }, null, 2)}\n`);
console.log(`→ constants/exploreAuthors.json`);
