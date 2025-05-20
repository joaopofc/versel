// Configuração do Firebase
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

// Variáveis globais
let prodSp = null;
let token = null;
let emailVendedor = null;
let productRef = database.ref("produtos/");
let currentPage = 'dashboard';
let currentProductId = null;
let orderbumpEditandoId = null;

// Função para inicializar a aplicação
document.addEventListener("DOMContentLoaded", () => {
    // Elementos da interface
    const productList = document.getElementById("product-list");
    const modal = document.getElementById("product-modal");
    const modalOverlay = document.getElementById("modal-overlay");
    const config = document.getElementById("config-modal");
    const orderModal = document.getElementById("order-modal");
    const configOverlay = document.getElementById("config-overlay");
    const orderOverlay = document.getElementById("order-overlay");
    const btnAdd = document.getElementById("btn-add");
    const btnConfig = document.getElementById("btn-config");
    const btnOrder = document.querySelector('.btn-order');
    const btnConfigSave = document.getElementById("btn-config-save");
    const btnOrderSave = document.getElementById("btn-order-save");
    const saveProduct = document.getElementById("save-product");
    const saveOrder = document.getElementById("save-order");
    const addOrderBumpBtn = document.getElementById("btn-add-order");

    const closeModal = document.getElementById("close-modal");
    const closeModalOrder = document.getElementById("close-modal-order");
    const countProd = document.getElementById("count-prod");
    const closeModalConfig = document.getElementById("close-modal-config");
    const countdownToggle = document.getElementById("countdown-toggle");
    const tokenInput = document.getElementById("token-input");
    const webhook = document.getElementById("webhook-input");
    const productName = document.getElementById("name");
    const name_vendedor = document.getElementById("nome_vendedor");
    const productPrice = document.getElementById("price");
    const productDescription = document.getElementById("description");
    const image = document.getElementById("image");
    const banner = document.getElementById("banner");
    const url_produto = document.getElementById("url_produto");
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");

    // Navegação SPA
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    // Verificar autenticação
    checkAuth();

    // Carregar token
    loadToken();

    // Menu toggle para mobile
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });


    // Navegação entre páginas
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');

            // Atualizar navegação ativa
            navLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');

            // Esconder todas as páginas
            pages.forEach(p => p.classList.remove('active'));

            // Mostrar página selecionada
            document.getElementById(`${page}-page`).classList.add('active');
            currentPage = page;

            // Atualizar título
            document.querySelector(`#${page}-page h1`).scrollIntoView();

            // Carregar dados específicos da página
            if (page === 'buyers') {
                loadBuyers();
            }

            // Fechar menu mobile se estiver aberto
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    });

    // Função para carregar compradores
    function loadBuyers() {
        const buyersList = document.getElementById("buyers-list");
        const filterStatus = document.getElementById("filter-status").value;
        const searchTerm = document.getElementById("search-buyer").value.toLowerCase();

        buyersList.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Carregando compradores...</td></tr>';

        let totalBuyers = 0;
        let approvedBuyers = 0;
        let pendingBuyers = 0;
        let allOrders = []; // Array para armazenar todos os pedidos antes de ordenar

        productRef.once("value", snapshot => {
            buyersList.innerHTML = '';
            allOrders = []; // Resetar array

            snapshot.forEach(productSnapshot => {
                const product = productSnapshot.val();
                const productId = productSnapshot.key;

                if (product.email_vendedor === emailVendedor) {
                    const ordersRef = productRef.child(productId).child("pedidos");

                    ordersRef.once("value", ordersSnapshot => {
                        ordersSnapshot.forEach(orderSnapshot => {
                            const order = orderSnapshot.val();
                            const orderId = orderSnapshot.key;

                            const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
                            const matchesSearch = searchTerm === '' ||
                                (order.nome && order.nome.toLowerCase().includes(searchTerm)) ||
                                (order.email && order.email.toLowerCase().includes(searchTerm));

                            if (matchesStatus && matchesSearch) {
                                totalBuyers++;
                                if (order.status === "approved") approvedBuyers++;
                                if (order.status === "pending") pendingBuyers++;
                                if (order.status === "cancelled") pendingBuyers++;

                                // Formatar data e criar objeto Date para ordenação
                                let dataObj = null;
                                let dataFormatada = 'N/A';

                                if (order.data && order.data.data) {
                                    const [dia, mes, ano] = order.data.data.split('/');
                                    dataFormatada = `${dia}/${mes}/${ano}`;
                                    dataObj = new Date(`${mes}/${dia}/${ano}`); // Criar objeto Date para ordenação
                                }

                                // Armazenar todos os pedidos com informações necessárias
                                allOrders.push({
                                    order,
                                    product,
                                    productId,
                                    orderId,
                                    dataFormatada,
                                    dataObj // Usaremos isso para ordenação
                                });
                            }
                        });

                        // Ordenar pedidos pela data (mais recente primeiro)
                        allOrders.sort((a, b) => {
                            if (!a.dataObj && !b.dataObj) return 0;
                            if (!a.dataObj) return 1; // Sem data vai para o final
                            if (!b.dataObj) return -1; // Sem data vai para o final
                            return b.dataObj - a.dataObj; // Ordem decrescente
                        });

                        // Limpar a lista antes de adicionar os itens ordenados
                        buyersList.innerHTML = '';

                        // Adicionar pedidos ordenados à tabela
                        allOrders.forEach(item => {
                            const { order, product, productId, orderId, dataFormatada } = item;

                            const row = document.createElement('tr');
                            row.innerHTML = `
                            <td class="col-1"><strong>${order.nome || 'N/A'}</strong></br>${order.email || 'N/A'}</td>
                            <td>${product.nome || 'N/A'}</td>
                            <td>R$ ${order.preco ? parseFloat(order.preco).toFixed(2).replace('.', ',') : '0,00'}</td>
                            <td><span class="status-badge status-${order.status || 'pending'}">${order.status === 'approved' ? 'Aprovado' :
                                    order.status === 'pending' ? 'Pendente' :
                                        order.status === 'cancelled' ? 'Cancelado' : order.status === 'rejected' ? 'Cancelado' : 'N/A'
                                }</span></td>
                            <td>${dataFormatada}</td>
                            <td class="buyer-actions">
                                <button class="btn-sm btn-view" data-id="${orderId}" data-product="${productId}">
                                    <i class="fas fa-eye"></i> Ver
                                </button>
                                <button class="btn-sm btn-contact" onclick="window.open('mailto:${order.email || ''}?subject=Compra do produto ${product.nome || ''}')">
                                    <i class="fas fa-envelope"></i> Email
                                </button>
                            </td>
                        `;
                            buyersList.appendChild(row);

                            const viewButton = row.querySelector('.btn-view');
                            viewButton.addEventListener('click', () => {
                                const buyerId = viewButton.getAttribute('data-id');
                                const productId = viewButton.getAttribute('data-product');
                                const orderRef = productRef.child(productId).child("pedidos").child(buyerId);


                                orderRef.once("value", orderSnapshot => {
                                    const orderData = orderSnapshot.val();
                                    const orderPixRefer = orderSnapshot.child("pix_info").val() || {};
                                    const orderPixDataRefer = orderSnapshot.child("data").val() || {};

                                    const modalRaiz = document.getElementById("buyer-modal");
                                    const modalContent = document.getElementById("od-modal-content");
                                    const odCloseModal = document.querySelector(".ob-close-modal");

                                    modalContent.innerHTML = `
                                        <p><strong>Nome:</strong> ${orderData.nome || 'N/A'}</p>
                                        <p><strong>Email:</strong> ${orderData.email || 'N/A'}</p>
                                        <p><strong>Celular:</strong> ${orderData.tel || 'N/A'}<a href="https://wa.me/${orderData.tel.replace(/[^\d]/g, '')}" target="_blank" 
                                        style="margin-left: 5px; color: #25D366;"><i style="margin-left: 5px" class="fa-brands fa-whatsapp"></i></a></p>
                                        <p><strong>Checkout:</strong> <a href='${orderPixRefer.url_pix || 'N/A'}'>${orderPixRefer.url_pix || 'N/A'}</a></p>
                                        <p><strong>Produto:</strong> ${product.nome || 'N/A'} - #${productId}</p>
                                        <p><strong>Valor:</strong> R$ ${parseFloat(orderData.preco).toFixed(2).replace('.', ',') || '0,00'}</p>
                                        <p><strong>Status:</strong> ${orderData.status === 'approved' ? 'Aprovado' : orderData.status === 'pending' ? 'Pendente' :
                                            orderData.status === 'cancelled' ? 'Cancelado' : 'N/A'
                                        } <i style="margin-left: 5px; color: #1DB954 !important;"  class="fa-solid fa-badge-check"></i></p>
                                        <p><strong>Order:</strong> #${orderPixRefer.pix_id || 'N/A'}</p>
                                        <p><strong>Data que gerou o pix:</strong> ${orderPixDataRefer.data} - ${orderPixDataRefer.hora}</p>
                                            <p><strong>Data que pagou:</strong> ${orderPixDataRefer.data_payment} - ${orderPixDataRefer.hora_payment || 'Aguardando pagamento'}</p>
                                        `;
                                    modalRaiz.style.display = "block";
                                    odCloseModal.addEventListener("click", () => {
                                        modalRaiz.style.display = "none";
                                    });

                                });
                            });
                        });

                        // Atualizar métricas
                        document.getElementById("total-buyers").textContent = totalBuyers;
                        document.getElementById("approved-buyers").textContent = approvedBuyers;
                        document.getElementById("pending-buyers").textContent = pendingBuyers;

                        if (totalBuyers === 0) {
                            buyersList.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Nenhum comprador encontrado</td></tr>';
                        }
                    });
                }
            });
        });
    }


    // Filtros e busca
    document.getElementById("filter-status").addEventListener("change", loadBuyers);
    document.getElementById("search-buyer").addEventListener("input", loadBuyers);

    // Restante do código existente...
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
            showToast("Preencha o token antes de criar o produto.", "error");
            config.classList.add("active");
            configOverlay.classList.add("active");
        } else if (token.length < 66) {
            showToast("Token inválido.", "error");
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
            showToast("Token inválido.", "error");
        } else if (tokenInput.value === "") {
            showToast("Preencha o token.", "error");
        } else {
            showToast("Token salvo com sucesso.", "success");
            config.classList.remove("active");
            configOverlay.classList.remove("active");

            const dataRef = database.ref('dados/');
            dataRef.child(emailVendedor.replace(/@/g, "---").replace(/\./g, "--")).update({
                token: tokenInput.value,
                webhook: webhook.value
            }).then(() => {
                console.log("Token atualizado com sucesso.");
                localStorage.setItem('token', tokenInput.value);
                token = tokenInput.value;
            }).catch(error => {
                console.error("Erro ao atualizar o token:", error);
            });
        }
    });

    const popup = document.getElementById('msginfo');

    function showPopup(message) {
        popup.innerText = message;
        popup.style.display = 'block';
    }

    function hidePopup() {
        setTimeout(() => {
            popup.style.display = 'none';
        }, 1000);
    }

    document.querySelectorAll('#info-i').forEach(item => {
        item.addEventListener('mouseover', () => {
            const message = item.getAttribute('data-message');
            showPopup(message);
        });
        item.addEventListener('mouseout', () => {
            hidePopup();
        });
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
    closeModalOrder.addEventListener("click", () => {
        orderModal.classList.remove("active");
        orderOverlay.classList.remove("active");
        editingProductId = null;
        clearForm();
    });

    // Carregar o token do LocalStorage
    function loadToken() {
        const dataRef = database.ref('dados/');

        dataRef.child(emailVendedor.replace(/@/g, "---").replace(/\./g, "--")).once("value").then(snapshot => {
            const data = snapshot.val();

            if (data.name) {
                document.getElementById("user-name").textContent = data.name;
            }
            if (!data.token) {
                console.error("Token não encontrado no banco de dados.");
                showToast("Token não encontrado no banco de dados. Adicione em configurações ou entre em contato com suporte.", "error");
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
            if (data.webhook) {
                document.getElementById("webhook-input").value = data.webhook;
            } else {
                document.getElementById("webhook-input").value = '';
            }
        }).catch(error => {
            console.error("Erro ao carregar o token:", error);
        });
    }

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
                        <span class="tag tipo" style="margin-left: 10px;">ID: ${productId || 'Sem ID'}</span>
                        </div>
                        <div class="tags" style="justify-content: end; align-items: center; margin-right: 10px;">
                            <button class="btn-order ${product.status || 'ATIVO'}p" title="Orderbump do produto." data-id="${productId}"><i data-id="${productId}" class="fa-solid fa-cart-plus"></i></button>
                            <a href="https://wa.me/5584994239716?text=Preciso+de+ajuda" class="btn-contact ${product.status || 'ATIVO'}p" title="Entrar em contato com suporte."><i class="fa-solid fa-headset"></i></a>
                            <button class="btn-edit ${product.status || 'ATIVO'}p" title="Editar produto." data-id="${productId}"><i data-id="${productId}" class="fa-solid fa-pen"></i></button>
                            <button class="btn-delete ${product.status || 'ATIVO'}p" title="Deletar produto." data-id="${productId}"><i data-id="${productId}" class="fa-solid fa-trash"></i></button>
                            <button class="btn-link ${product.status || 'ATIVO'}p" title="Copiar URL." data-id="${productId}"><i data-id="${productId}" class="fa-solid fa-copy"></i></button>
                        </div>
                    </div>
                `;

                if (productList.innerHTML === null || productList.innerHTML === undefined || productList.innerHTML === "") {
                    document.getElementById("fake-product-list").innerHTML = `
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

            document.querySelectorAll(".btn-order").forEach(button => {
                button.addEventListener("click", (event) => {
                    const productId = event.target.getAttribute("data-id");
                    editProductOrder(productId); // Passa o productId para a função editProduct
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

    let orderbumpEditandoId = null;
    let currentProductId = null;

    function editProductOrder(productId) {
        if (!productId) return console.error("ID do produto inválido");
        orderModal.classList.add('active');
        orderOverlay.classList.add('active');
        currentProductId = productId;
        const container = document.getElementById("orderbumpTableContainer");
        container.innerHTML = '<div class="loading-table">Carregando orderbumps...</div>';

        const ref = firebase.database().ref("produtos").child(productId).child('orderbumps');

        ref.once("value", snapshot => {
            const orderbumps = snapshot.val();

            container.innerHTML = "";

            if (orderbumps) {
                const table = document.createElement("table");
                table.className = "orderbump-table";
                table.innerHTML = `
                <thead>
                    <tr>
                        <th>Título</th>
                        <th>Preço</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;

                const tbody = table.querySelector("tbody");

                Object.entries(orderbumps).forEach(([id, data]) => {
                    const row = document.createElement("tr");

                    row.innerHTML = `
                    <td>${data.titulo || ""}</td>
                    <td>R$ ${parseFloat(data.preco || 0).toFixed(2)}</td>
                    <td>
                        <span class="status-badge ${data.ativo !== false ? 'active' : 'inactive'}">
                            ${data.ativo !== false ? 'Ativo' : 'Inativo'}
                        </span>
                    </td>
                    <td class="actions">
                        <button class="edit-btn" onclick="orderRedirect('orderbump?prod=${productId}&bump=${id}')">
                            Editar
                        </button>
                    </td>
                    
                </div>
                `;

                    tbody.appendChild(row);
                });

                const divBtn = document.createElement("div");
                divBtn.className = 'no-orderbumps';
                divBtn.innerHTML = `
                    <button class="add-orderbump-btn" onclick="orderRedirect('orderbump?prod=${productId}')">
                        Criar +OrderBumps
                    </button>`;
                container.appendChild(table);
                container.appendChild(divBtn);
            } else {
                container.innerHTML = `
                <div class="no-orderbumps">
                    <p>Nenhum orderbump encontrado para este produto.</p>
                    <button class="add-orderbump-btn" onclick="orderRedirect('orderbump?prod=${productId}')">
                        Criar OrderBump
                    </button>
                </div>
            `;
            }
            // Função global para redirecionamento
            window.orderRedirect = function (url) {
                try {
                    new URL(url, window.location.origin);
                    window.location.href = url;
                } catch (e) {
                    console.error('URL inválida para redirecionamento:', url);
                    alert('Erro: Não foi possível redirecionar para esta página');
                }
            };
        });
    }

    // Função global para redirecionamento
    window.orderRedirect = function (url) {
        try {
            new URL(url, window.location.origin);
            window.location.href = url;
        } catch (e) {
            console.error('URL inválida para redirecionamento:', url);
            alert('Erro: Não foi possível redirecionar para esta página');
        }
    };

    // Adicione este CSS no seu arquivo de estilo
    const style = document.createElement('style');
    style.textContent = `
    .orderbump-table {
        width: 100%;
        border-collapse: collapse;
        background-color: var(--color-surface);
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .orderbump-table th {
        background-color: var(--color-surface-light);
        color: var(--color-primary);
        padding: 12px 15px;
        text-align: left;
        font-weight: 600;
    }
    
    .orderbump-table td {
        padding: 12px 15px;
        border-bottom: 1px solid var(--color-border);
        color: var(--color-text);
    }
    
    .orderbump-table tr:last-child td {
        border-bottom: none;
    }
    
    .orderbump-table tr:hover {
        background-color: rgba(122, 111, 240, 0.05);
    }
    
    .status-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 500;
    }
    
    .status-badge.active {
        background-color: rgba(45, 212, 191, 0.2);
        color: var(--color-secondary);
    }
    
    .status-badge.inactive {
        background-color: rgba(255, 126, 185, 0.2);
        color: var(--color-accent);
    }
    
    .edit-btn {
        background-color: var(--color-primary);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
    }
    
    .edit-btn:hover {
        background-color: var(--color-primary-hover);
        transform: translateY(-1px);
    }
    
    .loading-table {
        padding: 20px;
        text-align: center;
        color: var(--color-text-muted);
    }
    
    .no-orderbumps {
        text-align: center;
        padding: 30px;
    }
    
    .no-orderbumps p {
        color: var(--color-text-muted);
        margin-bottom: 20px;
    }
    
    .add-orderbump-btn {
        background-color: var(--color-primary);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
    }
    
    .add-orderbump-btn:hover {
        background-color: var(--color-primary-hover);
    }
`;
    document.head.appendChild(style);


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

// Funções auxiliares
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
    console.log("Produto deletado com sucesso!");
    loadProducts(emailVendedor);
}

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
    }, 6000);
}

async function updateDashboard() {
    console.log("Atualizando dashboard...");

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
                    document.getElementById("totalVendas").textContent = totalVendas;
                    document.getElementById("quantPix").textContent = totalVendasPerdidas + totalVendas;

                    document.getElementById("faturamento").textContent = `R$ ${totalFaturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    document.getElementById("ticketMedio").textContent = `R$ ${ticketMedioValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    document.getElementById("pixValue").textContent = `R$ ${totalFaturamentoPerdido.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                });
            }
        });
    });
}

// Atualizar dashboard periodicamente
setInterval(updateDashboard, 30000); // Atualiza a cada 30 segundos
updateDashboard(); // Executa imediatamente

// Formatação do preço
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

// Verificar autenticação
function checkAuth() {
    const uid = localStorage.getItem('userid');
    const email = getQueryParam('email');

    if (!uid) {
        const urlUid = getQueryParam('user');
        if (urlUid) {
            localStorage.setItem('userid', urlUid);
            window.history.replaceState({}, document.title, "/dashboard");
        } else {
            redirectToLogin();
        }
    }

    if (email) {
        localStorage.setItem('email', email);
        emailVendedor = email;
    } else {
        emailVendedor = localStorage.getItem('email');
    }

    if (emailVendedor) {
        document.getElementById("user-email").textContent = emailVendedor;
        console.log(`Bem-vindo de volta, ${emailVendedor}!`);
    } else {
        redirectToLogin();
    }
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function redirectToLogin() {
    localStorage.removeItem('email');
    localStorage.removeItem('userid');
    setTimeout(() => {
        window.location.href = `login?logout=true`;
    }, 2000);
}

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('email');
    localStorage.removeItem('userid');
    redirectToLogin();
});