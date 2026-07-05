import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { DocumentTemplatesService } from './document-templates.service';
import { CreateDocumentTemplateDto } from './dto/create-document-template.dto';
import { UpdateDocumentTemplateDto } from './dto/update-document-template.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

interface AuthenticatedUser {
  userId: string;
  email: string;
  organizationId: string;
  role: Role;
}

@Controller('document-templates')
export class DocumentTemplatesController {
  constructor(
    private readonly documentTemplatesService: DocumentTemplatesService,
  ) {}

  // Список доступных плейсхолдеров — для подсказки в форме создания шаблона.
  // Включает базовые переменные и {{custom.<key>}} по настраиваемым полям
  // организации (опционально — только актуальные для конкретного типа дела).
  @Get('variables')
  getVariables(@Query('caseTypeId') caseTypeId: string | undefined, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.documentTemplatesService.getAvailableVariables(
      user.organizationId,
      caseTypeId,
    );
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.documentTemplatesService.findAll(user.organizationId);
  }

  @Get('single/:id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.documentTemplatesService.findOne(id, user.organizationId);
  }

  // Создание/редактирование/удаление шаблонов — только владелец и админ,
  // чтобы формулировки договоров были централизованы и не расходились по фирме.
  @Roles(Role.OWNER, Role.ADMIN)
  @Post()
  create(@Body() body: CreateDocumentTemplateDto, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.documentTemplatesService.create({
      ...body,
      organizationId: user.organizationId,
      createdById: user.userId,
    });
  }

  @Roles(Role.OWNER, Role.ADMIN)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateDocumentTemplateDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.documentTemplatesService.update(id, user.organizationId, body);
  }

  @Roles(Role.OWNER, Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.documentTemplatesService.remove(id, user.organizationId);
  }

  // Генерация документа по делу — доступна всем ролям в организации,
  // т.к. юристу нужно сформировать документ по своему делу.
  @Get(':id/generate')
  async generate(
    @Param('id') id: string,
    @Query('caseId') caseId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.user as AuthenticatedUser;
    const { buffer, filename } = await this.documentTemplatesService.generateDocx(
      id,
      caseId,
      user.organizationId,
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(filename)}"`,
    );
    return res.send(buffer);
  }
}
