// Gestione calendario
document.addEventListener('DOMContentLoaded', function() {
    console.log('Calendario - Inizializzazione...');
    
    // Inizializza variabili
    let currentDate = new Date();
    let events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
    
    // Elementi DOM
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const todayBtn = document.getElementById('todayBtn');
    const exportBtn = document.getElementById('exportBtn');
    const addEventBtn = document.getElementById('addEventBtn');
    const eventModal = document.getElementById('eventModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.cancel-btn');
    const saveBtn = document.querySelector('.save-btn');
    const eventForm = document.getElementById('eventForm');
    const upcomingEventsList = document.getElementById('upcomingEvents');
    
    // Inizializza calendario
    function initCalendar() {
        renderCalendar(currentDate);
        renderUpcomingEvents();
        updateLastSync();
        setupEventListeners();
    }
    
    // Renderizza il calendario per un mese specifico
    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        
        // Aggiorna il titolo del mese
        const monthNames = [
            'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
            'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
        ];
        currentMonthElement.textContent = `${monthNames[month]} ${year}`;
        
        // Calcola il primo giorno del mese
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Calcola il giorno della settimana del primo giorno (0 = Domenica, 1 = Lunedì)
        let firstDayOfWeek = firstDay.getDay();
        // Converti in formato italiano (0 = Lunedì, 6 = Domenica)
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
        
        // Pulisci il calendario
        calendarGrid.innerHTML = '';
        
        // Aggiungi giorni del mese precedente
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = 0; i < firstDayOfWeek; i++) {
            const day = prevMonthLastDay - firstDayOfWeek + i + 1;
            const dayElement = createDayElement(year, month - 1, day, true);
            calendarGrid.appendChild(dayElement);
        }
        
        // Aggiungi giorni del mese corrente
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = createDayElement(year, month, day, false);
            
            // Evidenzia il giorno corrente
            if (day === today.getDate() && 
                month === today.getMonth() && 
                year === today.getFullYear()) {
                dayElement.classList.add('today');
            }
            
            calendarGrid.appendChild(dayElement);
        }
        
        // Aggiungi giorni del mese successivo per completare la griglia
        const totalCells = 42; // 6 righe × 7 colonne
        const totalDaysDisplayed = firstDayOfWeek + daysInMonth;
        const nextMonthDaysNeeded = totalCells - totalDaysDisplayed;
        
        for (let day = 1; day <= nextMonthDaysNeeded; day++) {
            const dayElement = createDayElement(year, month + 1, day, true);
            calendarGrid.appendChild(dayElement);
        }
    }
    
    // Crea un elemento giorno per il calendario
    function createDayElement(year, month, day, isOtherMonth) {
        const date = new Date(year, month, day);
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        
        // Numero del giorno
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        // Eventi per questo giorno
        const dayEvents = getEventsForDate(date);
        if (dayEvents.length > 0) {
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'day-events';
            
            dayEvents.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'event';
                eventElement.textContent = event.title;
                eventElement.style.backgroundColor = event.color;
                eventElement.title = `${event.title} - ${event.subject || 'Nessuna materia'}`;
                
                // Click sull'evento
                eventElement.addEventListener('click', () => {
                    showEventDetails(event);
                });
                
                eventsContainer.appendChild(eventElement);
            });
            
            dayElement.appendChild(eventsContainer);
        }
        
        // Click sul giorno
        dayElement.addEventListener('click', () => {
            if (!isOtherMonth) {
                openEventModal(date);
            }
        });
        
        return dayElement;
    }
    
    // Ottieni eventi per una data specifica
    function getEventsForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return events.filter(event => event.date === dateStr);
    }
    
    // Ottieni eventi imminenti (prossimi 7 giorni)
    function getUpcomingEvents() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        return events
            .filter(event => {
                const eventDate = new Date(event.date);
                return eventDate >= today && eventDate <= nextWeek;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    // Renderizza eventi imminenti
    function renderUpcomingEvents() {
        const upcomingEvents = getUpcomingEvents();
        
        if (upcomingEvents.length === 0) {
            upcomingEventsList.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-plus"></i>
                    <p>Nessun evento imminente</p>
                </div>
            `;
            return;
        }
        
        upcomingEventsList.innerHTML = '';
        
        upcomingEvents.forEach(event => {
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('it-IT', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
            });
            
            const eventElement = document.createElement('div');
            eventElement.className = 'event-item';
            eventElement.style.borderLeftColor = event.color;
            eventElement.innerHTML = `
                <div class="event-date">${formattedDate}</div>
                <div class="event-title">${event.title}</div>
                <div class="event-subject">${event.subject || 'Nessuna materia'}</div>
            `;
            
            eventElement.addEventListener('click', () => {
                showEventDetails(event);
            });
            
            upcomingEventsList.appendChild(eventElement);
        });
    }
    
    // Mostra dettagli evento
    function showEventDetails(event) {
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('it-IT', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        const timeInfo = event.time ? ` alle ${event.time}` : '';
        
        alert(`
            📅 ${event.title}
            📌 Data: ${formattedDate}${timeInfo}
            📚 Materia: ${event.subject || 'Nessuna materia'}
            🏷️ Tipo: ${getEventTypeLabel(event.type)}
            📝 Note: ${event.description || 'Nessuna nota'}
        `);
    }
    
    // Ottieni etichetta per tipo evento
    function getEventTypeLabel(type) {
        const labels = {
            'verifica': 'Verifica',
            'compito': 'Compito',
            'progetto': 'Progetto',
            'laboratorio': 'Laboratorio',
            'riunione': 'Riunione',
            'altro': 'Altro'
        };
        
        return labels[type] || 'Altro';
    }
    
    // Apri modal per aggiungere evento
    function openEventModal(date = null) {
        if (date) {
            const dateStr = date.toISOString().split('T')[0];
            document.getElementById('eventDate').value = dateStr;
        } else {
            document.getElementById('eventDate').value = '';
        }
        
        document.getElementById('eventTime').value = '';
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventType').value = 'verifica';
        document.getElementById('eventSubject').value = '';
        document.getElementById('eventDescription').value = '';
        document.getElementById('color1').checked = true;
        
        eventModal.classList.add('show');
    }
    
    // Chiudi modal
    function closeEventModal() {
        eventModal.classList.remove('show');
        eventForm.reset();
    }
    
    // Salva evento
    function saveEvent() {
        const title = document.getElementById('eventTitle').value.trim();
        const date = document.getElementById('eventDate').value;
        const time = document.getElementById('eventTime').value;
        const type = document.getElementById('eventType').value;
        const subject = document.getElementById('eventSubject').value;
        const description = document.getElementById('eventDescription').value.trim();
        const color = document.querySelector('input[name="eventColor"]:checked').value;
        
        if (!title || !date) {
            alert('Inserisci almeno un titolo e una data!');
            return;
        }
        
        const newEvent = {
            id: Date.now(),
            title,
            date,
            time: time || null,
            type,
            subject: subject || null,
            description: description || null,
            color,
            createdAt: new Date().toISOString()
        };
        
        events.push(newEvent);
        saveEventsToStorage();
        
        renderCalendar(currentDate);
        renderUpcomingEvents();
        closeEventModal();
        
        alert('Evento salvato con successo! ✅');
    }
    
    // Salva eventi nel localStorage
    function saveEventsToStorage() {
        localStorage.setItem('calendarEvents', JSON.stringify(events));
        updateLastSync();
    }
    
    // Aggiorna l'ora dell'ultima sincronizzazione
    function updateLastSync() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('it-IT', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const dateString = now.toLocaleDateString('it-IT');
        
        document.getElementById('lastSync').textContent = `${dateString} alle ${timeString}`;
    }
    
    // Esporta eventi come file JSON
    function exportEvents() {
        if (events.length === 0) {
            alert('Nessun evento da esportare!');
            return;
        }
        
        const dataStr = JSON.stringify(events, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `calendario_5binf_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        alert(`Esportati ${events.length} eventi con successo! 📥`);
    }
    
    // Imposta gli event listener
    function setupEventListeners() {
        // Navigazione mesi
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(currentDate);
        });
        
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(currentDate);
        });
        
        // Torna a oggi
        todayBtn.addEventListener('click', () => {
            currentDate = new Date();
            renderCalendar(currentDate);
        });
        
        // Esporta eventi
        exportBtn.addEventListener('click', exportEvents);
        
        // Aggiungi evento
        addEventBtn.addEventListener('click', () => openEventModal());
        
        // Modal
        closeModalBtn.addEventListener('click', closeEventModal);
        cancelBtn.addEventListener('click', closeEventModal);
        
        saveBtn.addEventListener('click', saveEvent);
        
        // Chiudi modal cliccando fuori
        window.addEventListener('click', (e) => {
            if (e.target === eventModal) {
                closeEventModal();
            }
        });
        
        // Submit form
        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveEvent();
        });
    }
    
    // Inizializza tutto
    initCalendar();
    
    console.log('Calendario pronto!');
});
