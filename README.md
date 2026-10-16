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
- **Impostazioni mobile** — su schermi stretti lock, densità, vista e temi stanno in un pannello laterale (button slider in alto a destra), che resta aperto finché non lo si chiude
- **Esportazione .ics** e stampa
- **Calendario eventi** — gestione locale + sync Supabase (WIP)

## Pagine

- `index.html` — orario settimanale
- `calendario.html` — calendario eventi
- `snake.html` — easter egg 🐍 (frecce/WASD, oppure swipe su mobile)
- `login.html`, `404.html`

## Struttura

La pagina orario (`index.html`) carica un solo ES module, `js/main.js`, che importa:

- `js/core.js` — costanti, stato dell'orario (incluse le aule), caricamento dei JSON, utility di tempo/griglia
- `js/orario.js` — tabella settimanale, pannello info, densità, ricerca, export `.ics`/stampa
- `js/mobile.js` — viste "giorno"/"giorno tabella"/"tabella piena" e layout mobile
- `js/theme.js` — bootstrap tema + selettore (script classico in `<head>`, per evitare il flash)

Gli stili sono divisi per pagina, così ogni pagina carica solo il necessario:

- `styles/base.css` — font, variabili, reset, componenti condivisi (header, pannello impostazioni, tema), motion
- `styles/themes.css` — override dei temi (`[data-theme]`)
- `styles/schedule.css` — orario (usato da `index.html`)
- `styles/calendar.css` — calendario (usato da `calendario.html`)

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

Viene caricato via `fetch` da `js/core.js` (`loadData`). Per aggiornarlo basta
modificare il JSON: niente da toccare nel codice.

I link delle aule (es. accesso AUNICA) stanno invece in **`aule.json`**, mappa
stanza → link, caricato nello stesso momento:

```json
{
  "T.1.1": "https://aunicalogin.polimi.it/aunicalogin/getservizio.xml?id_servizio=343&idaula=53&lang=IT"
}
```

Per aggiungere un'aula basta quindi aggiungere la riga in `orario.json` e, se ha un
link, la corrispondenza in `aule.json`.

## Note sul deploy

`main` è collegato a Netlify (ogni push = deploy in produzione). Il lavoro va fatto sui
branch (`dev`, `feat/*`, …). Vedi `AGENTS.md`.
