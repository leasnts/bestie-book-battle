#!/usr/bin/env node
/**
 * Script pour uploader les couvertures de livres vers Supabase Storage
 *
 * Utilise la clé service_role pour bypasser le RLS (opération one-shot de seed).
 * Nécessite : EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage : SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/upload-book-covers.mjs
 * Ou : npx dotenv -e .env -- node scripts/upload-book-covers.mjs (si dotenv-cli installé)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Charger .env manuellement
try {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env');
  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
} catch (_) {}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const COVERS_DIR = join(ROOT, 'assets', 'images', 'covers');

const CHALLENGE_COVERS = [
  { challengeId: 'a4444444-4444-4444-4444-444444444444', file: 'a_little_life.png' },
  { challengeId: 'a1111111-1111-1111-1111-111111111111', file: 'sapiens.png' },
  { challengeId: 'a2222222-2222-2222-2222-222222222222', file: 'le_petit_prince.png' },
  { challengeId: 'a3333333-3333-3333-3333-333333333333', file: 'educated.png' },
];

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('❌ Variables requises : EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Récupère la clé service_role dans Supabase → Settings → API');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);
const BUCKET = 'book-covers';

async function uploadCover(challengeId, localPath) {
  const buffer = readFileSync(localPath);
  const ext = localPath.split('.').pop();
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  const fileName = `cover.${ext}`;
  const filePath = `${challengeId}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, { contentType: mime, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

async function main() {
  console.log('📤 Upload des couvertures vers Supabase Storage...\n');

  for (const { challengeId, file } of CHALLENGE_COVERS) {
    const path = join(COVERS_DIR, file);
    try {
      const coverUrl = await uploadCover(challengeId, path);
      const { error } = await supabase
        .from('challenges')
        .update({ cover_url: coverUrl })
        .eq('id', challengeId);
      if (error) throw error;
      console.log(`  ✅ ${file} → ${challengeId}`);
    } catch (e) {
      console.error(`  ❌ ${file}:`, e.message);
      process.exit(1);
    }
  }

  console.log('\n✨ Terminé ! Les couvertures sont en place.');
}

main();
