// 🧭 Caminho corrigido saindo de controllers e entrando em config
const { supabase } = require('../config/supabase'); 

class LeituraController {
    
    // Executa o registro de minutos salvando no banco de dados
    async registrarMinutos(req, res) {
        try {
            const id_aluno = req.usuarioLogadoId;
            const { minutos } = req.body;
            const hoje = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('registros_leitura')
                .upsert({ id_aluno, minutos_lidos: minutos, data_registro: hoje })
                .select();

            if (error) throw error;
            return res.status(201).json({ success: true, data });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    /**
     * Retorna os registros dos últimos 7 dias para montar o gráfico de barras
     */
    async obtenerProgressoAluno(req, res) {
        try {
            const id_aluno = req.usuarioLogadoId; 

            const seteDiasAtras = new Date();
            seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
            const dataLimite = seteDiasAtras.toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('registros_leitura')
                .select('data_registro, minutos_lidos, observacao')
                .eq('id_aluno', id_aluno)
                .gte('data_registro', dataLimite)
                .order('data_registro', { ascending: true });

            if (error) throw error;

            const { data: totalAcumulado, error: errTotal } = await supabase
                .from('registros_leitura')
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
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Soma o total de minutos de toda a escola para o termômetro
     */
    async obterTotalEscola(req, res) {
        try {
            const { data, error } = await supabase
                .from('registros_leitura')
                .select('minutos_lidos');

            if (error) throw error;

            const totalMinutos = data.reduce((sum, item) => sum + item.minutos_lidos, 0);
            const metaGlobal = 1000000;
            const porcentagem = ((totalMinutos / metaGlobal) * 100).toFixed(2);

            return res.status(200).json({
                success: true,
                totalMinutos,
                meta: metaGlobal,
                porcentagem: parseFloat(porcentagem)
            });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Gera o ranking agrupando por turmas
     */
    async obterRankingTurmas(req, res) {
        try {
            const { data, error } = await supabase
                .from('registros_leitura')
                .select(`
                    minutos_lidos,
                    alunos (
                        turma
                    )
                `);

            if (error) throw error;

            const turmasAgrupadas = {};

            data.forEach(registro => {
                const nomeTurma = registro.alunos?.turma || 'Turma Não Identificada';
                if (!turmasAgrupadas[nomeTurma]) {
                    turmasAgrupadas[nomeTurma] = 0;
                }
                turmasAgrupadas[nomeTurma] += registro.minutos_lidos;
            });

            const rankingOrdenado = Object.keys(turmasAgrupadas).map(turma => ({
                turma: turma,
                total_minutos: turmasAgrupadas[turma]
            })).sort((a, b) => b.total_minutos - a.total_minutos);

            return res.status(200).json({
                success: true,
                ranking: rankingOrdenado
            });

        } catch (error) {
            console.error('Erro ao obter ranking:', error.message);
            return res.status(500).json({ error: 'Erro interno ao gerar ranking.' });
        }
    }
}

module.exports = new LeituraController();