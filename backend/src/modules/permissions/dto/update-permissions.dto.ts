import {
  IsBoolean,
  IsIn,
  IsOptional,
} from 'class-validator';

export class UpdatePermissionsDto {
  @IsOptional()
  @IsBoolean({ message: 'lawyersSeeOnlyOwnCases должно быть true/false' })
  lawyersSeeOnlyOwnCases?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'assistantsSeeOnlyOwnTasks должно быть true/false' })
  assistantsSeeOnlyOwnTasks?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'hideAdminSectionsFromLawyers должно быть true/false' })
  hideAdminSectionsFromLawyers?: boolean;

  @IsOptional()
  @IsIn(['OWNER', 'ADMIN'], {
    message: 'whoCanDeleteCases должно быть OWNER или ADMIN',
  })
  whoCanDeleteCases?: string;

  @IsOptional()
  @IsIn(['OWNER', 'ADMIN', 'ALL'], {
    message: 'whoCanDeleteDocuments должно быть OWNER, ADMIN или ALL',
  })
  whoCanDeleteDocuments?: string;
}
