import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@racho.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@racho.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  const categories = [
    ['Alimentação', '🍔', '#F97316'],
    ['Transporte', '🚗', '#3B82F6'],
    ['Hospedagem', '🏠', '#8B5CF6'],
    ['Mercado', '🛒', '#10B981'],
    ['Lazer', '🎟️', '#EC4899'],
    ['Outros', '🧾', '#64748B'],
  ];

  for (const [name, icon, color] of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, icon, color },
    });
  }

  console.log('Administrador e categorias iniciais disponíveis.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
