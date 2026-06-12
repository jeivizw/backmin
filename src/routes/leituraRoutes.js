const express = require('express');
const router = express.Router();

const leituraController = require('./src/controllers/leituraController');
const { protegerRota } = require('./src/middlewares/auth');
const { validarMinutosDodia } = require('./src/middlewares/validation');

// 1. Registro de Leitura Diária (Protegido e Validado)
router.post(
    '/registrar', 
    protegerRota,         
    validarMinutosDodia,  
    leituraController.registrarMinutos 
);

// 2. Gráficos do Aluno (Privado - depende do aluno logado)
router.get('/progresso-individual', protegerRota, leituraController.obterProgressoAluno);

// 3. Termômetro de 1 Milhão (Público - para exibir na tela inicial/telão da escola se quiser)
router.get('/total-escola', leituraController.obterTotalEscola);

// 4. Ranking das Salas (Público ou Privado - deixei público para a disputa geral)
router.get('/ranking-turmas', leituraController.obterRankingTurmas);

module.exports = router;