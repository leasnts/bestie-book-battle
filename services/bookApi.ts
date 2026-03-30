import type { BookSearchResult, GoogleBooksSearchResponse, OpenLibraryTrendingWork } from '../types/bookSearch';
import { withTimeout } from '../utils/withTimeout';

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

/**
 * Nettoie une URL de couverture Google Books :
 * - Force HTTPS
 * - Retire l'effet "curl" sur la page
 * - Augmente le zoom pour une meilleure résolution
 */
function cleanCoverUrl(url: string): string {
  return url
    .replace('http://', 'https://')
    .replace('&edge=curl', '')
    .replace(/&zoom=\d/, '&zoom=2');
}

/**
 * Recherche des livres via Google Books API.
 * Retourne les résultats normalisés pour l'app.
 *
 * Gratuit sans clé API (1000 req/jour par IP).
 */
export async function searchBooks(
  query: string,
  maxResults = 10,
): Promise<BookSearchResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query.trim(),
    maxResults: String(maxResults),
    printType: 'books',
  });

  const response = await withTimeout(
    fetch(`${GOOGLE_BOOKS_API}?${params}`),
    8_000,
  );

  if (!response.ok) {
    throw new Error(`Google Books API error: ${response.status}`);
  }

  const data: GoogleBooksSearchResponse = await response.json();

  if (!data.items) return [];

  return data.items.map((item) => {
    const v = item.volumeInfo;
    const thumbnail = v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail;

    return {
      id: item.id,
      title: v.title,
      author: v.authors?.join(', ') ?? '',
      pageCount: v.pageCount ?? null,
      coverUrl: thumbnail ? cleanCoverUrl(thumbnail) : null,
      publisher: v.publisher ?? null,
      publishedDate: v.publishedDate ?? null,
    };
  });
}

// ── Trending (Open Library) ──────────────────────────────────

const OPEN_LIBRARY_TRENDING = 'https://openlibrary.org/trending/daily.json';
const OPEN_LIBRARY_COVER = 'https://covers.openlibrary.org/b/id';

/** Cache module-level : trending books + timestamp (TTL 1h) */
let trendingCache: { books: BookSearchResult[]; fetchedAt: number } | null = null;
const TRENDING_TTL = 60 * 60 * 1000; // 1 heure

/**
 * Récupère les livres tendance du moment via Open Library.
 * Résultats cachés 1h pour éviter les appels répétés.
 */
export async function fetchTrendingBooks(limit = 15): Promise<BookSearchResult[]> {
  // Retourner le cache s'il est encore frais
  if (trendingCache && Date.now() - trendingCache.fetchedAt < TRENDING_TTL) {
    return trendingCache.books;
  }

  const response = await withTimeout(
    fetch(`${OPEN_LIBRARY_TRENDING}?limit=${limit}`),
    8_000,
  );

  if (!response.ok) {
    throw new Error(`Open Library trending error: ${response.status}`);
  }

  const data: { works: OpenLibraryTrendingWork[] } = await response.json();

  const books: BookSearchResult[] = data.works
    .filter((w) => w.title)
    .map((w) => ({
      id: w.key,
      title: w.title,
      author: w.author_name?.join(', ') ?? '',
      pageCount: null,
      coverUrl: w.cover_i ? `${OPEN_LIBRARY_COVER}/${w.cover_i}-M.jpg` : null,
      publisher: w.publisher?.[0] ?? null,
      publishedDate: w.first_publish_year ? String(w.first_publish_year) : null,
    }));

  trendingCache = { books, fetchedAt: Date.now() };
  return books;
}
