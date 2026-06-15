import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@test.com';
  const password = '123456';

  const hashedPassword = await bcrypt.hash(password, 10);

  const org = await prisma.organization.create({
    data: {
      name: 'Test Org',
    },
  });

  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: 'OWNER',
      organizationId: org.id,
    },
  });

  console.log('✅ Seed user created');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
