import { IsString, Length } from 'class-validator';

export class VerifyTwoFactorDto {
  @IsString()
  challengeId: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
