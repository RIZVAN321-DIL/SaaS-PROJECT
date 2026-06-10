import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  organizationId: string;

  @IsOptional()
  role?: Role;
}
