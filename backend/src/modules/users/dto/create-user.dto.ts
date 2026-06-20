import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
