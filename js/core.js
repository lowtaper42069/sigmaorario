// core.js — fondamenta condivise: costanti, stato, caricamento dei JSON,
// utility di tempo/griglia e helper di cella. Livello base importato dagli
// altri moduli (orario.js, mobile.js, main.js).

export const DAY_START = 8;
export const DAY_END = 20;
export const SLOT_MINUTES = 15;
export const SLOTS_PER_HOUR = 60 / SLOT_MINUTES;
export const TOTAL_SLOTS = (DAY_END - DAY_START) * SLOTS_PER_HOUR;
export const NOME_GIORNI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];
export const GIORNI_BREVI = ['LUN', 'MAR', 'MER', 'GIO', 'VEN'];

// Preferenza vista mobile: 'day' (default), 'grid' o 'table'. Salvata col lock attivo.
export const MOBILE_VIEW_KEY = 'mobileView';

export const SUBJECT_COLORS = [
    '#6b7f9e', '#7a8a5f', '#a8894f', '#8a7a9e', '#a0705c',
    '#7d8a72', '#6e7a85', '#9c7380', '#5f8a85', '#a3906e',
];

export const SEMESTER_START = new Date(2026, 8, 14);
export const SEMESTER_WEEKS = 20;

export const HOLIDAYS_BY_WEEKDAY = {
    1: ['20261221', '20261228', '20270104'],
    2: ['20261208', '20261222', '20261229'],
    3: ['20261223', '20261230', '20270106'],
    4: ['20261224', '20261231'],
    5: ['20261225', '20270101'],
};

// Dati caricati via fetch — modificali nei JSON, non qui:
//   orario.json  lezioni per giorno (chiavi 0–4 = lun–ven)
//   aule.json    stanza -> link dell'aula (es. accesso AUNICA).
// Ri-assegnati in loadData(); gli importatori li leggono via live binding.
export let RAW_SCHEDULE = {};
export let ROOM_LINKS = {};
export const subjectColorMap = {};
export let grid = [];

// Stato della vista "giorno" (mobile): giorno selezionato e ultimo slot mostrato.
export const DAY_VIEW = { index: null, lastSlot: null };

// isMemorized() è definita da js/theme.js (window.isMemorized, script classico
// nell'<head>, caricato prima dei moduli): la ri-esponiamo per non sparpagliare
// i riferimenti a window.
export function isMemorized() {
    return window.isMemorized ? window.isMemorized() : false;
}

// UI del lucchetto: aggiorna icona/tooltip in base allo stato di memorizzazione.
export function updateLockUI() {
    const btn = document.getElementById('settingsMemorize');
    if (!btn) return;
    const icon = btn.querySelector('i');
    const memorized = isMemorized();
    if (icon) icon.className = memorized ? 'nf nf-md-lock' : 'nf nf-md-lock_open';
    btn.title = memorized ? 'UI salvata' : 'UI automatica';
    btn.classList.toggle('locked', memorized);
}

async function loadJSON(url, fallback) {
    try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        return (data && typeof data === 'object') ? data : fallback;
    } catch (err) {
        console.error('Impossibile caricare ' + url + ':', err);
        return fallback;
    }
}

// Caricamento in parallelo: ogni file è indipendente, se manca aule.json
// si perde solo il link dell'aula e l'orario resta pieno.
export function loadData() {
    return Promise.all([
        loadJSON('orario.json', {}).then(data => { RAW_SCHEDULE = data; }),
        loadJSON('aule.json', {}).then(data => { ROOM_LINKS = data; }),
    ]);
}

function timeToSlot(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return (h - DAY_START) * SLOTS_PER_HOUR + Math.floor(m / SLOT_MINUTES);
}

function slotToTime(slot) {
    const totalMinutes = DAY_START * 60 + slot * SLOT_MINUTES;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function slotToHourLabel(slot) {
    const totalMinutes = DAY_START * 60 + slot * SLOT_MINUTES;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (m === 0) {
        return `${h.toString().padStart(2, '0')}:00`;
    }
    return `:${m.toString().padStart(2, '0')}`;
}

function minutesOf(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function pad2(n) {
    return n.toString().padStart(2, '0');
}

function icsTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return `${pad2(h)}${pad2(m)}00`;
}

function icsDate(date, timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}T${pad2(h)}${pad2(m)}00`;
}

function getSubjectColor(subject) {
    if (!subjectColorMap[subject]) {
        subjectColorMap[subject] = SUBJECT_COLORS[Object.keys(subjectColorMap).length % SUBJECT_COLORS.length];
    }
    return subjectColorMap[subject];
}

function buildGrid() {
    grid = Array.from({ length: TOTAL_SLOTS }, () => Array(5).fill(null));

    for (let day = 0; day < 5; day++) {
        const lessons = RAW_SCHEDULE[day] || [];
        for (const lesson of lessons) {
            const startSlot = timeToSlot(lesson.start);
            const endSlot = timeToSlot(lesson.end);
            const duration = endSlot - startSlot;
            for (let s = startSlot; s < endSlot; s++) {
                grid[s][day] = {
                    subject: lesson.subject,
                    room: lesson.room,
                    link: ROOM_LINKS[lesson.room] || null,
                    isFirst: s === startSlot,
                    isLast: s === endSlot - 1,
                    isOnly: duration === 1,
                    color: getSubjectColor(lesson.subject),
                };
            }
        }
    }
}

function isBrutalTheme() {
    return (document.documentElement.getAttribute('data-theme') || '').startsWith('brutal');
}

// Markup interno di una cella-lezione: materia, aula e (se presente) icona link.
function lessonCellHTML(cell) {
    return `<span class="subject-cell">${cell.subject}</span>` +
           `<span class="room-cell">${cell.room || ''}</span>` +
           (cell.link ? '<i class="nf nf-fa-external_link link-icon" aria-hidden="true"></i>' : '');
}

// Data-attribute condivisi (aula/link/materia) letti dal click delegato sulla cella.
function setCellData(td, cell) {
    if (cell.room) {
        td.dataset.room = cell.room;
        if (cell.link) td.dataset.link = cell.link;
    }
    td.dataset.subject = cell.subject;
}

function getGiornoIndex() {
    const g = new Date().getDay();
    return [-1, 0, 1, 2, 3, 4, -1][g];
}

function getCurrentSlot() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    if (h < DAY_START || h >= DAY_END) return -1;
    return (h - DAY_START) * SLOTS_PER_HOUR + Math.floor(m / SLOT_MINUTES);
}

function getLessonEndSlot(day, slot) {
    const subject = grid[slot][day]?.subject;
    let s = slot;
    while (s + 1 < TOTAL_SLOTS && grid[s + 1]?.[day]?.subject === subject) s++;
    return s;
}

export {
    timeToSlot, slotToTime, slotToHourLabel, minutesOf, pad2, icsTime, icsDate,
    getSubjectColor, buildGrid, isBrutalTheme, lessonCellHTML, setCellData,
    getGiornoIndex, getCurrentSlot, getLessonEndSlot,
};
