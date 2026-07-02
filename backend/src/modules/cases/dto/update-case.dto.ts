import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateCaseDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Название дела не может быть длиннее 500 символов' })
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Некорректный ID типа дела' })
  caseTypeId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Некорректный ID стадии' })
  stageId?: string;

  // Пустая строка = снять назначение (юрист становится "не назначен")
  @IsOptional()
  @ValidateIf((o) => o.assignedLawyerId !== '' && o.assignedLawyerId !== null)
  @IsUUID('4', { message: 'Некорректный ID ответственного юриста' })
  assignedLawyerId?: string | null;
}
