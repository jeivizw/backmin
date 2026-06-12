const express = require('express');
const router = express.Router();
// Forçando o caminho relativo correto partindo da pasta src
const pedidoController = require('./src/controllers/pedidoController.js');

// Rota para o cliente criar um novo pedido com vários produtos
router.post('/criar', pedidoController.criarPedido);

module.exports = router;