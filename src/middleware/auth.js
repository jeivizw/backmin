const jwt = require('jsonwebtoken');

// Usa a mesma chave secreta definida no seu controlador de alunos
const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-key-muito-seguro';

const protegerRota = async (req, res, next) => {
    try {
        // 1. Captura o cabeçalho de autorização
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'Acesso negado. Token de autenticação não fornecido ou inválido.' 
            });
        }

        // 2. Extrai o token string
        const token = authHeader.split(' ')[1];

        // 3. Descriptografa e valida o token JWT gerado pelo alunoController
        const decoded = jwt.verify(token, JWT_SECRET);

        // 4. Injeta o ID do aluno verificado na requisição (repare que o seu controller salvou como id_aluno)
        req.usuarioLogadoId = decoded.id_aluno;

        // Autoriza o Express a prosseguir para as rotas/controllers
        next();
    } catch (err) {
        console.error('💥 Erro de validação no Middleware Auth:', err.message);
        return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
    }
};

module.exports = { protegerRota };