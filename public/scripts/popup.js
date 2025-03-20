document.addEventListener("DOMContentLoaded", function () {
    const calendarBody = document.getElementById("calendar-body-agendamento");
    const currentMonthLabel = document.getElementById("current-month-agendamento");
    const prevMonthButton = document.getElementById("prev-month-agendamento");
    const nextMonthButton = document.getElementById("next-month-agendamento");

    if (!calendarBody || !currentMonthLabel || !prevMonthButton || !nextMonthButton) {
        console.error("Elementos do calendário de agendamento não encontrados.");
        return;
    }

    let currentDate = new Date();

    function updateCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();
        const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

        currentMonthLabel.textContent = `${months[month]} ${year}`;

        calendarBody.innerHTML = ""; // Limpa a tabela

        let date = 1;
        for (let i = 0; i < 6; i++) {
            let row = document.createElement("tr");

            for (let j = 0; j < 7; j++) {
                let cell = document.createElement("td");

                if (i === 0 && j < firstDay) {
                    cell.textContent = "";
                } else if (date > lastDate) {
                    break;
                } else {
                    cell.textContent = date;
                    cell.classList.add("calendar-day-agendamento");
                    date++;
                }

                row.appendChild(cell);
            }

            calendarBody.appendChild(row);
        }
    }

    prevMonthButton.addEventListener("click", function () {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
    });

    nextMonthButton.addEventListener("click", function () {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
    });

    updateCalendar();

    const eventFormPopup = document.getElementById("event-form-popup-agendamento");
    const registerEventButton = document.getElementById("register-event-agendamento");
    const cancelEventButton = document.getElementById("cancel-event-agendamento");
    const eventForm = document.getElementById("event-form-agendamento");

    registerEventButton.addEventListener("click", () => {
        eventFormPopup.style.display = "flex";
    });

    cancelEventButton.addEventListener("click", () => {
        eventFormPopup.style.display = "none";
    });

    eventForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const eventData = {
            title: document.getElementById("event-title-agendamento").value,
            date: document.getElementById("event-date-agendamento").value,
            startTime: document.getElementById("start-time-agendamento").value,
            endTime: document.getElementById("end-time-agendamento").value,
            description: document.getElementById("description-agendamento").value,
            email: document.getElementById("email-agendamento").value,
            notifyEmail: document.getElementById("notify-email-agendamento").checked,
            database: localStorage.getItem("userDatabase"), // Obtém o banco de dados da empresa
        };

        try {
            await fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(eventData),
            });
            alert("Evento registrado com sucesso!");
            eventFormPopup.style.display = "none";
        } catch (error) {
            console.error("Erro ao registrar evento:", error);
            alert("Erro ao registrar evento.");
        }
    });
});
