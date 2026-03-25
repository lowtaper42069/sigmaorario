const ORE = ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:10', '15:00'];
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
                proxEl.textContent = oggi[i] + ' (' + ORE[i] + ')';
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
                proxEl.textContent = prossimo[i] + ' (' + nomeProssimo + ' ' + ORE[i] + ')';
                trovata = true;
                break;
            }
        }
        if (!trovata) {
            proxEl.textContent = '-';
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    aggiornaInfo();
    setInterval(aggiornaInfo, 1000);
});
