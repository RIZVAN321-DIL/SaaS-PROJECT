import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { PrismaService } from '../../database/prisma.service';

// =========================
// Базовые плейсхолдеры, доступные в шаблонах всегда: {{client.fullName}},
// {{case.title}} и т.д. Помимо них, для каждой организации динамически
// доступны {{custom.<key>}} — по настраиваемым полям клиента и дела,
// см. DocumentTemplatesService.getAvailableVariables().
// =========================
export const TEMPLATE_VARIABLES: { key: string; label: string }[] = [
  { key: 'client.fullName', label: 'ФИО клиента' },
  { key: 'client.phone', label: 'Телефон клиента' },
  { key: 'client.email', label: 'Email клиента' },
  { key: 'case.title', label: 'Название дела' },
  { key: 'case.description', label: 'Описание дела' },
  { key: 'organization.name', label: 'Название организации' },
  { key: 'lawyer.email', label: 'Email ответственного юриста' },
  { key: 'today', label: 'Сегодняшняя дата' },
];

@Injectable()
export class DocumentTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================
  // CRUD
  // =========================
  async findAll(organizationId: string) {
    return this.prisma.documentTemplate.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const template = await this.prisma.documentTemplate.findFirst({
      where: { id, organizationId },
    });
    if (!template) {
      throw new NotFoundException('Шаблон не найден');
    }
    return template;
  }

  async create(data: {
    name: string;
    description?: string;
    content: string;
    organizationId: string;
    createdById?: string;
  }) {
    return this.prisma.documentTemplate.create({ data });
  }

  async update(
    id: string,
    organizationId: string,
    data: { name?: string; description?: string; content?: string },
  ) {
    await this.findOne(id, organizationId);
    return this.prisma.documentTemplate.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.prisma.documentTemplate.delete({ where: { id } });
    return { success: true, id };
  }

  // =========================
  // Список переменных для подсказки в редакторе шаблона: базовые +
  // {{custom.<key>}} по всем настраиваемым полям клиента и дел организации.
  // Если передан caseTypeId — среди полей дела показываем только общие
  // (caseTypeId = null) и специфичные для этого типа.
  // =========================
  async getAvailableVariables(organizationId: string, caseTypeId?: string) {
    const definitions = await this.prisma.customFieldDefinition.findMany({
      where: {
        organizationId,
        ...(caseTypeId
          ? {
              OR: [
                { entityType: 'CLIENT' },
                { entityType: 'CASE', caseTypeId: null },
                { entityType: 'CASE', caseTypeId },
              ],
            }
          : {}),
      },
      orderBy: { order: 'asc' },
    });

    const customVariables = definitions.map((def) => ({
      key: `custom.${def.key}`,
      label: `${def.label} (${def.entityType === 'CLIENT' ? 'клиент' : 'дело'})`,
    }));

    return [...TEMPLATE_VARIABLES, ...customVariables];
  }

  // =========================
  // Контекст переменных для конкретного дела
  // =========================
  private async buildContext(caseId: string, organizationId: string) {
    const caseRecord = await this.prisma.case.findFirst({
      where: { id: caseId, organizationId },
      include: { client: true, assignedLawyer: true, organization: true },
    });

    if (!caseRecord) {
      throw new NotFoundException('Дело не найдено');
    }

    const today = new Date().toLocaleDateString('ru-RU');

    // custom.* собирается из полей клиента и дела. При совпадении ключей
    // значение из карточки дела имеет приоритет над значением клиента —
    // на практике ключи разных сущностей почти никогда не пересекаются,
    // т.к. уникальность key проверяется отдельно для CLIENT и для CASE.
    const custom: Record<string, any> = {
      ...((caseRecord.client?.customFields as Record<string, any>) ?? {}),
      ...((caseRecord.customFields as Record<string, any>) ?? {}),
    };

    return {
      client: {
        fullName: caseRecord.client?.fullName ?? '',
        phone: caseRecord.client?.phone ?? '',
        email: caseRecord.client?.email ?? '',
      },
      case: {
        title: caseRecord.title ?? '',
        description: caseRecord.description ?? '',
      },
      organization: {
        name: caseRecord.organization?.name ?? '',
      },
      lawyer: {
        email: caseRecord.assignedLawyer?.email ?? '',
      },
      custom,
      today,
    } as Record<string, Record<string, string> | string>;
  }

  // =========================
  // Подстановка {{path.to.value}} в тексте шаблона.
  // \p{L}\p{N}_ (юникод-классы) вместо \w — иначе кириллические ключи вида
  // {{custom.кадастровый_номер}} не совпали бы с обычным \w из ASCII.
  // =========================
  private resolveContent(content: string, context: Record<string, any>): string {
    return content.replace(
      /{{\s*([\p{L}\p{N}_]+(?:\.[\p{L}\p{N}_]+)*)\s*}}/gu,
      (match, path: string) => {
        const value = path
          .split('.')
          .reduce((acc: any, key: string) => (acc ? acc[key] : undefined), context);
        return value !== undefined && value !== null && value !== ''
          ? String(value)
          : `[${path}]`; // оставляем видимую метку, чтобы юрист заметил незаполненное поле
      },
    );
  }

  // =========================
  // Сгенерировать текст документа (для превью) и сразу .docx буфер
  // =========================
  async generateDocx(
    templateId: string,
    caseId: string,
    organizationId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    if (!caseId) {
      throw new BadRequestException('Не указано дело для генерации документа');
    }

    const template = await this.findOne(templateId, organizationId);
    const context = await this.buildContext(caseId, organizationId);
    const resolvedText = this.resolveContent(template.content, context);

    const paragraphs = resolvedText
      .split('\n')
      .map(
        (line) =>
          new Paragraph({
            children: [new TextRun(line)],
          }),
      );

    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs }],
    });

    const buffer = await Packer.toBuffer(doc);
    const safeName = template.name.replace(/[^\p{L}\p{N}\- _]/gu, '').trim() || 'Документ';

    return { buffer, filename: `${safeName}.docx` };
  }
}
