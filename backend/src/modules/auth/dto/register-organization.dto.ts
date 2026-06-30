import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';

export class RegisterOrganizationDto {
  @IsString()
  @MinLength(2)
  organizationName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  // =========================
  // Реферальный код приглашающей организации (необязательно).
  // Если указан и существует — новая организация получает 1 бесплатный
  // месяц, а пригласившая организация — ещё 1 бесплатный месяц.
  // =========================
  @IsString()
  @IsOptional()
  referralCode?: string;
}
