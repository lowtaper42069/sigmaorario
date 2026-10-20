# Configurazione Login

L'autenticazione usa **Supabase** (email + password), non più un backend PHP locale.

## Come funziona

- `js/supabase.js` contiene `SUPABASE_URL` e `SUPABASE_ANON_KEY`. **Non è versionato**
  (vedi `.gitignore`): viene generato da `scripts/gen-supabase.mjs`.
- Su **Netlify** il file è generato al build dalle env vars `SUPABASE_URL` e
  `SUPABASE_ANON_KEY` (Site configuration → Environment variables), come da `netlify.toml`.
- In **locale** va generato una volta:

  ```bash
  SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/gen-supabase.mjs
  ```

- La **anon key è pubblica per design**: i permessi reali sono decisi dalle Row Level
  Security policy del progetto Supabase.
- `login.html` fa `supabaseClient.auth.signInWithPassword({ email, password })` e,
  in caso di successo, salva la sessione in `sessionStorage` e reindirizza a
  `calendario.html`.
- `calendario.html` mostra i pulsanti di gestione (`admin-only`) solo se loggato.

## Creare un utente

Gli utenti si creano dalla dashboard Supabase del progetto:

1. **Authentication → Users → Add user**
2. Imposta email e password, poi conferma.

## Sicurezza

- La password non viene mai salvata in chiaro (gestita da Supabase Auth).
- Le operazioni sul database sono protette dalle RLS policy della tabella `eventi`.
- La `service_role` key **non** deve mai finire nel repo (solo la anon key).
