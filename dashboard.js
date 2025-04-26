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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let prodSp = null;
let token = null;


document.addEventListener("DOMContentLoaded", () => {
    const productList = document.getElementById("product-list");
    const modal = document.getElementById("product-modal");
    const modalOverlay = document.getElementById("modal-overlay");
    const config = document.getElementById("config-modal");
    const configOverlay = document.getElementById("config-overlay");
    const btnAdd = document.getElementById("btn-add");
    const btnConfig = document.getElementById("btn-config");
    const btnConfigSave = document.getElementById("btn-config-save");

    const saveProduct = document.getElementById("save-product");
    const closeModal = document.getElementById("close-modal");
    const countProd = document.getElementById("count-prod");
    const closeModalConfig = document.getElementById("close-modal-config");

    const countdownToggle = document.getElementById("countdown-toggle");
    const tokenInput = document.getElementById("token-input");
    const productName = document.getElementById("name");
    const name_vendedor = document.getElementById("nome_vendedor");
    const productPrice = document.getElementById("price");
    const status = document.getElementById("status");
    const productDescription = document.getElementById("description");
    const image = document.getElementById("image");
    const banner = document.getElementById("banner");
    const url_produto = document.getElementById("url_produto");

    const emailVendedor = localStorage.getItem('email'); // Substitua pelo email real do vendedor

    const productRef = firebase.database().ref("produtos/");

    let editingProductId = null;


    async function generateUniqueId() {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let id;
        let exists = true;

        while (exists) {
            id = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
            const snapshot = await productRef.child(id).once("value");
            exists = snapshot.exists();
        }
        return id;
    }

    btnAdd.addEventListener("click", () => {
        token = localStorage.getItem('token');
        if (token === "" || token === null) {
            showToast("Preencha o token!", "error");
            config.classList.add("active");
            configOverlay.classList.add("active");
        } else if (token.length < 66) {
            showToast("Token inválido!", "error");
            config.classList.add("active");
            configOverlay.classList.add("active");

        } else {
            modal.classList.add("active");
            modalOverlay.classList.add("active");
            editingProductId = null;
            clearForm();
        }
    });


    btnConfig.addEventListener("click", () => {
        config.classList.add("active");
        configOverlay.classList.add("active");

        editingProductId = null;
        clearForm();
    });

    btnConfigSave.addEventListener("click", () => {
        if (tokenInput.value.length < 66) {
            showToast("Token inválido!", "error");
        } else if (tokenInput.value === "") {
            showToast("Preencha o token!", "error");
        } else {
            showToast("Token salvo com sucesso!", "success");
            config.classList.remove("active");
            configOverlay.classList.remove("active");

            const dataRef = firebase.database().ref('dados/');
            dataRef.child(emailVendedor.replace(/@/g, "---").replace(/\./g, "--")).update({
                token: tokenInput.value
            }).then(() => {
                console.log("Token atualizado com sucesso.");
                localStorage.setItem('token', tokenInput.value);
                token = tokenInput.value;
            }).catch(error => {
                console.error("Erro ao atualizar o token:", error);
            });






        }
    });

    closeModal.addEventListener("click", () => {
        modal.classList.remove("active");
        modalOverlay.classList.remove("active");
        editingProductId = null;
        clearForm();
    });

    closeModalConfig.addEventListener("click", () => {
        config.classList.remove("active");
        configOverlay.classList.remove("active");
        modalOverlay.classList.remove("active");
        editingProductId = null;
        clearForm();
    });

    // Carregar o token do LocalStorage
    function loadToken() {
        const dataRef = firebase.database().ref('dados/');

        dataRef.child(emailVendedor.replace(/@/g, "---").replace(/\./g, "--")).once("value").then(snapshot => {
            const data = snapshot.val();
            if (!data.token) {
                console.error("Token não encontrado no banco de dados.");
                showToast("Token não encontrado no banco de dados. Entrar em contato com suporte.", "error");
                localStorage.removeItem('token');
                return;
            } else if (data.token.length < 66) {
                console.error("Token inválido no banco de dados.");
                showToast("Token inválido no banco de dados. Atualize seu Token.", "error");
                localStorage.removeItem('token');
                return;
            } else {
                localStorage.setItem('token', data.token);
                document.getElementById("token-input").value = data.token;
            }
        }).catch(error => {
            console.error("Erro ao carregar o token:", error);
        });

    }
    loadToken();

    saveProduct.addEventListener("click", async () => {
        saveProduct.disabled = true;
        setTimeout(() => {
            saveProduct.disabled = false;
        }, 3000); // Desabilita o botão por 2 segundos
        const name = productName.value;
        const nome_vendedor = name_vendedor.value;
        const price = productPrice.value;
        const countdownValue = document.getElementById('countdown-toggle').checked;


        const inputs = [
            document.getElementById('image').value.trim(),
            document.getElementById('banner').value.trim(),
            document.getElementById('url_produto').value.trim()
        ];

        const todosValidos = inputs.every(url => url.startsWith('https'));

        if (todosValidos) {
            if (name && price !== "0,00") {
                if (editingProductId) {
                    await productRef.child(editingProductId).update({
                        banner_img: banner.value,
                        preco: parseFloat(price.replace(",", ".")),
                        countdown: countdownValue,
                        descricao: productDescription.value,
                        email_vendedor: emailVendedor,
                        imagem: image.value,
                        nome: name,
                        nome_vendedor: nome_vendedor,
                        preco_original: 'R$97,00',
                        url_button: url_produto.value,
                        token: localStorage.getItem('token')
                    });
                } else {
                    const newProductId = await generateUniqueId();
                    await productRef.child(newProductId).set({
                        banner_img: banner.value,
                        preco: parseFloat(price.replace(",", ".")),
                        countdown: countdownValue,
                        descricao: productDescription.value,
                        email_vendedor: emailVendedor,
                        imagem: image.value,
                        nome: name,
                        nome_vendedor: nome_vendedor,
                        preco_original: 'R$97,00',
                        url_button: url_produto.value,
                        status: "ATIVO",
                        token: localStorage.getItem('token'),
                    });
                }
                modal.classList.remove("active");
                modalOverlay.classList.remove("active");
                loadProducts(emailVendedor);

            } else {
                showToast("Preencha todos os campos corretamente!", "error");
            }

        } else {
            showToast("Preencha todos os campos corretamente!", "error");
        };
    });


    function loadProducts(vendedorEmail) {
        productRef.orderByChild("email_vendedor").equalTo(vendedorEmail).once("value", snapshot => {
            productList.innerHTML = "";
            countProd.innerHTML = snapshot.numChildren();
            snapshot.forEach(childSnapshot => {
                const product = childSnapshot.val();
                const productId = childSnapshot.key;

                const card = document.createElement("div");
                card.className = "card-produto";

                card.innerHTML = `
            
                <img src="${product.imagem || 'https://i.pinimg.com/736x/05/3d/1e/053d1e19206de76b0a758c444db24f68.jpg'}" class="capa-produto" alt="Imagem do produto">
                <div class="info-produto">
                    <h3 class="nome-produto" title="${product.nome}">${product.nome}</h3>
                    <div style="display: flex; justify-content: start; align-items: center;">
                    <p class="tipo-produto">R$ ${product.preco.toFixed(2).replace(".", ",")}</p>
                    <span class="tag ${product.status || 'ATIVO'}" id="status" style="margin-left: 10px;">${product.status || 'ATIVO'}</span>
                    <span class="tag tipo" style="margin-left: 10px;">${product.categoria || 'AFILIAÇÃO'}</span>
                    </div>
                    <div class="tags" style="justify-content: end; align-items: center; margin-right: 10px;">
                        <button class="btn-edit ${product.status || 'ATIVO'}p" title="Editar produto." data-id="${productId}"><i data-id="${productId}" class="fa-solid fa-pen"></i></button>
                        <button class="btn-delete ${product.status || 'ATIVO'}p" title="Deletar produto." data-id="${productId}"><i data-id="${productId}" class="fa-solid fa-trash"></i></button>
                        <button class="btn-link ${product.status || 'ATIVO'}p" title="Copiar URL." data-id="${productId}"><i data-id="${productId}" class="fa-solid fa-copy"></i></button>
                    </div>
                </div>
        `;
                if (productList.innerHTML === null || productList.innerHTML === undefined || productList.innerHTML === "") {
                    document.getElementById("fake-product-list").innerHTML = `<div class="card-produto-placeholder placeholder">
                        <div class="capa-produto-placeholder shimmer"></div>

                        <div class="info-produto-placeholder">
                            <div class="nome-placeholder shimmer"></div>

                            <div class="linhas-tags">
                                <div class="preco-placeholder shimmer"></div>
                                <div class="tag-placeholder shimmer"></div>
                                <div class="tag-placeholder shimmer"></div>
                            </div>

                            <div class="botoes-placeholder">
                                <div class="botao-placeholder shimmer"></div>
                                <div class="botao-placeholder shimmer"></div>
                                <div class="botao-placeholder shimmer"></div>
                            </div>
                        </div>
                    </div>
                    <div class="card-produto-placeholder placeholder">
                        <div class="capa-produto-placeholder shimmer"></div>

                        <div class="info-produto-placeholder">
                            <div class="nome-placeholder shimmer"></div>

                            <div class="linhas-tags">
                                <div class="preco-placeholder shimmer"></div>
                                <div class="tag-placeholder shimmer"></div>
                                <div class="tag-placeholder shimmer"></div>
                            </div>

                            <div class="botoes-placeholder">
                                <div class="botao-placeholder shimmer"></div>
                                <div class="botao-placeholder shimmer"></div>
                                <div class="botao-placeholder shimmer"></div>
                            </div>
                        </div>
                    </div>
                    <div class="card-produto-placeholder placeholder">
                        <div class="capa-produto-placeholder shimmer"></div>

                        <div class="info-produto-placeholder">
                            <div class="nome-placeholder shimmer"></div>

                            <div class="linhas-tags">
                                <div class="preco-placeholder shimmer"></div>
                                <div class="tag-placeholder shimmer"></div>
                                <div class="tag-placeholder shimmer"></div>
                            </div>

                            <div class="botoes-placeholder">
                                <div class="botao-placeholder shimmer"></div>
                                <div class="botao-placeholder shimmer"></div>
                                <div class="botao-placeholder shimmer"></div>
                            </div>
                        </div>
                    </div>`;
                } else {
                    document.getElementById("fake-product-list").innerHTML = "";
                }
                productList.appendChild(card);

            });



            document.getElementById("fake-product-list").innerHTML = ""; // Limpa o conteúdo do fake-product-list




            document.querySelectorAll(".btn-edit").forEach(button => {
                button.addEventListener("click", (event) => {
                    const productId = event.target.getAttribute("data-id");
                    editProduct(productId); // Passa o productId para a função editProduct
                });
            });

            document.querySelectorAll(".btn-delete").forEach(button => {
                button.addEventListener("click", (event) => {
                    const productId = event.target.getAttribute("data-id");
                    document.querySelector(".confirmar").setAttribute("data-id", productId);
                    abrirPopup();
                });
            });
            
            
            document.querySelectorAll(".confirmar").forEach(button => {
                button.addEventListener("click", (event) => {
                    const productId = event.target.getAttribute("data-id");
                    productRef.child(productId).remove();
                    loadProducts(emailVendedor);
                    fecharPopup();
                });
            });
            document.querySelectorAll(".cancelar").forEach(button => {
                button.addEventListener("click", (event) => {
                    event.target.getAttribute("data-id") = null;
                    fecharPopup();
                });
            });

            document.querySelectorAll(".btn-link").forEach(button => {
                button.addEventListener("click", (event) => {
                    const productId = event.target.getAttribute("data-id");
                    navigator.clipboard.writeText('https://ipat.shop/' + productId).then(() => {
                        showToast("Link copiado para área de transferencia!", "success");

                    }).catch(err => {
                        console.error("Erro ao copiar o ID do produto: ", err);
                    });
                });
            });


        });
    }


    function editProduct(productId) {
        if (!productId) {
            console.error("ID do produto inválido");
            return;
        }

        productRef.child(productId).once("value", snapshot => {
            const product = snapshot.val();
            if (product) {
                productName.value = product.nome;
                productPrice.value = product.preco;
                productDescription.value = product.descricao;
                image.value = product.imagem;
                banner.value = product.banner_img;
                url_produto.value = product.url_button;
                nome_vendedor.value = product.nome_vendedor;
                countdownToggle.checked = product.countdown;
                modal.classList.add("active");
                modalOverlay.classList.add("active");
                editingProductId = productId;
            } else {
                console.error("Produto não encontrado");
            }
        });
    }

    function deleteProduct(productId) {
        if (confirm("Tem certeza que deseja excluir este produto?")) {
            productRef.child(productId).remove();
            loadProducts(emailVendedor);
        }

    }

    function clearForm() {
        productName.value = "";
        productPrice.value = "0,00";
        productDescription.value = "";
        image.value = "";
        banner.value = "";
        nome_vendedor.value = "";
        url_produto.value = "";
    }

    loadProducts(emailVendedor);


});


