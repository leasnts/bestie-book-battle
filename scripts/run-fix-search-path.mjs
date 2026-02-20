#!/usr/bin/env node
/**
 * Corrige le "Function Search Path Mutable" (Security Advisor Supabase)
 *
 * Exécute les ALTER FUNCTION pour définir search_path = 'public' sur toutes les fonctions.
 * Nécessite DATABASE_URL dans .env (Supabase → Settings → Database → Connection string)
 *
 * Usage : npm run fix-search-path
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Charger .env
try {
  const envPath = join(__dirname, '..', '.env');
  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
} catch (_) {}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env\n');
  console.error('   Récupère-le dans Supabase → Settings → Database → Connection string');
  console.error('   (mode "Transaction" ou "Session")\n');
  console.error('   Tu peux aussi copier le contenu de fix-function-search-path.sql');
  console.error('   dans le SQL Editor de Supabase et l\'exécuter manuellement.');
  process.exit(1);
}

// Lazy load pg pour ne pas bloquer si pas installé
let pg;
try {
  pg = (await import('pg')).default;
} catch (e) {
  console.error('❌ Package pg manquant. Installe-le :');
  console.error('   npm install pg --save-dev\n');
  process.exit(1);
}

const FUNCTIONS = [
  'generate_invite_code',
  'set_invite_code',
  'calculate_progress_percentage',
  'update_challenge_stats',
  'update_challenge_status',
  'update_streak',
  'update_updated_at_column',
  'create_initial_progress',
  'add_progress_history',
  'update_challenge_goals_updated_at',
];

async function main() {
  console.log('🔒 Correction du search_path des fonctions...\n');

  const client = new pg.Client({ connectionString: databaseUrl });

  try {
    await client.connect();
  } catch (e) {
    console.error('❌ Connexion à la base échouée:', e.message);
    console.error('   Vérifie que DATABASE_URL est correct.');
    process.exit(1);
  }

  let fixed = 0;
  for (const fn of FUNCTIONS) {
    try {
      await client.query(
        `ALTER FUNCTION IF EXISTS public.${fn}() SET search_path = 'public'`
      );
      const res = await client.query(
        `SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
         WHERE n.nspname = 'public' AND p.proname = $1`,
        [fn]
      );
      if (res.rows.length > 0) {
        console.log('   ✅', fn);
        fixed++;
      }
    } catch (e) {
      console.log('   ⏭️', fn, '(ignoré:', e.message.slice(0, 50) + '...)');
    }
  }

  await client.end();
  console.log('\n✨ Terminé.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
