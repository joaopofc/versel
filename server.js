const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Servir arquivos HTML
app.use(cors());

// Access Token do Mercado Pago
const MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-4128571484840245-051411-4e2440590f5e3a407cc718aecec17f6e-1361831608";

// Configuração do transporte de e-mail usando Nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "joaopaulojd021@gmail.com", // Seu e-mail
        pass: "jnkurgeunpbzkhbq" // Senha de aplicativo
    }
});

// Rota para criar pagamento PIX
app.post("/create_pix", async (req, res) => {
    const { nome, sobrenome, email, preco } = req.body;

    // Validação de dados de entrada
    if (!nome || !sobrenome || !email) {
        return res.status(400).json({ error: "Nome, sobrenome e email são obrigatórios!" });
    }

    const precoNumerico = parseFloat(preco);
    if (isNaN(precoNumerico)) {
        return res.status(400).json({ error: "O valor do preço é inválido." });
    }

    console.log("📢 Criando pagamento PIX para:", nome, sobrenome, email, precoNumerico);

    try {
        // Criação do pagamento PIX
        const response = await axios.post(
            "https://api.mercadopago.com/v1/payments",
            {
                transaction_amount: precoNumerico,
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
                    "X-Idempotency-Key": uuidv4() // Evita pagamentos duplicados
                }
            }
        );

        console.log("✅ Pagamento criado com sucesso!", response.data);

        // Enviar e-mail de confirmação de pagamento
        const mailOptions = {
            from: "joaopaulojd021@gmail.com",
            to: email,
            subject: "Pagamento PIX Criado com Sucesso!",
            text: `Olá ${nome},\n\nO seu pagamento PIX foi criado com sucesso. Segue o código PIX:\n\n${response.data.point_of_interaction.transaction_data.qr_code}\n\nObrigado pelo seu pagamento!`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("❌ Erro ao enviar e-mail:", error);
            } else {
                console.log("✅ E-mail enviado:", info.response);
            }
        });

        // Resposta com dados do pagamento
        res.json({
            payment_id: response.data.id,
            qr_code_base64: response.data.point_of_interaction.transaction_data.qr_code_base64,
            pix_code: response.data.point_of_interaction.transaction_data.qr_code
        });

    } catch (error) {
        console.error("❌ Erro ao criar pagamento:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Erro ao criar pagamento PIX", details: error.response?.data });
    }
});

// Rota para verificar o status do pagamento
app.get("/check_payment/:id", async (req, res) => {
    const payment_id = req.params.id;

    try {
        const response = await axios.get(
            `https://api.mercadopago.com/v1/payments/${payment_id}`,
            {
                headers: { "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}` }
            }
        );

        const status = response.data.status; // Status do pagamento (pending, approved, rejected)

        console.log(`🔍 Status do pagamento ${payment_id}: ${status}`);

        // Se o pagamento foi aprovado, enviar e-mail
        if (status === "approved") {
            const { payer_email, transaction_amount } = response.data;
            const subject = `Pagamento aprovado - ID: ${payment_id}`;
            const text = `Seu pagamento de R$ ${transaction_amount} foi aprovado com sucesso. Obrigado pelo seu pagamento!`;
            
            transporter.sendMail({
                from: "joaopaulojd021@gmail.com",
                to: payer_email,
                subject: subject,
                text: text,
            }, (error, info) => {
                if (error) {
                    console.error("❌ Erro ao enviar e-mail:", error);
                } else {
                    console.log("✅ E-mail enviado:", info.response);
                }
            });
        }

        // Resposta com o status do pagamento
        res.json({ status });

    } catch (error) {
        console.error("❌ Erro ao verificar pagamento:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Erro ao verificar pagamento", details: error.response?.data });
    }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));