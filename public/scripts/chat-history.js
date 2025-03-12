document.addEventListener("DOMContentLoaded", () => {
    const filterButton = document.getElementById("filter-button");
    const chatHistoryContainer = document.getElementById("chat-history");
    const backButton = document.getElementById("back-button");
    const filterDate = document.getElementById("filter-date");
    const filterKeyword = document.getElementById("filter-keyword"); // Campo para busca por palavra-chave
    const email = localStorage.getItem("userEmail");
    const empresa = localStorage.getItem("userEmpresa");
    const database = localStorage.getItem("userDatabase");

    const today = new Date().toISOString().split("T")[0];
    filterDate.value = today; // Preenche o campo filter-date com a data de hoje

    async function fetchChatHistory(date, keyword) {
        const query = new URLSearchParams();
        if (date) query.append("date", date);
        if (keyword) query.append("keyword", keyword); // Adiciona a palavra-chave à query

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
                messageElement.innerHTML = formatMarkdown(`${chat.date} - ${chat.sender}: ${chat.message}`); // Inclui a data da conversa e formata o texto
                chatHistoryContainer.appendChild(messageElement);
            });
        } else {
            chatHistoryContainer.innerHTML = `<p>${data.message}</p>`;
        }
    }

    filterButton.addEventListener("click", () => {
        const date = filterDate.value;
        const keyword = filterKeyword.value; // Obtém a palavra-chave do campo de entrada
        fetchChatHistory(date, keyword);
    });
    backButton.addEventListener("click", () => {
        window.location.href = "chat-aurora.html";
    });

    // Fetch chat history on page load
    fetchChatHistory(today);
});

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
