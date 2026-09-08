# Sigmaorario

Visualizzatore orario settimanale per il mio personale corso di laurea (A.S. 2026/2027).

## Funzionalità

- **Orario interattivo** — griglia 15 minuti (8:00–20:00) con blocchi lezione contigui
- **Indicatore lezione attuale** — linea verde verticale nell'ora corrente
- **Ricerca materie** — evidenzia tutte le occorrenze di una materia con bordo bianco
- **Densità regolabile** — slider per altezza righe (persistito in localStorage)
- **Tema chiaro/scuro** — toggle con preferenza salvata e rilevamento sistema
- **Link aule** — click su una lezione apre la mappa AUNICA dell'aula
- **Esportazione CSV** / stampa
- **Calendario eventi** — gestione locale + sync Supabase (WIP)

## Stack

- HTML / CSS / Vanilla JS
- Supabase (auth + database per calendario) (WIP)
- Font Awesome 6 per icone

## Sviluppo

```bash
# Servire in locale (qualsiasi static server)
npx serve .
# o
python -m http.server 8000
```

## Note

L'orario è hardcoded in `js/realtime.js` (`RAW_SCHEDULE`). Per modificarlo, aggiorna l'array di oggetti con `subject`, `start`, `end`, `room`.
