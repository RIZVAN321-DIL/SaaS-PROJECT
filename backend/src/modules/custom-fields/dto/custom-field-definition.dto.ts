import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsBoolean,
  IsInt,
  IsArray,
  MaxLength,
  Matches,
} from 'class-validator';

// entityType: к какой карточке относится поле
export const ENTITY_TYPES = ['CLIENT', 'CASE'] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

// fieldType: тип значения и способ рендера в форме на фронте
export const FIELD_TYPES = [
  'TEXT',
  'TEXTAREA',
  'NUMBER',
  'DATE',
  'SELECT',
  'BOOLEAN',
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

// Ключ переменной: буквы (в т.ч. кириллица), цифры, подчёркивание.
// Без точек и пробелов — точка зарезервирована как разделитель namespace
// в шаблонах документов ({{custom.ключ}}).
const KEY_PATTERN = /^[\p{L}\p{N}_]+$/u;

export class CreateCustomFieldDefinitionDto {
  @IsIn(ENTITY_TYPES, {
    message: 'entityType должен быть CLIENT или CASE',
  })
  entityType: EntityType;

  @IsString()
  @IsNotEmpty({ message: 'Ключ поля обязателен' })
  @MaxLength(100, { message: 'Ключ поля не должен превышать 100 символов' })
  @Matches(KEY_PATTERN, {
    message:
      'Ключ поля может содержать только буквы, цифры и подчёркивание, без пробелов и точек',
  })
  key: string;

  @IsString()
  @IsNotEmpty({ message: 'Название поля обязательно' })
  @MaxLength(255)
  label: string;

  @IsOptional()
  @IsIn(FIELD_TYPES, { message: 'Недопустимый тип поля' })
  fieldType?: FieldType;

  @IsOptional()
  @IsArray()
  options?: string[];

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;

  // Только для entityType = CASE. Если не задано — поле общее для всех типов дел.
  @IsOptional()
  @IsString()
  caseTypeId?: string;
}

export class UpdateCustomFieldDefinitionDto {
  // Ключ намеренно нельзя менять после создания — от него зависят
  // уже сохранённые значения в Client.customFields/Case.customFields
  // и переменные {{custom.ключ}}, использованные в шаблонах документов.

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  label?: string;

  @IsOptional()
  @IsIn(FIELD_TYPES, { message: 'Недопустимый тип поля' })
  fieldType?: FieldType;

  @IsOptional()
  @IsArray()
  options?: string[];

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsString()
  caseTypeId?: string | null;
}
