# Sigmaorario

Visualizzatore orario settimanale per il mio personale corso di laurea (A.S. 2026/2027).
App non ufficiale — per gli orari attendibili fa fede il sito del Politecnico di Milano.

## Funzionalità

- **Orario interattivo** — griglia a 15 minuti (8:00–20:00) con blocchi lezione contigui
- **Indicatore lezione attuale** — riquadro sulla cella ora/giorno corrente
- **Ricerca materie** — filtra mentre scrivi (debounce) e con Invio; evidenzia tutte le occorrenze
- **Densità regolabile** — slider per l'altezza righe (persistito in localStorage)
- **Temi** — 4 temi: *Brutal scuro* (default), *Brutal chiaro*, *Scuro*, *Chiaro*, scelti da un selettore a tendina
- **Motion** — wipe radiale al cambio tema, slide al cambio mese, animazioni dei modali e della ricerca (rispetta `prefers-reduced-motion`)
- **Link aule** — click su una lezione apre la mappa AUNICA dell'aula
- **Viste mobile** — su schermi stretti: *giorno* (lista), *giorno tabella* (griglia oraria coi blocchi) e *tabella piena*, con pallini e swipe per cambiare giorno
- **Esportazione .ics** e stampa
- **Calendario eventi** — gestione locale + sync Supabase (WIP)

## Pagine

- `index.html` — orario settimanale
- `calendario.html` — calendario eventi
- `snake.html` — easter egg 🐍 (frecce/WASD, oppure swipe su mobile)
- `login.html`, `404.html`

## Stack

- HTML / CSS / Vanilla JS (nessun build step)
- Supabase (auth + database per il calendario) (WIP)
- [JetBrains Mono Nerd Font](https://www.nerdfonts.com/) — testo e icone (via CDN)
- [Netlify](https://www.netlify.com/) per il deploy

## Sviluppo

```bash
# Servire in locale (qualsiasi static server)
npx serve .
# oppure
python3 -m http.server 8000
```

## Orario

L'orario sta in **`orario.json`** (chiavi `0`–`4` = lunedì–venerdì):

```json
{
  "0": [
    { "subject": "ANALISI MATEMATICA 1", "start": "13:15", "end": "16:15", "room": "2.1.4" }
  ]
}
```

Viene caricato via `fetch` da `js/realtime.js`. Per aggiornarlo basta modificare il JSON:
niente da toccare nel codice.

## Note sul deploy

`main` è collegato a Netlify (ogni push = deploy in produzione). Il lavoro va fatto sui
branch (`dev`, `feat/*`, …). Vedi `AGENTS.md`.
