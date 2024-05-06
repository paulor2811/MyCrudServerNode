const express = require('express');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');

const app = express();
const port = 3000;

// Configurações do banco de dados Oracle
const dbConfig = {
    user: 'sys',
    password: '123',
    connectString: '//192.168.1.103:1521/xe', // Endereço do banco de dados
    privilege: oracledb.SYSDBA // Especifica os privilégios SYSDBA
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

// Rota para buscar todos os usuários
app.get('/api/usuarios', async (req, res) => {
    let connection;
  
    try {
        console.log(new Date().toLocaleString(), 'Conectando ao banco de dados...');
        // Estabelecer conexão com o banco de dados
        connection = await oracledb.getConnection(dbConfig);
        console.log('Conexão bem-sucedida.');
    
        console.log('Buscando usuários...');
        // Executar a consulta SQL para buscar todos os usuários
        const result = await connection.execute('SELECT * FROM USUARIOS');
        console.log('Usuários encontrados:', result.rows);
    
        // Enviar os resultados como resposta da requisição
        res.json(result.rows);
    } catch (error) {
        // Se ocorrer algum erro, enviar uma mensagem de erro como resposta
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    } finally {
        // Fechar a conexão com o banco de dados
        if (connection) {
            try {
                console.log('Fechando conexão com o banco de dados...');
                await connection.close();
                console.log('Conexão fechada.');
            } catch (error) {
                console.error('Erro ao fechar a conexão com o banco de dados:', error);
            }
        }
    }
});

// Rota para registrar um novo usuário
app.post('/api/usuarios', async (req, res) => {
    let connection;
    const usuario = req.body; // Recupera os dados do usuário do corpo da requisição
  
    try {
        console.log(new Date().toLocaleString(), 'Conectando ao banco de dados...');
        // Estabelecer conexão com o banco de dados
        connection = await oracledb.getConnection(dbConfig);
        console.log('Conexão bem-sucedida.');
  
        console.log('Registrando novo usuário:', usuario);
        // Executar a consulta SQL para inserir um novo usuário
        const result = await connection.execute(
            'INSERT INTO USUARIOS (id, nome, email, senha, data_criacao) VALUES (USUARIOS_SEQ.NEXTVAL, :nome, :email, :senha, CURRENT_TIMESTAMP)',
            usuario
        );
        console.log('Novo usuário registrado com sucesso.');
  
        // Confirmar a transação
        await connection.commit();
  
        // Enviar uma resposta de sucesso
        res.status(201).json({ message: 'Usuário registrado com sucesso' });
    } catch (error) {
        // Se ocorrer algum erro, enviar uma mensagem de erro como resposta
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ error: 'Erro ao registrar usuário' });
    } finally {
        // Fechar a conexão com o banco de dados
        if (connection) {
            try {
                console.log('Fechando conexão com o banco de dados...');
                await connection.close();
                console.log('Conexão fechada.');
            } catch (error) {
                console.error('Erro ao fechar a conexão com o banco de dados:', error);
            }
        }
    }
  });
  

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
