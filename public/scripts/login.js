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
      window.location.href = 'chat-aurora.html';
    } else {
      alert(data.error);
    }
  });
  