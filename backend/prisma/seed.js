// Importa ambiente, segurança e banco.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// Cria o cliente de preenchimento.
const prisma = new PrismaClient();

// Recria os dados demonstrativos.
async function preencherBanco() {
  // Limpa tabelas na ordem correta.
  await prisma.expenseShare.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Criptografa as senhas demonstrativas.
  const senhaUsuariosHash = await bcrypt.hash('123456', 10);
  const senhaAdministradorHash = await bcrypt.hash('admin123', 10);

  // Cria administrador e usuários comuns.
  const [, ana, bruno, carla] = await Promise.all([
    prisma.user.create({ data: { name: 'Administrador', email: 'admin@racho.com', passwordHash: senhaAdministradorHash, role: 'ADMIN' } }),
    prisma.user.create({ data: { name: 'Ana Souza', email: 'ana@racho.com', passwordHash: senhaUsuariosHash } }),
    prisma.user.create({ data: { name: 'Bruno Lima', email: 'bruno@racho.com', passwordHash: senhaUsuariosHash } }),
    prisma.user.create({ data: { name: 'Carla Mendes', email: 'carla@racho.com', passwordHash: senhaUsuariosHash } }),
  ]);

  // Cria as categorias iniciais.
  const categorias = await Promise.all([
    prisma.category.create({ data: { name: 'Alimentação', icon: '🍔', color: '#F97316' } }),
    prisma.category.create({ data: { name: 'Transporte', icon: '🚗', color: '#3B82F6' } }),
    prisma.category.create({ data: { name: 'Hospedagem', icon: '🏠', color: '#8B5CF6' } }),
    prisma.category.create({ data: { name: 'Mercado', icon: '🛒', color: '#10B981' } }),
    prisma.category.create({ data: { name: 'Lazer', icon: '🎟️', color: '#EC4899' } }),
    prisma.category.create({ data: { name: 'Outros', icon: '🧾', color: '#64748B' } }),
  ]);

  // Cria o grupo de viagem.
  const viagem = await prisma.group.create({
    data: {
      name: 'Fim de semana em Caldas',
      description: 'Hospedagem, estrada, comida e passeios da viagem.',
      coverEmoji: '🏖️',
      createdById: ana.id,
      members: { create: [{ userId: ana.id }, { userId: bruno.id }, { userId: carla.id }] },
    },
  });

  // Cria o grupo do churrasco.
  const churrasco = await prisma.group.create({
    data: {
      name: 'Churrasco da turma',
      description: 'Despesas do churrasco de encerramento do semestre.',
      coverEmoji: '🔥',
      createdById: bruno.id,
      members: { create: [{ userId: bruno.id }, { userId: ana.id }, { userId: carla.id }] },
    },
  });

  // Registra a despesa de hospedagem.
  await prisma.expense.create({
    data: {
      groupId: viagem.id,
      title: 'Casa de temporada',
      description: 'Duas diárias para o grupo.',
      amount: '600.00',
      date: new Date('2026-07-04T12:00:00'),
      payerId: ana.id,
      createdById: ana.id,
      categoryId: categorias[2].id,
      shares: { create: [
        { userId: ana.id, amount: '200.00' },
        { userId: bruno.id, amount: '200.00' },
        { userId: carla.id, amount: '200.00' },
      ] },
    },
  });

  // Registra a despesa de transporte.
  await prisma.expense.create({
    data: {
      groupId: viagem.id,
      title: 'Combustível',
      amount: '210.00',
      date: new Date('2026-07-05T12:00:00'),
      payerId: bruno.id,
      createdById: bruno.id,
      categoryId: categorias[1].id,
      shares: { create: [
        { userId: ana.id, amount: '70.00' },
        { userId: bruno.id, amount: '70.00' },
        { userId: carla.id, amount: '70.00' },
      ] },
    },
  });

  // Registra a despesa do churrasco.
  await prisma.expense.create({
    data: {
      groupId: churrasco.id,
      title: 'Carnes e acompanhamentos',
      amount: '270.00',
      date: new Date('2026-07-11T12:00:00'),
      payerId: carla.id,
      createdById: carla.id,
      categoryId: categorias[0].id,
      shares: { create: [
        { userId: ana.id, amount: '90.00' },
        { userId: bruno.id, amount: '90.00' },
        { userId: carla.id, amount: '90.00' },
      ] },
    },
  });

  // Registra um pagamento confirmado.
  await prisma.settlement.create({
    data: {
      groupId: viagem.id,
      payerId: carla.id,
      receiverId: ana.id,
      createdById: carla.id,
      amount: '50.00',
      method: 'PIX',
      note: 'Primeira parte da hospedagem',
      status: 'CONFIRMED',
      confirmedAt: new Date(),
    },
  });

  // Exibe as credenciais demonstrativas.
  console.log('Banco preenchido.');
  console.log('Administrador: admin@racho.com / admin123');
  console.log('Usuários: ana@racho.com, bruno@racho.com, carla@racho.com / 123456');
}

// Executa e encerra a conexão.
preencherBanco().catch(console.error).finally(() => prisma.$disconnect());
