/**
 * Разовый скрипт для создания/обновления тарифов в базе данных.
 *
 * Перед запуском создайте в Stripe Dashboard (Product catalog) продукты
 * с РЕКУРРЕНТНЫМИ ценами (recurring price) и подставьте сюда их Price ID
 * (вида price_XXXXXXXXXXXX) вместо плейсхолдеров ниже.
 *
 * Запуск из директории backend:
 * npx ts-node prisma/seed-plans.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      key: 'starter',
      name: 'Starter',
      description: 'Для небольшой практики: до 3 пользователей',
      priceMonthly: 2900, // 29.00 в минимальных единицах валюты
      currency: 'usd',
      maxUsers: 3,
      stripePriceId: 'price_REPLACE_WITH_STARTER_PRICE_ID',
    },
    {
      key: 'pro',
      name: 'Pro',
      description: 'Для растущей фирмы: до 10 пользователей',
      priceMonthly: 7900,
      currency: 'usd',
      maxUsers: 10,
      stripePriceId: 'price_REPLACE_WITH_PRO_PRICE_ID',
    },
    {
      key: 'enterprise',
      name: 'Enterprise',
      description: 'Без ограничений по числу пользователей',
      priceMonthly: 19900,
      currency: 'usd',
      maxUsers: null,
      stripePriceId: 'price_REPLACE_WITH_ENTERPRISE_PRICE_ID',
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { key: plan.key },
      create: plan,
      update: plan,
    });
    console.log(`Тариф "${plan.name}" создан/обновлён`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
