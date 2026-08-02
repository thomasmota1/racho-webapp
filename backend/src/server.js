import 'dotenv/config';
import aplicacao from './app.js';
import prisma from './lib/prisma.js';

const porta = Number(process.env.PORT || 3333);
const servidor = aplicacao.listen(porta, () => {
  console.log(`Rachô API disponível em http://localhost:${porta}`);
});

async function encerrarServidor() {
  await prisma.$disconnect();
  servidor.close(() => process.exit(0));
}

process.on('SIGINT', encerrarServidor);
process.on('SIGTERM', encerrarServidor);
