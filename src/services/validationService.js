// 🧭 Caminho corrigido para subir um nível (../) e achar a pasta config
const { supabase } = require('../config/supabase');

class ValidationService {
    async validarLimiteDiario(id_aluno, minutos, dataRegistro) {
        try {
            // 1. Buscar configuração do limite na tabela [configuracoes]
            const { data: config, error: errorConfig } = await supabase
                .from('configuracoes')
                .select('valor')
                .eq('chave', 'limite_minutos_diario')
                .maybeSingle();

            if (errorConfig) {
                throw new Error(`Erro ao buscar configurações: ${errorConfig.message}`);
            }
            
            const limiteDiario = parseInt(config?.valor || 16);
            
            // 2. Buscar quanto o aluno já leu hoje na tabela [logs_leitura] (ajustado para o nome real da tabela)
            const { data: registroExistente, error: errorRegistro } = await supabase
                .from('logs_leitura') 
                .select('minutos_lidos')
                .eq('id_aluno', id_aluno)
                .eq('data_registro', dataRegistro)
                .maybeSingle();

            if (errorRegistro) {
                throw new Error(`Erro ao buscar registros de leitura: ${errorRegistro.message}`);
            }
            
            const minutosJaRegistrados = registroExistente?.minutos_lidos || 0;
            const totalMinutos = minutosJaRegistrados + minutos;
            
            // 3. Validação da meta diária configurada
            if (totalMinutos > limiteDiario) {
                const minutosRestantes = limiteDiario - minutesJaRegistrados;
                return {
                    valido: false,
                    mensagem: `Limite diário de ${limiteDiario} minutos excedido! Já registou ${minutosJaRegistrados} minutos hoje. Só pode adicionar mais ${minutosRestantes} minutos.`,
                    minutosRestantes,
                    limite: limiteDiario,
                    jaRegistrados: minutosJaRegistrados
                };
            }
            
            return {
                valido: true,
                mensagem: 'Registro válido',
                totalRegistrado: totalMinutos,
                limite: limiteDiario,
                jaRegistrados: minutosJaRegistrados
            };

        } catch (error) {
            console.error('Erro crítico no ValidationService:', error.message);
            throw new Error(`Falha interna na validação: ${error.message}`);
        }
    }
}

module.exports = new ValidationService();