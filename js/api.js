class ApiManager {
    static baseUrl = ''; // Se gli script PHP sono nella stessa directory
    
    static async request(endpoint, method = 'GET', data = null) {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, options);
            
            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Errore sconosciuto');
            }
            
            return result;
        } catch (error) {
            console.error(`Errore nella richiesta ${endpoint}:`, error);
            throw error;
        }
    }
    
    static formatDateForDB(date) {
        return date.toISOString().split('T')[0];
    }
    
    // Eventi
    static async getEvents(startDate = null, endDate = null) {
        let endpoint = 'get_events.php';
        
        if (startDate && endDate) {
            endpoint += `?start_date=${this.formatDateForDB(startDate)}&end_date=${this.formatDateForDB(endDate)}`;
        }
        
        const result = await this.request(endpoint);
        return result.events || [];
    }
    
    static async getMonthEvents(year, month) {
        const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
        const result = await this.request(`get_events.php?month=${monthStr}`);
        return result.events || [];
    }
    
    static async addEvent(eventData) {
        const result = await this.request('add_event.php', 'POST', eventData);
        return result.event;
    }
    
    static async updateEvent(eventId, eventData) {
        eventData.id = eventId;
        const result = await this.request('update_event.php', 'PUT', eventData);
        return result.event;
    }
    
    static async deleteEvent(eventId) {
        const result = await this.request('delete_event.php', 'DELETE', { id: eventId });
        return result;
    }
}
