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
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { ArticlesService } from './articles.service'
import { CreateArticleDto } from './dto/create-article.dto'
import { UpdateArticleDto } from './dto/update-article.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '../users/schemas/user.schema'
import { Express } from 'express'

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'manuscript', maxCount: 1 },
      { name: 'supplementary', maxCount: 10 },
    ])
  )
  async create(
    @Body() body: any,
    @Request() req,
    @UploadedFiles() files: { manuscript?: Express.Multer.File[]; supplementary?: Express.Multer.File[] }
  ) {
    if (!files?.manuscript?.[0]) {
      throw new BadRequestException('Manuscript file is required')
    }
    
    // Debug logging
    console.log('📝 Received body:', body)
    console.log('📝 Body keys:', Object.keys(body))
    
    // Parse JSON fields from multipart form data
    const createArticleDto: CreateArticleDto = {
      title: body.title,
      abstract: body.abstract,
      content: body.content,
      type: body.type,
      keywords: body.keywords ? JSON.parse(body.keywords) : [],
      authors: body.authors ? JSON.parse(body.authors) : [],
      correspondingAuthorEmail: body.correspondingAuthorEmail,
      volume: body.volume,
      funding: body.funding,
      acknowledgments: body.acknowledgments,
    }
    
    console.log('📝 Parsed DTO:', createArticleDto)
    
    return this.articlesService.create(createArticleDto, req.user.id, files, req.user.role)
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string
  ) {
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    return this.articlesService.findAll(pageNum, limitNum, { status, category, search })
  }

  @Get('published')
  async findPublished(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('category') category?: string,
    @Query('featured') featured?: string
  ) {
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    return this.articlesService.findPublished(pageNum, limitNum, { category, featured: featured === 'true' })
  }

  @Get('featured')
  async findFeatured() {
    return this.articlesService.findFeatured()
  }

  @Get('recent')
  async findRecent(@Query('limit') limit: string = '5') {
    const limitNum = parseInt(limit, 10)
    return this.articlesService.findRecent(limitNum)
  }

  @Get('by-author/:authorId')
  async findByAuthor(
    @Param('authorId') authorId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    return this.articlesService.findByAuthor(authorId, pageNum, limitNum)
  }

  @Get('categories')
  async getCategories() {
    return this.articlesService.getCategories()
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF, UserRole.EDITORIAL_BOARD)
  async getStatistics() {
    return this.articlesService.getStatistics()
  }

  @Get('volume/:volumeNumber')
  async findByVolume(@Param('volumeNumber') volumeNumber: string) {
    return this.articlesService.findByVolume(parseInt(volumeNumber, 10))
  }

  @Get('volume/:volumeNumber/article/:articleNumber')
  async findByVolumeAndArticleNumber(
    @Param('volumeNumber') volumeNumber: string,
    @Param('articleNumber') articleNumber: string
  ) {
    return this.articlesService.findByVolumeAndArticleNumber(
      parseInt(volumeNumber, 10),
      articleNumber
    )
  }

  @Get('vol:volumeNumber/article:articleNumber')
  async findByVolAndArticle(
    @Param('volumeNumber') volumeNumber: string,
    @Param('articleNumber') articleNumber: string
  ) {
    return this.articlesService.findByVolumeAndArticleNumber(
      parseInt(volumeNumber, 10),
      articleNumber
    )
  }

  @Get('available-for-volume')
  async findAvailableForVolume(
    @Query('volumeId') volumeId?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('status') status?: string
  ) {
    console.log('📝 Available for volume request:', { volumeId, search, category, status })
    return this.articlesService.findAvailableForVolume(volumeId, { search, category, status })
  }

  @Get('debug/all')
  async debugAllArticles() {
    return this.articlesService.findAll(1, 100)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, updateArticleDto: UpdateArticleDto, @Request() req) {
    return this.articlesService.update(id, updateArticleDto, req.user.id)
  }

  @Patch(':id/article-number')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF, UserRole.EDITORIAL_BOARD)
  async updateArticleNumber(
    @Param('id') id: string,
    @Body() body: { articleNumber: string },
    @Request() req
  ) {
    return this.articlesService.updateArticleNumber(id, body.articleNumber, req.user.id)
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF, UserRole.EDITORIAL_BOARD)
  async updateStatus(
    @Param('id') id: string,
    statusDto: { status: string; reviewerComments?: string },
    @Request() req
  ) {
    return this.articlesService.updateStatus(id, statusDto.status, req.user.id, statusDto.reviewerComments)
  }

  @Post(':id/assign-reviewer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF, UserRole.EDITORIAL_BOARD)
  async assignReviewer(@Param('id') id: string, assignDto: { reviewerId: string }, @Request() req) {
    return this.articlesService.assignReviewer(id, assignDto.reviewerId, req.user.id)
  }

  @Post(':id/submit-review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.REVIEWER)
  async submitReview(
    @Param('id') id: string,
    reviewDto: { rating: number; comments: string; recommendation: string },
    @Request() req
  ) {
    return this.articlesService.submitReview(id, req.user.id, reviewDto)
  }

  @Post(':id/view')
  async incrementViews(@Param('id') id: string) {
    return this.articlesService.incrementViews(id)
  }

  @Post(':id/download')
  async incrementDownloads(@Param('id') id: string) {
    return this.articlesService.incrementDownloads(id)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF)
  async remove(@Param('id') id: string, @Request() req) {
    return this.articlesService.remove(id, req.user.id)
  }
}
