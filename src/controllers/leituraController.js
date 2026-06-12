const { supabase } = require('../config/supabase'); // Ajuste o caminho se necessário
const { verificarTokenInterno } = require('./src/middleware/auth'); // Ou como vocês extraem o user logado

class LeituraController {
    
    // ... suas outras funções (como registrarMinutos) ...

    /**
     * RF: Gráfico/Indicador de progresso individual
     * Retorna os registros dos últimos 7 dias para montar o gráfico de barras
     */
    async obterProgressoAluno(req, res) {
        try {
            // Puxa o ID do aluno injetado pelo middleware 'protegerRota'
            const id_aluno = req.usuario.id; 

            // Calcula a data de 7 dias atrás
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

            // Calcula também o total acumulado histórico desse aluno para um card de destaque
            const { data: totalAcumulado, error: errTotal } = await supabase
                .from('registros_leitura')
                .select('minutos_lidos')
                .eq('id_aluno', id_aluno);

            if (errTotal) throw errTotal;

            const totalMinutosDesteAluno = totalAcumulado.reduce((sum, item) => sum + item.minutos_lidos, 0);

            return res.status(200).json({
                success: true,
                totalHistorico: totalMinutosDesteAluno,
                historicoSemanal: data // Array perfeito para mandar pro Chart.js no front
            });

        } catch (error) {
            console.error('Erro ao obter progresso:', error.message);
            return res.status(500).json({ error: 'Erro interno ao buscar progresso.' });
        }
    }

    /**
     * RF: Termômetro/Contador Geral (Meta de 1 Milhão de Minutos)
     * Soma TODOS os minutos lidos por todos os alunos da escola
     */
    async obterTotalEscola(req, res) {
        try {
            // Usamos RPC (Remote Procedure Call) ou um sum nativo se configurado.
            // Como o Supabase às vezes complica com SUM direto no client dependendo da versão, 
            // a forma mais segura e performática sem criar funções no banco é essa:
            const { data, error } = await supabase
                .from('registros_leitura')
                .select('minutos_lidos');

            if (error) throw error;

            const totalMinutosEscola = data.reduce((sum, item) => sum + item.minutos_lidos, 0);
            const metaTotal = 1000000; // 1 Milhão
            const porcentagemAlcancada = ((totalMinutosEscola / metaTotal) * 100).toFixed(2);

            return res.status(200).json({
                success: true,
                totalMinutos: totalMinutosEscola,
                meta: metaTotal,
                porcentagem: parseFloat(porcentagemAlcancada) // Ex: 1.45 (%) para a barra de progresso do front
            });

        } catch (error) {
            console.error('Erro ao obter total da escola:', error.message);
            return res.status(500).json({ error: 'Erro interno ao calcular meta global.' });
        }
    }

    /**
     * RF: Competição saudável entre as salas (Ranking)
     * Busca os minutos e agrupa por turma
     */
    async obterRankingTurmas(req, res) {
        try {
            // Fazemos um JOIN trazendo os minutos lidos e a turma do aluno
            // Certifique-se de que na sua tabela ALUNOS exista a coluna 'turma' (ex: '1º Ano A', '2º Ano B')
            const { data, error } = await supabase
                .from('registros_leitura')
                .select(`
                    minutos_lidos,
                    alunos (
                        turma
                    )
                `);

            if (error) throw error;

            // Agrupando e somando os minutos por turma via JavaScript (super rápido)
            const turmasAgrupadas = {};

            data.forEach(registro => {
                const nomeTurma = registro.alunos?.turma || 'Turma Não Identificada';
                if (!turmasAgrupadas[nomeTurma]) {
                    turmasAgrupadas[nomeTurma] = 0;
                }
                turmasAgrupadas[nomeTurma] += registro.minutos_lidos;
            });

            // Transforma em array e ordena do maior para o menor
            const rankingOrdenado = Object.keys(turmasAgrupadas).map(turma => ({
                turma: turma,
                total_minutos: turmasAgrupadas[turma]
            })).sort((a, b) => b.total_minutos - a.total_minutos);

            return res.status(200).json({
                success: true,
                ranking: rankingOrdenado // Array ordenado pronto para virar uma tabela de líderes
            });

        } catch (error) {
            console.error('Erro ao obter ranking:', error.message);
            return res.status(500).json({ error: 'Erro interno ao gerar ranking.' });
        }
    }
}

module.exports = new LeituraController();