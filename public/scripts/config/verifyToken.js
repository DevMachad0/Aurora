document.addEventListener("DOMContentLoaded", (async () => {
    const o = localStorage.getItem("userEmail");

    // Criando o estilo CSS dentro do JS
    const style = document.createElement('style');
    style.innerHTML = `
        /* Bloquear o fundo */
        #overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        
        /* Estilo do popup */
        #popup {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            text-align: center;
        }

        /* Estilo dos inputs e botões */
        #popup input {
            padding: 10px;
            width: 200px;
            margin-bottom: 10px;
            border-radius: 4px;
            border: 1px solid #ccc;
        }

        #popup button {
            padding: 10px 20px;
            margin: 5px;
            border: none;
            background-color: #4CAF50;
            color: white;
            cursor: pointer;
            border-radius: 4px;
        }

        #popup button.cancel {
            background-color: #f44336;
        }

        #popup button:hover {
            opacity: 0.8;
        }
    `;
    document.head.appendChild(style);

    try {
        const e = await fetch(`/users/${o}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        const t = await e.json();

        if (t.tokenAdmin) {
            // Criar o overlay (bloqueio do fundo) e o popup
            const overlay = document.createElement('div');
            overlay.id = 'overlay';

            const popup = document.createElement('div');
            popup.id = 'popup';

            // Criar a label e o campo de entrada para o token
            const label = document.createElement('label');
            label.textContent = "Digite o token de administrador:";
            const inputPassword = document.createElement('input');
            inputPassword.type = "password";
            inputPassword.placeholder = "Token de administrador";
            inputPassword.autofocus = true;

            // Botões de ação
            const submitButton = document.createElement('button');
            submitButton.textContent = "Submeter";
            const cancelButton = document.createElement('button');
            cancelButton.textContent = "Cancelar";
            cancelButton.classList.add('cancel');

            // Adiciona os elementos no popup
            popup.appendChild(label);
            popup.appendChild(inputPassword);
            popup.appendChild(submitButton);
            popup.appendChild(cancelButton);

            // Adiciona o popup e o overlay ao body
            overlay.appendChild(popup);
            document.body.appendChild(overlay);

            // Lógica do botão de submeter
            submitButton.addEventListener('click', () => {
                const userToken = inputPassword.value;
                if (btoa(userToken) !== t.tokenAdmin) {
                    alert("Token incorreto. Acesso negado.");
                    window.location.href = "chat-aurora.html";
                } else {
                    console.log("Token correto. Acesso permitido.");
                    // Você pode continuar a lógica para liberar o acesso
                }
                document.body.removeChild(overlay); // Remove o overlay
            });

            // Lógica do botão de cancelar (voltar para a home)
            cancelButton.addEventListener('click', () => {
                window.location.href = "chat-aurora.html"; // Redireciona para a home
                document.body.removeChild(overlay); // Remove o overlay
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
