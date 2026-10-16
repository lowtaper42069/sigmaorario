# Configurazione Login

L'autenticazione usa **Supabase** (email + password), non più un backend PHP locale.

## Come funziona

- `js/supabase.js` contiene `SUPABASE_URL` e `SUPABASE_ANON_KEY`.
- La **anon key è pubblica per design**: può stare nel repo, i permessi reali sono
  decisi dalle Row Level Security policy del progetto Supabase.
- `login.html` fa `supabaseClient.auth.signInWithPassword({ email, password })` e,
  in caso di successo, salva la sessione in `sessionStorage` e reindirizza a
  `calendario.html`.
- `calendario.html` mostra i pulsanti di gestione (`admin-only`) solo se loggato.

## Creare un utente

Gli utenti si creano dalla dashboard Supabase del progetto:

1. **Authentication → Users → Add user**
2. Imposta email e password, poi conferma.

Non serve nessun file di configurazione locale.

## Sicurezza

- La password non viene mai salvata in chiaro (gestita da Supabase Auth).
- Le operazioni sul database sono protette dalle RLS policy della tabella `eventi`.
- La `service_role` key **non** deve mai finire nel repo (solo la anon key).
