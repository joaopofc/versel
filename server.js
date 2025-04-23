const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const cors = require("cors"); // 🔥 Importando CORS
const nodemailer = require("nodemailer");
const fetch = require("node-fetch");

const app = express();
app.use(cors()); // 🔥 Habilitando CORS
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Servir arquivos HTML

// Access Token do Mercado Pago
//const token = "APP_USR-4128571484840245-051411-4e2440590f5e3a407cc718aecec17f6e-1361831608";
let tokenValid = null;
let precoValid = null;

// Criar pagamento PIX
app.post("/create_pix", async (req, res) => {
    let { nome_completo, email, preco, token } = req.body;

    if (!nome_completo || !email) {
        return res.status(400).json({ error: "Nome completo e email são obrigatórios!" });
    }

    //   Verificando se o token é válido
    tokenValid = token;

    // Dividindo o nome completo automaticamente
    const nomeArray = nome_completo.trim().split(" ");
    const first_name = nomeArray[0]; // Primeiro nome
    const last_name = nomeArray.slice(1).join(" ") || "N/A"; // Restante do nome ou "N/A" se não houver sobrenome

    const precoNumerico = parseFloat(preco);
    if (isNaN(precoNumerico)) {
        return res.status(400).json({ error: "O valor do preço é inválido." });
    }
    precoValid = precoNumerico.toFixed(2);

    console.log("📢 Criando pagamento PIX para:", first_name, last_name, email, precoNumerico); // 🔥 Correção aqui!

    try {
        const response = await axios.post(
            "https://api.mercadopago.com/v1/payments",
            {
                transaction_amount: precoNumerico,
                payment_method_id: "pix",
                description: `Compra do Produto dev`,
                external_reference: `PEDIDO_${uuidv4()}`,
                metadata: {
                    cliente_email: email
                },
                payer: {
                    email: email,
                    first_name: first_name,  // 🔥 Corrigido para usar `first_name`
                    last_name: last_name      // 🔥 Corrigido para usar `last_name`
                }
            },
            {
                headers: {
                    "Authorization": `Bearer ${tokenValid}`,
                    "Content-Type": "application/json",
                    "X-Idempotency-Key": uuidv4()
                }
            }
        );

        console.log("✅ Pagamento criado com sucesso!", response.data);

        res.json({
            payment_id: response.data.id,
            qr_code_base64: response.data.point_of_interaction.transaction_data.qr_code_base64,
            pix_code: response.data.point_of_interaction.transaction_data.qr_code
        });
        await fetch("https://ntfy.sh/vendas", {
            method: "POST",
            body: "Sua comissão: R$ " + precoValid,
            headers: {
                "Title": "Pix Gerado!",
                "Content-Type": "text/plain",
                "Priority": "high"
            }
        });

    } catch (error) {
        console.error("❌ Erro ao criar pagamento:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Erro ao criar pagamento PIX", details: error.response?.data });
    }
});


