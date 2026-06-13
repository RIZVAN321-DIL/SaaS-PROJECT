import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import {
  Request,
  Response,
} from 'express';

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
  // UPLOAD DOCUMENT
  // =========================
  @Post('upload/:caseId')
  @UseInterceptors(
    FileInterceptor('file'),
  )
  async upload(
    @Param('caseId')
    caseId: string,

    @UploadedFile()
    file: Express.Multer.File,

    @Req()
    req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    if (!file) {
      throw new BadRequestException(
        'File is required',
      );
    }

    return this.documentsService.uploadFile({
      organizationId:
        user.organizationId,

      uploadedById:
        user.userId,

      caseId,

      fileName:
        file.originalname,

      mimeType:
        file.mimetype,

      buffer:
        file.buffer,
    });
  }

  // =========================
  // DOWNLOAD DOCUMENT
  // =========================
  @Get(':id/download')
  async download(
    @Param('id')
    id: string,

    @Req()
    req: Request,

    @Res()
    res: Response,
  ) {
    const user =
      req.user as AuthenticatedUser;

    const file =
      await this.documentsService.downloadFile(
        id,
        user.organizationId,
      );

    res.setHeader(
      'Content-Type',
      file.mimeType,
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.name}"`,
    );

    return res.send(
      file.buffer,
    );
  }

  // =========================
  // GET ALL DOCUMENTS
  // =========================
  @Get()
  async findAll(
    @Req()
    req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.documentsService.findAll(
      user.organizationId,
    );
  }

  // =========================
  // GET ONE DOCUMENT
  // =========================
  @Get(':id')
  async findOne(
    @Param('id')
    id: string,

    @Req()
    req: Request,
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
  // =========================
  @Delete(':id')
  async remove(
    @Param('id')
    id: string,

    @Req()
    req: Request,
  ) {
    const user =
      req.user as AuthenticatedUser;

    return this.documentsService.remove(
      id,
      user.organizationId,
    );
  }
}
