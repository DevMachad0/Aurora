document.addEventListener("DOMContentLoaded", (async () => {
    const o = localStorage.getItem("userEmail");
    try {
        const e = await fetch(`/users/${o}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        const t = await e.json();
        if (t.tokenAdmin) {
            // Criar um input de senha dinamicamente
            const inputContainer = document.createElement('div');
            const inputLabel = document.createElement('label');
            inputLabel.textContent = "Digite o token de administrador:";
            const inputPassword = document.createElement('input');
            inputPassword.type = "password";
            inputPassword.placeholder = "Token de administrador";
            inputPassword.autofocus = true;

            // Adicionar os elementos ao body
            inputContainer.appendChild(inputLabel);
            inputContainer.appendChild(inputPassword);
            document.body.appendChild(inputContainer);

            // Adicionar um botão para submeter o token
            const submitButton = document.createElement('button');
            submitButton.textContent = "Submeter";
            inputContainer.appendChild(submitButton);

            submitButton.addEventListener("click", () => {
                const userToken = inputPassword.value;
                if (btoa(userToken) !== t.tokenAdmin) {
                    alert("Token incorreto. Acesso negado.");
                    window.location.href = "chat-aurora.html";
                } else {
                    console.log("Token correto. Acesso permitido.");
                    // Você pode continuar a lógica para liberar o acesso
                }
            });
        } else {
            console.log("Token de administrador não definido. Acesso permitido.");
        }
    } catch (o) {
        console.error("Erro ao verificar token de administrador:", o);
        alert("Erro ao verificar token de administrador.");
        window.location.href = "chat-aurora.html";
    }
}));
