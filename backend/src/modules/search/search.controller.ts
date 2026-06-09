import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // =========================
  // GLOBAL SEARCH (JWT CONTEXT)
  // =========================
  @Get()
  search(
    @Req() req: Request,
    @Query('query') query: string,
  ) {
    const user = req.user as any;

    return this.searchService.search(
      user.organizationId,
      query,
    );
  }
}
