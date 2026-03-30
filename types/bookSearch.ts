/** Résultat de recherche normalisé pour l'app */
export interface BookSearchResult {
  id: string;
  title: string;
  author: string;
  pageCount: number | null;
  coverUrl: string | null;
  publisher: string | null;
  publishedDate: string | null;
}

/** Élément de la réponse Open Library trending */
export interface OpenLibraryTrendingWork {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  publisher?: string[];
}

/** Volume Google Books (partiel — seulement les champs utiles) */
export interface GoogleBooksVolumeItem {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    pageCount?: number;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    publisher?: string;
    publishedDate?: string;
  };
}

/** Réponse brute de l'API Google Books */
export interface GoogleBooksSearchResponse {
  totalItems: number;
  items?: GoogleBooksVolumeItem[];
}
