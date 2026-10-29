import Constants from 'expo-constants';
import catalog from '../constants/exploreCatalog.json';
import type {
  AppleBookItem,
  BookSearchResult,
  GoogleBooksSearchResponse,
  GoogleBooksVolumeItem,
  OpenLibrarySearchDoc,
} from '../types/bookSearch';
import { compactText, normalizeText } from '../utils/normalizeText';
import { withTimeout } from '../utils/withTimeout';

/**
 * Recherche de livres, en trois sources :
 *
 * - **Apple Books** (API de recherche iTunes, boutique française) : la
 *   recherche au fil de la frappe. Rapide (~0,4 s), sans clé, tolère les
 *   fautes (« letranger », « freida mcfaden »), éditions françaises et
 *   couvertures HD. Ne donne ni pages ni éditeur.
 * - **Google Books** : les éditions papier d'un livre choisi (éditeur, année,
 *   pages, ISBN), pour pré-remplir le nombre de pages. Clé à nous
 *   (`EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY`) : sans clé, le quota anonyme est
 *   partagé par toute la planète et tombe vite à court (#83).
 * - **Open Library** : repli si Apple ne répond pas. Lent (plusieurs
 *   secondes), mais sans clé ni quota.
 *
 * Plus le catalogue des étagères (constants/exploreCatalog.json), cherché en
 * local : suggestions instantanées, sans réseau.
 */

const APPLE_SEARCH = 'https://itunes.apple.com/search';
const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const GOOGLE_BOOKS_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;
/** La clé est restreinte aux apps iOS : Google vérifie l'identifiant envoyé dans cet en-tête */
const IOS_BUNDLE_ID = Constants.expoConfig?.ios?.bundleIdentifier;
const OPEN_LIBRARY_COVER = 'https://covers.openlibrary.org/b/id';

// ── Catalogue local ──────────────────────────────────────────

type Shelf = { key: string; label: string; books: BookSearchResult[] };
const SHELVES = catalog.shelves as Shelf[];

/** Les livres des étagères, sans doublons (un livre peut être sur deux étagères) */
const CATALOG_BOOKS: BookSearchResult[] = Array.from(
  new Map(SHELVES.flatMap((s) => s.books).map((b) => [b.id, b])).values(),
);

/** Les livres du moment, proposés avant qu'on tape quoi que ce soit */
// L'étagère « now » n'existe plus dans le catalogue : on prend BookTok
export const TRENDING_BOOKS: BookSearchResult[] = (SHELVES.find((s) => s.key === 'now') ?? SHELVES.find((s) => s.key === 'booktok'))?.books ?? [];

/**
 * Livres du catalogue dont le titre ou l'auteur commence par ce qu'on tape
 * (début de n'importe quel mot, ou tout attaché : « letr » trouve L'Étranger).
 */
export function searchCatalog(query: string, limit = 3): BookSearchResult[] {
  const q = normalizeText(query);
  if (q.length < 2) return [];
  const qCompact = q.replace(/ /g, '');
  return CATALOG_BOOKS.filter((book) => {
    const haystack = normalizeText(`${book.title} ${book.author}`);
    return (
      haystack.startsWith(q) ||
      haystack.includes(` ${q}`) ||
      compactText(book.title).startsWith(qCompact)
    );
  }).slice(0, limit);
}

// ── Recherche (Apple Books) ──────────────────────────────────

/** Résultats déjà cherchés : revenir en arrière sur un mot ne relance rien */
const searchCache = new Map<string, BookSearchResult[]>();
const SEARCH_CACHE_MAX = 50;

/**
 * Recherche un livre par titre, auteur ou saga. Apple Books d'abord, Open
 * Library en repli. `signal` annule une recherche dépassée par la frappe.
 */
