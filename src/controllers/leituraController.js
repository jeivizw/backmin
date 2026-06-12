// Dentro de src/controllers/leituraController.js

async registrarMinutos(req, res) {
    try {
        const id_aluno = req.usuarioLogadoId; // 🟢 Ajustado para bater com o middleware
        const { minutos } = req.body;
        const hoje = new Date().toISOString().split('T')[0];

        // Mapeado para a tabela correta do seu banco: [logs_leitura]
        const { data, error } = await supabase
            .from('logs_leitura')
            .upsert({ id_aluno, minutos_lidos: minutos, data_registro: hoje }, { onConflict: 'id_aluno,data_registro' })
            .select();

        if (error) throw error;
        return res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('💥 Erro no registrarMinutos:', error.message);
        return res.status(500).json({ error: error.message });
    }
}

async obterProgressoAluno(req, res) {
    try {
        const id_aluno = req.usuarioLogadoId; // 🟢 Ajustado para bater com o middleware

        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
        const dataLimite = seteDiasAtras.toISOString().split('T')[0];

        // Mapeado para a tabela correta: [logs_leitura]
        const { data, error } = await supabase
            .from('logs_leitura')
            .select('data_registro, minutos_lidos, observacao')
            .eq('id_aluno', id_aluno)
            .gte('data_registro', dataLimite)
            .order('data_registro', { ascending: true });

        if (error) throw error;

        const { data: totalAcumulado, error: errTotal } = await supabase
            .from('logs_leitura')
            .select('minutos_lidos')
            .eq('id_aluno', id_aluno);

        if (errTotal) throw errTotal;
        const totalHistorico = totalAcumulado.reduce((acc, curr) => acc + curr.minutos_lidos, 0);

        return res.status(200).json({
            success: true,
            historicoSemanal: data,
            totalHistorico,
            minutosHoje: data.find(r => r.data_registro === new Date().toISOString().split('T')[0])?.minutos_lidos || 0
        });
    } catch (error) {
        console.error('💥 Erro no obterProgressoAluno:', error.message);
        return res.status(500).json({ error: error.message });
    }
}