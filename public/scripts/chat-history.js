document.addEventListener("DOMContentLoaded", () => {
    const filterButton = document.getElementById("filter-button");
    const chatHistoryContainer = document.getElementById("chat-history");
    const backButton = document.getElementById("back-button");

    const today = new Date().toISOString().split("T")[0];
    document.getElementById("filter-date").value = today;

    async function fetchChatHistory() {
        const date = document.getElementById("filter-date").value;
        const text = document.getElementById("filter-text").value;
        const email = localStorage.getItem("userEmail");
        const empresa = localStorage.getItem("userEmpresa");

        const query = new URLSearchParams();
        if (date) query.append("date", date);
        if (text) query.append("text", text);

        console.log("Query:", query.toString()); // Log para depuração

        const response = await fetch(`/api/chat-history?${query.toString()}`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "User-Email": email,
                "User-Empresa": empresa
            }
        });

        const data = await response.json();
        console.log("Resposta da API:", data); // Log para depuração

        chatHistoryContainer.innerHTML = "";

        if (Array.isArray(data)) {
            data.forEach(chat => {
                const messageElement = document.createElement("div");
                messageElement.classList.add("message", chat.sender);
                messageElement.textContent = `${chat.timestamp} - ${chat.sender}: ${chat.message}`;
                chatHistoryContainer.appendChild(messageElement);
            });
        } else {
            chatHistoryContainer.innerHTML = `<p>${data.message}</p>`;
        }
    }

    filterButton.addEventListener("click", fetchChatHistory);
    backButton.addEventListener("click", () => {
        window.location.href = "chat-aurora.html";
    });

    // Fetch chat history on page load
    fetchChatHistory();
});
