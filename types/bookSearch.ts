/** Résultat de recherche normalisé pour l'app */
export interface BookSearchResult {
  id: string;
  title: string;
  author: string;
  pageCount: number | null;
  coverUrl: string | null;
  publisher: string | null;
  publishedDate: string | null;
  /** ISBN-13 de l'édition, quand on la connaît (Google Books) */
  isbn?: string | null;
}

/** Livre de la boutique Apple Books (API de recherche iTunes, champs utiles seulement) */
export interface AppleBookItem {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  releaseDate?: string;
  description?: string;
  genres?: string[];
}

/** Élément de la réponse Open Library search (champs demandés seulement) */
export interface OpenLibrarySearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  first_publish_year?: number;
  editions?: {
    docs?: { title?: string; cover_i?: number; language?: string[] }[];
  };
}

/** Volume Google Books (partiel — seulement les champs utiles) */
export interface GoogleBooksVolumeItem {
  id: string;
  volumeInfo: {
    title: string;
    subtitle?: string;
    authors?: string[];
    pageCount?: number;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    publisher?: string;
    publishedDate?: string;
    language?: string;
    industryIdentifiers?: { type: string; identifier: string }[];
  };
}

/** Réponse brute de l'API Google Books */
export interface GoogleBooksSearchResponse {
  totalItems: number;
  items?: GoogleBooksVolumeItem[];
}
