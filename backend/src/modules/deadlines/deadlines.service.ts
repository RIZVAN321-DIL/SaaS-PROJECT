import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../../database/prisma.service';
import { AuthService } from '../auth/auth.service';

// Сколько дней "вперёд" считаем срок приближающимся и шлём напоминание.
// Напоминание отправляется один раз на дедлайн (см. deadlineReminderSentAt) —
// это MVP; для многоступенчатых напоминаний (7/3/1 день) нужно будет
// заменить deadlineReminderSentAt на массив отправленных этапов.
const REMINDER_WINDOW_DAYS = 3;

@Injectable()
export class DeadlinesService {
  private readonly logger = new Logger(DeadlinesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkUpcomingDeadlines() {
    const now = new Date();
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + REMINDER_WINDOW_DAYS);

    const cases = await this.prisma.case.findMany({
      where: {
        deadlineDate: { gte: now, lte: windowEnd },
        deadlineReminderSentAt: null,
      },
      include: {
        assignedLawyer: true,
        organization: {
          include: {
            users: { where: { role: 'OWNER' }, take: 1 },
          },
        },
      },
    });

    if (cases.length === 0) return;

    this.logger.log(`Найдено дел с приближающимся сроком: ${cases.length}`);

    for (const c of cases) {
      // Приоритет — ответственный юрист; если не назначен, напоминаем владельцу организации.
      const recipient = c.assignedLawyer?.email ?? c.organization.users[0]?.email;
      if (!recipient || !c.deadlineDate) continue;

      const sent = await this.authService.sendDeadlineReminder(
        recipient,
        c.title,
        c.id,
        c.deadlineLabel,
        c.deadlineDate,
      );

      if (sent) {
        await this.prisma.case.update({
          where: { id: c.id },
          data: { deadlineReminderSentAt: new Date() },
        });
      } else {
        this.logger.warn(`Не удалось отправить напоминание по делу ${c.id}`);
      }
    }
  }
}
