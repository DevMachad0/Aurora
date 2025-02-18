// Verifica se o usuário tem um token de autenticação
const token = localStorage.getItem("token");
const userName = localStorage.getItem("userName"); // Obtém o nome do usuário do localStorage
const userEmail = localStorage.getItem("userEmail"); // Obtém o e-mail do usuário
const userEmpresa = localStorage.getItem("userEmpresa"); // Obtém a empresa do usuário
const userLicenca = localStorage.getItem("userLicenca"); // Obtém a licença do usuário
const userPlano = localStorage.getItem("userPlano"); // Obtém o plano do usuário
const userDados = JSON.parse(localStorage.getItem("userDados")); // Obtém os dados do usuário
const userCreatedAt = localStorage.getItem("userCreatedAt"); // Obtém a data de criação do usuário
const userUpdatedAt = localStorage.getItem("userUpdatedAt"); // Obtém a data de atualização do usuário

if (!token) {
  // Redireciona para a página de login caso o token não exista
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", async () => {
    const menuToggle = document.getElementById("menu-toggle");
    const sidebar = document.getElementById("sidebar");
    const themeToggle = document.getElementById("theme-toggle");
    const userInfo = document.querySelector(".user-info p");

    // Atualiza o nome do usuário na interface
    if (userInfo && userName) {
        userInfo.textContent = `👤 ${userName}`;
    }

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

    function saveChatHistory() {
        const chatHistory = chatBox.innerHTML;
        localStorage.setItem("chatHistory", chatHistory);
    }

    async function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        appendMessage("user-message", `Você: ${message}`);
        messageInput.value = "";

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` // Token enviado no cabeçalho
                },
                body: JSON.stringify({
                    message,
                    user: {
                        nome: userName,
                        email: userEmail,
                        empresa: userEmpresa,
                        licenca: userLicenca,
                        plano: userPlano,
                        dados: userDados,
                        createdAt: userCreatedAt,
                        updatedAt: userUpdatedAt
                    }
                }),
            });

            const data = await response.json();
            appendMessage("bot-message", `Aurora: ${data.message}`);
            saveChatHistory();
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
