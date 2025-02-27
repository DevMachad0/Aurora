document.addEventListener("DOMContentLoaded", () => {
    const userNome = localStorage.getItem("userNome");
    const userEmail = localStorage.getItem("userEmail");
    const userTelefone = localStorage.getItem("userTelefone");
    const userPlano = localStorage.getItem("userPlano");
    const userTipo = localStorage.getItem("userTipo");

    document.querySelector(".info-box p:nth-child(2)").innerHTML = `<strong>Nome:</strong> ${userNome}`;
    document.querySelector(".info-box p:nth-child(3)").innerHTML = `<strong>E-mail:</strong> ${userEmail}`;
    document.querySelector(".info-box p:nth-child(4)").innerHTML = `<strong>Telefone:</strong> ${userTelefone}`;
    document.querySelector(".info-box p:nth-child(5)").innerHTML = `<strong>Plano:</strong> ${userPlano}`;
    document.querySelector(".info-box p:nth-child(6)").innerHTML = `<strong>Tipo:</strong> ${userTipo}`;
});
