import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности — CaseFlow',
  description: 'Политика конфиденциальности сервиса CaseFlow',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="mb-8 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft size={14} /> На главную
      </Link>

      <h1 className="mb-2 text-3xl font-bold">Политика конфиденциальности</h1>
      <p className="mb-8 text-sm text-muted-foreground">Действует с {new Date().toLocaleDateString('ru-RU')}</p>

      <div className="space-y-6 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="mb-2 text-lg font-semibold">1. Общие положения</h2>
          <p>
            Настоящая Политика конфиденциальности определяет порядок обработки персональных данных
            пользователей сервиса CaseFlow (далее — «Сервис»). Используя Сервис, вы соглашаетесь
            с условиями настоящей Политики.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">2. Какие данные мы собираем</h2>
          <p>Мы обрабатываем следующие категории данных:</p>
          <ul className="ml-5 mt-2 list-disc space-y-1">
            <li>Данные учётной записи: email, роль в организации, хэш пароля</li>
            <li>Данные, которые вы вносите в систему: сведения о делах, клиентах, задачах, документах</li>
            <li>Технические данные: IP-адрес, тип браузера, журналы действий (аудит-лог)</li>
            <li>Платёжные данные обрабатываются платёжным провайдером Stripe — мы не храним номера карт</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">3. Как мы защищаем данные</h2>
          <p>
            Документы, загруженные в Сервис, хранятся в зашифрованном виде (AES-256-GCM). Доступ
            к данным внутри организации регулируется настраиваемыми ролями. Пароли хранятся
            в виде необратимых хэшей и никогда не передаются в открытом виде.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">4. Передача данных третьим лицам</h2>
          <p>
            Мы не продаём и не передаём персональные данные третьим лицам, за исключением
            сервисов, необходимых для работы платформы: обработка платежей (Stripe), отправка
            транзакционных писем (Resend), хостинг инфраструктуры (Render).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">5. Права пользователя</h2>
          <p>
            Вы можете запросить удаление своей учётной записи и связанных данных, обратившись
            в поддержку. Данные организации удаляются при удалении аккаунта владельца организации,
            если иное не предусмотрено законодательством о хранении бухгалтерских/юридических документов.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">6. Контакты</h2>
          <p>
            По вопросам обработки персональных данных обращайтесь по адресу поддержки, указанному
            в вашем личном кабинете.
          </p>
        </section>
      </div>
    </main>
  );
}
