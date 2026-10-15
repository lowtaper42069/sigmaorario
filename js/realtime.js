const DAY_START = 8;
const DAY_END = 20;
const SLOT_MINUTES = 15;
const SLOTS_PER_HOUR = 60 / SLOT_MINUTES;
const TOTAL_SLOTS = (DAY_END - DAY_START) * SLOTS_PER_HOUR;
const NOME_GIORNI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];
const GIORNI_BREVI = ['LUN', 'MAR', 'MER', 'GIO', 'VEN'];

// Preferenza vista mobile: 'day' (default) o 'table'. Salvata solo col lock attivo.
const MOBILE_VIEW_KEY = 'mobileView';

// isMemorized() e' fornita da js/theme.js (window.isMemorized), caricato prima.

let isPrinting = false;

window.addEventListener('beforeprint', () => { isPrinting = true; });
window.addEventListener('afterprint', () => { isPrinting = false; });

function updateLockUI() {
    const btn = document.getElementById('settingsMemorize');
    if (!btn) return;
    const icon = btn.querySelector('i');
    const memorized = isMemorized();
    if (icon) icon.className = memorized ? 'nf nf-md-lock' : 'nf nf-md-lock_open';
    btn.title = memorized ? 'UI salvata' : 'UI automatica';
    btn.classList.toggle('locked', memorized);
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

function setTheme(theme) {
    if (window.applyTheme) window.applyTheme(theme);
    else document.documentElement.setAttribute('data-theme', theme);
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

document.addEventListener('DOMContentLoaded', initTheme);

const AUNICA_LINKS = {
    '2.1.4': 'https://aunicalogin.polimi.it/aunicalogin/getservizio.xml?id_servizio=343&idaula=39&lang=IT',
    '20.S.1': 'https://aunicalogin.polimi.it/aunicalogin/getservizio.xml?id_servizio=343&idaula=282&lang=IT',
    'T.1.1': 'https://aunicalogin.polimi.it/aunicalogin/getservizio.xml?id_servizio=343&idaula=53&lang=IT',
    'T.2.1': 'https://aunicalogin.polimi.it/aunicalogin/getservizio.xml?id_servizio=343&idaula=54&lang=IT',
    'T.2.3': 'https://aunicalogin.polimi.it/aunicalogin/getservizio.xml?id_servizio=343&idaula=56&lang=IT',
};

// Orario caricato da orario.json (fetch) — modificalo lì, non qui.
let RAW_SCHEDULE = {};

async function loadSchedule() {
    try {
        const res = await fetch('orario.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (data && typeof data === 'object') RAW_SCHEDULE = data;
    } catch (err) {
        console.error('Impossibile caricare orario.json:', err);
    }
}

const SUBJECT_COLORS = [
    '#6b7f9e', '#7a8a5f', '#a8894f', '#8a7a9e', '#a0705c',
    '#7d8a72', '#6e7a85', '#9c7380', '#5f8a85', '#a3906e',
];

let subjectColorMap = {};
let grid = [];

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

function slotToTimeRange(slot) {
    const start = slotToTime(slot);
    const end = slotToTime(slot + 1);
    return `${start} - ${end}`;
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
                    link: AUNICA_LINKS[lesson.room] || null,
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

function generaOrario() {
    const table = document.getElementById('scheduleTable');
    if (!table) return;

    buildGrid();

    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';

    const brutal = isBrutalTheme();

    for (let s = 0; s < TOTAL_SLOTS; s++) {
        const tr = document.createElement('tr');
        tr.dataset.slot = s;

        if (s % SLOTS_PER_HOUR === 0) {
            tr.classList.add('hour-separator');
        }

        const tdOra = document.createElement('td');
        const isHourMark = s % SLOTS_PER_HOUR === 0;
        tdOra.textContent = slotToHourLabel(s);
        tdOra.classList.add('time-col');
        if (isHourMark) tdOra.classList.add('hour-mark');
        tr.appendChild(tdOra);

        for (let day = 0; day < 5; day++) {
            const cell = grid[s][day];

            if (brutal && cell && !cell.isFirst && !cell.isOnly) {
                continue;
            }

            const td = document.createElement('td');
            td.dataset.day = day;

            if (!cell) {
                td.dataset.slot = s;
                td.textContent = '-';
                td.classList.add('empty');
            } else if (brutal) {
                const endSlot = getLessonEndSlot(day, s);
                td.rowSpan = endSlot - s + 1;
                td.dataset.startSlot = s;
                td.dataset.endSlot = endSlot;
                td.style.setProperty('--subject-color', cell.color);
                td.classList.add('block');
                td.innerHTML = lessonCellHTML(cell);
                setCellData(td, cell);
            } else {
                td.dataset.slot = s;
                td.style.setProperty('--subject-color', cell.color);
                td.classList.add('block');

                const isBlockStart = cell.isFirst || cell.isOnly;
                const isBlockEnd = cell.isLast || cell.isOnly;

                if (isBlockStart) td.classList.add('block-start');
                if (isBlockEnd) td.classList.add('block-end');
                if (!isBlockStart && !isBlockEnd) td.classList.add('block-middle');

                if (isBlockStart) {
                    td.innerHTML = lessonCellHTML(cell);
                } else {
                    td.textContent = '';
                }

                setCellData(td, cell);
            }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
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

function findNextLesson(fromDay, fromSlot) {
    let day = fromDay;
    let slot = fromSlot;
    for (let i = 0; i < 5; i++) {
        for (let s = slot; s < TOTAL_SLOTS; s++) {
            if (grid[s][day]) {
                return { day, slot: s, lesson: grid[s][day] };
            }
        }
        day = (day + 1) % 5;
        slot = 0;
    }
    return null;
}

function getLessonEndSlot(day, slot) {
    const subject = grid[slot][day]?.subject;
    let s = slot;
    while (s + 1 < TOTAL_SLOTS && grid[s + 1]?.[day]?.subject === subject) s++;
    return s;
}

function roomLink(room) {
    const href = AUNICA_LINKS[room];
    return href ? `<a href="${href}" target="_blank" rel="noopener">${room}</a>` : room;
}

function formatLessonTime(day, slot) {
    const endSlot = getLessonEndSlot(day, slot);
    return `${slotToTime(slot)} - ${slotToTime(endSlot + 1)}`;
}

function formatNextLesson(result) {
    if (!result) return 'Nessuna lezione';
    const time = formatLessonTime(result.day, result.slot);
    const room = result.lesson.room ? ` — ${roomLink(result.lesson.room)}` : '';
    const today = getGiornoIndex();
    if (result.day === today || today === -1) {
        return `${result.lesson.subject} (${time}${room})`;
    }
    return `${result.lesson.subject} (${NOME_GIORNI[result.day]} ${time}${room})`;
}

function aggiornaInfo() {
    const oraEl = document.getElementById('currentTime');
    const giornoEl = document.getElementById('currentDay');
    const lezEl = document.getElementById('currentLesson');
    const proxEl = document.getElementById('nextLesson');

    if (!oraEl) return;

    const now = new Date();
    oraEl.textContent = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    giornoEl.textContent = now.toLocaleDateString('it-IT', { weekday: 'long' });

    const idxG = getGiornoIndex();
    const currentSlot = getCurrentSlot();

    updateCurrentSlotIndicator(currentSlot);

    // Vista giorno (mobile): si ridisegna solo quando cambia lo slot
    if (DAY_VIEW.index !== null && currentSlot !== DAY_VIEW.lastSlot) {
        DAY_VIEW.lastSlot = currentSlot;
        renderDayView();
    }

    if (idxG === -1) {
        lezEl.textContent = '-';
        const next = findNextLesson(0, 0);
        proxEl.innerHTML = formatNextLesson(next);
        return;
    }

    if (currentSlot === -1) {
        lezEl.textContent = '-';
        const next = now.getHours() < DAY_START
            ? findNextLesson(idxG, 0)
            : findNextLesson((idxG + 1) % 5, 0);
        proxEl.innerHTML = formatNextLesson(next);
        return;
    }

    const current = grid[currentSlot]?.[idxG];

    if (current) {
        const time = formatLessonTime(idxG, currentSlot);
        lezEl.innerHTML = current.room
            ? `${current.subject} (${time} — ${roomLink(current.room)})`
            : `${current.subject} (${time})`;
        const next = findNextLesson(idxG, currentSlot + 1);
        proxEl.innerHTML = formatNextLesson(next);
    } else {
        lezEl.textContent = '-';
        const next = findNextLesson(idxG, currentSlot);
        proxEl.innerHTML = formatNextLesson(next);
    }
}

function updateCurrentSlotIndicator(currentSlot) {
    document.querySelectorAll('td.current-cell').forEach(td => td.classList.remove('current-cell'));
    if (currentSlot >= 0 && currentSlot < TOTAL_SLOTS) {
        const idxG = getGiornoIndex();
        if (idxG === -1) return;
        const lessonCells = document.querySelectorAll(`#scheduleTable tbody td[data-day="${idxG}"][data-start-slot]`);
        for (const cell of lessonCells) {
            const start = Number(cell.dataset.startSlot);
            const end = Number(cell.dataset.endSlot);
            if (currentSlot >= start && currentSlot <= end) {
                cell.classList.add('current-cell');
                return;
            }
        }
        const row = document.querySelector(`#scheduleTable tbody tr[data-slot="${currentSlot}"]`);
        if (row) {
            const cell = row.querySelector(`td[data-day="${idxG}"]`);
            if (cell) cell.classList.add('current-cell');
        }
    }
}

function getViewportFingerprint() {
    return window.innerWidth + 'x' + window.innerHeight;
}

function initDensity() {
    const slider = document.getElementById('densitySlider');
    const toggle = document.getElementById('settingsMemorize');
    if (!slider) return;

    const memorized = isMemorized();
    const savedDensity = localStorage.getItem('density');
    const savedViewport = localStorage.getItem('densityViewport');
    const currentViewport = getViewportFingerprint();

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            let value;
            if (memorized && savedDensity !== null && savedViewport === currentViewport) {
                value = parseInt(savedDensity, 10);
            } else {
                value = calcFitDensity();
            }
            slider.value = value;
            applyDensity(value);
            if (memorized) saveDensity(value);
        });
    });

    slider.addEventListener('input', function () {
        applyDensity(this.value);
        if (isMemorized()) saveDensity(this.value);
    });

    const setDensity = (v) => {
        slider.value = v;
        applyDensity(v);
        if (isMemorized()) saveDensity(v);
    };
    const minIcon = document.querySelector('.density-control .nf-fa-minus');
    const maxIcon = document.querySelector('.density-control .nf-fa-plus');
    if (minIcon) minIcon.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); setDensity(slider.min); });
    if (maxIcon) maxIcon.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); setDensity(slider.max); });

    if (toggle) {
        toggle.addEventListener('click', function () {
            const next = !isMemorized();
            if (next) {
                localStorage.setItem('settingsMemorize', '1');
                saveDensity(slider.value);
                localStorage.setItem('theme', document.documentElement.getAttribute('data-theme') || 'dark');
                localStorage.setItem(MOBILE_VIEW_KEY, currentLayout());
            } else {
                localStorage.removeItem('settingsMemorize');
                // FEATURE VOLUTA: unlock cancella anche il tema scelto.
                localStorage.removeItem('theme');
                localStorage.removeItem('density');
                localStorage.removeItem('densityViewport');
                localStorage.removeItem(MOBILE_VIEW_KEY);
            }
            updateLockUI();
        });
    }
}