function abrirPopup() {
    document.getElementById('popup-confirmacao').style.display = 'flex';
}

function fecharPopup() {
    document.getElementById('popup-confirmacao').style.display = 'none';
}

function confirmarAcao(prodIdDelete) {
    fecharPopup();
    productRef.child(prodIdDelete).remove();
    loadProducts(emailVendedor);
    // Aqui você coloca a ação real, tipo deletar item:
    console.log("Produto deletado com sucesso!");
    loadProducts(emailVendedor);

};




function showToast(message, type) {
    const toastContainer = document.getElementById("toast-container");

    const toast = document.createElement("div");
    toast.classList.add("toast");
    toast.classList.add(type);  // Adiciona a classe 'success' ou 'error'
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Remove o toast após 4 segundos
    setTimeout(() => {
        toast.remove();
    }, 4000);
}



const productRef = firebase.database().ref("produtos/")
let emailVendedor = localStorage.getItem('email'); // Use 'let' para permitir reatribuição, se necessário.


async function updateDashboard() {
    let totalFaturamento = 0;
    let totalVendas = 0;
    let totalTicketMedio = 0;
    let totalVendasPerdidas = 0;
    let totalFaturamentoPerdido = 0;

    // Percorre todos os produtos
    await productRef.once("value", snapshot => {
        snapshot.forEach(productSnapshot => {
            const product = productSnapshot.val();
            const productId = productSnapshot.key;

            // Verifica se o produto pertence ao vendedor
            if (product.email_vendedor === emailVendedor) {
                const ordersRef = productRef.child(productId).child("pedidos");

                ordersRef.once("value", ordersSnapshot => {
                    ordersSnapshot.forEach(orderSnapshot => {
                        const order = orderSnapshot.val();

                        // Verifica se o pedido está APROVADO e tem preço válido
                        if (order.status === "approved" && !isNaN(order.preco)) {
                            totalFaturamento += parseFloat(order.preco);
                            totalVendas++;
                            totalTicketMedio += parseFloat(order.preco);
                        }
                        if (order.status === "pending" && !isNaN(order.preco)) {
                            totalFaturamentoPerdido += parseFloat(order.preco);
                            totalVendasPerdidas++;
                        }
                    });

                    // Atualiza o Ticket Médio após processar os pedidos
                    const ticketMedioValue = totalVendas > 0 ? totalTicketMedio / totalVendas : 0;

                    // Atualiza o dashboard
                    document.getElementById("faturamento").textContent = `R$ ${totalFaturamento.toFixed(2).replace(".", ",")}`;
                    document.getElementById("totalVendas").textContent = totalVendas;
                    document.getElementById("ticketMedio").textContent = `R$ ${ticketMedioValue.toFixed(2).replace(".", ",")}`;
                    document.getElementById("quantPix").textContent = totalVendasPerdidas + totalVendas;
                    document.getElementById("pixValue").textContent = `R$ ${totalFaturamentoPerdido.toFixed(2).replace(".", ",")}`;
                });
            }
        });
    });
}

