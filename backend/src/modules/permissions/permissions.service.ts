import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Role } from '../../common/enums/role.enum';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';

export interface OrgPermissions {
  lawyersSeeOnlyOwnCases: boolean;
  assistantsSeeOnlyOwnTasks: boolean;
  hideAdminSectionsFromLawyers: boolean;
  whoCanDeleteCases: string;
  whoCanDeleteDocuments: string;
}

// =========================
// ЗНАЧЕНИЯ ПО УМОЛЧАНИЮ
// По требованию заказчика все ограничения по умолчанию включены
// =========================
const DEFAULT_PERMISSIONS: OrgPermissions = {
  lawyersSeeOnlyOwnCases: true,
  assistantsSeeOnlyOwnTasks: true,
  hideAdminSectionsFromLawyers: true,
  whoCanDeleteCases: 'ADMIN',
  whoCanDeleteDocuments: 'ADMIN',
};

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================
  // ПОЛУЧИТЬ НАСТРОЙКИ (создаёт дефолтные при первом обращении)
  // =========================
  async getForOrganization(organizationId: string): Promise<OrgPermissions> {
    const existing = await this.prisma.organizationPermissions.findUnique({
      where: { organizationId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.organizationPermissions.create({
      data: {
        organizationId,
        ...DEFAULT_PERMISSIONS,
      },
    });
  }

  // =========================
  // ОБНОВИТЬ НАСТРОЙКИ (только OWNER — проверяется в контроллере через @Roles)
  // =========================
  async update(
    organizationId: string,
    dto: UpdatePermissionsDto,
  ): Promise<OrgPermissions> {
    await this.getForOrganization(organizationId);

    return this.prisma.organizationPermissions.update({
      where: { organizationId },
      data: { ...dto },
    });
  }

  // =========================
  // ПРОВЕРКИ ДОСТУПА
  // OWNER и ADMIN всегда видят всё — эта логика зашита здесь,
  // а не оставлена на усмотрение вызывающего кода.
  // =========================

  canDeleteCase(role: Role | string, settings: Pick<OrgPermissions, 'whoCanDeleteCases'>): boolean {
    if (role === Role.OWNER) return true;
    if (role === Role.ADMIN) return settings.whoCanDeleteCases === 'ADMIN';
    return false;
  }

  canDeleteDocument(
    role: Role | string,
    settings: Pick<OrgPermissions, 'whoCanDeleteDocuments'>,
  ): boolean {
    if (role === Role.OWNER) return true;
    if (settings.whoCanDeleteDocuments === 'ALL') return true;
    if (role === Role.ADMIN) return settings.whoCanDeleteDocuments === 'ADMIN';
    return false;
  }

  // Нужно ли фильтровать список дел юристу по назначенному юристу.
  // OWNER/ADMIN не фильтруются никогда.
  shouldFilterCasesByLawyer(
    role: Role | string,
    settings: Pick<OrgPermissions, 'lawyersSeeOnlyOwnCases'>,
  ): boolean {
    return role === Role.LAWYER && settings.lawyersSeeOnlyOwnCases;
  }

  // Нужно ли фильтровать список задач помощнику по исполнителю.
  // OWNER/ADMIN не фильтруются никогда.
  shouldFilterTasksByAssistant(
    role: Role | string,
    settings: Pick<OrgPermissions, 'assistantsSeeOnlyOwnTasks'>,
  ): boolean {
    return role === Role.ASSISTANT && settings.assistantsSeeOnlyOwnTasks;
  }
        }
