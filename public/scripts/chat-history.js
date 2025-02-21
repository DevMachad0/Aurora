document.addEventListener("DOMContentLoaded", () => {
    const filterButton = document.getElementById("filter-button");
    const chatHistoryContainer = document.getElementById("chat-history");
    const backButton = document.getElementById("back-button");
    const filterDate = document.getElementById("filter-date");
    const email = localStorage.getItem("userEmail");
    const empresa = localStorage.getItem("userEmpresa");
    const database = localStorage.getItem("userDatabase");

    const today = new Date().toISOString().split("T")[0];
    filterDate.value = today; // Preenche o campo filter-date com a data de hoje

    async function fetchChatHistory(date) {
        const query = new URLSearchParams();
        if (date) query.append("date", date);

        console.log("Query:", query.toString());
        // Log para depuração
        console.log(database);
        
        const response = await fetch(`/api/chat-history?${query.toString()}`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "User-Email": email,
                "User-Empresa": empresa,
                "User-Database": database // Certifique-se de que o banco de dados está sendo enviado
            }
        });

        const data = await response.json();
        console.log("Resposta da API:", data); // Log para depuração

        chatHistoryContainer.innerHTML = "";

        if (Array.isArray(data)) {
            data.forEach(chat => {
                const messageElement = document.createElement("div");
                messageElement.classList.add("message", chat.sender);
                messageElement.textContent = `${date} - ${chat.sender}: ${chat.message}`; // Inclui a data da conversa
                chatHistoryContainer.appendChild(messageElement);
            });
        } else {
            chatHistoryContainer.innerHTML = `<p>${data.message}</p>`;
        }
    }

    filterButton.addEventListener("click", () => {
        const date = filterDate.value;
        fetchChatHistory(date);
    });
    backButton.addEventListener("click", () => {
        window.location.href = "chat-aurora.html";
    });

    // Fetch chat history on page load
    fetchChatHistory(today);
});
