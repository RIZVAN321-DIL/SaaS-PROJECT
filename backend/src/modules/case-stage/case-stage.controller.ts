import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';

import { CaseStageService } from './case-stage.service';

@Controller('case-stages')
export class CaseStageController {
  constructor(
    private readonly caseStageService: CaseStageService,
  ) {}

  @Get(':organizationId')
  findAll(
    @Param('organizationId')
    organizationId: string,
  ) {
    return this.caseStageService.findAll(
      organizationId,
    );
  }

  @Get('single/:id')
  findOne(@Param('id') id: string) {
    return this.caseStageService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.caseStageService.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.caseStageService.update(
      id,
      body,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.caseStageService.remove(id);
  }

  @Put('move-case/:caseId/:stageId')
  moveCase(
    @Param('caseId') caseId: string,
    @Param('stageId') stageId: string,
  ) {
    return this.caseStageService.moveCase(
      caseId,
      stageId,
    );
  }

  @Get('board/:organizationId')
  getBoard(
    @Param('organizationId')
    organizationId: string,
  ) {
    return this.caseStageService.getBoard(
      organizationId,
    );
  }
}
