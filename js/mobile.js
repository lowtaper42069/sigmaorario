// mobile.js — vista "giorno" (lista o griglia oraria) con swipe e gestione del
// layout mobile a tre viste (giorno / giorno tabella / tabella piena).

import {
    TOTAL_SLOTS, SLOTS_PER_HOUR, NOME_GIORNI, GIORNI_BREVI, MOBILE_VIEW_KEY,
    ROOM_LINKS, RAW_SCHEDULE, grid, DAY_VIEW, isMemorized,
    getSubjectColor, getLessonEndSlot, getGiornoIndex, getCurrentSlot,
    isBrutalTheme, lessonCellHTML, setCellData, slotToHourLabel, timeToSlot,
    minutesOf,
} from './core.js';

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
            ? (ROOM_LINKS[lesson.room]
                ? `<a href="${ROOM_LINKS[lesson.room]}" target="_blank" rel="noopener">${lesson.room}</a>`
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
    // larghezze esplicite: con table-layout:fixed le colonne sono prevedibili.
    // Sono in styles/schedule.css (con override per gli schermi stretti, dove la
    // colonna ore deve allargarsi per non troncare "08:00" in "08:...").
    const colgroup = document.createElement('colgroup');
    const colOra = document.createElement('col');
    colOra.className = 'col-ora';
    const colGiorno = document.createElement('col');
    colGiorno.className = 'col-giorno';
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

    // La vista "griglia" mostra sempre la giornata completa: anche un giorno
    // libero (es. martedì) rende la tabella vuota con tutte le celle "-".
    if (currentLayout() === 'grid') {
        renderDayGrid(body, idx, lessons);
    } else if (!lessons.length) {
        const empty = document.createElement('div');
        empty.className = 'day-empty';
        empty.textContent = 'Nessuna lezione';
        body.appendChild(empty);
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
const LAYOUT_LABEL = { day: 'Giorno', grid: 'Giorno tabella', table: 'Tabella piena' };
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

function applyLayout(pref) {
    document.body.classList.toggle('mobile-table', pref === 'table');
    document.body.classList.toggle('mobile-grid', pref === 'grid');
    refreshViewOptions();

    // la vista "giorno" cambia corpo (lista o tabella oraria) → ridisegna
    if (document.getElementById('dayBody')) renderDayView();
}

// Il selettore della vista (nel pannello impostazioni) mostra le 3 opzioni libere
function refreshViewOptions() {
    const box = document.getElementById('viewOptions');
    if (!box) return;
    const cur = currentLayout();
    box.querySelectorAll('.view-option').forEach(opt => {
        opt.setAttribute('aria-checked', opt.dataset.value === cur ? 'true' : 'false');
    });
}

function initLayout() {
    const box = document.getElementById('viewOptions');
    if (box) {
        LAYOUTS.forEach(value => {
            const opt = document.createElement('button');
            opt.type = 'button';
            opt.className = 'pick-option view-option';
            opt.setAttribute('role', 'menuitemradio');
            opt.dataset.value = value;
            opt.innerHTML = '<i class="nf ' + LAYOUT_ICON[value] + '" aria-hidden="true"></i>' +
                            '<span class="pick-option-label">' + LAYOUT_LABEL[value] + '</span>';
            opt.addEventListener('click', () => {
                applyLayout(value);
                if (isMemorized()) localStorage.setItem(MOBILE_VIEW_KEY, value);
            });
            box.appendChild(opt);
        });
    }

    applyLayout(savedLayout());
}

export { renderDayView, initDayView, initLayout, currentLayout };
