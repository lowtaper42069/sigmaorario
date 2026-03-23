// Calendario Semplice - Versione completa con PHP
document.addEventListener('DOMContentLoaded', function() {
    console.log('Calendario Semplice - Inizializzazione...');
    
    // Variabili
    let currentDate = new Date();
    let events = [];
    
    // Elementi DOM
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const todayBtn = document.getElementById('todayBtn');
    const addEventBtn = document.getElementById('addEventBtn');
    const exportBtn = document.getElementById('exportBtn');
    const printBtn = document.getElementById('printBtn');
    const clearFilters = document.getElementById('clearFilters');
    const eventModal = document.getElementById('eventModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.cancel-btn');
    const saveBtn = document.querySelector('.save-btn');
    const eventForm = document.getElementById('eventForm');
    const upcomingEventsList = document.getElementById('upcomingEvents');
    
    // Stats elements
    const totalEventsElement = document.getElementById('totalEvents');
    const upcomingEventsCountElement = document.getElementById('upcomingEventsCount');
    const verificheCountElement = document.getElementById('verificheCount');
    const labCountElement = document.getElementById('labCount');
    const footerEventCountElement = document.getElementById('footerEventCount');
    const lastSyncElement = document.getElementById('lastSync');
    
    // Inizializza calendario
    async function initCalendar() {
        try {
            await loadEvents();
            renderCalendar(currentDate);
            updateStats();
            updateLastSync();
            setupEventListeners();
            setupModalEvents();
            
            // Filtra automaticamente gli eventi imminenti
            filterUpcomingEvents();
            
            console.log('Calendario inizializzato con successo!');
        } catch (error) {
            console.error('Errore nell\'inizializzazione:', error);
            showMessage('Errore nell\'inizializzazione del calendario', 'error');
        }
    }
    
    // Carica eventi
    async function loadEvents() {
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            events = await ApiManager.getMonthEvents(year, month);
            console.log(`Caricati ${events.length} eventi per ${year}-${month + 1}`);
        } catch (error) {
            console.error('Errore nel caricamento eventi:', error);
            events = [];
            showMessage('Errore nel caricamento eventi: ' + error.message, 'error');
        }
    }
    
    // Renderizza calendario
    async function renderCalendar(date) {
        try {
            const year = date.getFullYear();
            const month = date.getMonth();
            
            // Aggiorna titolo mese
            const monthNames = [
                'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
            ];
            currentMonthElement.textContent = `${monthNames[month]} ${year}`;
            
            // Carica eventi per questo mese
            await loadEvents();
            
            // Calcola giorni del mese
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const daysInMonth = lastDay.getDate();
            
            // Giorno della settimana del primo giorno (0 = Domenica)
            let firstDayOfWeek = firstDay.getDay();
            // Converti in formato italiano (0 = Lunedì, 6 = Domenica)
            firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
            
            // Pulisci calendario
            calendarGrid.innerHTML = '';
            
            // Giorni del mese precedente
            const prevMonthLastDay = new Date(year, month, 0).getDate();
            for (let i = 0; i < firstDayOfWeek; i++) {
                const day = prevMonthLastDay - firstDayOfWeek + i + 1;
                const dayElement = createDayElement(year, month - 1, day, true);
                calendarGrid.appendChild(dayElement);
            }
            
            // Giorni del mese corrente
            const today = new Date();
            for (let day = 1; day <= daysInMonth; day++) {
                const dayElement = createDayElement(year, month, day, false);
                
                // Evidenzia oggi
                if (day === today.getDate() && 
                    month === today.getMonth() && 
                    year === today.getFullYear()) {
                    dayElement.classList.add('today');
                }
                
                calendarGrid.appendChild(dayElement);
            }
            
            // Giorni del mese successivo
            const totalCells = 42; // 6 righe × 7 colonne
            const totalDaysDisplayed = firstDayOfWeek + daysInMonth;
            const nextMonthDaysNeeded = totalCells - totalDaysDisplayed;
            
            for (let day = 1; day <= nextMonthDaysNeeded; day++) {
                const dayElement = createDayElement(year, month + 1, day, true);
                calendarGrid.appendChild(dayElement);
            }
            
            // Aggiorna eventi imminenti
            renderUpcomingEvents();
            updateStats();
            
        } catch (error) {
            console.error('Errore nel render del calendario:', error);
            showMessage('Errore nella visualizzazione del calendario', 'error');
        }
    }
    
    // Crea elemento giorno
    function createDayElement(year, month, day, isOtherMonth) {
        const date = new Date(year, month, day);
        const dateStr = ApiManager.formatDateForDB(date);
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
        const dayEvents = events.filter(event => event.date === dateStr);
        if (dayEvents.length > 0) {
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'day-events';
            
            dayEvents.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'event';
                eventElement.textContent = event.title.substring(0, 20); // Limita lunghezza
                eventElement.style.backgroundColor = event.color;
                
                // Tooltip con dettagli
                eventElement.title = `${event.title}\n${event.subject || 'Nessuna materia'}\n${event.time ? 'Ora: ' + event.time : ''}`;
                eventElement.dataset.eventId = event.id;
                
                // Bottone elimina
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'event-delete';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = 'Elimina evento';
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm('Eliminare questo evento?')) {
                        await deleteEvent(event.id);
                    }
                });
                
                eventElement.appendChild(deleteBtn);
                
                // Click per modificare
                eventElement.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('event-delete')) {
                        editEvent(event);
                    }
                });
                
                eventsContainer.appendChild(eventElement);
            });
            
            dayElement.appendChild(eventsContainer);
        }
        
        // Click sul giorno per aggiungere evento
        dayElement.addEventListener('click', () => {
            if (!isOtherMonth) {
                openEventModal(date);
            }
        });
        
        return dayElement;
    }
    
    // Renderizza eventi imminenti
    function renderUpcomingEvents() {
        const upcomingEvents = getUpcomingEvents();
        
        if (upcomingEvents.length === 0) {
            upcomingEventsList.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-plus"></i>
                    <p>Nessun evento imminente</p>
                    <small>Clicca su un giorno per aggiungere un evento</small>
                </div>
            `;
            return;
        }
        
        upcomingEventsList.innerHTML = '';
        
        upcomingEvents.forEach(event => {
            const eventElement = createEventItem(event);
            upcomingEventsList.appendChild(eventElement);
        });
    }
    
    // Crea elemento evento per la sidebar
    function createEventItem(event) {
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('it-IT', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
        
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        eventElement.style.borderLeftColor = event.color;
        eventElement.dataset.eventId = event.id;
        
        let timeHTML = '';
        if (event.time) {
            timeHTML = ` • ${event.time}`;
        }
        
        eventElement.innerHTML = `
            <div class="event-date">${formattedDate}${timeHTML}</div>
            <div class="event-title">${event.title}</div>
            <div class="event-subject">${event.subject || 'Nessuna materia'}</div>
            <div class="event-actions">
                <button class="event-action-btn view-event" title="Visualizza">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="event-action-btn delete-event" title="Elimina">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Event listeners
        const viewBtn = eventElement.querySelector('.view-event');
        const deleteBtn = eventElement.querySelector('.delete-event');
        
        viewBtn.addEventListener('click', () => showEventDetails(event));
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Eliminare questo evento?')) {
                await deleteEvent(event.id);
            }
        });
        
        eventElement.addEventListener('click', (e) => {
            if (!e.target.closest('.event-actions')) {
                showEventDetails(event);
            }
        });
        
        return eventElement;
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
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 10); // Massimo 10 eventi
    }
    
    // Filtra eventi imminenti
    function filterUpcomingEvents() {
        const now = new Date();
        const upcoming = events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= now;
        }).length;
        
        upcomingEventsCountElement.textContent = upcoming;
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
        const typeLabels = {
            'verifica': 'Verifica',
            'compito': 'Compito',
            'progetto': 'Progetto',
            'laboratorio': 'Laboratorio',
            'riunione': 'Riunione',
            'altro': 'Altro'
        };
        
        const eventType = typeLabels[event.type] || 'Altro';
        
        const details = `
            <div class="event-details">
                <h4><i class="fas fa-info-circle"></i> Dettagli Evento</h4>
                <div class="detail-row">
                    <strong>📅 Data:</strong> ${formattedDate}${timeInfo}
                </div>
                <div class="detail-row">
                    <strong>📚 Materia:</strong> ${event.subject || 'Nessuna materia'}
                </div>
                <div class="detail-row">
                    <strong>🏷️ Tipo:</strong> ${eventType}
                </div>
                ${event.description ? `
                <div class="detail-row">
                    <strong>📝 Note:</strong> ${event.description}
                </div>` : ''}
                <div class="detail-actions">
                    <button class="btn btn-primary" id="editEventBtn">
                        <i class="fas fa-edit"></i> Modifica
                    </button>
                    <button class="btn btn-danger" id="deleteEventBtn">
                        <i class="fas fa-trash"></i> Elimina
                    </button>
                    <button class="btn btn-secondary" id="closeDetailsBtn">Chiudi</button>
                </div>
            </div>
        `;
        
        // Crea modal
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-body">
                    ${details}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        const closeBtn = modal.querySelector('#closeDetailsBtn');
        const deleteBtn = modal.querySelector('#deleteEventBtn');
        const editBtn = modal.querySelector('#editEventBtn');
        
        const closeDetails = () => modal.remove();
        
        closeBtn.addEventListener('click', closeDetails);
        
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Sei sicuro di voler eliminare questo evento?')) {
                await deleteEvent(event.id);
                closeDetails();
            }
        });
        
        editBtn.addEventListener('click', () => {
            closeDetails();
            editEvent(event);
        });
        
        // Chiudi cliccando fuori
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeDetails();
            }
        });
        
        // Tasto ESC per chiudere
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeDetails();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }
    
    // Modifica evento
    function editEvent(event) {
        openEventModal(new Date(event.date), event);
    }
    
    // Elimina evento
    async function deleteEvent(eventId) {
        try {
            await ApiManager.deleteEvent(eventId);
            
            // Rimuovi evento dall'array locale
            events = events.filter(event => event.id !== eventId);
            
            // Ricarica calendario
            renderCalendar(currentDate);
            updateStats();
            
            showMessage('Evento eliminato con successo!', 'success');
        } catch (error) {
            showMessage('Errore nell\'eliminazione: ' + error.message, 'error');
        }
    }
    
    // Apri modal evento
    function openEventModal(date = null, eventToEdit = null) {
        const isEdit = !!eventToEdit;
        const modalTitle = eventModal.querySelector('h3');
        
        if (modalTitle) {
            modalTitle.innerHTML = isEdit ? 
                '<i class="fas fa-edit"></i> Modifica Evento' : 
                '<i class="fas fa-calendar-plus"></i> Nuovo Evento';
        }
        
        if (date) {
            const dateStr = ApiManager.formatDateForDB(date);
            document.getElementById('eventDate').value = dateStr;
        } else {
            // Data di default: oggi
            const today = new Date();
            document.getElementById('eventDate').value = ApiManager.formatDateForDB(today);
        }
        
        if (eventToEdit) {
            // Compila form con dati evento
            document.getElementById('eventTitle').value = eventToEdit.title;
            document.getElementById('eventDate').value = eventToEdit.date;
            document.getElementById('eventTime').value = eventToEdit.time || '';
            document.getElementById('eventType').value = eventToEdit.type;
            document.getElementById('eventSubject').value = eventToEdit.subject || '';
            document.getElementById('eventDescription').value = eventToEdit.description || '';
            
            // Imposta colore
            const colorInput = eventModal.querySelector(`input[name="eventColor"][value="${eventToEdit.color}"]`);
            if (colorInput) {
                colorInput.checked = true;
            } else {
                // Se il colore non esiste, usa quello di default
                eventModal.querySelector('input[name="eventColor"][value="#6366f1"]').checked = true;
            }
            
            // Salva ID evento per l'update
            eventForm.dataset.eventId = eventToEdit.id;
            saveBtn.textContent = 'Aggiorna Evento';
        } else {
            // Resetta form
            eventForm.reset();
            eventForm.dataset.eventId = '';
            eventModal.querySelector('input[name="eventColor"][value="#6366f1"]').checked = true;
            saveBtn.textContent = 'Salva Evento';
        }
        
        eventModal.classList.add('show');
        document.getElementById('eventTitle').focus();
    }
    
    // Chiudi modal
    function closeEventModal() {
        eventModal.classList.remove('show');
        eventForm.reset();
        eventForm.dataset.eventId = '';
        eventModal.querySelector('input[name="eventColor"][value="#6366f1"]').checked = true;
    }
    
    // Salva evento
    async function saveEvent() {
        const title = document.getElementById('eventTitle').value.trim();
        const date = document.getElementById('eventDate').value;
        const time = document.getElementById('eventTime').value;
        const type = document.getElementById('eventType').value;
        const subject = document.getElementById('eventSubject').value;
        const description = document.getElementById('eventDescription').value.trim();
        const color = eventModal.querySelector('input[name="eventColor"]:checked').value;
        const eventId = eventForm.dataset.eventId;
        
        if (!title || !date) {
            showMessage('Inserisci almeno un titolo e una data!', 'error');
            document.getElementById('eventTitle').focus();
            return;
        }
        
        try {
            const eventData = {
                title,
                date,
                time: time || null,
                type,
                subject: subject || null,
                description: description || null,
                color
            };
            
            let savedEvent;
            
            if (eventId) {
                // Update existing event
                savedEvent = await ApiManager.updateEvent(eventId, eventData);
                showMessage('Evento aggiornato con successo!', 'success');
            } else {
                // Create new event
                savedEvent = await ApiManager.addEvent(eventData);
                showMessage('Evento creato con successo!', 'success');
            }
            
            // Aggiorna evento nell'array locale
            if (eventId) {
                // Aggiorna evento esistente
                const index = events.findIndex(e => e.id == eventId);
                if (index !== -1) {
                    events[index] = savedEvent;
                }
            } else {
                // Aggiungi nuovo evento
                events.push(savedEvent);
            }
            
            // Ricarica calendario
            renderCalendar(currentDate);
            updateStats();
            
            closeEventModal();
            
        } catch (error) {
            showMessage('Errore nel salvataggio: ' + error.message, 'error');
        }
    }
    
    // Aggiorna statistiche
    function updateStats() {
        const total = events.length;
        const upcoming = getUpcomingEvents().length;
        const verifiche = events.filter(e => e.type === 'verifica').length;
        const laboratori = events.filter(e => e.type === 'laboratorio').length;
        
        totalEventsElement.textContent = total;
        upcomingEventsCountElement.textContent = upcoming;
        verificheCountElement.textContent = verifiche;
        labCountElement.textContent = laboratori;
        footerEventCountElement.textContent = total;
    }
    
    // Aggiorna ultima sincronizzazione
    function updateLastSync() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('it-IT', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const dateString = now.toLocaleDateString('it-IT');
        
        lastSyncElement.textContent = `${dateString} alle ${timeString}`;
    }
    
    // Mostra messaggio di notifica
    function showMessage(message, type = 'info') {
        // Crea una notifica semplice
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Event listener per chiudere
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        // Rimuovi automaticamente dopo 5 secondi
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Esporta eventi come JSON
    function exportEvents() {
        try {
            if (events.length === 0) {
                showMessage('Nessun evento da esportare!', 'warning');
                return;
            }
            
            const dataStr = JSON.stringify(events, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const fileName = `calendario_5binf_${new Date().toISOString().split('T')[0]}.json`;
            
            const link = document.createElement('a');
            link.setAttribute('href', dataUri);
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showMessage(`Esportati ${events.length} eventi!`, 'success');
        } catch (error) {
            showMessage('Errore nell\'esportazione: ' + error.message, 'error');
        }
    }
    
    // Stampa calendario
    function printCalendar() {
        window.print();
    }
    
    // Setup event listeners
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
        
        // Aggiungi evento
        addEventBtn.addEventListener('click', () => openEventModal());
        
        // Esporta
        exportBtn.addEventListener('click', exportEvents);
        
        // Stampa
        printBtn.addEventListener('click', printCalendar);
        
        // Filtri (funzionalità futura)
        clearFilters.addEventListener('click', () => {
            showMessage('Funzionalità filtri da implementare', 'info');
        });
        
        // Navigazione con tastiera
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                prevMonthBtn.click();
            } else if (e.key === 'ArrowRight') {
                nextMonthBtn.click();
            } else if (e.key === 't' && (e.ctrlKey || e.metaKey)) {
                todayBtn.click();
            } else if (e.key === 'Escape' && eventModal.classList.contains('show')) {
                closeEventModal();
            }
        });
    }
    
    // Setup modal events
    function setupModalEvents() {
        // Modal buttons
        closeModalBtn.addEventListener('click', closeEventModal);
        cancelBtn.addEventListener('click', closeEventModal);
        saveBtn.addEventListener('click', saveEvent);
        
        // Chiudi modal cliccando fuori
        eventModal.addEventListener('click', (e) => {
            if (e.target === eventModal) {
                closeEventModal();
            }
        });
        
        // Submit form
        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveEvent();
        });
        
        // Enter per salvare nel modal
        eventModal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                saveBtn.click();
            }
        });
    }
    
    // Inizializza tutto
    initCalendar();
    console.log('Calendario semplice pronto!');
});
