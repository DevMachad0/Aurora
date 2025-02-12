// Verifica se o usuário tem um token de autenticação
const token = localStorage.getItem('token');

if (!token) {
  // Redireciona para a página de login caso o token não exista
  window.location.href = 'index.html';
}

// Se o token existir, a página será carregada normalmente
// Seleção dos elementos principais
const toggleThemeButton = document.getElementById('toggle-theme');
const chatBox = document.getElementById('chat-box');
const body = document.body;
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

// Função para alternar o tema
function toggleTheme() {
    // Alterna a classe de modo escuro no corpo
    body.classList.toggle('dark-mode');
    // Alterna a cor do botão de tema conforme o tema ativo
    if (body.classList.contains('dark-mode')) {
        toggleThemeButton.textContent = '🌞';
    } else {
        toggleThemeButton.textContent = '🌑';
    }
}
// Função para abrir e fechar o menu
const menu = document.getElementById('menu');
const openMenuButton = document.getElementById('open-menu-button');

openMenuButton.addEventListener('click', () => {
    menu.classList.toggle('open'); // Alterna a classe "open" para abrir/fechar o menu
});

// Aumenta o tamanho do campo de chat no mobile
function adjustChatInputForMobile() {
    if (window.innerWidth <= 767) {
        // Aumenta o tamanho do chat box para dispositivos móveis
        chatBox.style.height = 'calc(100% - 120px)';
        messageInput.style.height = '60px';
    } else {
        chatBox.style.height = 'auto'; // Tamanho padrão no desktop
        messageInput.style.height = '40px'; // Tamanho padrão no desktop
    }
}

// Adiciona o evento de alternância de tema ao botão
toggleThemeButton.addEventListener('click', toggleTheme);

// Ajusta o campo de chat no carregamento e ao redimensionar a janela
window.addEventListener('resize', adjustChatInputForMobile);
window.addEventListener('load', adjustChatInputForMobile);
