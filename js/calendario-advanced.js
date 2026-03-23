// Calendario Avanzato - Gestione completa
class AdvancedCalendar {
    constructor() {
        this.currentDate = new Date();
        this.currentView = 'month';
        this.events = [];
        this.filteredEvents = [];
        this.filters = {
            types: ['verifica', 'compito', 'progetto', 'laboratorio', 'riunione', 'altro'],
            subject: 'tutte'
        };
        
        this.init();
    }
    
    async init() {
        await this.loadEvents();
        this.setupUI();
        this.render();
        this.setupEventListeners();
        this.updateStats();
    }
    
    async loadEvents() {
        try {
            this.events = await ApiManager.getEvents();
            this.applyFilters();
        } catch (error) {
            console.error('Errore nel caricamento eventi:', error);
            this.events = [];
        }
    }
    
    setupUI() {
        // Inizializza date picker con data corrente
        const today = utils.formatDateForDB(new Date());
        document.getElementById('eventDate').value = today;
        document.getElementById('eventDate').min = today;
    }
    
    render() {
        this.renderMonthView();
        this.renderUpcomingEvents();
        this.updateHeader();
    }
    
    renderMonthView() {
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        grid.innerHTML = this.generateMonthGrid(year, month);
        this.highlightEvents();
    }
    
    generateMonthGrid(year, month) {
        // ... implementazione griglia mese ...
        return html;
    }
    
    renderUpcomingEvents() {
        const container = document.getElementById('upcomingEvents');
        const upcoming = this.getUpcomingEvents();
        
        if (upcoming.length === 0) {
            container.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-plus"></i>
                    <p>Nessun evento imminente</p>
                    <small>Clicca su un giorno per aggiungere un evento</small>
                </div>
            `;
            return;
        }
        
        container.innerHTML = upcoming.map(event => this.createEventCard(event)).join('');
    }
    
    createEventCard(event) {
        const date = new Date(event.date);
        const formattedDate = date.toLocaleDateString('it-IT', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
        
        const priorityClass = event.priority === 'alta' || event.priority === 'urgente' ? 'high-priority' : '';
        
        return `
            <div class="event-item ${priorityClass}" data-id="${event.id}">
                <div class="event-date">${formattedDate}${event.time ? ` • ${event.time}` : ''}</div>
                <div class="event-title">${event.title}</div>
                <div class="event-subject">${event.subject || 'Nessuna materia'}</div>
                <div class="event-actions">
                    <button class="event-action-btn view-event" title="Visualizza">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="event-action-btn edit-event" title="Modifica">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="event-action-btn delete-event" title="Elimina">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    // ... tutte le altre funzioni avanzate ...
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    window.calendar = new AdvancedCalendar();
});
