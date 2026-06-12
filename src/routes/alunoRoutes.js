const express = require('express');
const router = express.Router();
const alunoController = require('./src/controllers/alunoController');

// Rotas de Autenticação
router.post('/login/rm', alunoController.loginPorRM);
router.post('/login/email', alunoController.loginPorEmail);

// Rota de Registro de Minutos (usa o middleware de autenticação embutido no controller)
router.post('/registro-leitura', alunoController.registrarLeitura);

module.exports = router;