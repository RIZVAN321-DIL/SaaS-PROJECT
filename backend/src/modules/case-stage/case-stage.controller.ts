import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
} from '@nestjs/common';

import { Request } from 'express';

import { CaseStageService } from './case-stage.service';

@Controller('case-stages')
export class CaseStageController {
  constructor(
    private readonly caseStageService: CaseStageService,
  ) {}

  @Get()
  findAll(
    @Req() req: Request,
  ) {
    const user = req.user as any;

    return this.caseStageService.findAll(
      user.organizationId,
    );
  }

  @Get('single/:id')
  findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;

    return this.caseStageService.findOne(
      id,
      user.organizationId,
    );
  }

  @Post()
  create(
    @Body() body: any,
    @Req() req: Request,
  ) {
    const user = req.user as any;

    return this.caseStageService.create({
      ...body,
      organizationId:
        user.organizationId,
    });
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const user = req.user as any;

    return this.caseStageService.update(
      id,
      user.organizationId,
      body,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;

    return this.caseStageService.remove(
      id,
      user.organizationId,
    );
  }

  @Put('move-case/:caseId/:stageId')
  moveCase(
    @Param('caseId') caseId: string,
    @Param('stageId') stageId: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;

    return this.caseStageService.moveCase(
      caseId,
      stageId,
      user.organizationId,
    );
  }

  @Get('board')
  getBoard(
    @Req() req: Request,
  ) {
    const user = req.user as any;

    return this.caseStageService.getBoard(
      user.organizationId,
    );
  }
}
