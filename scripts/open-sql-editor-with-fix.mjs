#!/usr/bin/env node
/**
 * Copie le SQL de fix dans le presse-papier et ouvre le SQL Editor Supabase.
 * L'utilisateur n'a plus qu'à coller (Cmd+V) et cliquer Run.
 */

import { readFileSync } from 'fs';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, 'fix-function-search-path.sql');
const sql = readFileSync(sqlPath, 'utf8');
const url = 'https://supabase.com/dashboard/project/ktpyoqqswdblnqaqcfxw/sql/new';

// Copier dans le presse-papier (macOS)
const p = spawn('pbcopy', [], { stdio: ['pipe', 'inherit', 'inherit'] });
p.stdin.write(sql);
p.stdin.end();
p.on('close', (code) => {
  if (code !== 0) {
    console.error('pbcopy a échoué');
  }
});

// Ouvrir le navigateur
spawn('open', [url], { stdio: 'ignore', detached: true });

console.log('\n✅ Le SQL est copié dans ton presse-papier.');
console.log('   Une fenêtre Supabase devrait s\'ouvrir.');
console.log('   → Colle (Cmd+V) dans l\'éditeur SQL');
console.log('   → Clique sur Run\n');
