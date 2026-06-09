import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // =========================
  // GLOBAL SEARCH ENDPOINT
  // =========================
  @Get()
  search(
    @Query('organizationId') organizationId: string,
    @Query('query') query: string,
  ) {
    return this.searchService.search(organizationId, query);
  }
}
