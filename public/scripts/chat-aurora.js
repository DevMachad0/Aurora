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
const userNome = localStorage.getItem("userNome"); // Obtém o nome do usuário
const userTelefone = localStorage.getItem("userTelefone"); // Obtém o telefone do usuário
const userTipo = localStorage.getItem("userTipo"); // Obtém o tipo do usuário   


if (!token) {
  // Redireciona para a página de login caso o token não exista
  localStorage.clear();
  window.location.href = "index.html";
}

let logoutTimer;
let inactivityTimer;
let stopGeneration = false;

// Função para deslogar o usuário
function logout() {
    localStorage.clear();
    localStorage.removeItem("token");
    window.location.href = "index.html";
}

// Função para resetar o timer de inatividade
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(logout, 30 * 60 * 1000); // 30 minutos
}

// Função para iniciar o timer de logout
function startLogoutTimer() {
    logoutTimer = setTimeout(() => {
        localStorage.clear();
        localStorage.removeItem("token");
        window.location.href = "index.html";
    }, 5 * 60 * 60 * 1000); // 5 horas
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

    // Adiciona evento de logout ao botão "Sair"
    const logoutButton = document.querySelector("a[href='index.html']");
    if (logoutButton) {
        logoutButton.addEventListener("click", (event) => {
            event.preventDefault();
            localStorage.clear();
            localStorage.removeItem("token");
            window.location.href = "index.html";
        });
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");
    const chatBox = document.querySelector(".chat-box");
    const stopButton = document.getElementById("stop-button");

    stopButton.addEventListener("click", function () {
        stopGeneration = true;
    });

    function appendMessage(sender, text) {
        const messageElement = document.createElement("div");
        messageElement.classList.add(sender);
        messageElement.innerHTML = formatMarkdown(text); // Formata o texto em Markdown
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

        // Impede que o usuário envie HTML
        const sanitizedMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        appendMessage("user-message", `Você: ${sanitizedMessage}`);
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
                    message: sanitizedMessage,
                    user: {
                        nome: userName,
                        email: userEmail,
                        empresa: userEmpresa,
                        database: database,
                        licenca: userLicenca,
                        plano: userPlano,
                        dados: userDados,
                        createdAt: userCreatedAt,
                        updatedAt: userUpdatedAt
                    }
                }),
            });

            const data = await response.json();
            if (data.error) {
                appendMessage("bot-message", `Erro: ${data.error}`);
            } else {
                await generateTextProcedurally("bot-message", `Aurora: ${data.message}`);
            }
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

        // Remove o código HTML e exibe apenas a tabela formatada
        const sanitizedText = text.replace(/`html\s*([\s\S]*?)\s*`/g, '$1');

        for (let i = 0; i < sanitizedText.length; i++) {
            if (stopGeneration) {
                stopGeneration = false;
                break;
            }
            messageElement.innerHTML = formatMarkdown(sanitizedText.slice(0, i + 1)); // Formata o texto em Markdown
            chatBox.scrollTop = chatBox.scrollHeight;
            await new Promise(resolve => setTimeout(resolve, 20)); // Ajuste o tempo conforme necessário
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

        // Formata blocos de código
        text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

        // Formata tabelas
        text = text.replace(/^\|(.+?)\|$/gm, '<tr><td>$1</td></tr>');
        text = text.replace(/<\/tr>\s*<tr>/g, '</tr><tr>');
        text = text.replace(/<tr><td>(.+?)<\/td><\/tr>/g, '<table><tbody><tr><td>$1</td></tr></tbody></table>');
        text = text.replace(/<td>\s*\|\s*/g, '<td>');
        text = text.replace(/\s*\|\s*<\/td>/g, '</td>');

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

    const calendarButton = document.getElementById('calendar');
    const iframe = document.getElementById('popup-iframe');
    const popupOverlay = document.getElementById('popup-overlay');

    if (calendarButton) {
        calendarButton.addEventListener('click', function() {
            if (iframe && popupOverlay) {
                iframe.style.display = 'block';
                popupOverlay.style.display = 'flex';
            }
        });
    }

    if (iframe) {
        iframe.addEventListener('load', function() {
            const iframeDocument = iframe.contentWindow.document;
            iframeDocument.addEventListener('click', function(event) {
                if (event.target.id === 'close-popup') {
                    iframe.style.display = 'none';
                    if (popupOverlay) {
                        popupOverlay.style.display = 'none';
                    }
                }
            });
        });
    }

    if (popupOverlay) {
        popupOverlay.addEventListener('click', function(event) {
            if (event.target === this) {
                this.style.display = 'none';
                if (iframe) {
                    iframe.style.display = 'none';
                }
            }
        });
    }
});
