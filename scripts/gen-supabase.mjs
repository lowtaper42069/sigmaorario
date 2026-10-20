// Genera js/supabase.js a partire da SUPABASE_URL / SUPABASE_ANON_KEY.
// Usato dal build di Netlify (netlify.toml); eseguibile anche in locale:
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/gen-supabase.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('gen-supabase: mancano SUPABASE_URL e/o SUPABASE_ANON_KEY.');
    process.exit(1);
}

const out = fileURLToPath(new URL('../js/supabase.js', import.meta.url));
const content =
    `const SUPABASE_URL = '${url}';\n` +
    `const SUPABASE_ANON_KEY = '${key}';\n\n` +
    `const { createClient } = supabase;\n` +
    `const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);\n`;

writeFileSync(out, content);
console.log('gen-supabase: scritto js/supabase.js');
