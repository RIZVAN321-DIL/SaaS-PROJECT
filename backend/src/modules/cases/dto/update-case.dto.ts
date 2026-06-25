import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
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
}
