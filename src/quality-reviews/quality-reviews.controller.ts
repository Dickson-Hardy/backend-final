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
import { QualityReviewsService } from './quality-reviews.service';
import { CreateQualityReviewDto } from './dto/create-quality-review.dto';
import { UpdateQualityReviewDto } from './dto/update-quality-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('editorial/quality-reviews')
@UseGuards(JwtAuthGuard)
export class QualityReviewsController {
  constructor(private readonly qualityReviewsService: QualityReviewsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.EDITORIAL_ASSISTANT, UserRole.ASSOCIATE_EDITOR, UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)
  create(@Body() createDto: CreateQualityReviewDto) {
    return this.qualityReviewsService.create(createDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.EDITORIAL_ASSISTANT, UserRole.ASSOCIATE_EDITOR, UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)
  findAll() {
    return this.qualityReviewsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.qualityReviewsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateQualityReviewDto) {
    return this.qualityReviewsService.update(id, updateDto);
  }

  @Patch(':id/start')
  startReview(@Param('id') id: string, @Request() req) {
    return this.qualityReviewsService.startReview(id, req.user.userId);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.qualityReviewsService.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.qualityReviewsService.reject(id, body.reason);
  }

  @Patch(':id/requires-revision')
  requiresRevision(@Param('id') id: string, @Body() body: { notes: string }) {
    return this.qualityReviewsService.requiresRevision(id, body.notes);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    await this.qualityReviewsService.delete(id);
    return { message: 'Quality review deleted successfully' };
  }
}
