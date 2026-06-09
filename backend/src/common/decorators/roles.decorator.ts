import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

// =========================
// RBAC METADATA KEY
// =========================
export const ROLES_KEY = 'roles';

// =========================
// ROLES DECORATOR (RBAC CORE)
// =========================
export const Roles = (...roles: Role[]) =>
  SetMetadata(ROLES_KEY, roles);
