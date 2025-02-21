document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  const res = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, senha }),
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userName', data.user.usuario); // Nome do usuário
    localStorage.setItem('userEmail', data.user.email); // E-mail do usuário
    localStorage.setItem('userEmpresa', data.user.empresa); // Empresa do usuário
    localStorage.setItem('userLicenca', data.user.licenca); // Licença do usuário
    localStorage.setItem('userPlano', data.user.plano); // Plano do usuário
    localStorage.setItem('userDados', JSON.stringify(data.user.dados)); // Dados do usuário
    localStorage.setItem('userDatabase', data.user.database); // Database do usuário
    localStorage.setItem('userCreatedAt', data.user.createdAt); // Data de criação do usuário
    localStorage.setItem('userUpdatedAt', data.user.updatedAt); // Data de atualização do usuário

    window.location.href = 'chat-aurora.html';
  } else {
    alert(data.error);
  }
});
