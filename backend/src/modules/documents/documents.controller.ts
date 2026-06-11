import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
} from '@nestjs/common';

import { Request } from 'express';
import { DocumentsService } from './documents.service';

interface AuthenticatedUser {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
  ) {}

  // =========================
  // CREATE DOCUMENT
  // =========================
  @Post()
  create(
    @Body() body: any,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.documentsService.create({
      ...body,
      organizationId:
        user.organizationId,
    });
  }

  // =========================
  // GET ALL DOCUMENTS
  // =========================
  @Get()
  findAll(
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.documentsService.findAll(
      user.organizationId,
    );
  }

  // =========================
  // GET ONE DOCUMENT
  // TENANT SAFE
  // =========================
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.documentsService.findById(
      id,
      user.organizationId,
    );
  }

  // =========================
  // DELETE DOCUMENT
  // TENANT SAFE
  // =========================
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.documentsService.remove(
      id,
      user.organizationId,
    );
  }
}
