import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { NewsService } from './news.service'
import { CreateNewsDto } from './dto/create-news.dto'
import { UpdateNewsDto } from './dto/update-news.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '../users/schemas/user.schema'
import { Express } from 'express'

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF, UserRole.EDITORIAL_BOARD)
  @UseInterceptors(FileInterceptor('image'))
  async create(
    createNewsDto: CreateNewsDto,
    @Request() req,
    @UploadedFile() image?: Express.Multer.File
  ) {
    return this.newsService.create(createNewsDto, req.user.id, image)
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('category') category?: string,
    @Query('search') search?: string
  ) {
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    return this.newsService.findAll(pageNum, limitNum, { category, search })
  }

  @Get('published')
  async findPublished(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('category') category?: string
  ) {
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    return this.newsService.findPublished(pageNum, limitNum, { category })
  }

  @Get('recent')
  async findRecent(@Query('limit') limit: string = '5') {
    const limitNum = parseInt(limit, 10)
    return this.newsService.findRecent(limitNum)
  }

  @Get('featured')
  async findFeatured() {
    return this.newsService.findFeatured()
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.newsService.findOne(id)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF, UserRole.EDITORIAL_BOARD)
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    updateNewsDto: UpdateNewsDto,
    @Request() req,
    @UploadedFile() image?: Express.Multer.File
  ) {
    return this.newsService.update(id, updateNewsDto, req.user.id, image)
  }

  @Post(':id/view')
  async incrementViews(@Param('id') id: string) {
    return this.newsService.incrementViews(id)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF)
  async remove(@Param('id') id: string, @Request() req) {
    return this.newsService.remove(id, req.user.id)
  }
}