export async function searchBooks(
  query: string,
  { limit = 12, signal }: { limit?: number; signal?: AbortSignal } = {},
): Promise<BookSearchResult[]> {
  const key = normalizeText(query);
  if (!key) return [];
  const cached = searchCache.get(key);
  if (cached) return cached;

  let books: BookSearchResult[];
  try {
    books = await searchAppleBooks(query, limit, signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    console.warn('[bookApi] Apple Books indisponible, repli sur Open Library', error);
    books = await searchOpenLibrary(query, limit);
  }

  if (searchCache.size >= SEARCH_CACHE_MAX) {
    searchCache.delete(searchCache.keys().next().value!);
  }
  searchCache.set(key, books);
  return books;
}

async function searchAppleBooks(
  query: string,
  limit: number,
  signal?: AbortSignal,
): Promise<BookSearchResult[]> {
  const params = new URLSearchParams({
    term: query.trim(),
    media: 'ebook',
    country: 'fr',
    lang: 'fr_fr',
    // On en demande plus : le tri retire les guides de lecture et les langues étrangères
    limit: String(limit * 2),
  });

  const response = await withTimeout(fetch(`${APPLE_SEARCH}?${params}`, { signal }), 6_000);
  if (!response.ok) {
    throw new Error(`Apple Books search error: ${response.status}`);
  }

  const data: { results: AppleBookItem[] } = await response.json();
  return rankAppleResults(data.results).slice(0, limit);
}

/** Guides de lecture, résumés, coffrets : pas des livres qu'un groupe lit */
const NOISE_TITLE = /fiche de lecture|commentaire de texte|r[ée]sum[ée] (express|du livre)|analyse (de l|du livre)|[ée]tude de l.?oeuvre|^summary of|\bbundle\b|\bbonus\b|coffret|extrait gratuit|edizione|ausgabe|edici[óo]n|editie/i;
const NOISE_AUTHOR = /lepetitlitteraire|encyclopaedia universalis|r[ée]sum[ée] express/i;
const NOISE_GENRE = /outils p[ée]dagogiques|critique litt[ée]raire|ouvrages de r[ée]f[ée]rence/i;

/**
 * Trie les résultats Apple : retire le bruit, garde une seule fois chaque
 * livre, et fait passer le français devant l'anglais. Les autres langues
 * (la boutique française vend aussi du néerlandais, de l'allemand…) sortent.
 */
function rankAppleResults(items: AppleBookItem[]): BookSearchResult[] {
  const seen = new Set<string>();
  const french: BookSearchResult[] = [];
  const english: BookSearchResult[] = [];

  for (const item of items) {
    if (NOISE_TITLE.test(item.trackName) || NOISE_AUTHOR.test(item.artistName)) continue;
    if (item.genres?.some((g) => NOISE_GENRE.test(g))) continue;

    const lang = guessLanguage(item.description ?? '');
    if (lang === 'other') continue;

    const book = toBook(item);
    const key = `${compactText(book.title)}|${compactText(book.author)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    (lang === 'en' ? english : french).push(book);
  }

  return [...french, ...english];
}

function toBook(item: AppleBookItem): BookSearchResult {
  return {
    id: `apple:${item.trackId}`,
    title: cleanTitle(item.trackName),
    // « Holly Black & Leslie Damant-Jeandel » : le second nom est la traductrice
    author: item.artistName.split(/ & |, /)[0].trim(),
    pageCount: null,
    // 100×100 → 600×600 : la même image, en HD (le « bb » garde les proportions)
    coverUrl: item.artworkUrl100?.replace(/\/\d+x\d+bb\./, '/600x600bb.') ?? null,
    publisher: null,
    publishedDate: item.releaseDate?.slice(0, 10) ?? null,
  };
}

/**
 * Le titre sans ce que la boutique y ajoute :
 *   « Fourth Wing - Version française »                          → « Fourth Wing »
 *   « Harry Potter et la Chambre des Secrets (Enhanced Edition) » → « … des Secrets »
 *   « Retour de flamme - Tome 1 de la série Legacy - Par l'autrice de… » → « Retour de flamme - Tome 1 de la série Legacy »
 * « Captive - tome 1 » garde son tome.
 */
function cleanTitle(title: string): string {
  return title
    .replace(/\s*\((enhanced edition|[ée]dition[^)]*|version[^)]*|french edition)\)/gi, '')
    .split(/\s+[-–]\s+/)
    .filter((part, i) => i === 0 || !/version fran|[ée]dition|par l.?aut|autrice|auteur|["«»“”]|incontournable|best.?seller/i.test(part))
    .join(' - ')
    .trim();
}

const FRENCH_WORDS = new Set(['le', 'la', 'les', 'des', 'du', 'et', 'est', 'une', 'dans', 'pour', 'qui', 'elle', 'sur', 'pas', 'que', 'son', 'sa', 'ses', 'au']);
const ENGLISH_WORDS = new Set(['the', 'and', 'of', 'is', 'to', 'with', 'her', 'his', 'she', 'he', 'that', 'for', 'in', 'from', 'this', 'an']);
/** Allemand, néerlandais, italien, espagnol : les plus courants qui ne sont ni français ni anglais */
const OTHER_WORDS = new Set(['der', 'die', 'und', 'das', 'ist', 'nicht', 'het', 'een', 'van', 'zijn', 'il', 'di', 'che', 'per', 'della', 'el', 'los', 'las', 'con', 'por', 'una', 'del']);

/**
 * Langue d'un livre, devinée sur sa description (l'API ne la donne pas) :
 * on compte les petits mots les plus courants de chaque langue.
 * Sans description, on garde le livre (« fr », dans le doute).
 */
function guessLanguage(description: string): 'fr' | 'en' | 'other' {
  const words = normalizeText(description.replace(/<[^>]+>|&#?\w+;/g, ' ')).split(' ').slice(0, 120);
  if (words.length < 12) return 'fr';
  let fr = 0;
  let en = 0;
  let other = 0;
  for (const word of words) {
    if (FRENCH_WORDS.has(word)) fr++;
    if (ENGLISH_WORDS.has(word)) en++;
    if (OTHER_WORDS.has(word)) other++;
  }
  if ((fr < 3 && en < 3) || other > Math.max(fr, en)) return 'other';
  return fr >= en ? 'fr' : 'en';
}

// ── Repli (Open Library) ─────────────────────────────────────

/**
 * Recherche via Open Library : titre, auteur ou saga, éditions françaises
 * d'abord (`lang=fre` : titre et couverture de l'édition française quand elle
 * existe).
 */
async function searchOpenLibrary(query: string, limit: number): Promise<BookSearchResult[]> {
  const params = new URLSearchParams({
    q: query.trim(),
    limit: String(limit),
    lang: 'fre',
    fields: 'key,title,author_name,cover_i,number_of_pages_median,first_publish_year,editions,editions.title,editions.cover_i,editions.language',
  });

  const response = await withTimeout(fetch(`https://openlibrary.org/search.json?${params}`), 12_000);
  if (!response.ok) {
    throw new Error(`Open Library search error: ${response.status}`);
  }

  const data: { docs: OpenLibrarySearchDoc[] } = await response.json();

  return data.docs
    .filter((doc) => doc.title)
    .map((doc) => {
      const edition = doc.editions?.docs?.[0];
      const french = edition?.language?.includes('fre') ? edition : undefined;
      const coverId = french?.cover_i ?? doc.cover_i;
      return {
        id: doc.key,
        title: french?.title ?? doc.title,
        author: doc.author_name?.[0] ?? '',
        pageCount: doc.number_of_pages_median ?? null,
        coverUrl: coverId ? `${OPEN_LIBRARY_COVER}/${coverId}-L.jpg` : null,
        publisher: null,
        publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : null,
      };
    });
}

// ── Éditions (Google Books) ──────────────────────────────────

const editionsCache = new Map<string, BookSearchResult[]>();

/**
 * Les éditions françaises d'un livre : éditeur, année, pages, couverture.
 * Seules celles qui ont un nombre de pages comptent (c'est ce qu'on vient
 * chercher), une seule fois par éditeur et nombre de pages, les plus
 * récentes d'abord. La couverture de l'édition, sinon celle du livre.
 *
 * Liste vide si Google ne répond pas : on règle alors ses pages à la main.
 */
export async function fetchEditions(book: BookSearchResult): Promise<BookSearchResult[]> {
  const cacheKey = `${compactText(book.title)}|${compactText(book.author)}`;
  const cached = editionsCache.get(cacheKey);
  if (cached) return cached;

  const lastName = book.author.split(',')[0].trim().split(' ').pop() ?? '';
  // Le titre sans le « tome 1 » : les éditeurs l'écrivent chacun à leur façon
  const title = book.title.replace(/\s*[-–:(].*$/, '').trim() || book.title;
  const params = new URLSearchParams({
    q: `intitle:${title}${lastName ? ` inauthor:${lastName}` : ''}`,
    maxResults: '20',
    printType: 'books',
    langRestrict: 'fr',
  });
  if (GOOGLE_BOOKS_KEY) params.set('key', GOOGLE_BOOKS_KEY);

  try {
    const headers: Record<string, string> = IOS_BUNDLE_ID ? { 'X-Ios-Bundle-Identifier': IOS_BUNDLE_ID } : {};
    const response = await withTimeout(fetch(`${GOOGLE_BOOKS_API}?${params}`, { headers }), 8_000);
    if (!response.ok) throw new Error(`Google Books API error: ${response.status}`);
    const data: GoogleBooksSearchResponse = await response.json();

    const wanted = compactText(title);
    const seen = new Set<string>();
    const editions = (data.items ?? [])
      .filter((item) => item.volumeInfo.pageCount && compactText(item.volumeInfo.title).includes(wanted))
      .map((item) => toEdition(item, book))
      .sort((a, b) => (b.publishedDate ?? '').localeCompare(a.publishedDate ?? ''))
      .filter((edition) => {
        const key = `${compactText(edition.publisher ?? '')}|${edition.pageCount}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    editionsCache.set(cacheKey, editions);
    return editions;
  } catch (error) {
    console.warn('[bookApi] éditions indisponibles', error);
    return [];
  }
}

function toEdition(item: GoogleBooksVolumeItem, book: BookSearchResult): BookSearchResult {
  const v = item.volumeInfo;
  const thumbnail = v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail;
  return {
    id: `google:${item.id}`,
    // Le titre et l'auteur du livre choisi : ceux de Google sont parfois en majuscules ou tronqués
    title: book.title,
    author: book.author,
    pageCount: v.pageCount ?? null,
    coverUrl: thumbnail ? cleanGoogleCover(thumbnail) : book.coverUrl,
    publisher: v.publisher ?? null,
    publishedDate: v.publishedDate ?? null,
    isbn: v.industryIdentifiers?.find((id) => id.type === 'ISBN_13')?.identifier ?? null,
  };
}

/** HTTPS, sans l'effet « page cornée », en meilleure résolution */
function cleanGoogleCover(url: string): string {
  return url
    .replace('http://', 'https://')
    .replace('&edge=curl', '')
    .replace(/&zoom=\d/, '&zoom=2');
}