function saveDensity(value) {
    localStorage.setItem('density', value);
    localStorage.setItem('densityViewport', getViewportFingerprint());
}

function calcFitDensity() {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const padY = 0.4 * rem;
    const border = 1;

    const tableWrapper = document.querySelector('.table-wrapper');
    const tableEl = document.getElementById('scheduleTable');
    if (!tableWrapper || !tableEl) return 50;

    const wrapperRect = tableWrapper.getBoundingClientRect();
    const theadRect = tableEl.querySelector('thead')?.getBoundingClientRect();
    const theadHeight = theadRect ? theadRect.height : 0;

    const topSpace = wrapperRect.top + theadHeight;

    const bottomElements = ['.current-info', '.legend', '.actions-bar', 'footer'];
    let bottomHeight = 0;
    for (const sel of bottomElements) {
        const el = document.querySelector(sel);
        if (el) {
            const r = el.getBoundingClientRect();
            bottomHeight += r.height;
            const style = getComputedStyle(el);
            bottomHeight += parseFloat(style.marginTop) + parseFloat(style.marginBottom);
        }
    }

    const availableForTableBody = window.innerHeight - topSpace - bottomHeight - 4;

    const rowHeightMin = (0.6 * 1.0 * rem) + padY + border;
    const rowHeightMax = (0.6 * 2.5 * rem) + padY + border;
    const tableMin = TOTAL_SLOTS * rowHeightMin;
    const tableMax = TOTAL_SLOTS * rowHeightMax;

    const clamped = Math.max(tableMin, Math.min(tableMax, availableForTableBody));
    const lh = ((clamped / TOTAL_SLOTS) - padY - border) / (0.6 * rem);
    const clampedLH = Math.max(1.0, Math.min(2.5, lh));
    return Math.round(((clampedLH - 1.0) / (2.5 - 1.0)) * 100);
}

