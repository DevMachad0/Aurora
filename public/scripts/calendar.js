document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        dateClick: function(info) {
            var eventForm = document.createElement('div');
            eventForm.innerHTML = `
                <form id="event-form">
                    <label for="event-title">Título:</label>
                    <input type="text" id="event-title" name="event-title" required>
                    <label for="event-start">Data de Início:</label>
                    <input type="date" id="event-start" name="event-start" required>
                    <label for="event-time">Horário:</label>
                    <input type="time" id="event-time" name="event-time" required>
                    <label for="event-description">Descrição:</label>
                    <textarea id="event-description" name="event-description" required></textarea>
                    <button type="submit">Salvar</button>
                </form>
            `;
            document.body.appendChild(eventForm);
            eventForm.style.position = 'fixed';
            eventForm.style.top = '50%';
            eventForm.style.left = '50%';
            eventForm.style.transform = 'translate(-50%, -50%)';
            eventForm.style.backgroundColor = '#fff';
            eventForm.style.padding = '20px';
            eventForm.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
            eventForm.style.zIndex = '1001';

            document.getElementById('event-form').addEventListener('submit', function(e) {
                e.preventDefault();
                // Lógica para salvar o evento
                eventForm.remove();
            });
        }
    });
    calendar.render();
});
