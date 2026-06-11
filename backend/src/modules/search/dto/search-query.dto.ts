import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  query?: string;
}
