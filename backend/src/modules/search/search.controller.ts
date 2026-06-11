import {
  Controller,
  Get,
  Query,
  Req,
} from '@nestjs/common';

import { Request } from 'express';

import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

interface JwtUser {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
  ) {}

  // =========================
  // GLOBAL SEARCH
  // =========================
  @Get()
  async search(
    @Req() req: Request,
    @Query() queryDto: SearchQueryDto,
  ) {
    const user =
      req.user as JwtUser;

    return this.searchService.search(
      user.organizationId,
      queryDto.query ?? '',
    );
  }
}
