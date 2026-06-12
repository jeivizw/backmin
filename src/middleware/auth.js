const supabase = require('../config/supabase');

const protegerRota = async (req, res, next) => {
    try {
        // 1. Pega o token enviado pelo front-end no cabeçalho (Headers) da requisição
        const authHeader = req.headers.authorization;

        // Verifica se o cabeçalho existe e se começa com "Bearer " (padrão de mercado)
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'Acesso negado. Token de autenticação não fornecido ou inválido.' 
            });
        }

        // Extrai apenas o código do token (remove a palavra "Bearer")
        const token = authHeader.split(' ')[1];

        // 2. Pede ao Supabase para verificar se esse token JWT é válido e real
        const { data: { user }, error } = await supabase.auth.getUser(token);

        // Se o Supabase disser que o token expirou ou é falso, barra o usuário
        if (error || !user) {
            return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
        }

        // 3. O PULO DO GATO: Se o token for válido, nós injetamos o ID verificado dentro da requisição (req)
        req.usuarioLogadoId = user.id;

        // Libera para o Express continuar e ir para o Controller/Banco de dados
        next();

    } catch (err) {
        return res.status(500).json({ error: 'Erro interno na validação da autenticação.' });
    }
};

module.exports = { protegerRota };