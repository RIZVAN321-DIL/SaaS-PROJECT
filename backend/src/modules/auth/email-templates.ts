/**
 * Простые HTML-шаблоны для транзакционных писем CaseFlow.
 * Используются в AuthService.sendEmail(). Держим инлайн-стили —
 * почтовые клиенты (Outlook, Gmail) плохо поддерживают <style> в <head>.
 */

const BRAND_COLOR = '#0d9488';
const BRAND_COLOR_DARK = '#0f172a';

function wrapper(bodyHtml: string): string {
  return `
  <div style="background:#f3f4f6;padding:32px 16px;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:${BRAND_COLOR_DARK};padding:24px 32px;">
        <span style="font-size:20px;font-weight:800;color:#ffffff;">Case<span style="color:${BRAND_COLOR};">Flow</span></span>
      </div>
      <div style="padding:32px;">
        ${bodyHtml}
      </div>
      <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          Это письмо отправлено автоматически. Если вы не запрашивали это действие — просто проигнорируйте его.
        </p>
      </div>
    </div>
  </div>`;
}

export function twoFactorCodeEmail(code: string): { subject: string; html: string; text: string } {
  return {
    subject: 'Код подтверждения входа — CaseFlow',
    html: wrapper(`
      <p style="margin:0 0 16px;font-size:15px;color:#111827;">Ваш код для входа в CaseFlow:</p>
      <div style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;padding:14px 28px;background:#f0fdfa;border:1px solid ${BRAND_COLOR};border-radius:12px;font-size:28px;font-weight:800;letter-spacing:6px;color:${BRAND_COLOR_DARK};">${code}</span>
      </div>
      <p style="margin:0;font-size:13px;color:#6b7280;">Код действует 10 минут. Никому не сообщайте его.</p>
    `),
    text: `Ваш код для входа: ${code}. Действует 10 минут.`,
  };
}

export function passwordResetEmail(resetLink: string): { subject: string; html: string; text: string } {
  return {
    subject: 'Сброс пароля — CaseFlow',
    html: wrapper(`
      <p style="margin:0 0 20px;font-size:15px;color:#111827;">
        Мы получили запрос на сброс пароля для вашего аккаунта CaseFlow.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${resetLink}" style="display:inline-block;padding:12px 28px;background:${BRAND_COLOR};color:#ffffff;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;">
          Сбросить пароль
        </a>
      </div>
      <p style="margin:0;font-size:13px;color:#6b7280;">
        Ссылка действует 1 час. Если вы не запрашивали сброс пароля, просто игнорируйте это письмо.
      </p>
    `),
    text: `Перейдите по ссылке, чтобы сбросить пароль: ${resetLink}`,
  };
}

export function inviteEmail(
  setPasswordLink: string,
  roleLabel: string,
): { subject: string; html: string; text: string } {
  return {
    subject: 'Вас пригласили в CaseFlow',
    html: wrapper(`
      <p style="margin:0 0 20px;font-size:15px;color:#111827;">
        Вас добавили в команду CaseFlow с ролью «${roleLabel}». Чтобы начать
        работу, задайте пароль для входа.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${setPasswordLink}" style="display:inline-block;padding:12px 28px;background:${BRAND_COLOR};color:#ffffff;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;">
          Задать пароль и войти
        </a>
      </div>
      <p style="margin:0;font-size:13px;color:#6b7280;">
        Ссылка действует 7 дней. Если вы не ожидали это приглашение, просто игнорируйте письмо.
      </p>
    `),
    text: `Вас добавили в команду CaseFlow с ролью «${roleLabel}». Перейдите по ссылке, чтобы задать пароль: ${setPasswordLink}`,
  };
}

export function deadlineReminderEmail(
  caseTitle: string,
  deadlineLabel: string | null,
  deadlineDate: Date,
  caseLink: string,
): { subject: string; html: string; text: string } {
  const formattedDate = deadlineDate.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const daysLeft = Math.ceil(
    (deadlineDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  );
  const label = deadlineLabel || 'Срок по делу';

  return {
    subject: `⏰ Срок истекает через ${daysLeft} дн. — ${caseTitle}`,
    html: wrapper(`
      <div style="margin:0 0 16px;padding:10px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;">
        <span style="font-size:13px;font-weight:700;color:#b91c1c;">Осталось ${daysLeft} дн. до срока</span>
      </div>
      <p style="margin:0 0 6px;font-size:15px;color:#111827;font-weight:600;">${label}</p>
      <p style="margin:0 0 20px;font-size:14px;color:#374151;">По делу «${caseTitle}» — срок ${formattedDate}.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${caseLink}" style="display:inline-block;padding:12px 28px;background:${BRAND_COLOR};color:#ffffff;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;">
          Открыть дело
        </a>
      </div>
    `),
    text: `${label} по делу «${caseTitle}»: ${formattedDate} (осталось ${daysLeft} дн.). Открыть дело: ${caseLink}`,
  };
}
