// src/controllers/pedidoController.js
const pedidoService = require('../services/pedidoService');

const criarPedido = async (req, res, next) => {
    try {
        const { id_cliente, itens, metodo_pagamento } = req.body;

        // Validação básica se os dados obrigatórios vieram na requisição
        if (!id_cliente || !itens || itens.length === 0 || !metodo_pagamento) {
            return res.status(400).json({ 
                error: 'Dados incompletos para processar o pedido. Certifique-se de enviar id_cliente, itens e metodo_pagamento.' 
            });
        }

        // Chama o serviço para executar a lógica complexa de venda e estoque
        const resultado = await pedidoService.processarPedidoCompra(id_cliente, itens, metodo_pagamento);

        return res.status(201).json({
            success: true,
            message: 'Pedido realizado com sucesso!',
            dados: resultado
        });

    } catch (error) {
        // Se houver algum erro (como falta de estoque), passa para o tratamento centralizado do server.js
        return res.status(400).json({ error: error.message });
    }
};

module.exports = { criarPedido };