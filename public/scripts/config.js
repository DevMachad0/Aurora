document.addEventListener("DOMContentLoaded", () => {
    const userNome = localStorage.getItem("userNome");
    const userEmail = localStorage.getItem("userEmail");
    const userTelefone = localStorage.getItem("userTelefone");
    const userPlano = localStorage.getItem("userPlano");
    const userTipo = localStorage.getItem("userTipo");
    const userDatabase = localStorage.getItem("userDatabase");
    const userDados = JSON.parse(localStorage.getItem("userDados"));

    document.querySelector(".info-box p:nth-child(2)").innerHTML = `<strong>Nome:</strong> ${userNome}`;
    document.querySelector(".info-box p:nth-child(3)").innerHTML = `<strong>E-mail:</strong> ${userEmail}`;
    document.querySelector(".info-box p:nth-child(4)").innerHTML = `<strong>Telefone:</strong> ${userTelefone}`;
    document.querySelector(".info-box p:nth-child(5)").innerHTML = `<strong>Plano:</strong> ${userPlano}`;
    document.querySelector(".info-box p:nth-child(6)").innerHTML = `<strong>Tipo:</strong> ${userTipo}`;

    // Carregar dados do array "dados" e exibir em profile-info
    const profileInfoContainer = document.querySelector(".profile-info");
    userDados.forEach(dado => {
        const inputContainer = document.createElement("div");
        const input = document.createElement("input");
        input.type = "text";
        input.value = dado;

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Excluir";
        deleteButton.classList.add("delete-button");

        inputContainer.appendChild(input);
        inputContainer.appendChild(deleteButton);
        profileInfoContainer.appendChild(inputContainer);

        deleteButton.addEventListener("click", () => {
            profileInfoContainer.removeChild(inputContainer);
        });
    });

    // Adicionar botão para adicionar nova linha de texto
    const addButton = document.createElement("button");
    addButton.textContent = "Adicionar Informação";
    addButton.classList.add("add-button");
    profileInfoContainer.appendChild(addButton);

    addButton.addEventListener("click", () => {
        const inputContainer = document.createElement("div");
        const newInput = document.createElement("input");
        newInput.type = "text";

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Excluir";
        deleteButton.classList.add("delete-button");

        inputContainer.appendChild(newInput);
        inputContainer.appendChild(deleteButton);
        profileInfoContainer.insertBefore(inputContainer, addButton);

        deleteButton.addEventListener("click", () => {
            profileInfoContainer.removeChild(inputContainer);
        });
    });

    // Obter status de armazenamento
    fetch("/api/storage-status", {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "User-Database": userDatabase
        }
    })
    .then(response => response.json())
    .then(data => {
        let emUsoFormatted;
        let emUsoUnit;
        let atualFormatted;
        let atualUnit;

        if (data.emUso < 1024) {
            emUsoFormatted = data.emUso.toFixed(2);
            emUsoUnit = 'Bytes';
        } else if (data.emUso < 1024 * 1024) {
            emUsoFormatted = (data.emUso / 1024).toFixed(2);
            emUsoUnit = 'KB';
        } else if (data.emUso < 1024 * 1024 * 1024) {
            emUsoFormatted = (data.emUso / (1024 * 1024)).toFixed(2);
            emUsoUnit = 'MB';
        } else {
            emUsoFormatted = (data.emUso / (1024 * 1024 * 1024)).toFixed(2);
            emUsoUnit = 'GB';
        }

        if (data.atual < 1024) {
            atualFormatted = data.atual.toFixed(2);
            atualUnit = 'Bytes';
        } else if (data.atual < 1024 * 1024) {
            atualFormatted = (data.atual / 1024).toFixed(2);
            atualUnit = 'KB';
        } else if (data.atual < 1024 * 1024 * 1024) {
            atualFormatted = (data.atual / (1024 * 1024)).toFixed(2);
            atualUnit = 'MB';
        } else {
            atualFormatted = (data.atual / (1024 * 1024 * 1024)).toFixed(2);
            atualUnit = 'GB';
        }

        document.querySelector(".storage-info").innerHTML = `
            <p><span class="dot blue"></span> Em Uso: ${emUsoFormatted} ${emUsoUnit}</p>
            <p><span class="dot cyan"></span> Atual: ${atualFormatted} ${atualUnit}</p>
            <p><strong>Total:</strong> ${data.total} GB</p>
        `;

        // Atualizar gráfico de armazenamento
        const totalBytes = data.total * 1024 * 1024 * 1024;
        let emUsoPercent = (data.emUso / totalBytes) * 100;
        if (emUsoPercent < 1 && data.emUso > 0) {
            emUsoPercent = 1; // Garantir que o valor mínimo seja 1%
        }
        const circle = document.querySelector(".circle");
        const innerCircle = document.querySelector(".inner-circle");

        innerCircle.style.height = `${emUsoPercent}%`;
        innerCircle.style.width = `${emUsoPercent}%`;
        circle.style.background = `conic-gradient(#007bff ${emUsoPercent}%, #00bcd4 ${emUsoPercent}% 100%)`;
    })
    .catch(error => console.error("Erro ao obter status de armazenamento:", error));

    const saveButton = document.querySelector(".save-button");
    const backButton = document.querySelector(".back-button");
    const tokenInput = document.getElementById("token");

    saveButton.addEventListener("click", async () => {
        const updatedDados = Array.from(document.querySelectorAll(".profile-info input")).map(input => input.value);
        const tokenAdmin = tokenInput.value;

        try {
            const response = await fetch("/users/update-dados", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ email: userEmail, dados: updatedDados })
            });

            if (response.ok) {
                localStorage.setItem("userDados", JSON.stringify(updatedDados));
                alert("Dados atualizados com sucesso!");
            } else {
                const errorData = await response.json();
                alert(`Erro ao atualizar dados: ${errorData.error}`);
            }

            // Atualizar tokenAdmin
            const tokenResponse = await fetch("/users/update-token-admin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ email: userEmail, tokenAdmin })
            });

            if (tokenResponse.ok) {
                alert("Token atualizado com sucesso!");
            } else {
                const errorData = await tokenResponse.json();
                alert(`Erro ao atualizar token: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Erro ao atualizar dados:", error);
            alert("Erro ao atualizar dados.");
        }
    });

    backButton.addEventListener("click", () => {
        window.location.href = "chat-aurora.html";
    });
});
