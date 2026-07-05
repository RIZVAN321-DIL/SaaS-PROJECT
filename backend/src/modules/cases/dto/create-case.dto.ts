import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsObject,
  MaxLength,
} from 'class-validator';

export class CreateCaseDto {
  @IsNotEmpty({ message: 'Название дела обязательно' })
  @IsString()
  @MaxLength(500, { message: 'Название дела не может быть длиннее 500 символов' })
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty({ message: 'Укажите клиента для дела' })
  @IsUUID('4', { message: 'Некорректный ID клиента' })
  clientId: string;

  @IsOptional()
  @IsUUID('4', { message: 'Некорректный ID типа дела' })
  caseTypeId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Некорректный ID ответственного юриста' })
  assignedLawyerId?: string;

  // Значения настраиваемых полей дела: { "<key>": "значение" }.
  // Автоматически становятся доступны в шаблонах как {{custom.<key>}}.
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}
