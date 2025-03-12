document.addEventListener("DOMContentLoaded", async () => {
    const email = localStorage.getItem("userEmail");

    // Função para exibir popup
    function showPopup(message, callback) {
        const popup = document.createElement("div");
        popup.classList.add("popup");

        const popupContent = document.createElement("div");
        popupContent.classList.add("popup-content");

        const messageElement = document.createElement("p");
        messageElement.textContent = message;

        const inputElement = document.createElement("input");
        inputElement.type = "password";
        inputElement.placeholder = "Digite o token";

        const confirmButton = document.createElement("button");
        confirmButton.textContent = "Confirmar";
        confirmButton.addEventListener("click", () => {
            document.body.removeChild(popup);
            callback(inputElement.value);
        });

        popupContent.appendChild(messageElement);
        popupContent.appendChild(inputElement);
        popupContent.appendChild(confirmButton);
        popup.appendChild(popupContent);
        document.body.appendChild(popup);
    }

    try {
        const response = await fetch(`/users/${email}`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });
        const data = await response.json();

        if (data.tokenAdmin) {
            showPopup("Digite o token de administrador:", (token) => {
                if (btoa(token) !== data.tokenAdmin) {
                    showPopup("Token incorreto. Acesso negado.", () => {
                        window.location.href = "chat-aurora.html";
                    });
                } else {
                    console.log("Token correto. Acesso permitido.");
                    // Chamar a função exibirDados do config.js
                    if (typeof exibirDados === "function") {
                        exibirDados();
                    }
                }
            });
        } else {
            console.log("Token de administrador não definido. Acesso permitido.");
            // Chamar a função exibirDados do config.js
            if (typeof exibirDados === "function") {
                exibirDados();
            }
        }
    } catch (error) {
        console.error("Erro ao verificar token de administrador:", error);
        showPopup("Erro ao verificar token de administrador.", () => {
            window.location.href = "chat-aurora.html";
        });
    }
});
