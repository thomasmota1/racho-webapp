// Importa servidor, rotas e middlewares.
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import settlementRoutes from './routes/settlementRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { rotaNaoEncontrada, tratarErro } from './middlewares/errorHandler.js';

// Cria a aplicação Express.
const aplicacao = express();
// Configura origem e dados JSON.
aplicacao.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
aplicacao.use(express.json());

// Informa a disponibilidade da API.
aplicacao.get('/api/health', (_requisicao, resposta) => {
  resposta.json({ status: 'ok', application: 'Rachô API' });
});

// Registra as rotas da API.
aplicacao.use('/api/auth', authRoutes);
aplicacao.use('/api/categories', categoryRoutes);
aplicacao.use('/api/groups', groupRoutes);
aplicacao.use('/api/expenses', expenseRoutes);
aplicacao.use('/api/settlements', settlementRoutes);
aplicacao.use('/api/admin', adminRoutes);
// Trata rotas e erros restantes.
aplicacao.use(rotaNaoEncontrada);
aplicacao.use(tratarErro);

// Exporta a aplicação configurada.
export default aplicacao;
