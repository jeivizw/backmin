const { supabase } = require('./src/config/supabase');

class ValidationService {
    async validarLimiteDiario(id_aluno, minutos, dataRegistro) {
        try {
            // 1. Buscar configuração do limite com tratamento de erro
            const { data: config, error: errorConfig } = await supabase
                .from('configuracoes')
                .select('valor')
                .eq('chave', 'limite_minutos_diario')
                .maybeSingle(); // maybeSingle não quebra o código se não achar nada

            if (errorConfig) {
                throw new Error(`Erro ao buscar configurações: ${errorConfig.message}`);
            }
            
            const limiteDiario = parseInt(config?.valor || 16);
            
            // 2. Buscar registro do dia
            const { data: registroExistente, error: errorRegistro } = await supabase
                .from('registros_leitura')
                .select('minutos_lidos')
                .eq('id_aluno', id_aluno)
                .eq('data_registro', dataRegistro)
                .maybeSingle(); // Trocado por maybeSingle para evitar o erro PGRST116 quando o aluno não leu nada ainda

            if (errorRegistro) {
                throw new Error(`Erro ao buscar registros de leitura: ${errorRegistro.message}`);
            }
            
            const minutosJaRegistrados = registroExistente?.minutos_lidos || 0;
            const totalMinutos = minutosJaRegistrados + minutos;
            
            // 3. Validação da meta diária
            if (totalMinutos > limiteDiario) {
                const minutosRestantes = limiteDiario - minutosJaRegistrados;
                return {
                    valido: false,
                    mensagem: `Limite diário de ${limiteDiario} minutos excedido! Você já registrou ${minutosJaRegistrados} minutos hoje. Só pode adicionar mais ${minutosRestantes} minutos.`,
                    minutosRestantes,
                    limite: limiteDiario,
                    jaRegistrados: minutosJaRegistrados
                };
            }
            
            return {
                valido: true,
                mensagem: 'Registro válido',
                totalRegistrado: totalMinutos
            };

        } catch (error) {
            // O catch intercepta qualquer falha catastrófica ou os erros disparados acima
            console.error('Erro crítico no ValidationService:', error.message);
            
            // Lança o erro para a frente para ser capturado pelo seu Controller
            throw new Error(`Falha interna na validação: ${error.message}`);
        }
    }
}

module.exports = new ValidationService();