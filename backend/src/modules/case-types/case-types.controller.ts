import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';

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

  @Get(':organizationId')
  findAll(
    @Param('organizationId')
    organizationId: string,
  ) {
    return this.caseTypesService.findAll(
      organizationId,
    );
  }

  // =========================
  // GET ONE
  // =========================

  @Get('single/:id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.caseTypesService.findOne(id);
  }

  // =========================
  // CREATE CASE TYPE
  // =========================

  @Post()
  create(
    @Body()
    body: CreateCaseTypeDto,
  ) {
    return this.caseTypesService.create(body);
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
  ) {
    return this.caseTypesService.update(
      id,
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
  ) {
    return this.caseTypesService.remove(id);
  }

  // =========================
  // CREATE CASE FROM TYPE
  // =========================

  @Post('create-case')
  createCaseFromType(
    @Body()
    body: CreateCaseFromTypeDto,
  ) {
    return this.caseTypesService.createCaseFromType(
      body,
    );
  }
}
