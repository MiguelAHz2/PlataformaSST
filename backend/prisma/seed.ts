/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de producción...');

  // Limpiar base de datos en orden (respetar foreign keys)
  await prisma.answer.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.workshopSubmission.deleteMany();
  await prisma.lessonCompletion.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  console.log('✅ Base de datos limpiada');

  // Crear administradora
  const adminPassword = await bcrypt.hash('Soacha.2026', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'Icela Sanchez',
      email: 'icela.1998.sanchez@gmail.com',
      password: adminPassword,
      role: 'ADMIN',
      position: 'Ingeniera SST',
      phone: '3182036686',
    },
  });

  console.log('✅ Admin creada:', admin.email);
  console.log('\n🎉 Seed de producción completado!');
  console.log('\n📋 Credenciales admin:');
  console.log('  Email:    icela.1998.sanchez@gmail.com');
  console.log('  Password: Soacha.2026');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
