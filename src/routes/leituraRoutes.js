const express = require('express');
const router = express.Router();

// 🧭 Caminhos corrigidos subindo um nível (../) pois este arquivo já está dentro de src/routes
const leituraController = require('../controllers/leituraController');
const { protegerRota } = require('../middlewares/auth');
const { validateLeitura } = require('../middlewares/validation');

// 1. Registro de Leitura Diária (Protegido e Validado)
router.post(
    '/registrar', 
    protegerRota,         
    validateLeitura,  // Nome corrigido para bater com o export do seu validation.js
    leituraController.registrarMinutos 
);

// 2. Gráficos do Aluno (Privado - depende do aluno logado)
router.get('/progresso-individual', protegerRota, leituraController.obterProgressoAluno);

// 3. Termômetro de 1 Milhão (Público)
router.get('/total-escola', leituraController.obterTotalEscola);

// 4. Ranking das Salas (Público)
router.get('/ranking-turmas', leituraController.obterRankingTurmas);

module.exports = router;