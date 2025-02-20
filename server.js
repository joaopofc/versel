const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Servir arquivos HTML

const MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-4128571484840245-051411-4e2440590f5e3a407cc718aecec17f6e-1361831608";

// Rota para criar um pagamento PIX
app.post("/create_pix", async (req, res) => {
    const { nome, sobrenome, email } = req.body;

    try {
        const response = await axios.post(
            "https://api.mercadopago.com/v1/payments",
            {
                transaction_amount: 0.01, // Valor do pagamento
                payment_method_id: "pix",
                payer: {
                    email: email,
                    first_name: nome,
                    last_name: sobrenome
                }
            },
            {
                headers: {
                    "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                    "X-Idempotency-Key": uuidv4() // Gera um ID único para evitar duplicações
                }
            }
        );

        res.json({
            qr_code_base64: response.data.point_of_interaction.transaction_data.qr_code_base64,
            pix_code: response.data.point_of_interaction.transaction_data.qr_code
        });

    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).send("Erro ao criar pagamento PIX");
    }
});

// Webhook para confirmar pagamento
app.post("/webhook", async (req, res) => {
    const payment = req.body;
    if (payment.action === "payment.created") {
        const payment_id = payment.data.id;

        try {
            const payment_info = await axios.get(
                `https://api.mercadopago.com/v1/payments/${payment_id}`,
                { headers: { "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}` } }
            );

            if (payment_info.data.status === "approved") {
                console.log(`Pagamento ${payment_id} aprovado!`);
                res.redirect("https://seusite.com/sucesso");
            }
        } catch (error) {
            console.error(error);
        }
    }
    res.sendStatus(200);
});

// Iniciar o servidor
app.listen(3001, () => console.log("Servidor rodando na porta 3001"));
