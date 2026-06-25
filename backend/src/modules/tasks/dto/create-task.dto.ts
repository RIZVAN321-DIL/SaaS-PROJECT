import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
  IsDateString,
  IsEnum,
} from 'class-validator';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export class CreateTaskDto {
  @IsUUID('4', { message: 'Некорректный ID дела' })
  @IsNotEmpty({ message: 'Дело обязательно' })
  caseId: string;

  @IsString({ message: 'Название должно быть строкой' })
  @IsNotEmpty({ message: 'Название обязательно' })
  @MaxLength(255, { message: 'Название не должно превышать 255 символов' })
  title: string;

  @IsOptional()
  @IsString({ message: 'Описание должно быть строкой' })
  @MaxLength(5000, { message: 'Описание не должно превышать 5000 символов' })
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Некорректный формат даты дедлайна' })
  dueDate?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Некорректный ID исполнителя' })
  assignedToId?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString({ message: 'Название должно быть строкой' })
  @IsNotEmpty({ message: 'Название не может быть пустым' })
  @MaxLength(255, { message: 'Название не должно превышать 255 символов' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Описание должно быть строкой' })
  @MaxLength(5000, { message: 'Описание не должно превышать 5000 символов' })
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Некорректный формат даты дедлайна' })
  dueDate?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Некорректный ID исполнителя' })
  assignedToId?: string;

  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Некорректный статус задачи' })
  status?: TaskStatus;
}
