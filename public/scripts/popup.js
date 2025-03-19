document.addEventListener("DOMContentLoaded", function () {
    const calendarBody = document.getElementById("calendar-body");
    const currentMonthLabel = document.getElementById("current-month");
    const prevMonthButton = document.getElementById("prev-month");
    const nextMonthButton = document.getElementById("next-month");

    if (!calendarBody || !currentMonthLabel || !prevMonthButton || !nextMonthButton) {
        console.error("Elementos do calendário não encontrados.");
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
                    cell.classList.add("calendar-day");
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

    const eventFormPopup = document.getElementById("event-form-popup");
    const registerEventButton = document.getElementById("register-event");
    const cancelEventButton = document.getElementById("cancel-event");
    const eventForm = document.getElementById("event-form");

    registerEventButton.addEventListener("click", () => {
        eventFormPopup.style.display = "flex";
    });

    cancelEventButton.addEventListener("click", () => {
        eventFormPopup.style.display = "none";
    });

    eventForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const eventData = {
            title: document.getElementById("event-title").value,
            date: document.getElementById("event-date").value,
            startTime: document.getElementById("start-time").value,
            endTime: document.getElementById("end-time").value,
            description: document.getElementById("description").value,
            email: document.getElementById("email").value,
            notifyEmail: document.getElementById("notify-email").checked,
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
