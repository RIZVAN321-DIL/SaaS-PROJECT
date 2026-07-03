import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

// Ровно один из двух режимов должен прийти с фронта:
// 1) fixedDate: явная дата дедлайна
// 2) sourceDate + days: авторасчёт ("от даты события + N дней")
// Если ни то, ни другое не передано — срок снимается с дела.
export class SetCaseDeadlineDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  @IsOptional()
  @IsDateString()
  fixedDate?: string;

  @IsOptional()
  @IsDateString()
  sourceDate?: string;

  @ValidateIf((o) => o.sourceDate !== undefined)
  @IsInt()
  @Min(0)
  @Max(3650)
  days?: number;
}
