// server.js - Campanha de Leitura SESI
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// 🏠 ROTA RAIZ
app.get('/', (req, res) => {
    res.json({ 
        message: "Servidor Backend do SESI ativo com sucesso!", 
        status: "online" 
    });
});

// 🔌 CONEXÃO COM AS ROTAS DO SESI (Aqui buscamos de dentro do ./src/ pois o server.js está fora)
const alunoRoutes = require('./src/routes/alunoRoutes');
const leituraRoutes = require('./src/routes/leituraRoutes');

app.use('/api', alunoRoutes);
app.use('/api/leitura', leituraRoutes); // Adicionado para ativar os endpoints de gráficos, metas e ranking!

// Tratamento de erros centralizado
app.use((err, req, res, next) => {
    console.error('💥 Erro:', err.message || err);
    res.status(500).json({ error: 'Erro interno no servidor do projeto de leitura.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Back-end Campanha de Leitura SESI ativo na porta ${PORT}`);
});

module.exports = app;