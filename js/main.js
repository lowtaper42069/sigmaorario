// Dati dell'orario scolastico
const scheduleData = {
    days: ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'],
    
    hours: [
        { start: '8:00', end: '9:00' },
        { start: '9:00', end: '10:00' },
        { start: '10:00', end: '11:00' },
        { start: '11:00', end: '12:00' },
        { start: '12:00', end: '13:00' },
        { start: '13:00', end: '14:00' },
        { start: '14:10', end: '15:00' },
        { start: '15:00', end: '16:00' }
    ],
    
    schedule: [
        // Lunedì (0)
        [
            'Gestione Progetto OR LAB',
            'Informatica LAB',
            'Informatica',
            'Sistemi e Reti LAB',
            'Sistemi e Reti LAB',
            'Storia',
            'Lingua Inglese',
            'Matematica'
        ],
        // Martedì (1)
        [
            'Informatica',
            'Sistemi e Reti',
            'Storia',
            'Lingua Inglese',
            'Tecnologie e Progetti LAB',
            'Tecnologie e Progetti LAB',
            '',
            ''
        ],
        // Mercoledì (2)
        [
            'Informatica LAB',
            'Informatica LAB',
            'Lingua e Letteratura',
            'Matematica e Complementi',
            'Gestione Progetto OR LAB',
            'Gestione Progetto OR LAB',
            '',
            ''
        ],
        // Giovedì (3)
        [
            'Lingua Inglese',
            'Sistemi e Reti',
            'Lingua e Letteratura',
            'Lingua e Letteratura',
            'Tecnologie e Progetti',
            'Informatica',
            '',
            ''
        ],
        // Venerdì (4)
        [
            'Scienze Motorie',
            'Scienze Motorie',
            'Tecnologie e prog',
            'Lingua e Letteratura',
            'Matematica e Complementi',
            'Religione Cattolica',
            '',
            ''
        ]
    ],
    
    // Ottieni l'indice del giorno corrente (0 = Lunedì, 4 = Venerdì)
    getCurrentDayIndex: function() {
        const now = new Date();
        const day = now.getDay(); // 0 = Domenica, 1 = Lunedì, ..., 6 = Sabato
        
        // Mappa: Domenica(0) -> -1, Lunedì(1) -> 0, Martedì(2) -> 1, ..., Venerdì(5) -> 4, Sabato(6) -> -1
        const map = [-1, 0, 1, 2, 3, 4, -1];
        return map[day];
    },
    
    getCurrentHourIndex: function() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour + currentMinute / 60;
        
        const startTimes = [8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.1667, 15.0];
        
        for (let i = 0; i < startTimes.length; i++) {
            let endTime = (i === 6) ? 15.0 : startTimes[i] + 1;
            if (currentTime >= startTimes[i] && currentTime <= endTime) {
                return i;
            }
        }
        
        return -1;
    }
};
