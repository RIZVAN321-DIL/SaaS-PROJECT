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

import { CaseTypesService } from './case-types.service';

import { CreateCaseTypeDto } from './dto/create-case-type.dto';
import { UpdateCaseTypeDto } from './dto/update-case-type.dto';
import { CreateCaseFromTypeDto } from './dto/create-case-from-type.dto';

@Controller('case-types')
export class CaseTypesController {
  constructor(
    private readonly caseTypesService: CaseTypesService,
  ) {}

  // =========================
  // GET ALL
  // =========================

  @Get()
  findAll(
    @Req() req: Request,
  ) {
    const user = req.user as any;

    return this.caseTypesService.findAll(
      user.organizationId,
    );
  }

  // =========================
  // GET ONE
  // =========================

  @Get('single/:id')
  findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;

    return this.caseTypesService.findOne(
      id,
      user.organizationId,
    );
  }

  // =========================
  // CREATE CASE TYPE
  // =========================

  @Post()
  create(
    @Body()
    body: CreateCaseTypeDto,

    @Req()
    req: Request,
  ) {
    const user = req.user as any;

    return this.caseTypesService.create({
      ...body,
      organizationId:
        user.organizationId,
    });
  }

  // =========================
  // UPDATE CASE TYPE
  // =========================

  @Put(':id')
  update(
    @Param('id')
    id: string,

    @Body()
    body: UpdateCaseTypeDto,

    @Req()
    req: Request,
  ) {
    const user = req.user as any;

    return this.caseTypesService.update(
      id,
      user.organizationId,
      body,
    );
  }

  // =========================
  // DELETE CASE TYPE
  // =========================

  @Delete(':id')
  remove(
    @Param('id')
    id: string,

    @Req()
    req: Request,
  ) {
    const user = req.user as any;

    return this.caseTypesService.remove(
      id,
      user.organizationId,
    );
  }

  // =========================
  // CREATE CASE FROM TYPE
  // =========================

  @Post('create-case')
  createCaseFromType(
    @Body()
    body: CreateCaseFromTypeDto,

    @Req()
    req: Request,
  ) {
    const user = req.user as any;

    return this.caseTypesService.createCaseFromType({
      ...body,
      organizationId:
        user.organizationId,
    });
  }
}
