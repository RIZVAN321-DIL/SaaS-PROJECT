import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';

// =========================
// Генерация уникального реферального кода организации
// Формат: 8 символов в верхнем регистре, например "A1B2C3D4"
// =========================
export async function generateUniqueReferralCode(
  prisma: PrismaService,
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const existing = await prisma.organization.findUnique({
      where: { referralCode: code },
    });
    if (!existing) return code;
  }
  // Крайне маловероятный случай — добавляем временную метку для гарантии уникальности
  return `${crypto.randomBytes(4).toString('hex').toUpperCase()}${Date.now()}`;
}
