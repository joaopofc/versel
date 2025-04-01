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



document.addEventListener("DOMContentLoaded", () => {
    const productList = document.getElementById("product-list");
    const modal = document.getElementById("product-modal");
    const btnAdd = document.getElementById("btn-add");
    const saveProduct = document.getElementById("save-product");
    const closeModal = document.getElementById("close-modal");

    const productName = document.getElementById("name");
    const productPrice = document.getElementById("price");
    const productDescription = document.getElementById("description");
    const image = document.getElementById("image");
    const banner = document.getElementById("banner");
    const url_produto = document.getElementById("url_produto");

    const emailVendedor = "joao@pix.com";
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
        modal.classList.add("active");
        productPrice = '0,00';

        editingProductId = null;
        clearForm();
    });

    closeModal.addEventListener("click", () => {
        modal.classList.remove("active");
        editingProductId = null;
        clearForm();
    });

    saveProduct.addEventListener("click", async () => {
        const name = productName.value;
        const price = productPrice.value;

        if (name && price) {
            if (editingProductId) {
                await productRef.child(editingProductId).update({
                    banner_img: banner.value,
                    preco: parseFloat(price),
                    countdown: true,
                    descricao: productDescription.value,
                    email_vendedor: emailVendedor,
                    imagem: image.value,
                    nome: name,
                    nome_vendedor: 'João',
                    preco_original: '97',
                    url_button: url_produto.value,
                });
            } else {
                const newProductId = await generateUniqueId();
                await productRef.child(newProductId).set({
                    banner_img: banner.value,
                    preco: parseFloat(price).replace(",", "."),
                    countdown: true,
                    descricao: productDescription.value,
                    email_vendedor: emailVendedor,
                    imagem: image.value,
                    nome: name,
                    nome_vendedor: 'João',
                    preco_original: '97',
                    url_button: url_produto.value,
                });
            }
            modal.classList.remove("active");
            loadProducts(emailVendedor);
        }
    });

    function loadProducts(vendedorEmail) {
        productList.innerHTML = "";
        productRef.orderByChild("email_vendedor").equalTo(vendedorEmail).once("value", snapshot => {
            snapshot.forEach(childSnapshot => {
                const product = childSnapshot.val();
                const productId = childSnapshot.key; // ID do produto
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${product.nome}</td>
                    <td>R$ ${product.preco.toFixed(2).replace(".", ",")}</td>
                    <td>Ativo</td>
                    <td>
                        <button class="btn-edit" data-id="${productId}"><i data-id="${productId}" class="fa-solid fa-pen"></i></button>
                        <button class="btn-delete" data-id="${productId}"><i data-id="${productId}" class="fa-solid fa-trash"></i></button>
                        <button class="btn-link" data-id="${productId}"><i data-id="${productId}" class="fa-solid fa-copy"></i></button>                        
                    </td>
                `;
                productList.appendChild(row);
            });

            document.querySelectorAll(".btn-edit").forEach(button => {
                button.addEventListener("click", (event) => {
                    const productId = event.target.getAttribute("data-id");
                    editProduct(productId); // Passa o productId para a função editProduct
                });
            });

            document.querySelectorAll(".btn-delete").forEach(button => {
                button.addEventListener("click", (event) => {
                    const productId = event.target.getAttribute("data-id");
                    deleteProduct(productId);
                });
            });

            document.querySelectorAll(".btn-link").forEach(button => {
                button.addEventListener("click", (event) => {
                    const productId = event.target.getAttribute("data-id");
                    navigator.clipboard.writeText('https://ipat.shop/?pv=' + productId).then(() => {
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
                modal.classList.add("active");
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
        productPrice.value = "";
        productDescription.value = "";
        image.value = "";
        banner.value = "";
        url_produto.value = "";
    }

    loadProducts(emailVendedor);
});



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



const productRef = firebase.database().ref("produtos/");
const emailVendedor = "joao@pix.com"; // Substitua pelo email real do vendedor

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
    },2000);
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
document.getElementById('img2').addEventListener('click', () => {
    localStorage.removeItem('email');
    localStorage.removeItem('userid');
    redirectToLogin();
});