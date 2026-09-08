const DAY_START = 8;
const DAY_END = 20;
const SLOT_MINUTES = 15;
const SLOTS_PER_HOUR = 60 / SLOT_MINUTES;
const TOTAL_SLOTS = (DAY_END - DAY_START) * SLOTS_PER_HOUR;
const NOME_GIORNI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];

function isMemorized() {
    return localStorage.getItem('settingsMemorize') === '1';
}

function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function updateLockUI() {
    const btn = document.getElementById('settingsMemorize');
    if (!btn) return;
    const icon = btn.querySelector('i');
    const memorized = isMemorized();
    if (icon) icon.className = memorized ? 'fas fa-lock' : 'fas fa-lock-open';
    btn.title = memorized ? 'Impostazioni bloccate (clicca per sbloccare)' : 'Le impostazioni seguono il sistema';
    btn.classList.toggle('locked', memorized);
}

function initTheme() {
    const memorized = isMemorized();
    const saved = memorized ? localStorage.getItem('theme') : null;
    const theme = saved || getSystemTheme();
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
    updateLockUI();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!isMemorized()) {
            const next = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', next);
            updateThemeIcon(next);
        }
    });
}

function updateThemeIcon(theme) {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    const icon = toggle.querySelector('i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    updateThemeIcon(next);
    if (isMemorized()) {
        localStorage.setItem('theme', next);
    }
}

document.addEventListener('DOMContentLoaded', initTheme);

const AUNICA_LINKS = {
    '2.1.4': 'https://aunicalogin.polimi.it/aunicalogin/getservizio.xml?id_servizio=343&idaula=39&lang=IT',
    '20.S.1': 'https://aunicalogin.polimi.it/aunicalogin/getservizio.xml?id_servizio=343&idaula=282&lang=IT',
    'T.1.1': 'https://aunicalogin.polimi.it/aunicalogin/getservizio.xml?id_servizio=343&idaula=53&lang=IT',
    'T.2.1': 'https://aunicalogin.polimi.it/aunicalogin/getservizio.xml?id_servizio=343&idaula=54&lang=IT',
    'T.2.3': 'https://aunicalogin.polimi.it/aunicalogin/getservizio.xml?id_servizio=343&idaula=56&lang=IT',
};

const RAW_SCHEDULE = {
    0: [
        { subject: 'FONDAMENTI DI INFORMATICA', start: '13:15', end: '16:15', room: '2.1.4' },
        { subject: 'ANALISI MATEMATICA 1', start: '16:15', end: '19:15', room: '2.1.4' },
    ],
    1: [],
    2: [
        { subject: 'FONDAMENTI DI INFORMATICA', start: '8:15', end: '10:15', room: '20.S.1' },
        { subject: 'ANALISI MATEMATICA 1', start: '10:15', end: '13:15', room: '20.S.1' },
        { subject: 'GEOMETRIA E ALGEBRA LINEARE', start: '15:15', end: '17:15', room: 'T.2.3' },
    ],
    3: [
        { subject: 'GEOMETRIA E ALGEBRA LINEARE', start: '8:15', end: '10:15', room: 'T.1.1' },
        { subject: 'FONDAMENTI DI INFORMATICA', start: '10:15', end: '13:15', room: 'T.1.1' },
        { subject: 'FONDAMENTI DI INFORMATICA', start: '14:15', end: '18:15', room: 'T.2.1' },
    ],
    4: [
        { subject: 'ANALISI MATEMATICA 1', start: '13:15', end: '15:15', room: 'T.2.3' },
        { subject: 'GEOMETRIA E ALGEBRA LINEARE', start: '15:15', end: '18:15', room: 'T.2.3' },
    ],
};

const SUBJECT_COLORS = [
    '#8b8fff', '#7dd37d', '#ffc86b', '#ff8a8a', '#c0aaff',
    '#f4a1d0', '#6beeff', '#c8e87d', '#ffb87a', '#7de0d8',
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

function generaOrario() {
    const table = document.getElementById('scheduleTable');
    if (!table) return;

    buildGrid();

    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';

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
            const td = document.createElement('td');
            td.dataset.day = day;
            td.dataset.slot = s;

            if (!cell) {
                td.textContent = '-';
                td.classList.add('empty');
            } else {
                td.style.setProperty('--subject-color', cell.color);
                td.classList.add('block');

                const isBlockStart = cell.isFirst || cell.isOnly;
                const isBlockEnd = cell.isLast || cell.isOnly;

                if (isBlockStart) td.classList.add('block-start');
                if (isBlockEnd) td.classList.add('block-end');
                if (!isBlockStart && !isBlockEnd) td.classList.add('block-middle');

                if (isBlockStart) {
                    td.innerHTML = `
                        <span class="subject-cell">${cell.subject}</span>
                        <span class="room-cell">${cell.room || ''}</span>
                        ${cell.link ? '<span class="link-icon" aria-hidden="true">↗</span>' : ''}
                    `;
                } else {
                    td.textContent = '';
                }

                if (cell.room) {
                    td.dataset.room = cell.room;
                    if (cell.link) {
                        td.dataset.link = cell.link;
                    }
                }
                td.dataset.subject = cell.subject;
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

function formatLessonTime(day, slot) {
    const endSlot = getLessonEndSlot(day, slot);
    return `${slotToTime(slot)} - ${slotToTime(endSlot + 1)}`;
}

function formatNextLesson(result) {
    if (!result) return 'Nessuna lezione';
    const time = formatLessonTime(result.day, result.slot);
    const today = getGiornoIndex();
    if (result.day === today || today === -1) {
        return `${result.lesson.subject} (${time})`;
    }
    return `${result.lesson.subject} (${NOME_GIORNI[result.day]} ${time})`;
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

    if (idxG === -1) {
        lezEl.textContent = '-';
        const next = findNextLesson(0, 0);
        proxEl.textContent = formatNextLesson(next);
        return;
    }

    if (currentSlot === -1) {
        lezEl.textContent = '-';
        const next = now.getHours() < DAY_START
            ? findNextLesson(idxG, 0)
            : findNextLesson((idxG + 1) % 5, 0);
        proxEl.textContent = formatNextLesson(next);
        return;
    }

    const current = grid[currentSlot]?.[idxG];

    if (current) {
        const time = formatLessonTime(idxG, currentSlot);
        lezEl.textContent = current.room
            ? `${current.subject} (${time} — ${current.room})`
            : `${current.subject} (${time})`;
        const next = findNextLesson(idxG, currentSlot + 1);
        proxEl.textContent = formatNextLesson(next);
    } else {
        lezEl.textContent = '-';
        const next = findNextLesson(idxG, currentSlot);
        proxEl.textContent = formatNextLesson(next);
    }
}

function updateCurrentSlotIndicator(currentSlot) {
    document.querySelectorAll('td.current-cell').forEach(td => td.classList.remove('current-cell'));
    if (currentSlot >= 0 && currentSlot < TOTAL_SLOTS) {
        const idxG = getGiornoIndex();
        if (idxG === -1) return;
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

    if (toggle) {
        toggle.addEventListener('click', function () {
            const next = !isMemorized();
            if (next) {
                localStorage.setItem('settingsMemorize', '1');
                saveDensity(slider.value);
                localStorage.setItem('theme', document.documentElement.getAttribute('data-theme') || 'dark');
            } else {
                localStorage.removeItem('settingsMemorize');
                localStorage.removeItem('theme');
                localStorage.removeItem('density');
                localStorage.removeItem('densityViewport');
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
    const padY = 0.3 * rem;
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

function toggleLabs() {
    const cells = document.querySelectorAll('#scheduleTable td.lab');
    const isActive = document.querySelector('#scheduleTable td.lab.lab-highlight') !== null;
    cells.forEach(cell => {
        if (isActive) {
            cell.classList.remove('lab-highlight');
        } else {
            cell.classList.add('lab-highlight');
        }
    });
}

function searchMateria() {
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
        const firstMatch = document.querySelector('#scheduleTable td.search-highlight');
        if (firstMatch) firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        alert('Nessuna materia trovata');
    }
}

function resetView() {
    document.querySelectorAll('#scheduleTable td.search-highlight').forEach(cell => {
        cell.classList.remove('search-highlight');
    });
    document.querySelectorAll('td.lab').forEach(cell => {
        cell.classList.remove('lab-highlight');
    });
    const searchInput = document.getElementById('searchMateria');
    if (searchInput) searchInput.value = '';
    showToday();
}

function exportSchedule() {
    let csv = [];
    document.querySelectorAll('#scheduleTable tr').forEach(row => {
        const rowData = [];
        row.querySelectorAll('th, td').forEach(cell => {
            rowData.push(cell.textContent.trim());
        });
        csv.push(rowData.join(','));
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'orario_5binf.csv';
    a.click();
}

function printSchedule() {
    window.print();
}

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('scheduleTable')) {
        generaOrario();
        showToday();
        aggiornaInfo();
        setInterval(aggiornaInfo, 1000);
    }

    const searchInput = document.getElementById('searchMateria');
    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                searchMateria();
            }
        });
    }

    document.getElementById('scheduleTable')?.addEventListener('click', function (e) {
        const td = e.target.closest('td[data-link]');
        if (td) {
            window.open(td.dataset.link, '_blank');
        }
    });

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    initDensity();
});