const { createClient } = require('@supabase/supabase-js');
// Inicializa o cliente interno do Supabase para o serviço
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

class PedidoService {
    async processarPedidoCompra(id_cliente, itens, metodo_pagamento) {
        try {
            let valorTotalPedido = 0;
            const itensVerificados = [];

            // 1. Validar estoque e calcular preços de cada item
            for (const item of itens) {
                const { data: produto, error: errProd } = await supabase
                    .from('PRODUTOS')
                    .select('*')
                    .eq('ID_PRODUTO', item.id_produto)
                    .maybeSingle();

                if (errProd || !produto) throw new Error(`Produto ID ${item.id_produto} não encontrado.`);
                if (produto.ESTOQUE < item.quantidade) {
                    throw new Error(`Estoque insuficiente para o produto: ${produto.NOME}. Estoque atual: ${produto.ESTOQUE}`);
                }

                const subtotal = produto.PRECO * item.quantidade;
                valorTotalPedido += subtotal;

                itensVerificados.push({
                    id_produto: item.id_produto,
                    quantidade: item.quantidade,
                    novoEstoque: produto.ESTOQUE - item.quantidade
                });
            }

            // 2. Criar o Registro na tabela PEDIDOS
            const { data: pedidoCriado, error: errPed } = await supabase
                .from('PEDIDOS')
                .insert({
                    ID_CLIENTE: id_cliente,
                    DATA_PEDIDO: new Date().toISOString()
                })
                .select()
                .single();

            if (errPed) throw new Error(`Erro ao gerar pedido: ${errPed.message}`);

            // 3. Salvar os Itens e dar Baixa no Estoque de cada produto
            for (const item of itensVerificados) {
                // Insere em ITENS_DO_PEDIDO
                await supabase.from('ITENS_DO_PEDIDO').insert({
                    ID_PEDIDO: pedidoCriado.ID_PEDIDO,
                    ID_PRODUTO: item.id_produto,
                    QUANTIDADE: item.quantidade
                });

                // Atualiza a tabela PRODUTOS reduzindo a quantidade vendida
                await supabase
                    .from('PRODUTOS')
                    .update({ ESTOQUE: item.novoEstoque })
                    .eq('ID_PRODUTO', item.id_produto);
            }

            // 4. Criar o registro na tabela PAGAMENTOS
            const { data: pagamento, error: errPag } = await supabase
                .from('PAGAMENTOS')
                .insert({
                    ID_PEDIDO: pedidoCriado.ID_PEDIDO,
                    METODO: metodo_pagamento,
                    VALOR: valorTotalPedido,
                    DATA_PAGAMENTO: new Date().toISOString()
                })
                .select()
                .single();

            return { pedidoId: pedidoCriado.ID_PEDIDO, total: valorTotalPedido, pagamento: pagamento.METODO };

        } catch (error) {
            console.error('Erro no processamento do Pedido:', error.message);
            throw error;
        }
    }
}

module.exports = new PedidoService();