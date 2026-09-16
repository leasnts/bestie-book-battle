/**
 * Vérifie les conversions du carnet (utils/annotations.ts).
 *
 * Le projet n'a pas de lanceur de tests : ce script se suffit à lui-même.
 *   node scripts/check-annotations.mjs
 *
 * Il compile le fichier avec esbuild (déjà installé), l'importe, et compare
 * quelques cas au résultat attendu. Les règles ici doivent rester d'accord avec
 * scripts/add-annotations.sql : la base filtre, l'app affiche.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'bbb-check-'));
const bundle = join(dir, 'annotations.mjs');

execFileSync(
  'npx',
  ['esbuild', 'utils/annotations.ts', '--bundle', '--platform=node', '--format=esm', `--outfile=${bundle}`, '--log-level=warning'],
  { stdio: 'inherit' },
);

const m = await import(bundle);

const cases = [];
const check = (name, got, want) =>
  cases.push([name, got, want, JSON.stringify(got) === JSON.stringify(want)]);

// Une note posée p. 230 dans un poche de 624 pages…
check('p. 230 sur 624 → position', +m.positionFromPage(230, 624).toFixed(5), 0.36859);
// …se retrouve vers la p. 259 dans un grand format de 700 pages
check('la même position dans 700 p.', m.pageFromPosition(0.36859, 700), 259);
check('même édition : page exacte', m.formatNotePage(0.36859, 624, 624), 'p. 231');
check('autre édition : page approchée', m.formatNotePage(0.36859, 624, 700), '≈ p. 259');

check('page 0', m.positionFromPage(0, 624), 0);
check('page au-delà du livre', m.positionFromPage(700, 624), 1);
check('édition sans pages', m.positionFromPage(10, 0), 0);

// L'anti-spoil : la marge d'≈ 1 % fait préférer un peu tard à un peu tôt
check('note juste devant moi : verrouillée', m.isUnlocked(0.26, 0.258), false);
check('note dépassée d\'un cheveu : ouverte', m.isUnlocked(0.24, 0.25), true);
check('note pile à ma page : verrouillée', m.isUnlocked(0.258, 0.258), false);

check('six catégories', Object.keys(m.ANNOTATION_CATEGORIES).length, 6);
check('catégorie par défaut', m.DEFAULT_CATEGORY, 'a_retenir');
check('marge identique à la base', m.UNLOCK_MARGIN, 0.01);

let failures = 0;
for (const [name, got, want, ok] of cases) {
  if (!ok) failures += 1;
  console.log(`${ok ? '✓' : '✗'} ${name} → ${JSON.stringify(got)}${ok ? '' : ` (attendu ${JSON.stringify(want)})`}`);
}

rmSync(dir, { recursive: true, force: true });

console.log(
  failures === 0
    ? `\n${cases.length}/${cases.length} vérifications passées`
    : `\n${failures} échec(s) sur ${cases.length}`,
);
process.exit(failures === 0 ? 0 : 1);