function applyDensity(value) {
    const minLH = 1.0;
    const maxLH = 2.5;
    const lh = minLH + (maxLH - minLH) * (value / 100);
    document.documentElement.style.setProperty('--row-line-height', lh);
}

function showToday() {
    const today = new Date().getDay();
    if (today === 0 || today === 6) return;

    const isHighlighted = document.querySelector('#scheduleTable th.today-highlight');
    if (isHighlighted) return;

    const dayIndex = getGiornoIndex();
    if (dayIndex === -1) return;

    const header = document.querySelector('#scheduleTable thead tr');
    if (header && header.children[dayIndex + 1]) {
        header.children[dayIndex + 1].classList.add('today-highlight');
    }
}

// opts.live = true → ricerca mentre si scrive: niente alert, niente scroll forzato
function searchMateria(opts) {
    const live = !!(opts && opts.live);
    const query = document.getElementById('searchMateria').value.trim().toLowerCase();

    const isHighlighted = document.querySelector('#scheduleTable td.search-highlight');

    if (isHighlighted) {
        document.querySelectorAll('#scheduleTable td.search-highlight').forEach(cell => {
            cell.classList.remove('search-highlight');
        });
    }

    if (!query) return;

    const cells = document.querySelectorAll('#scheduleTable td[data-subject]');
    const matchedSubjects = new Set();
    let found = false;

    cells.forEach(cell => {
        const text = cell.textContent.toLowerCase();
        if (text.includes(query)) {
            matchedSubjects.add(cell.dataset.subject);
            found = true;
        }
    });

    if (found) {
        document.querySelectorAll('#scheduleTable td[data-subject]').forEach(cell => {
            if (matchedSubjects.has(cell.dataset.subject)) {
                cell.classList.add('search-highlight');
            }
        });
        if (!live) {
            const firstMatch = document.querySelector('#scheduleTable td.search-highlight');
            if (firstMatch) firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else if (!live) {
        alert('Nessuna materia trovata');
    }
}

function resetView() {
    document.querySelectorAll('#scheduleTable td.search-highlight').forEach(cell => {
        cell.classList.remove('search-highlight');
    });
    const searchInput = document.getElementById('searchMateria');
    if (searchInput) searchInput.value = '';
    showToday();
}

/* ------------------------------------------------------------------ */
/* Vista "giorno" (mobile): una giornata per volta, swipe per cambiare  */
/* ------------------------------------------------------------------ */

const DAY_VIEW = { index: null, lastSlot: null };

function minutesOf(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function isLessonNow(lesson) {
    if (DAY_VIEW.index !== getGiornoIndex()) return false;
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    return mins >= minutesOf(lesson.start) && mins < minutesOf(lesson.end);
}

// Vista giorno "lista": le lezioni in ordine di orario
function renderDayList(body, lessons) {
    lessons.forEach(lesson => {
        const current = isLessonNow(lesson);
        const room = lesson.room
            ? (AUNICA_LINKS[lesson.room]
                ? `<a href="${AUNICA_LINKS[lesson.room]}" target="_blank" rel="noopener">${lesson.room}</a>`
                : lesson.room)
            : '';
        const meta = [room, current ? 'in corso' : ''].filter(Boolean).join(' · ');

        const row = document.createElement('div');
        row.className = 'day-lesson' + (current ? ' is-current' : '');
        row.style.setProperty('--subject-color', getSubjectColor(lesson.subject));
        row.innerHTML =
            `<div class="dl-time">${lesson.start}<span class="dl-time-end">${lesson.end}</span></div>` +
            `<div><div class="dl-subject">${lesson.subject}</div>` +
            (meta ? `<div class="dl-meta">${meta}</div>` : '') +
            `</div>`;
        body.appendChild(row);
    });
}

// Vista giorno "tabella": la giornata come griglia oraria, coi blocchi delle lezioni
function renderDayGrid(body, idx, lessons) {
    const brutal = isBrutalTheme();

    // slot occupati dalla lezione in corso (per evidenziarli)
    const nowSlots = new Set();
    lessons.forEach(l => {
        if (!isLessonNow(l)) return;
        for (let s = timeToSlot(l.start); s < timeToSlot(l.end); s++) nowSlots.add(s);
    });

    // tutta la giornata (08:00–20:00), anche se rimane lunga
    const from = 0;
    const to = TOTAL_SLOTS - 1;

    const table = document.createElement('table');
    table.className = 'day-table';
    // larghezze esplicite: con table-layout:fixed le colonne sono prevedibili
    const colgroup = document.createElement('colgroup');
    const colOra = document.createElement('col');
    colOra.style.width = '20%';
    const colGiorno = document.createElement('col');
    colGiorno.style.width = '80%';
    colgroup.appendChild(colOra);
    colgroup.appendChild(colGiorno);
    table.appendChild(colgroup);
    const tbody = document.createElement('tbody');

    for (let s = from; s <= to; s++) {
        const tr = document.createElement('tr');
        if (s % SLOTS_PER_HOUR === 0) tr.classList.add('hour-separator');

        const tdOra = document.createElement('td');
        tdOra.className = 'time-col' + (s % SLOTS_PER_HOUR === 0 ? ' hour-mark' : '');
        tdOra.textContent = slotToHourLabel(s);
        tr.appendChild(tdOra);

        const cell = grid[s] ? grid[s][idx] : null;

        // nei temi brutal la cella è coperta dal rowSpan del blocco iniziato sopra
        if (brutal && cell && !cell.isFirst && !cell.isOnly) {
            tbody.appendChild(tr);
            continue;
        }

        const td = document.createElement('td');
        td.dataset.day = idx;

        if (!cell) {
            td.classList.add('empty');
            td.textContent = '-';
        } else if (brutal) {
            const endSlot = getLessonEndSlot(idx, s);
            td.rowSpan = endSlot - s + 1;
            td.style.setProperty('--subject-color', cell.color);
            td.classList.add('block');
            if (nowSlots.has(s)) td.classList.add('is-now');
            td.innerHTML = lessonCellHTML(cell);
            setCellData(td, cell);
        } else {
            td.style.setProperty('--subject-color', cell.color);
            td.classList.add('block');

            const isStart = cell.isFirst || cell.isOnly;
            const isEnd = cell.isLast || cell.isOnly;
            if (isStart) td.classList.add('block-start');
            if (isEnd) td.classList.add('block-end');
            if (!isStart && !isEnd) td.classList.add('block-middle');
            if (nowSlots.has(s)) td.classList.add('is-now');

            if (isStart) {
                td.innerHTML = lessonCellHTML(cell);
            }
            setCellData(td, cell);
        }

        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    body.appendChild(table);
}

function renderDayView(dir) {
    const body = document.getElementById('dayBody');
    if (!body) return;

    if (DAY_VIEW.index === null) {
        const today = getGiornoIndex();
        DAY_VIEW.index = today === -1 ? 0 : today;
    }
    const idx = DAY_VIEW.index;

    const title = document.getElementById('dayTitle');
    if (title) title.textContent = NOME_GIORNI[idx];

    const lessons = (RAW_SCHEDULE[idx] || [])
        .slice()
        .sort((a, b) => minutesOf(a.start) - minutesOf(b.start));

    body.innerHTML = '';

    if (!lessons.length) {
        const empty = document.createElement('div');
        empty.className = 'day-empty';
        empty.textContent = 'Nessuna lezione';
        body.appendChild(empty);
    } else if (currentLayout() === 'grid') {
        renderDayGrid(body, idx, lessons);
    } else {
        renderDayList(body, lessons);
    }

    const dots = document.getElementById('dayDots');
    if (dots) {
        dots.innerHTML = '';
        NOME_GIORNI.forEach((nome, i) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'day-dot' + (i === idx ? ' active' : '');
            dot.setAttribute('aria-label', nome);
            if (i === idx) dot.setAttribute('aria-current', 'true');
            dot.innerHTML = '<span class="day-dot-mark"></span>' +
                            '<span class="day-dot-label">' + GIORNI_BREVI[i] + '</span>';
            dot.addEventListener('click', () => gotoDayIndex(i));
            dots.appendChild(dot);
        });
    }

    if (dir) {
        body.classList.remove('from-right', 'from-left');
        void body.offsetWidth;   // reflow: riavvia l'animazione
        body.classList.add(dir > 0 ? 'from-right' : 'from-left');
    }
}

function gotoDay(delta) {
    if (DAY_VIEW.index === null) DAY_VIEW.index = 0;
    const n = NOME_GIORNI.length;
    DAY_VIEW.index = (DAY_VIEW.index + delta + n) % n;
    renderDayView(delta);
}

// Vai a un giorno preciso scegliendo la direzione più breve per l'animazione
function gotoDayIndex(index) {
    const n = NOME_GIORNI.length;
    const from = DAY_VIEW.index === null ? 0 : DAY_VIEW.index;
    if (index === from) return;
    const forward = (index - from + n) % n;
    DAY_VIEW.index = index;
    renderDayView(forward <= n / 2 ? 1 : -1);
}

function initDayView() {
    const root = document.getElementById('dayView');
    if (!root) return;

    const prev = document.getElementById('dayPrev');
    const next = document.getElementById('dayNext');
    if (prev) prev.onclick = () => gotoDay(-1);
    if (next) next.onclick = () => gotoDay(1);

    // Swipe orizzontale: verso sinistra = giorno dopo, verso destra = giorno prima
    let x0 = null;
    let y0 = null;
    root.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        x0 = e.touches[0].clientX;
        y0 = e.touches[0].clientY;
    }, { passive: true });
    root.addEventListener('touchend', (e) => {
        if (x0 === null) return;
        const t = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]);
        if (!t) { x0 = null; return; }
        const dx = t.clientX - x0;
        const dy = t.clientY - y0;
        x0 = null;
        if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
        gotoDay(dx < 0 ? 1 : -1);
    }, { passive: true });

    renderDayView();
    DAY_VIEW.lastSlot = getCurrentSlot();
}

