const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2'); // Apenas uma importação do módulo mysql2 agora

const app = express();
const port = process.env.PORT || 3000;

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
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200'); // Permite solicitações do Angular (localhost:4200)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

// Rota para a página inicial
app.get('/', (req, res) => {
    res.send('Bem-vindo à página inicial');
});

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

// Inicia o servidor na porta especificada
app.listen(port, () => {
    console.log(`Servidor rodando em https://mycrudservernode-production.up.railway.app/:${port}`);
});
