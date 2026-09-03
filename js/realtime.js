const ORE = ['8:15 - 10:15', '10:15 - 13:15', '13:15 - 16:15', '14:15 - 18:15', '15:15 - 17:15', '15:15 - 18:15', '16:15 - 19:15'];
const ORE_SHORT = ['8:15', '10:15', '13:15', '14:15', '15:15', '15:15', '16:15'];
const INIZIO = [8.25, 10.25, 13.25, 14.25, 15.25, 15.25, 16.25];
const FINE = [10.25, 13.25, 16.25, 18.25, 17.25, 18.25, 19.25];

const ORARIO = {
    0: ['', '', 'FONDAMENTI DI INFORMATICA', '', '', '', 'FONDAMENTI DI INFORMATICA'],
    1: ['', '', '', '', '', '', ''],
    2: ['FONDAMENTI DI INFORMATICA', 'ANALISI MATEMATICA 1', '', '', 'GEOMETRIA E ALGEBRA LINEARE', '', ''],
    3: ['GEOMETRIA E ALGEBRA LINEARE', 'FONDAMENTI DI INFORMATICA', '', 'FONDAMENTI DI INFORMATICA', '', '', ''],
    4: ['', '', 'ANALISI MATEMATICA 1', '', '', 'GEOMETRIA E ALGEBRA LINEARE', '']
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
    const oggi = ORARIO[idxG];
    for (let i = oggi.length - 1; i >= 0; i--) {
        if (oggi[i] && oggi[i].trim()) return i;
    }
    return 0;
}

function getOraIndex() {
    const h = new Date().getHours();
    const m = new Date().getMinutes();
    const t = h + m / 60;
    const idxG = getGiornoIndex();
    if (idxG === -1) return -1;
    
    const oggi = ORARIO[idxG];
    for (let i = 0; i < ORE.length; i++) {
        if (oggi[i] && oggi[i].trim() && t >= INIZIO[i] && t < FINE[i]) return i;
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
    const h = now.getHours();
    const m = now.getMinutes();
    const t = h + m / 60;
    
    if (idxG === -1) {
        lezEl.textContent = '-';
        proxEl.textContent = 'Nessuna lezione';
        return;
    }
    
    const oggi = ORARIO[idxG];
    const idxO = getOraIndex();
    
    if (idxO !== -1) {
        lezEl.textContent = oggi[idxO];
        
        let trovata = false;
        for (let i = idxO + 1; i < oggi.length; i++) {
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
        
        let trovata = false;
        for (let i = 0; i < oggi.length; i++) {
            if (oggi[i] && oggi[i].trim() && t < FINE[i]) {
                proxEl.textContent = oggi[i] + ' (' + ORE_SHORT[i] + ')';
                trovata = true;
                break;
            }
        }
        
        if (!trovata) {
            const prossimoG = (idxG + 1) % 5;
            const prossimo = ORARIO[prossimoG];
            const nomeProssimo = NOME_GIORNI[prossimoG];
            
            let trovata2 = false;
            for (let i = 0; i < prossimo.length; i++) {
                if (prossimo[i] && prossimo[i].trim()) {
                    proxEl.textContent = prossimo[i] + ' (' + nomeProssimo + ' ' + ORE_SHORT[i] + ')';
                    trovata2 = true;
                    break;
                }
            }
            if (!trovata2) {
                proxEl.textContent = '-';
            }
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