import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8, {
    message: 'Пароль должен содержать минимум 8 символов',
  })
  @MaxLength(128, {
    message: 'Пароль не должен превышать 128 символов',
  })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'Пароль должен содержать хотя бы одну букву и одну цифру',
  })
  newPassword: string;
}
