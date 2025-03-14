document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('overlay');
    const calendarPopup = document.getElementById('calendar-popup');
    const daysContainer = document.querySelector('.days');

    function generateCalendar() {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const startingDay = firstDayOfMonth.getDay();

        daysContainer.innerHTML = ''; // Limpa os dias anteriores

        // Adiciona espaços vazios para os dias antes do primeiro dia do mês
        for (let i = 0; i < startingDay; i++) {
            daysContainer.innerHTML += '<div></div>';
        }

        // Adiciona os dias do mês
        for (let i = 1; i <= daysInMonth; i++) {
            daysContainer.innerHTML += `<div>${i}</div>`;
        }
    }

    generateCalendar();

    // Função para mostrar o pop-up
    window.showCalendarPopup = function() {
        overlay.style.display = 'flex';
    };

    // Função para fechar o pop-up
    function closeCalendarPopup() {
        overlay.style.display = 'none';
    }

    // Fecha o pop-up ao clicar fora dele
    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            closeCalendarPopup();
        }
    });

    // Adicione aqui a lógica para os botões de ação (registrar, editar, cancelar)
    document.getElementById('register-event').addEventListener('click', function() {
        alert('Registrar evento');
        closeCalendarPopup();
    });

    document.getElementById('edit-event').addEventListener('click', function() {
        alert('Editar evento');
        closeCalendarPopup();
    });

    document.getElementById('cancel-event').addEventListener('click', function() {
        alert('Cancelar evento');
        closeCalendarPopup();
    });
});