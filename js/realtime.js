// Orario completo hardcodato
const ORE = ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:10', '15:00'];
const INIZIO = [8, 9, 10, 11, 12, 13, 14.167, 15];

const ORARIO = {
    0: ['Gestione Progetto LAB', 'Informatica LAB', 'Informatica', 'Sistemi e Reti LAB', 'Sistemi e Reti LAB', 'Storia', 'Inglese', 'Matematica'],
    1: ['Informatica', 'Sistemi e Reti', 'Storia', 'Inglese', 'Tecnologie e Progetti LAB', 'Tecnologie e Progetti LAB', '', ''],
    2: ['Informatica LAB', 'Informatica LAB', 'Italiano', 'Matematica', 'Gestione Progetto LAB', 'Gestione Progetto LAB', '', ''],
    3: ['Inglese', 'Sistemi e Reti', 'Italiano', 'Italiano', 'Tecnologie e Progetti', 'Informatica', '', ''],
    4: ['Scienze Motorie', 'Scienze Motorie', 'Tecnologie e Progetti', 'Italiano', 'Matematica', 'Religione Cattolica', '', '']
};

const NOME_GIORNI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];

function getIndiceGiorno() {
    const g = new Date().getDay();
    const m = [-1, 0, 1, 2, 3, 4, -1];
    return m[g];
}

function getIndiceOra() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const t = h + m / 60;
    
    for (let i = 0; i < INIZIO.length; i++) {
        const fine = (i === 6) ? 15 : INIZIO[i] + 1;
        if (t >= INIZIO[i] && t < fine) return i;
    }
    return -1;
}

function getProssimaLezione() {
    const now = new Date();
    const g = new Date().getDay();
    const h = now.getHours() + now.getMinutes() / 60;
    const mappa = [-1, 0, 1, 2, 3, 4, -1];
    
    for (let d = 1; d <= 7; d++) {
        const checkG = (g + d) % 7;
        if (checkG === 0) continue;
        
        const idx = mappa[checkG];
        if (idx === -1) continue;
        
        const inizio = d === 1 ? h + 0.5 : 8;
        for (let i = 0; i < INIZIO.length; i++) {
            if (d === 1 && INIZIO[i] <= h) continue;
            const lez = ORARIO[idx][i];
            if (lez && lez.trim() !== '') {
                return { lezione: lez, giorno: NOME_GIORNI[idx], ora: ORE[i] };
            }
        }
    }
    return null;
}

function aggiornaInfo() {
    const oraEl = document.getElementById('currentTime');
    const giornoEl = document.getElementById('currentDay');
    const lezEl = document.getElementById('currentLesson');
    const proxEl = document.getElementById('nextLesson');
    
    const now = new Date();
    oraEl.textContent = now.toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'});
    giornoEl.textContent = now.toLocaleDateString('it-IT', {weekday: 'long'});
    
    const idxG = getIndiceGiorno();
    const idxO = getIndiceOra();
    
    if (idxG === -1) {
        const prox = getProssimaLezione();
        if (prox) {
            lezEl.textContent = 'Fuori orario';
            proxEl.textContent = prox.lezione + ' (' + prox.giorno + ' ' + prox.ora + ')';
        } else {
            lezEl.textContent = '-';
            proxEl.textContent = '-';
        }
        return;
    }
    
    const oggi = ORARIO[idxG];
    
    if (idxO !== -1) {
        const lez = oggi[idxO];
        lezEl.textContent = (lez && lez.trim()) ? lez : 'Pausa';
        
        let trovata = false;
        for (let i = idxO + 1; i < oggi.length; i++) {
            if (oggi[i] && oggi[i].trim()) {
                proxEl.textContent = oggi[i];
                trovata = true;
                break;
            }
        }
        if (!trovata) {
            const prox = getProssimaLezione();
            proxEl.textContent = prox ? prox.lezione + ' (' + prox.giorno + ' ' + prox.ora + ')' : '-';
        }
    } else {
        lezEl.textContent = 'Fuori orario';
        let trovata = false;
        for (let i = 0; i < oggi.length; i++) {
            if (oggi[i] && oggi[i].trim()) {
                proxEl.textContent = oggi[i];
                trovata = true;
                break;
            }
        }
        if (!trovata) {
            const prox = getProssimaLezione();
            proxEl.textContent = prox ? prox.lezione + ' (' + prox.giorno + ' ' + prox.ora + ')' : '-';
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    aggiornaInfo();
    setInterval(aggiornaInfo, 1000);
});
