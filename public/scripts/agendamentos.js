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
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        currentMonthYear.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;

        // Preenche os dias do mês
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement("div");
            dayElement.classList.add("day");
            const fullDate = new Date(year, month, i).toLocaleDateString('pt-BR');
            dayElement.setAttribute("data-date", fullDate);
            dayElement.innerHTML = `<h3>${i}</h3>`;
            calendar.appendChild(dayElement);
        }

        loadReminders();
    }

    // Função para adicionar lembrete
    function addReminder(date, reminder) {
        const fullDate = date.toLocaleDateString('pt-BR');
        const dayElement = calendar.querySelector(`.day[data-date='${fullDate}']`);
    
        if (dayElement) {
            // Removendo lembretes duplicados antes de adicionar novos
            dayElement.querySelectorAll(".reminder").forEach(reminderElement => reminderElement.remove());
    
            const reminderElement = document.createElement("div");
            reminderElement.classList.add("reminder");
            reminderElement.textContent = reminder;
            dayElement.appendChild(reminderElement);
        } else {
            console.warn("Não foi possível encontrar um dia correspondente no calendário", date);
        }
    }
    // Função para carregar lembretes do localStorage
    function loadReminders() {
        const reminders = JSON.parse(localStorage.getItem("reminders")) || [];
        reminders.forEach(reminder => {
            const reminderDate = new Date(reminder.date);
            if (reminderDate.getFullYear() === currentDate.getFullYear() && reminderDate.getMonth() === currentDate.getMonth()) {
                addReminder(reminderDate, reminder.text);
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
            console.log("Agendamentos recebidos:", data.agendamentos); // Depuração

            if (data.agendamentos) {
                data.agendamentos.forEach(agendamento => {
                    const reminderText = `${agendamento.titulo} - ${agendamento.hora} - ${agendamento.descricao} - ${agendamento.prioridade}`;
                    const [day, month, year] = agendamento.data.split('/');
                    const reminderDate = new Date(year, month - 1, day);

                    // Verifica se a data é válida e se pertence ao mês atual
                    if (!isNaN(reminderDate.getTime()) && reminderDate.getFullYear() === currentDate.getFullYear() && reminderDate.getMonth() === currentDate.getMonth()) {
                        addReminder(reminderDate, reminderText);
                    } else {
                        console.error("Data inválida ou fora do mês atual para agendamento:", agendamento);
                    }
                });
            }
        } catch (error) {
            console.error("Erro ao carregar agendamentos:", error);
        }
    }

    // Inicializa o calendário e carrega os agendamentos
    createCalendar(currentDate);
    setTimeout(loadAgendamentos, 1000);

    // Evento para voltar ao chat
    backToChatButton.addEventListener("click", () => {
        window.location.href = "chat-aurora.html";
    });

    // Eventos para navegar entre meses
    prevMonthButton.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        createCalendar(currentDate);
        setTimeout(loadAgendamentos, 1000);
    });

    nextMonthButton.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        createCalendar(currentDate);
        setTimeout(loadAgendamentos, 1000);
    });

    // Exemplo de como adicionar um lembrete
    // saveReminder(new Date(2023, 10, 15), "Reunião às 10h");
});
