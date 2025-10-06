import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { DraftsService } from './drafts.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('submissions/drafts')
@UseGuards(JwtAuthGuard)
export class DraftsController {
  constructor(private readonly draftsService: DraftsService) {}

  @Post()
  create(@Request() req, @Body() createDraftDto: CreateDraftDto) {
    return this.draftsService.create(req.user.userId, createDraftDto);
  }

  @Get()
  findByAuthor(@Request() req) {
    return this.draftsService.findByAuthor(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.draftsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDraftDto: UpdateDraftDto,
    @Request() req,
  ) {
    return this.draftsService.update(id, updateDraftDto, req.user.userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    await this.draftsService.delete(id, req.user.userId);
    return { message: 'Draft deleted successfully' };
  }

  @Post(':id/submit')
  submitAsArticle(@Param('id') id: string, @Request() req) {
    return this.draftsService.submitAsArticle(id, req.user.userId);
  }
}
