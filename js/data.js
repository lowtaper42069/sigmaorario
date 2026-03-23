// Utility functions
const utils = {
    // Formatta l'ora
    formatTime: function(date) {
        return date.toLocaleTimeString('it-IT', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    },
    
    // Formatta la data
    formatDate: function(date) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('it-IT', options);
    },
    
    // Formatta il giorno della settimana
    formatDay: function(date) {
        const options = { weekday: 'long' };
        return date.toLocaleDateString('it-IT', options);
    },
    
    // Calcola il tempo rimanente fino alla prossima lezione
    calculateTimeToNextLesson: function(currentDayIndex, currentHourIndex) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Se siamo fuori dall'orario scolastico o è l'ultima lezione
        if (currentHourIndex === -1 || currentHourIndex >= scheduleData.hours.length - 1) {
            return null;
        }
        
        // Calcola la fine della lezione corrente
        let endHour, endMinute;
        if (currentHourIndex === 6) { // Lezione da 14:10 a 15:00
            endHour = 15;
            endMinute = 0;
        } else {
            const nextHour = scheduleData.hours[currentHourIndex + 1];
            [endHour, endMinute] = nextHour.start.split(':').map(Number);
        }
        
        // Calcola la differenza in minuti
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        const endTotalMinutes = endHour * 60 + endMinute;
        const minutesLeft = endTotalMinutes - currentTotalMinutes;
        
        if (minutesLeft <= 0) return null;
        
        // Formatta il tempo rimanente
        const hours = Math.floor(minutesLeft / 60);
        const minutes = minutesLeft % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    },
    
    // Controlla se una materia è un laboratorio
    isLab: function(subject) {
        return subject && subject.toUpperCase().includes('LAB');
    },
    
    // Aggiorna l'ora dell'ultimo aggiornamento
    updateLastUpdateTime: function() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('it-IT', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        document.getElementById('lastUpdate').textContent = timeString;
    }
};
