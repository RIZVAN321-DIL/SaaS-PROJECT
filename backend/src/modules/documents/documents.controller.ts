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
import { Request, Response } from 'express';
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

  @Post('upload/:caseId')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('caseId') caseId: string,
    @UploadedFile() file: any,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    if (!file) {
      throw new BadRequestException('Файл обязателен для загрузки');
    }

    return this.documentsService.uploadFile({
      organizationId: user.organizationId,
      uploadedById: user.userId,
      caseId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
    });
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.user as AuthenticatedUser;
    const file = await this.documentsService.downloadFile(id, user.organizationId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.name)}"`,
    );
    return res.send(file.buffer);
  }

  @Get()
  async findAll(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.documentsService.findAll(user.organizationId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.documentsService.findById(id, user.organizationId);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.documentsService.remove(id, user.organizationId, user.userId, user.role);
  }
}