/* ------------------------------------------------------------------ */
/* Vista mobile: giorno (default) / giorno tabella / tabella piena      */
/* La scelta è salvata col lock (chiave 'mobileView').                  */
/* ------------------------------------------------------------------ */

const LAYOUTS = ['day', 'grid', 'table'];
const LAYOUT_LABEL = { day: 'giorno', grid: 'giorno tabella', table: 'tabella' };
const LAYOUT_ICON  = { day: 'nf-fa-th_list', grid: 'nf-fa-calendar_day', table: 'nf-fa-table' };

function currentLayout() {
    if (document.body.classList.contains('mobile-table')) return 'table';
    if (document.body.classList.contains('mobile-grid')) return 'grid';
    return 'day';
}

function savedLayout() {
    // FEATURE VOLUTA (come tema e densità): letto/salvato solo col lock attivo.
    if (!isMemorized()) return 'day';
    const saved = localStorage.getItem(MOBILE_VIEW_KEY);
    return LAYOUTS.indexOf(saved) === -1 ? 'day' : saved;
}

function nextLayout(pref) {
    return LAYOUTS[(LAYOUTS.indexOf(pref) + 1) % LAYOUTS.length];
}

function applyLayout(pref) {
    document.body.classList.toggle('mobile-table', pref === 'table');
    document.body.classList.toggle('mobile-grid', pref === 'grid');

    const btn = document.getElementById('layoutToggle');
    if (btn) {
        // il pulsante mostra la vista di destinazione
        const next = nextLayout(pref);
        const icon = btn.querySelector('i');
        if (icon) icon.className = 'nf ' + LAYOUT_ICON[next];
        const label = 'Vista ' + LAYOUT_LABEL[pref] + ' — clicca per: ' + LAYOUT_LABEL[next];
        btn.title = label;
        btn.setAttribute('aria-label', label);
    }

    // la vista "giorno" cambia corpo (lista o tabella oraria) → ridisegna
    if (document.getElementById('dayBody')) renderDayView();
}

