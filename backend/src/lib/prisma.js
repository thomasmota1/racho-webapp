// Importa o cliente do banco.
import { PrismaClient } from '@prisma/client';

// Cria uma conexão compartilhada.
const prisma = new PrismaClient();

// Disponibiliza o cliente configurado.
export default prisma;
