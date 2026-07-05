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
} from '@nestjs/common';

import { Request } from 'express';

import { CustomFieldsService } from './custom-fields.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import {
  CreateCustomFieldDefinitionDto,
  UpdateCustomFieldDefinitionDto,
  EntityType,
} from './dto/custom-field-definition.dto';

@Controller('custom-field-definitions')
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  // Доступно всем ролям — нужно для рендера форм клиента/дела.
  @Get()
  findAll(
    @Req() req: Request,
    @Query('entityType') entityType?: EntityType,
    @Query('caseTypeId') caseTypeId?: string,
  ) {
    const user = req.user as any;
    return this.customFieldsService.findAll(
      user.organizationId,
      entityType,
      caseTypeId,
    );
  }

  // =========================
  // Управление составом полей — только владелец организации
  // =========================
  @Roles(Role.OWNER)
  @Post()
  create(@Body() body: CreateCustomFieldDefinitionDto, @Req() req: Request) {
    const user = req.user as any;
    return this.customFieldsService.create({
      ...body,
      organizationId: user.organizationId,
    });
  }

  @Roles(Role.OWNER)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateCustomFieldDefinitionDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.customFieldsService.update(id, user.organizationId, body);
  }

  @Roles(Role.OWNER)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    return this.customFieldsService.remove(id, user.organizationId);
  }
}
