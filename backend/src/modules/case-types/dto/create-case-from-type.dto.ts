import {
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCaseFromTypeDto {
  @IsString()
  caseTypeId: string;

  @IsString()
  organizationId: string;

  @IsString()
  clientId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  priority?: string;
}