function initLayout() {
    applyLayout(savedLayout());

    const btn = document.getElementById('layoutToggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
        const next = nextLayout(currentLayout());
        applyLayout(next);
        if (isMemorized()) localStorage.setItem(MOBILE_VIEW_KEY, next);
    });
}

const SEMESTER_START = new Date(2026, 8, 14);
const SEMESTER_WEEKS = 20;

const HOLIDAYS_BY_WEEKDAY = {
    1: ['20261221', '20261228', '20270104'],
    2: ['20261208', '20261222', '20261229'],
    3: ['20261223', '20261230', '20270106'],
    4: ['20261224', '20261231'],
    5: ['20261225', '20270101'],
};

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

function exportSchedule() {
    const dtstamp = '20260901T000000Z';
    let uidCounter = 0;
    const events = [];

    for (const dayKey of Object.keys(RAW_SCHEDULE)) {
        const day = Number(dayKey);
        for (const lesson of RAW_SCHEDULE[day]) {
            const date = new Date(SEMESTER_START);
            date.setDate(date.getDate() + day);
            uidCounter++;

            const exDates = []
                .concat(HOLIDAYS_BY_WEEKDAY[day + 1] || [])
                .map(d => `${d}T${icsTime(lesson.start)}`)
                .join(',');

            events.push([
                'BEGIN:VEVENT',
                `DTSTAMP:${dtstamp}`,
                `DTSTART:${icsDate(date, lesson.start)}`,
                `DTEND:${icsDate(date, lesson.end)}`,
                `RRULE:FREQ=WEEKLY;COUNT=${SEMESTER_WEEKS}`,
                `EXDATE:${exDates}`,
                `SUMMARY:${lesson.subject}`,
                `LOCATION:${lesson.room}`,
                `UID:sigmaorario-e${uidCounter}@sigmaorario`,
                'END:VEVENT',
            ].join('\r\n'));
        }
    }

    const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//SigmaOrario//IT',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Orario 5BINF',
        'X-WR-TIMEZONE:Europe/Rome',
        ...events,
        'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'orario_5binf.ics';
    a.click();
}

function printSchedule() {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    window.print();
    document.documentElement.setAttribute('data-theme', theme);
}

document.addEventListener('DOMContentLoaded', async function () {
    if (document.getElementById('scheduleTable')) {
        await loadSchedule();
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

    document.getElementById('scheduleTable')?.addEventListener('click', function (e) {
        const td = e.target.closest('td[data-link]');
        if (td) {
            window.open(td.dataset.link, '_blank');
        }
    });

    initDensity();
});