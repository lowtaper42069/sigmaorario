// Funzioni per l'evidenziazione in tempo reale
const realtime = {
    currentDayIndex: null,
    currentHourIndex: null,
    
    // Inizializza l'evidenziazione
    init: function() {
        this.updateCurrentTime();
        this.highlightCurrentDay();
        this.highlightCurrentLesson();
        
        // Aggiorna ogni secondo
        setInterval(() => {
            this.updateCurrentTime();
            this.highlightCurrentLesson();
        }, 1000);
        
        // Aggiorna l'ora dell'ultimo aggiornamento ogni minuto
        setInterval(() => {
            utils.updateLastUpdateTime();
        }, 60000);
    },
    
    // Aggiorna l'ora corrente nell'header
    updateCurrentTime: function() {
        const now = new Date();
        
        // Aggiorna l'orologio
        document.getElementById('currentTime').textContent = utils.formatTime(now);
        
        // Aggiorna il giorno
        document.getElementById('currentDay').textContent = utils.formatDay(now);
        
        // Aggiorna l'ora e giorno corrente per l'evidenziazione
        this.currentDayIndex = scheduleData.getCurrentDayIndex();
        this.currentHourIndex = scheduleData.getCurrentHourIndex();
        
        // Aggiorna le informazioni della lezione corrente
        this.updateCurrentLessonInfo();
    },
    
    // Aggiorna le informazioni della lezione corrente
    updateCurrentLessonInfo: function() {
        const lessonNameElement = document.getElementById('lessonName');
        const countdownElement = document.getElementById('countdownTimer');
        
        if (this.currentHourIndex !== -1 && this.currentDayIndex !== -1) {
            const currentLesson = scheduleData.schedule[this.currentDayIndex][this.currentHourIndex];
            
            if (currentLesson && currentLesson.trim() !== '') {
                lessonNameElement.textContent = currentLesson;
                const timeLeft = utils.calculateTimeToNextLesson(this.currentDayIndex, this.currentHourIndex);
                
                if (timeLeft) {
                    countdownElement.textContent = timeLeft;
                    document.getElementById('countdown').style.display = 'block';
                } else {
                    document.getElementById('countdown').style.display = 'none';
                }
            } else {
                lessonNameElement.textContent = 'Pausa';
                countdownElement.textContent = '-';
                document.getElementById('countdown').style.display = 'block';
            }
        } else {
            lessonNameElement.textContent = 'Fuori dall\'orario scolastico';
            countdownElement.textContent = '-';
            document.getElementById('countdown').style.display = 'none';
        }
    },
    
    // Evidenzia il giorno corrente nell'header della tabella
    highlightCurrentDay: function() {
        // Rimuovi evidenziazione precedente
        const dayHeaders = document.querySelectorAll('th:not(:first-child)');
        dayHeaders.forEach(header => {
            header.classList.remove('current-day-header');
        });
        
        // Evidenzia il giorno corrente (aggiungi 1 perché la prima colonna è "Ora")
        if (this.currentDayIndex !== -1) {
            const currentDayHeader = document.querySelector(`th:nth-child(${this.currentDayIndex + 2})`);
            if (currentDayHeader) {
                currentDayHeader.classList.add('current-day-header');
            }
        }
    },
    
    // Evidenzia la lezione corrente
    highlightCurrentLesson: function() {
        // Rimuovi evidenziazioni precedenti
        const allCells = document.querySelectorAll('td');
        allCells.forEach(cell => {
            cell.classList.remove('current-hour', 'next-hour');
        });
        
        // Evidenzia la lezione corrente
        if (this.currentHourIndex !== -1 && this.currentDayIndex !== -1) {
            // Trova la riga dell'ora corrente (aggiungi 1 perché la prima riga è l'header)
            const row = document.querySelector(`tr:nth-child(${this.currentHourIndex + 2})`);
            if (row) {
                // Evidenzia la cella del giorno corrente (aggiungi 2 perché: 1 per l'header, 1 per la colonna "Ora")
                const currentCell = row.querySelector(`td:nth-child(${this.currentDayIndex + 2})`);
                if (currentCell) {
                    currentCell.classList.add('current-hour');
                }
            }
        }
        
        // Evidenzia anche la prossima lezione se esiste
        this.highlightNextLesson();
    },
    
    // Evidenzia la prossima lezione
    highlightNextLesson: function() {
        if (this.currentHourIndex !== -1 && this.currentDayIndex !== -1) {
            const nextHourIndex = this.currentHourIndex + 1;
            
            // Controlla se c'è una lezione nell'ora successiva dello stesso giorno
            if (nextHourIndex < scheduleData.hours.length) {
                const nextLesson = scheduleData.schedule[this.currentDayIndex][nextHourIndex];
                
                if (nextLesson && nextLesson.trim() !== '') {
                    const row = document.querySelector(`tr:nth-child(${nextHourIndex + 2})`);
                    if (row) {
                        const nextCell = row.querySelector(`td:nth-child(${this.currentDayIndex + 2})`);
                        if (nextCell) {
                            nextCell.classList.add('next-hour');
                        }
                    }
                }
            }
        }
    }
};
