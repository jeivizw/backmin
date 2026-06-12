// server.js - Campanha de Leitura SESI
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// Rota de teste para você verificar se o Back-end está vivo na Vercel
app.get('/api/teste', (req, res) => {
    res.json({ 
        status: "online", 
        projeto: "Campanha de Leitura SESI",
        timestamp: new Date()
    });
});

// 🔌 CONEXÃO COM AS ROTAS DO SESI
const alunoRoutes = require('./src/routes/alunoRoutes');
app.use('/api', alunoRoutes);

// Tratamento de erros centralizado
app.use((err, req, res, next) => {
    console.error('💥 Erro:', err.message || err);
    res.status(500).json({ error: 'Erro interno no servidor do projeto de leitura.' });
});


const PORT = process.env.PORT || 3001;

// Só escuta a porta se NÃO estiver rodando dentro do ambiente da Vercel
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Back-end Campanha de Leitura SESI ativo na porta ${PORT}`);
    });
}

module.exports = app;