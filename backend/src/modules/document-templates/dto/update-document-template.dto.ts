import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateDocumentTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
