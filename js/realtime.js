const DAY_START = 8;
const DAY_END = 20;
const SLOT_MINUTES = 15;
const SLOTS_PER_HOUR = 60 / SLOT_MINUTES;
const TOTAL_SLOTS = (DAY_END - DAY_START) * SLOTS_PER_HOUR;
const NOME_GIORNI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];

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
        { subject: 'FONDAMENTI DI INFORMATICA', start: '16:15', end: '19:15', room: '2.1.4' },
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

function buildGrid() {
    grid = Array.from({ length: TOTAL_SLOTS }, () => Array(5).fill(null));

    for (let day = 0; day < 5; day++) {
        const lessons = RAW_SCHEDULE[day] || [];
        for (const lesson of lessons) {
            const startSlot = timeToSlot(lesson.start);
            const endSlot = timeToSlot(lesson.end);
            for (let s = startSlot; s < endSlot; s++) {
                grid[s][day] = {
                    subject: lesson.subject,
                    room: lesson.room,
                    link: AUNICA_LINKS[lesson.room] || null,
                    isFirst: s === startSlot,
                    isLast: s === endSlot - 1,
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

        const tdOra = document.createElement('td');
        tdOra.textContent = slotToTimeRange(s);
        tdOra.classList.add('time-col');
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
                td.textContent = cell.subject;
                if (cell.room) {
                    td.dataset.room = cell.room;
                    if (cell.link) {
                        td.dataset.link = cell.link;
                        td.classList.add('has-link');
                    }
                }
                if (cell.isFirst) {
                    td.classList.add('block-start');
                }
                if (cell.isLast) {
                    td.classList.add('block-end');
                }
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

    if (idxG === -1) {
        lezEl.textContent = '-';
        proxEl.textContent = 'Nessuna lezione';
        return;
    }

    if (currentSlot === -1) {
        const firstSlot = grid.findIndex(row => row[idxG]);
        if (firstSlot !== -1) {
            const lesson = grid[firstSlot][idxG];
            lezEl.textContent = '-';
            proxEl.textContent = `${lesson.subject} (${slotToTimeRange(firstSlot)})`;
        } else {
            lezEl.textContent = '-';
            proxEl.textContent = 'Nessuna lezione oggi';
        }
        return;
    }

    const current = grid[currentSlot]?.[idxG];

    if (current) {
        lezEl.textContent = current.subject;

        let nextSlot = currentSlot + 1;
        while (nextSlot < TOTAL_SLOTS && !grid[nextSlot]?.[idxG]) nextSlot++;

        if (nextSlot < TOTAL_SLOTS) {
            const next = grid[nextSlot][idxG];
            proxEl.textContent = `${next.subject} (${slotToTimeRange(nextSlot)})`;
        } else {
            proxEl.textContent = '-';
        }
    } else {
        lezEl.textContent = '-';

        let nextSlot = currentSlot;
        while (nextSlot < TOTAL_SLOTS && !grid[nextSlot]?.[idxG]) nextSlot++;

        if (nextSlot < TOTAL_SLOTS) {
            const next = grid[nextSlot][idxG];
            proxEl.textContent = `${next.subject} (${slotToTimeRange(nextSlot)})`;
        } else {
            let day = (idxG + 1) % 5;
            while (day !== idxG) {
                const firstSlot = grid.findIndex(row => row[day]);
                if (firstSlot !== -1) {
                    const next = grid[firstSlot][day];
                    proxEl.textContent = `${next.subject} (${NOME_GIORNI[day]} ${slotToTimeRange(firstSlot)})`;
                    break;
                }
                day = (day + 1) % 5;
            }
        }
    }
}

function showToday() {
    const today = new Date().getDay();
    if (today === 0 || today === 6) return;

    const isHighlighted = document.querySelector('#scheduleTable td.today-highlight');
    if (isHighlighted) return;

    const dayIndex = getGiornoIndex();
    if (dayIndex === -1) return;

    const rows = document.querySelectorAll('#scheduleTable tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells[dayIndex + 1]) {
            cells[dayIndex + 1].classList.add('today-highlight');
        }
    });
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
            cell.classList.remove('today-highlight', 'search-highlight');
        });
    }

    if (!query) return;

    const cells = document.querySelectorAll('#scheduleTable td[data-subject]');
    let found = false;
    cells.forEach(cell => {
        const text = cell.textContent.toLowerCase();
        if (text.includes(query)) {
            cell.classList.add('today-highlight', 'search-highlight');
            found = true;
        }
    });

    if (found) {
        document.querySelector('#scheduleTable').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        alert('Nessuna materia trovata');
    }
}

function resetView() {
    document.querySelectorAll('#scheduleTable td.today-highlight, #scheduleTable td.search-highlight').forEach(cell => {
        cell.classList.remove('today-highlight', 'search-highlight');
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
});