import { IsString, IsOptional, IsDateString } from 'class-validator';

export class GrantOverrideDto {
  @IsString()
  @IsOptional()
  reason?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
