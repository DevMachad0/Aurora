// Verifica se o usuário tem um token de autenticação
const token = localStorage.getItem('token');

if (!token) {
  // Redireciona para a página de login caso o token não exista
  window.location.href = 'index.html';
}

document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("menu-toggle");
    const sidebar = document.getElementById("sidebar");
    const themeToggle = document.getElementById("theme-toggle");

    // Alternar menu lateral
    menuToggle.addEventListener("click", (event) => {
        sidebar.classList.toggle("active");
        event.stopPropagation(); // Impede que o clique no botão feche o menu imediatamente
    });

    // Fechar menu ao clicar fora
    document.addEventListener("click", (event) => {
        if (sidebar.classList.contains("active") && !sidebar.contains(event.target) && event.target !== menuToggle) {
            sidebar.classList.remove("active");
        }
    });

    // Alternar tema escuro/claro
    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
    });
});
document.addEventListener("DOMContentLoaded", function () {
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");
    const chatBox = document.querySelector(".chat-box");

    function appendMessage(sender, text) {
        const messageElement = document.createElement("div");
        messageElement.classList.add(sender);
        messageElement.textContent = text;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        appendMessage("user-message", `Você: ${message}`);
        messageInput.value = "";

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            });

            const data = await response.json();
            appendMessage("bot-message", `Aurora: ${data.message}`);
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
            appendMessage("bot-message", "Erro ao se comunicar com o servidor.");
        }
    }

    sendButton.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") sendMessage();
    });
});
