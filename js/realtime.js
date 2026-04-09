const ORE = ['8:00 - 9:00', '9:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:10 - 15:00', '15:00 - 16:00'];
const ORE_SHORT = ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:10', '15:00'];
const INIZIO = [8, 9, 10, 11, 12, 13, 14.167, 15];
const FINE = [9, 10, 11, 12, 13, 14, 15, 16];

const ORARIO = {
    0: ['Gestione Progetto LAB', 'Informatica LAB', 'Informatica', 'Sistemi e Reti LAB', 'Sistemi e Reti LAB', 'Storia', 'Inglese', 'Matematica'],
    1: ['Informatica', 'Sistemi e Reti', 'Storia', 'Inglese', 'Tecnologie e Progetti LAB', 'Tecnologie e Progetti LAB', '', ''],
    2: ['Informatica LAB', 'Informatica LAB', 'Italiano', 'Matematica', 'Gestione Progetto LAB', 'Gestione Progetto LAB', '', ''],
    3: ['Inglese', 'Sistemi e Reti', 'Italiano', 'Italiano', 'Tecnologie e Progetti', 'Informatica', '', ''],
    4: ['Scienze Motorie', 'Scienze Motorie', 'Tecnologie e Progetti', 'Italiano', 'Matematica', 'Religione Cattolica', '', '']
};

const NOME_GIORNI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];

function isLab(materia) {
    return materia && materia.includes('LAB');
}

function generaOrario() {
    const table = document.getElementById('scheduleTable');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';

    for (let i = 0; i < ORE.length; i++) {
        const tr = document.createElement('tr');
        
        const tdOra = document.createElement('td');
        tdOra.textContent = ORE[i];
        tr.appendChild(tdOra);

        for (let g = 0; g < 5; g++) {
            const td = document.createElement('td');
            const materia = ORARIO[g][i];
            td.textContent = materia || '-';
            
            if (isLab(materia)) {
                td.classList.add('lab');
            } else if (!materia) {
                td.classList.add('empty');
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

function getUltimaOraIndex(idxG) {
    if (idxG === 0) return 7;
    return 5;
}

function getOraIndex() {
    const h = new Date().getHours();
    const m = new Date().getMinutes();
    const t = h + m / 60;
    
    for (let i = 0; i < INIZIO.length; i++) {
        const fine = FINE[i];
        if (t >= INIZIO[i] && t < fine) return i;
    }
    return -1;
}

function aggiornaInfo() {
    const oraEl = document.getElementById('currentTime');
    const giornoEl = document.getElementById('currentDay');
    const lezEl = document.getElementById('currentLesson');
    const proxEl = document.getElementById('nextLesson');
    
    if (!oraEl) return;
    
    const now = new Date();
    oraEl.textContent = now.toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'});
    giornoEl.textContent = now.toLocaleDateString('it-IT', {weekday: 'long'});
    
    const idxG = getGiornoIndex();
    const idxO = getOraIndex();
    const h = now.getHours();
    const m = now.getMinutes();
    const ora = h + m / 60;
    
    if (idxG === -1) {
        lezEl.textContent = '-';
        proxEl.textContent = 'Nessuna lezione';
        return;
    }
    
    const oggi = ORARIO[idxG];
    const ultimaOraIdx = getUltimaOraIndex(idxG);
    const fineLezioni = FINE[ultimaOraIdx];
    
    if (ora < 8) {
        lezEl.textContent = '-';
        const prima = oggi[0];
        proxEl.textContent = prima ? prima + ' (8:00)' : '-';
    } else if (idxO !== -1) {
        lezEl.textContent = oggi[idxO] || 'Pausa';
        
        let trovata = false;
        for (let i = idxO + 1; i <= ultimaOraIdx; i++) {
            if (oggi[i] && oggi[i].trim()) {
                proxEl.textContent = oggi[i] + ' (' + ORE_SHORT[i] + ')';
                trovata = true;
                break;
            }
        }
        if (!trovata) {
            proxEl.textContent = '-';
        }
    } else {
        lezEl.textContent = '-';
        
        const prossimoG = (idxG + 1) % 5;
        const prossimo = ORARIO[prossimoG];
        const nomeProssimo = NOME_GIORNI[prossimoG];
        
        let trovata = false;
        const prossimaIdx = getUltimaOraIndex(prossimoG);
        for (let i = 0; i <= prossimaIdx; i++) {
            if (prossimo[i] && prossimo[i].trim()) {
                proxEl.textContent = prossimo[i] + ' (' + nomeProssimo + ' ' + ORE_SHORT[i] + ')';
                trovata = true;
                break;
            }
        }
        if (!trovata) {
            proxEl.textContent = '-';
        }
    }
}

function showToday() {
    const today = new Date().getDay();
    if (today === 0 || today === 6) return;
    
    const isHighlighted = document.querySelector('#scheduleTable td.highlighted');
    if (isHighlighted) return;
    
    const dayIndex = today;
    const rows = document.querySelectorAll('#scheduleTable tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells[dayIndex]) {
            cells[dayIndex].classList.add('today', 'highlighted');
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
            cell.classList.remove('today', 'search-highlight');
        });
    }
    
    if (!query) return;
    
    const cells = document.querySelectorAll('#scheduleTable td');
    let found = false;
    cells.forEach(cell => {
        const text = cell.textContent.toLowerCase();
        if (text.includes(query)) {
            cell.classList.add('today', 'search-highlight');
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
    document.querySelectorAll('#scheduleTable td.today, #scheduleTable td.search-highlight').forEach(cell => {
        cell.classList.remove('today', 'highlighted', 'search-highlight');
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
    const blob = new Blob([csv.join('\n')], {type: 'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'orario_5binf.csv';
    a.click();
}

function printSchedule() {
    window.print();
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('scheduleTable')) {
        generaOrario();
        showToday();
        aggiornaInfo();
        setInterval(aggiornaInfo, 1000);
    }

    const searchInput = document.getElementById('searchMateria');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchMateria();
            }
        });
    }
});