/**
 * ISBN — le numéro d'une édition précise d'un livre (le code-barres au dos).
 *
 * `parseIsbn` reconnaît un ISBN tapé ou scanné, avec ou sans tirets ni
 * espaces, en ISBN-13 (978…, 979…) ou en ancien ISBN-10, et le rend toujours
 * en ISBN-13 : c'est sous cette forme que Google Books et Open Library le
 * cherchent. Un numéro dont la clé (le dernier chiffre) ne tombe pas juste
 * n'est pas un ISBN : une faute de frappe ou un autre code-barres.
 */
export function parseIsbn(text: string): string | null {
  const raw = text.replace(/[\s-]/g, '').toUpperCase();
  if (/^97[89]\d{10}$/.test(raw)) return isbn13Valid(raw) ? raw : null;
  if (/^\d{9}[\dX]$/.test(raw)) return isbn10Valid(raw) ? isbn10To13(raw) : null;
  return null;
}

function isbn13Valid(isbn: string): boolean {
  const sum = [...isbn].reduce((total, digit, i) => total + Number(digit) * (i % 2 === 0 ? 1 : 3), 0);
  return sum % 10 === 0;
}

function isbn10Valid(isbn: string): boolean {
  const sum = [...isbn].reduce((total, char, i) => total + (char === 'X' ? 10 : Number(char)) * (10 - i), 0);
  return sum % 11 === 0;
}

function isbn10To13(isbn10: string): string {
  const body = `978${isbn10.slice(0, 9)}`;
  const sum = [...body].reduce((total, digit, i) => total + Number(digit) * (i % 2 === 0 ? 1 : 3), 0);
  return `${body}${(10 - (sum % 10)) % 10}`;
}
