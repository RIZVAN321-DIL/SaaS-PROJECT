import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterOrganizationDto {
  @IsString()
  @MinLength(2)
  organizationName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
