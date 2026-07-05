import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsObject,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateClientDto {
  @IsString({ message: 'ФИО должно быть строкой' })
  @IsNotEmpty({ message: 'ФИО обязательно' })
  @MaxLength(255, { message: 'ФИО не должно превышать 255 символов' })
  fullName: string;

  @IsOptional()
  @IsString()
  @Matches(/^[\d\s\+\-\(\)]+$/, {
    message: 'Некорректный формат номера телефона',
  })
  @MaxLength(30, { message: 'Номер телефона слишком длинный' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Некорректный формат email' })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Примечания не должны превышать 5000 символов' })
  notes?: string;

  // Значения настраиваемых полей клиента: { "<key>": "значение" }.
  // Набор полей задаётся владельцем организации в Настройках.
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}

export class UpdateClientDto {
  @IsOptional()
  @IsString({ message: 'ФИО должно быть строкой' })
  @IsNotEmpty({ message: 'ФИО не может быть пустым' })
  @MaxLength(255)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[\d\s\+\-\(\)]+$/, {
    message: 'Некорректный формат номера телефона',
  })
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Некорректный формат email' })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}
