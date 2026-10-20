// main.js — bootstrap della pagina orario: glue tema/lucchetto, pannello
// impostazioni, wiring del DOM ed eventi. Unico entry point di index.html.

import { loadData, isMemorized, updateLockUI } from './core.js';
import {
    generaOrario, aggiornaInfo, showToday, searchMateria, resetView,
    initDensity, exportSchedule, printSchedule,
} from './orario.js';
import { renderDayView, initDayView, initLayout } from './mobile.js';

let isPrinting = false;

window.addEventListener('beforeprint', () => { isPrinting = true; });
window.addEventListener('afterprint', () => { isPrinting = false; });

function setTheme(theme) {
    if (window.applyTheme) window.applyTheme(theme);
    else document.documentElement.setAttribute('data-theme', theme);
}

function initTheme() {
    // Il tema iniziale è già applicato da js/theme.js (nell'<head>), che garantisce
    // sempre un data-theme valido (bootstrap). Qui: UI del lock + aggiornamento live
    // dal tema di sistema.
    // FEATURE VOLUTA (NON "FIXARE"): tema letto SOLO con lock attivo.
    updateLockUI();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!isMemorized() && !isPrinting) {
            const current = document.documentElement.getAttribute('data-theme');
            if (current !== 'dark' && current !== 'light') return;
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

// Il cambio tema (dal selettore in js/theme.js) richiede di ridisegnare la
// griglia: il tema brutal usa rowSpan, quindi la struttura delle celle cambia.
document.addEventListener('themechange', () => {
    if (document.getElementById('scheduleTable')) {
        generaOrario();
        showToday();
    }
    // Vista giorno (mobile): anche lei dipende dal tema (i brutal usano rowSpan).
    if (document.getElementById('dayBody')) renderDayView();
});

// (initTheme è richiamata dal bootstrap più sotto, insieme al resto della UI.)

// Mobile: i controlli dell'header vivono in un pannello laterale che resta
// aperto finché non lo si chiude (X, backdrop, Esc).
function initControlsMenu() {
    const toggle = document.getElementById('controlsToggle');
    const panel = document.getElementById('controlsPanel');
    const closeBtn = document.getElementById('controlsClose');
    const backdrop = document.getElementById('controlsBackdrop');
    if (!toggle || !panel) return;

    const isOpen = () => document.body.classList.contains('controls-open');
    let closing = null;
    const setOpen = (open) => {
        clearTimeout(closing);
        document.body.classList.remove('controls-closing');
        if (!open && isOpen()) {
            // animazione di uscita prima di nascondere il pannello
            document.body.classList.add('controls-closing');
            closing = setTimeout(() => document.body.classList.remove('controls-closing'), 160);
        }
        document.body.classList.toggle('controls-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        setOpen(!isOpen());
    });

    if (closeBtn) closeBtn.addEventListener('click', () => { setOpen(false); toggle.focus(); });
    if (backdrop) backdrop.addEventListener('click', () => setOpen(false));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen()) {
            setOpen(false);
            toggle.focus();
        }
    });
}

document.addEventListener('DOMContentLoaded', async function () {
    initTheme();

    if (document.getElementById('scheduleTable')) {
        await loadData();
        generaOrario();
        showToday();
        initDayView();
        initLayout();
        aggiornaInfo();
        setInterval(aggiornaInfo, 1000);
    }

    const searchInput = document.getElementById('searchMateria');
    if (searchInput) {
        let searchTimer = null;
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                clearTimeout(searchTimer);
                searchMateria();
            }
        });
        // Ricerca mentre si scrive (debounce): niente alert, niente scroll forzato
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function () { searchMateria({ live: true }); }, 200);
        });
    }

    // Celle con link (aula): in tabella e nella vista giorno il tap/click
    // apre il link della stanza — stesso handler, contenitori diversi.
    const openRoomLink = (e) => {
        const td = e.target.closest('td[data-link]');
        if (td) window.open(td.dataset.link, '_blank', 'noopener,noreferrer');
    };
    document.getElementById('scheduleTable')?.addEventListener('click', openRoomLink);
    document.getElementById('dayBody')?.addEventListener('click', openRoomLink);

    document.getElementById('exportBtn')?.addEventListener('click', exportSchedule);
    document.getElementById('printBtn')?.addEventListener('click', printSchedule);
    document.getElementById('resetBtn')?.addEventListener('click', resetView);
    document.getElementById('searchBtn')?.addEventListener('click', () => searchMateria());

    initDensity();
    initControlsMenu();
});
