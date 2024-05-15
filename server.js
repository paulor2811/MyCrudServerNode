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
    connection.query('SELECT * FROM usuarios', (error, results) => {
        if (error) {
            console.error('Erro ao buscar usuários:', error);
            res.status(500).json({ error: 'Erro ao buscar usuários' });
            return;
        }
        console.log('Usuários encontrados:', results);
        res.json(results);
    });
});

// Rota para registrar um novo usuário
app.post('/api/usuarios', (req, res) => {
    const usuario = req.body;
    console.log(new Date().toLocaleString(), 'Registrando novo usuário:', usuario);
    connection.query(
        'INSERT INTO usuarios (nome, email, senha, data_de_criacao) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        [usuario.nome, usuario.email, usuario.senha],
        (error, results) => {
            if (error) {
                console.error('Erro ao registrar usuário:', error);
                res.status(500).json({ error: 'Erro ao registrar usuário' });
                return;
            }
            console.log('Novo usuário registrado com sucesso.');
            res.status(201).json({ message: 'Usuário registrado com sucesso' });
        }
    );
});

// Rota para fazer login
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    console.log(new Date().toLocaleString(), 'Fazendo login para o email:', email);
    connection.query(
        'SELECT * FROM usuarios WHERE email = ?',
        [email],
        (error, results) => {
            if (error) {
                console.error('Erro ao fazer login:', error);
                res.status(500).json({ error: 'Erro ao fazer login' });
                return;
            }
            if (results.length === 0) {
                console.log('Usuário não encontrado.');
                res.status(401).json({ error: 'Email ou senha incorretos' });
                return;
            }
            if (results[0].senha !== senha) {
                console.log('Senha incorreta.');
                res.status(401).json({ error: 'Email ou senha incorretos' });
                return;
            }
            console.log('Login bem-sucedido.');
            res.json({ message: 'Login bem-sucedido', usuario: results[0] });
        }
    );
});

// Rota para enviar uma nova mensagem
app.post('/api/mensagens', (req, res) => {
    const mensagem = req.body;
    console.log(new Date().toLocaleString(), 'Recebendo nova mensagem:', mensagem);
    connection.query(
        'INSERT INTO mensagens (usuario, mensagem, data_envio) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [mensagem.user, mensagem.message],
        (error, results) => {
            if (error) {
                console.error('Erro ao inserir mensagem:', error);
                res.status(500).json({ error: 'Erro ao inserir mensagem' });
                return;
            }
            console.log('Nova mensagem inserida com sucesso.');
            // Envia a nova mensagem para todos os clientes conectados via WebSocket
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(mensagem));
                }
            });
            res.status(201).json({ message: 'Mensagem enviada com sucesso' });
        }
    );
});

// WebSocket server
wss.on('connection', function connection(ws) {
    console.log('Novo cliente conectado.');
    ws.on('message', function message(data) {
        console.log('Mensagem recebida do cliente:', data);
    });
    ws.on('close', function close() {
        console.log('Cliente desconectado.');
    });
});

// Inicia o servidor na porta especificada
server.listen(port, () => {
    console.log(`Servidor rodando em https://mycrudservernode-production.up.railway.app:${port}`);
});
