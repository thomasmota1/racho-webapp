// Carrega ambiente, aplicação e banco.
import 'dotenv/config';
import aplicacao from './app.js';
import prisma from './lib/prisma.js';

// Define a porta do servidor.
const porta = Number(process.env.PORT || 3333);
// Inicia a escuta HTTP.
const servidor = aplicacao.listen(porta, () => {
  console.log(`Rachô API disponível em http://localhost:${porta}`);
});

// Encerra conexões com segurança.
async function encerrarServidor() {
  await prisma.$disconnect();
  servidor.close(() => process.exit(0));
}

// Escuta sinais de encerramento.
process.on('SIGINT', encerrarServidor);
process.on('SIGTERM', encerrarServidor);
