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
const database = localStorage.getItem("userDatabase");

console.log(database)
if (!token) {
  // Redireciona para a página de login caso o token não exista
  window.location.href = "index.html";
}

let logoutTimer;
let inactivityTimer;

// Função para deslogar o usuário
function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}

// Função para resetar o timer de inatividade
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(logout, 10 * 60 * 1000); // 10 minutos
}

// Função para iniciar o timer de logout
function startLogoutTimer() {
    logoutTimer = setTimeout(logout, 60 * 60 * 1000); // 1 hora
}

// Eventos para resetar o timer de inatividade
document.addEventListener("mousemove", resetInactivityTimer);
document.addEventListener("keypress", resetInactivityTimer);

// Inicia os timers
startLogoutTimer();
resetInactivityTimer();

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
        if (sender === "bot-message") {
            messageElement.innerHTML = formatMarkdown(text); // Formata o texto em Markdown apenas para mensagens da IA
        } else {
            messageElement.textContent = text; // Não formata o texto para mensagens do usuário
        }
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
        messageInput.style.height = "46px"; // Reseta a altura do campo de entrada

        // Desabilita o campo de entrada e o botão de enviar
        messageInput.disabled = true;
        sendButton.disabled = true;
        sendButton.textContent = "Gerando..."; 

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
            await generateTextProcedurally("bot-message", `Aurora: ${data.message}`);
            saveChatHistory();
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
            appendMessage("bot-message", "Erro ao se comunicar com o servidor.");
        } finally {
            // Reabilita o campo de entrada e o botão de enviar
            messageInput.disabled = false;
            sendButton.disabled = false;
            sendButton.textContent = "Enviar"; // Restaura o texto original do botão
            messageInput.focus();
        }
    }

    async function generateTextProcedurally(sender, text) {
        const messageElement = document.createElement("div");
        messageElement.classList.add(sender);
        chatBox.appendChild(messageElement);

        for (let i = 0; i < text.length; i++) {
            messageElement.innerHTML = formatMarkdown(text.slice(0, i + 1)); // Formata o texto em Markdown
            chatBox.scrollTop = chatBox.scrollHeight;
            await new Promise(resolve => setTimeout(resolve, 30)); // Ajuste o tempo conforme necessário
        }
    }

    function formatMarkdown(text) {
        // Formata negrito e itálico
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        text = text.replace(/_(.*?)_/g, '<em>$1</em>');

        // Formata cabeçalhos (de 1 a 6 níveis)
        text = text.replace(/######(.*?)######/g, '<h6>$1</h6>');
        text = text.replace(/#####(.*?)#####/g, '<h5>$1</h5>');
        text = text.replace(/####(.*?)####/g, '<h4>$1</h4>');
        text = text.replace(/###(.*?)###/g, '<h3>$1</h3>');
        text = text.replace(/##(.*?)##/g, '<h2>$1</h2>');
        text = text.replace(/#(.*?)#/g, '<h1>$1</h1>');

        // Formata listas não ordenadas
        text = text.replace(/^\s*[-*] (.*$)/gim, '<ul><li>$1</li></ul>');

        // Formata listas ordenadas
        text = text.replace(/^\s*\d+\.\s(.*$)/gim, '<ol><li>$1</li></ol>');

        // Formata código inline
        text = text.replace(/`(.*?)`/g, '<code>$1</code>');

        // Garante que listas não sejam aninhadas incorretamente
        text = text.replace(/<\/ul>\s*<ul>/g, '');
        text = text.replace(/<\/ol>\s*<ol>/g, '');

        // Retira possíveis quebras de linha após cabeçalhos
        text = text.replace(/<\/h1>\s*<h1>/g, '</h1><h1>');

        return text.trim();
    }
    

    sendButton.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    messageInput.addEventListener("input", function () {
        messageInput.style.height = "auto";
        messageInput.style.height = `${messageInput.scrollHeight}px`;
    });
});