// Verificar status do pagamento usando a API correta
app.get("/check_payment/:id", async (req, res) => {
    const payment_id = req.params.id;

    // Pega o token do cabeçalho Authorization: Bearer SEU_TOKEN
    const authHeader = req.headers['authorization'];
    const tokenValid = authHeader && authHeader.split(' ')[1]; // tira o "Bearer "

    if (!tokenValid) {
        return res.status(401).json({ error: "Token não fornecido" });
    }

    try {
        const response = await axios.get(
            `https://api.mercadopago.com/v1/payments/${payment_id}`,
            {
                headers: {
                    "Authorization": `Bearer ${tokenValid}`
                }
            }
        );

        const status = response.data.status; // Status do pagamento (pending, approved, rejected)

        console.log(`🔍 Status do pagamento ${payment_id}: ${status}`);

        res.json({ status });

        if (status === "approved") {
            await fetch("https://ntfy.sh/vendas", {
                method: "POST",
                body: "Sua comissão: R$ " + precoValid,
                headers: {
                    "Title": "Venda aprovada!",
                    "Content-Type": "text/plain",
                    "Priority": "high"
                }
            });
        };

    } catch (error) {
        console.error("❌ Erro ao verificar pagamento:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Erro ao verificar pagamento", details: error.response?.data });
    }
});
//https://versel-5pxj.onrender.com/send-email-mrk
app.post('/send-email', (req, res) => {
    let { nome_completo, email, url_button, nome_produto, nome_vendedor, email_vendedor, preco } = req.body;

    if (!nome_completo || !email) {
        return res.status(400).json({ error: "Nome completo e email são obrigatórios!" });
    }

    // 🔥 Dividindo o nome completo automaticamente
    const nomeArray = nome_completo.trim().split(" ");
    const first_name = nomeArray[0]; // Primeiro nome
    const last_name = nomeArray.slice(1).join(" ") || "N/A"; // Restante do nome ou "N/A" se não houver sobrenome

    // Configurar o envio de e-mail aqui (com NodeMailer, SendGrid, etc)
    // Exemplo com Nodemailer:
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "joaopaulojd021@gmail.com", // Seu e-mail
            pass: "jnkurgeunpbzkhbq" // Senha de aplicativo
        }
    });
    const mailOptions = {
        from: '"Twopay" <joaopaulojd021@gmail.com>',
        to: email,
        subject: `Pagamento aprovado!`,
        html: `<!DOCTYPE html>
        <html lang="pt-BR">

        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Compra Confirmada</title>
        </head>

        <body style="margin: 0; padding: 15px; background-color: #f4f4f4; text-align: center; font-family: Arial, sans-serif;">
            <div    style="max-width: 600px; margin: 40px auto; background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); text-align: center;">
        

            <h1 style="color: #333; font-size: 25px; margin-bottom: 10px; margin-top: 30px;">Eae ${first_name}, tudo certo?</h1>

            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                Seu pedido foi <b>confirmado</b>. Para acessar <b>${nome_produto}</b>, clique no botão abaixo:
            </p>

            <a href="${url_button}" style="display: inline-block; cursor: pointer;  box-shadow: inset 0 -4px #0002; background-color: #28a745; color: #fff; font-size: 17px; font-weight: bold; text-decoration: none; padding: 16px 34px; border-radius: 8px; transition: 0.3s ease;">
            Acessar Produto
            </a>


            <p style="margin-top: 30px; font-size: 15px; color: #777; width: 100%; display: flex; align-items: center; justify-content: start;">
                Veja os detalhes abaixo:
            </p>
            <p 
                style="margin-top: 0px; font-size: 15px; color: #777; display: flex; align-items: center; justify-content: start;">
                <b style="color: #525F7F; margin-right: 3px;">Produto:</b> ${nome_produto}
            </p>
            <p
                style="margin-top: -6px; font-size: 15px; color: #777; display: flex; align-items: center; justify-content: start;">
                <b style="color: #525F7F; margin-right: 3px;">Valor:</b> R$ ${preco}
            </p>
            <p
                style="margin-top: -6px; font-size: 15px; color: #777; display: flex; align-items: center; justify-content: start;">
                <b style="color: #525F7F; margin-right: 3px;">Método de pagamento:</b> Pix
            </p>
            <p
                style="margin-top: -6px; font-size: 15px; color: #777; display: flex; align-items: center; justify-content: start;">
                <b style="color: #525F7F; margin-right: 3px;">Email usado:</b> ${email}
            </p>



       
        
            <p style="margin-top: 30px; font-size: 14px; color: #777;">
                Se <b>precisar de ajuda</b>, entre em contato com ${nome_vendedor} nesse email: <a
                    href="mailto:${email_vendedor}">${email_vendedor}</a>
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">

            <p style="font-size: 12px; color: #999;">
                &copy; 2025 <a href="https://ipat.shop/help">Twopay</a>. Todos os direitos reservados.
            </p>
        </div>
    </body>
</html>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send('Erro ao enviar e-mail');
        }
        res.status(200).send('E-mail enviado com sucesso');
    });
});

app.post('/send-email-marketing', (req, res) => {
    let { nome_completo, email, url_button, nome_produto, nome_vendedor, email_vendedor } = req.body;

    if (!nome_completo || !email) {
        return res.status(400).json({ error: "Nome completo e email são obrigatórios!" });
    }

    // 🔥 Dividindo o nome completo automaticamente
    const nomeArray = nome_completo.trim().split(" ");
    const first_name = nomeArray[0]; // Primeiro nome
    const last_name = nomeArray.slice(1).join(" ") || "N/A"; // Restante do nome ou "N/A" se não houver sobrenome

    // Configurar o envio de e-mail aqui (com NodeMailer, SendGrid, etc)
    // Exemplo com Nodemailer:
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "joaopaulojd021@gmail.com", // Seu e-mail
            pass: "jnkurgeunpbzkhbq" // Senha de aplicativo
        }
    });
    const mailOptions = {
        from: '"Twopay" <joaopaulojd021@gmail.com>',
        to: email,
        subject: `Finalize seu pagamento`,
        html: `<!DOCTYPE html>
        <html lang="pt-BR">

        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Compra Confirmada</title>
        </head>

        <body style="margin: 0; padding: 15px; background-color: #f4f4f4; text-align: center; font-family: Arial, sans-serif;">
            <div    style="max-width: 600px; margin: 40px auto; background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); text-align: center;">
        

            <h1 style="color: #333; font-size: 25px; margin-bottom: 10px; margin-top: 30px;">Eae ${first_name}, tudo certo?</h1>

            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                Finalize seu pagamento para acessar <b>${nome_produto}</b>! Clique aqui em abaixo:
            </p>

            <a href="${url_button}" style="display: inline-block; cursor: pointer;  box-shadow: inset 0 -4px #0002; background-color: #28a745; color: #fff; font-size: 17px; font-weight: bold; text-decoration: none; padding: 16px 34px; border-radius: 8px; transition: 0.3s ease;">
            Finalizar pagamento
            </a>       
        
            <p style="margin-top: 30px; font-size: 14px; color: #777;">
                Se <b>precisar de ajuda</b>, entre em contato com ${nome_vendedor} nesse email: <a
                    href="mailto:${email_vendedor}">${email_vendedor}</a>
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">

            <p style="font-size: 12px; color: #999;">
                &copy; 2025 <a href="https://ipat.shop/help">Twopay</a>. Todos os direitos reservados.
            </p>
        </div>
    </body>
</html>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send('Erro ao enviar e-mail');
        }
        res.status(200).send('E-mail enviado com sucesso');
    });
});

app.get('/ping', (req, res) => {
    res.send('pong'); // ou res.status(200).send('pong');
});

// Iniciar o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
