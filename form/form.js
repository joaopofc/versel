import { initializeApp } from "https://www.gstatic.com/firebasejs/9.5.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.5.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB0DFXPILXxKAkjaKOHvgnppV3CY7xR9Cs",
  authDomain: "meu-checkout-web.firebaseapp.com",
  databaseURL: "https://meu-checkout-web-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "meu-checkout-web",
  storageBucket: "meu-checkout-web.firebasestorage.app",
  messagingSenderId: "422699934016",
  appId: "1:422699934016:web:7910537a1f8d5457929aa5",
  measurementId: "G-VRKRL1MR9S"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


document.getElementById("reg-btn").addEventListener('click', function () {
  document.getElementById("register-div").style.display = "inline";
  document.getElementById("login-div").style.display = "none";
});

document.getElementById("log-btn").addEventListener('click', function () {
  document.getElementById("register-div").style.display = "none";
  document.getElementById("login-div").style.display = "inline";

});

document.getElementById("login-btn").addEventListener('click', function () {
  const loginEmail = document.getElementById("login-email").value;
  const loginPassword = document.getElementById("login-password").value;

  signInWithEmailAndPassword(auth, loginEmail, loginPassword)
    .then((userCredential) => {
      const user = userCredential.user;
      const loginButton = document.getElementById('loginButton');
      // Exibir o loading
      loadingOverlay.style.display = 'flex';
      // Simular processo de login (ex.: validação de credenciais no servidor)
      localStorage.setItem('logado', true);
      setTimeout(() => {
        loadingOverlay.style.display = 'none';
        window.location.href = `dashboard.html?email=${loginEmail}&user=${user.uid}`;
        // Aqui você pode adicionar lógica para redirecionar o usuário ou lidar com o login
      }, 3000); // Aguarda 3 segundos


    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      document.getElementById("error-login").style.display = "inline";
      document.getElementById("error-login").innerHTML = "Usuário ou senha incorretos";
    });
});


document.getElementById("register-btn").addEventListener('click', function () {

  const registerEmail = document.getElementById("register-email").value;
  const registerPassword = document.getElementById("register-password").value;

  createUserWithEmailAndPassword(auth, registerEmail, registerPassword)
    .then((userCredential) => {
      const user = userCredential.user;
      document.getElementById("register-div").style.display = "none";
      document.getElementById("login-div").style.display = "inline";
      document.getElementById("login-email").value = registerEmail;
      document.getElementById("error-login").innerHTML = registerEmail + " foi registrado. Faça login!";
    }).catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      document.getElementById("error-regis").style.display = "inline";
      document.getElementById("error-regis").innerHTML = "Já existe um usuário com esse email. Clique em ENTRAR!";

    });
});


document.getElementById("log-out-btn").addEventListener('click', function () {
  signOut(auth).then(() => {
    document.getElementById("result-box").style.display = "none";
    document.getElementById("login-div").style.display = "inline";
  }).catch((error) => {
    document.getElementById("result").innerHTML = "Sorry ! <br>" + errorMessage;
  });

});



import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.5.0/firebase-auth.js";

// Mostrar a interface de redefinição de senha
document.getElementById("forgot-password-btn").addEventListener("click", () => {
  document.getElementById("login-div").style.display = "none";
  document.getElementById("reset-password-div").style.display = "inline";
});

document.getElementById("back").addEventListener("click", () => {
  document.getElementById("reset-password-div").style.display = "none";
  document.getElementById("login-div").style.display = "inline";
});

// Lidar com a redefinição de senha
document.getElementById("reset-password-btn").addEventListener("click", () => {
  const resetEmail = document.getElementById("reset-email").value;

  if (!resetEmail) {
    const message = document.getElementById("reset-message");
    message.style.display = "inline";
    message.innerHTML = "Por favor, insira um email válido.";
    message.style.color = "red";
    return;
  }

  sendPasswordResetEmail(auth, resetEmail)
    .then(() => {
      const message = document.getElementById("reset-message");

      document.getElementById("reset-password-div").style.display = "none";
      document.getElementById("login-div").style.display = "inline";
      document.getElementById("error-login").innerHTML = "Email de redefinição enviado! Verifique sua caixa de entrada.";
      document.getElementById("error-login").style.color = "green";

      setTimeout(() => {
        document.getElementById("error-login").innerHTML = "";
      }, 7000);
    })
    .catch((error) => {
      const message = document.getElementById("reset-message");
      message.style.display = "inline";
      if (error.code === "auth/user-not-found") {
        message.innerHTML = "Nenhum usuário encontrado com esse email.";

      } else {
        message.innerHTML = "Erro ao enviar o email. Tente novamente.";
      }
      message.style.color = "red";
    });
});

