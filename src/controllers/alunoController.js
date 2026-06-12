const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-key-muito-seguro';

// Middleware de Autenticação embutido
const verificarTokenInterno = async (req) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) throw new Error('Token não fornecido');
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
};

// 1. Login por RM
const loginPorRM = async (req, res) => {
    try {
        const { rm } = req.body;
        console.log("🔍 Tentando logar com o RM:", rm);
        if (!rm) return res.status(400).json({ error: 'RM é obrigatório.' });

        const { data: aluno, error } = await supabase
            .from('alunos')
            .select('*')
            .eq('rm', rm)
            .eq('ativo', true)
            .maybeSingle();

            console.log("📊 Resposta do Supabase:", { aluno, error });
        if (error || !aluno) return res.status(401).json({ error: 'RM não encontrado ou inativo.' });

        const token = jwt.sign({ id_aluno: aluno.id_aluno, rm: aluno.rm, turma: aluno.turma }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ success: true, token, aluno: { id: aluno.id_aluno, nome: aluno.nome_completo, rm: aluno.rm, turma: aluno.turma } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Login por E-mail (Com a restrição do SESI)
const loginPorEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'E-mail é obrigatório.' });

        // 🚨 TRAVA EXCLUSIVA: Valida se o domínio termina com o e-mail institucional do SESI SP
        if (!email.toLowerCase().endsWith('@portalsesisp.org.br')) {
            return res.status(403).json({ error: 'Acesso negado. Utilize apenas o seu e-mail institucional @portalsesisp.org.br' });
        }

        const { data: aluno, error } = await supabase
            .from('alunos')
            .select('*')
            .eq('email_institucional', email.toLowerCase())
            .eq('ativo', true)
            .maybeSingle();

        if (error || !aluno) return res.status(401).json({ error: 'E-mail institucional não cadastrado no sistema.' });

        const token = jwt.sign({ id_aluno: aluno.id_aluno, rm: aluno.rm, turma: aluno.turma }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ success: true, token, aluno: { id: aluno.id_aluno, nome: aluno.nome_completo, rm: aluno.rm } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Registrar tempo de leitura (Log de minutos)
const registrarLeitura = async (req, res) => {
    try {
        const usuarioLogado = await verificarTokenInterno(req);
        const { minutos, data_registro, observacao } = req.body;

        if (!minutos || minutos <= 0) return res.status(400).json({ error: 'Os minutos lidos devem ser maiores que zero.' });
        if (minutos > 16) return res.status(400).json({ error: 'Você ultrapassou o limite diário permitido de 16 minutos!' });

        let dataRegistro = data_registro || new Date().toISOString().split('T')[0];

        // Salva ou atualiza os minutos lidos no banco de dados
        const { data, error } = await supabase
            .from('registros_leitura')
            .upsert({ 
                id_aluno: usuarioLogado.id_aluno, 
                data_registro: dataRegistro, 
                minutos_lidos: minutos,
                observacao: observacao || 'Registro de leitura diária'
            }, { onConflict: 'id_aluno,data_registro' })
            .select();

        if (error) throw error;

        res.json({ success: true, message: `Log de ${minutos} minutos salvo com sucesso!`, dados: data[0] });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

module.exports = { loginPorRM, loginPorEmail, registrarLeitura };