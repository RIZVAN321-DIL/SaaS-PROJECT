import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDocumentTemplateDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsString()
  content: string;
}