// Chama a função para atualizar o dashboard
updateDashboard();



document.getElementById("price").addEventListener("input", function (event) {
    let value = event.target.value;

    // Remove qualquer caractere que não seja número
    value = value.replace(/\D/g, "");

    // Garante que sempre tenha ao menos 3 dígitos (para manter a estrutura "0,00")
    while (value.length < 3) {
        value = "0" + value;
    }

    // Adiciona a vírgula para os centavos
    let integerPart = value.slice(0, value.length - 2);
    let decimalPart = value.slice(value.length - 2);
    value = integerPart + "," + decimalPart;

    // Se a parte inteira for apenas '0' e há um número diferente de zero nos centavos, mantém o zero à esquerda
    if (integerPart === "0" && decimalPart !== "00") {
        value = "0," + decimalPart;
    } else {
        // Remove o zero da parte inteira apenas quando houver um número maior que zero nela
        value = value.replace(/^0+(?=\d,)/, '');
    }

    // Atualiza o campo com o valor formatado
    event.target.value = value;
});




function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Variáveis globais
let uid = localStorage.getItem('userid');
const email = getQueryParam('email');

// Verificar UID na URL
if (!uid) {
    uid = getQueryParam('user');
    if (uid) {
        localStorage.setItem('userid', uid);
        // Limpar a URL
        window.history.replaceState({}, document.title, "/dashboard");
    } else {
        redirectToLogin(); // UID ausente na URL e no LocalStorage
    }
}

// Configuração do Firebase com 

// Mostrar email salvo
if (email) {
    localStorage.setItem('email', email);
}
const savedEmail = localStorage.getItem('email');
if (savedEmail) {
    const userEmailP = document.getElementById("user-email");
    userEmailP.textContent = savedEmail;
    console.log(`Bem-vindo de volta, ${savedEmail}!`);
} else {
    redirectToLogin();
}

// Redirecionar para login
function redirectToLogin() {
    localStorage.removeItem('email');
    localStorage.removeItem('userid');
    setTimeout(() => {
        window.location.href = `login.html?logout=true`;
    }, 2000);
}


function redirectToLogin() {
    localStorage.removeItem('email');
    localStorage.removeItem('userid');
    setTimeout(() => {
        window.location.href = `login.html?logout=true`;
    }, 2000);
}



// Configuração pós-carregamento
window.onload = () => {
    setTimeout(() => {
        if (!uid || !savedEmail) {
            redirectToLogin();
        } else {
        }
    }, 2000);
};

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('email');
    localStorage.removeItem('userid');
    redirectToLogin();
});