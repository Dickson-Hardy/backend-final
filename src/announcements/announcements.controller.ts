import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/create-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnnouncementType } from './schemas/announcement.schema';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createAnnouncementDto: CreateAnnouncementDto, @Request() req) {
    return this.announcementsService.create(
      createAnnouncementDto,
      req.user.userId,
      req.user.name || `${req.user.firstName} ${req.user.lastName}`,
    );
  }

  @Get()
  findAll(
    @Query('includeUnpublished') includeUnpublished?: string,
    @Query('type') type?: AnnouncementType,
  ) {
    const showUnpublished = includeUnpublished === 'true';
    return this.announcementsService.findAll(showUnpublished, type);
  }

  @Get('pinned')
  getPinned() {
    return this.announcementsService.getPinnedAnnouncements();
  }

  @Get('recent')
  getRecent(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 10;
    return this.announcementsService.getRecentAnnouncements(limitNum);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('incrementViews') incrementViews?: string) {
    const shouldIncrement = incrementViews === 'true';
    return this.announcementsService.findOne(id, shouldIncrement);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateAnnouncementDto: UpdateAnnouncementDto) {
    return this.announcementsService.update(id, updateAnnouncementDto);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  togglePublish(@Param('id') id: string) {
    return this.announcementsService.togglePublish(id);
  }

  @Patch(':id/pin')
  @UseGuards(JwtAuthGuard)
  togglePin(@Param('id') id: string) {
    return this.announcementsService.togglePin(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.announcementsService.delete(id);
  }
}
