const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configurações do banco de dados MySQL
const dbConfig = {
    host: 'roundhouse.proxy.rlwy.net',
    user: 'root',
    password: 'HhMdbMwxHvowbsaWKmNpQisWZZMDKGCA',
    database: 'railway',
    port: 18381,
    authPlugins: {
        mysql_clear_password: () => () => Buffer.from('HhMdbMwxHvowbsaWKmNpQisWZZMDKGCA')
    }
};

app.use(bodyParser.json());

// Middleware de log para registrar as requisições recebidas
app.use((req, res, next) => {
    console.log('Requisição recebida:', req.method, req.url);
    next();
});

// Middleware para habilitar o CORS
const cors = require('cors');
const corsOptions = {
    origin: 'https://paulos-website.000webhostapp.com',
    optionsSuccessStatus: 200,
}
app.use(cors(corsOptions));

// Criação da conexão com o banco de dados MySQL
const connection = mysql.createConnection(dbConfig);

// Rota para buscar todos os usuários
app.get('/api/usuarios', (req, res) => {
    console.log(new Date().toLocaleString(), 'Buscando usuários...');
    
    // Executar a consulta SQL para buscar todos os usuários
    connection.query('SELECT * FROM usuarios', (error, results) => {
        if (error) {
            // Se ocorrer algum erro, enviar uma mensagem de erro como resposta
            console.error('Erro ao buscar usuários:', error);
            res.status(500).json({ error: 'Erro ao buscar usuários' });
            return;
        }
        
        console.log('Usuários encontrados:', results);
        // Enviar os resultados como resposta da requisição
        res.json(results);
    });
});

// Rota para registrar um novo usuário
app.post('/api/usuarios', (req, res) => {
    const usuario = req.body; // Recupera os dados do usuário do corpo da requisição
    console.log(new Date().toLocaleString(), 'Registrando novo usuário:', usuario);
    
    // Executar a consulta SQL para inserir um novo usuário
    connection.query(
        'INSERT INTO usuarios (nome, email, senha, data_de_criacao) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        [usuario.nome, usuario.email, usuario.senha],
        (error, results) => {
            if (error) {
                // Se ocorrer algum erro, enviar uma mensagem de erro como resposta
                console.error('Erro ao registrar usuário:', error);
                res.status(500).json({ error: 'Erro ao registrar usuário' });
                return;
            }
            
            console.log('Novo usuário registrado com sucesso.');
            // Enviar uma resposta de sucesso
            res.status(201).json({ message: 'Usuário registrado com sucesso' });
        }
    );
});

// Rota para fazer login
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body; // Recupera os dados de login do corpo da requisição
    console.log(new Date().toLocaleString(), 'Fazendo login para o email:', email);
    
    // Executa uma consulta SQL para buscar o usuário com o email fornecido
    connection.query(
        'SELECT * FROM usuarios WHERE email = ?',
        [email],
        (error, results) => {
            if (error) {
                // Se ocorrer algum erro, envia uma mensagem de erro como resposta
                console.error('Erro ao fazer login:', error);
                res.status(500).json({ error: 'Erro ao fazer login' });
                return;
            }
            
            // Verifica se encontrou um usuário com o email fornecido
            if (results.length === 0) {
                // Se não encontrou um usuário, envia uma mensagem de erro como resposta
                console.log('Usuário não encontrado.');
                res.status(401).json({ error: 'Email ou senha incorretos' });
                return;
            }
            
            // Verifica se a senha fornecida coincide com a senha do usuário encontrado
            if (results[0].senha !== senha) {
                // Se a senha não coincide, envia uma mensagem de erro como resposta
                console.log('Senha incorreta.');
                res.status(401).json({ error: 'Email ou senha incorretos' });
                return;
            }
            
            // Se chegou até aqui, significa que o login foi bem-sucedido
            console.log('Login bem-sucedido.');
            res.json({ message: 'Login bem-sucedido', usuario: results[0] });
        }
    );
});

// Rota para enviar uma nova mensagem
app.post('/api/mensagens', (req, res) => {
    const mensagem = req.body;

    // Insere a nova mensagem no banco de dados
    connection.query(
        'INSERT INTO mensagens (usuario, mensagem, data_envio) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [mensagem.user, mensagem.message],
        (error, results) => {
            if (error) {
                console.error('Erro ao inserir mensagem:', error);
                res.status(500).json({ error: 'Erro ao inserir mensagem' });
                return;
            }

            // Envia a nova mensagem para todos os clientes conectados via WebSocket
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(mensagem));
                }
            });

            console.log('Nova mensagem inserida com sucesso.');
            res.status(201).json({ message: 'Mensagem enviada com sucesso' });
        }
    );
});


// WebSocket server
wss.on('connection', function connection(ws) {
    console.log('Novo cliente conectado.');

    ws.on('close', function close() {
        console.log('Cliente desconectado.');
    });
});

// Inicia o servidor na porta especificada
app.listen(port, () => {
    console.log(`Servidor rodando em https://mycrudservernode-production.up.railway.app/:${port}`);
});
