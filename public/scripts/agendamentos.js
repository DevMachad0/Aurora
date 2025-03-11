document.addEventListener("DOMContentLoaded", () => {
    const calendar = document.getElementById("calendar");
    const backToChatButton = document.getElementById("back-to-chat");
    const prevMonthButton = document.getElementById("prev-month");
    const nextMonthButton = document.getElementById("next-month");
    const currentMonthYear = document.getElementById("current-month-year");

    let currentDate = new Date();

    // Função para criar o calendário
    function createCalendar(date) {
        calendar.innerHTML = "";
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        currentMonthYear.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;

        // Preenche os dias anteriores ao primeiro dia do mês
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDayElement = document.createElement("div");
            emptyDayElement.classList.add("day");
            calendar.appendChild(emptyDayElement);
        }

        // Preenche os dias do mês
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement("div");
            dayElement.classList.add("day");
            dayElement.innerHTML = `<h3>${i}</h3>`;
            calendar.appendChild(dayElement);
        }

        loadReminders();
    }

    // Função para adicionar lembrete
    function addReminder(day, reminder) {
        const dayElement = calendar.querySelector(`.day:nth-child(${day + new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()})`);
        const reminderElement = document.createElement("div");
        reminderElement.classList.add("reminder");
        reminderElement.textContent = reminder;
        dayElement.appendChild(reminderElement);
    }

    // Função para carregar lembretes do localStorage
    function loadReminders() {
        const reminders = JSON.parse(localStorage.getItem("reminders")) || [];
        reminders.forEach(reminder => {
            const reminderDate = new Date(reminder.date);
            if (reminderDate.getFullYear() === currentDate.getFullYear() && reminderDate.getMonth() === currentDate.getMonth()) {
                addReminder(reminderDate.getDate(), reminder.text);
            }
        });
    }

    // Função para salvar lembrete no localStorage
    function saveReminder(date, text) {
        const reminders = JSON.parse(localStorage.getItem("reminders")) || [];
        reminders.push({ date, text });
        localStorage.setItem("reminders", JSON.stringify(reminders));
    }

    // Função para carregar agendamentos do servidor
    async function loadAgendamentos() {
        try {
            const response = await fetch("/api/agendamentos", {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    "User-Email": localStorage.getItem("userEmail"),
                    "User-Empresa": localStorage.getItem("userEmpresa"),
                    "User-Database": localStorage.getItem("userDatabase")
                }
            });

            const data = await response.json();
            if (data.agendamentos) {
                data.agendamentos.forEach(agendamento => {
                    const reminderText = `${agendamento.titulo} - ${agendamento.hora} - ${agendamento.descricao} - ${agendamento.prioridade}`;
                    const reminderDate = new Date(agendamento.data);
                    addReminder(reminderDate.getDate(), reminderText);
                });
            }
        } catch (error) {
            console.error("Erro ao carregar agendamentos:", error);
        }
    }

    // Inicializa o calendário e carrega os agendamentos
    createCalendar(currentDate);
    loadAgendamentos();

    // Evento para voltar ao chat
    backToChatButton.addEventListener("click", () => {
        window.location.href = "chat-aurora.html";
    });

    // Eventos para navegar entre meses
    prevMonthButton.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        createCalendar(currentDate);
    });

    nextMonthButton.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        createCalendar(currentDate);
    });

});
