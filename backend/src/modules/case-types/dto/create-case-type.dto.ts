import {
  IsArray,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCaseTypeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  tasksTemplate?: string[];

  @IsOptional()
  @IsArray()
  documentsTemplate?: string[];

  @IsOptional()
  @IsArray()
  rules?: any[];
}
