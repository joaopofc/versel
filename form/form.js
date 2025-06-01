import { initializeApp } from "https://www.gstatic.com/firebasejs/9.5.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.5.0/firebase-auth.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/9.5.0/firebase-database.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.5.0/firebase-auth.js";

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
const db = getDatabase(app);




document.addEventListener("DOMContentLoaded", async () => {

  const ipData = await fetch("https://ipapi.co/json/")
        .then(res => res.json())
        .catch(() => null);

      const ip = ipData?.ip || "Desconhecido";
      const cidade = ipData?.city || "N/A";
      const uf = ipData?.region_code || "N/A";
      const pais = ipData?.country_name || "N/A";

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

    if (loginEmail === "" || loginPassword === "") {
      showMsg("Preencha todos os campos.", "error");
      return;
    }



    signInWithEmailAndPassword(auth, loginEmail, loginPassword)
      .then((userCredential) => {
        const user = userCredential.user;

        // Exibe carregando
        localStorage.setItem('logado', true);
        document.getElementById('loadingOverlay').style.display = 'flex';

        setTimeout(() => {
          document.getElementById('loadingOverlay').style.display = 'none';
          window.location.href = `dashboard.html?email=${loginEmail}&user=${user.uid}`;
        }, 3000);
      })
      .catch((error) => {
        showMsg("Usuário ou senha incorretos.", "error");
      });
  });



  document.getElementById("register-btn").addEventListener('click', function () {
    const registerEmail = document.getElementById("register-email").value;
    const registerPassword = document.getElementById("register-password").value;
    const name = document.getElementById("register-name").value;
    const tel = document.getElementById("register-tel").value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    function formatarEmailParaChave(email) {
      return email.replace(/@/g, "---").replace(/\./g, "--");
    }
  
    if (registerEmail === "" || registerPassword === "" || name === "" || tel === "") {
      showMsg("Preencha todos os campos.", "error");
      return;
    } else if (registerPassword.length < 6) {
      showMsg("A senha deve ter pelo menos 6 caracteres.", "error");
      return;
    } else if (tel.length < 17) {
      showMsg("O telefone deve ter pelo menos 11 dígitos.", "error");
      return;
    } else {
      createUserWithEmailAndPassword(auth, registerEmail, registerPassword)
        .then((userCredential) => {
          const user = userCredential.user;
          user.getIdToken().then((token) => {
            const emailChave = formatarEmailParaChave(registerEmail);
            const dadosRef = ref(db, 'dados/' + emailChave);
  
            get(dadosRef).then((snapshot) => {
              if (snapshot.exists()) {
                showMsg("Usuário já registrado no banco. Nada será feito.", "error");
              } else {
                set(dadosRef, {
                  email: registerEmail,
                  name: name,
                  userdata: {
                    ip: ip,
                    cidade: cidade + ' ' + uf
                  },
                  tel: tel.replace(/[+\- ]/g, ''), // <-- correção aqui
                  token: '',
                  webhook: ''
                }).then(() => {
                  localStorage.setItem('logado', true);
                  document.getElementById('loadingOverlay').style.display = 'flex';
  
                  setTimeout(() => {
                    document.getElementById('loadingOverlay').style.display = 'none';
                    window.location.href = `dashboard.html?email=${registerEmail}&user=${user.uid}`;
                  }, 4000);
                }).catch((error) => {
                  console.error("Erro ao salvar dados:", error);
                });
              }
            }).catch((error) => {
              console.error("Erro ao verificar existência do caminho:", error);
            });
          });
        }).catch((error) => {
          if (error.code === "auth/email-already-in-use") {
            showMsg("Este email já está cadastrado. Clique em ENTRAR!", "error");
          } else {
            showMsg("Erro ao registrar: " + error.message, "error");
          }
        });
    }
  });
  


  document.getElementById("log-out-btn").addEventListener('click', function () {
    signOut(auth).then(() => {
      document.getElementById("result-box").style.display = "none";
      document.getElementById("login-div").style.display = "inline";
    }).catch((error) => {
      document.getElementById("result").innerHTML = "Sorry ! <br>" + errorMessage;
    });

  });





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
      showMsg("Por favor, insira um email válido.", "error");
      return;
    }

    sendPasswordResetEmail(auth, resetEmail)
      .then(() => {
        const message = document.getElementById("reset-message");

        document.getElementById("reset-password-div").style.display = "none";
        document.getElementById("login-div").style.display = "inline";
        showMsg("Email de redefinição enviado! Verifique sua caixa de entrada.", "success");
      })
      .catch((error) => {
        const message = document.getElementById("reset-message");
        message.style.display = "inline";
        if (error.code === "auth/user-not-found") {
          showMsg("Nenhum usuário encontrado com esse email.", "error");
        } else {
          showMsg("Erro ao enviar o email. Tente novamente.", "error");
        }
        message.style.color = "red";
      });
  });



  document.getElementById('register-tel').addEventListener('input', function (e) {
    let value = e.target.value
    value = value.replace(/\D/g, '').replace(/^55/, '+55 ')
    if (value.length > 6) {
      value = value.replace(/^(\+55\s\d{2})(\d)/, '$1 $2')
    }
    if (value.length > 11) {
      value = value.replace(/(\d{5})(\d{4})$/, '$1-$2')
    }
    e.target.value = value
  })
  var tell = document.getElementById('tel');

});