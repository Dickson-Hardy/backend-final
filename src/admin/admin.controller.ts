import { Controller, Get, Patch, Delete, Post, Param, Body, UseGuards, Request, UseInterceptors, UploadedFiles } from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { AdminService } from './admin.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '../users/schemas/user.schema'
import { AdminUpdateArticleDto } from './dto/admin-update-article.dto'
import { Express } from 'express'

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get system statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'System statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number', example: 1250 },
        userChange: { type: 'string', example: '+12' },
        activeSubmissions: { type: 'number', example: 45 },
        submissionChange: { type: 'string', example: '+5' },
        uptime: { type: 'string', example: '99.9%' },
        uptimeChange: { type: 'string', example: '+0.1%' },
        storageUsed: { type: 'string', example: '2.5TB' },
        storageChange: { type: 'string', example: '+150GB' }
      }
    }
  })
  async getStats() {
    return this.adminService.getSystemStats()
  }

  @Get('activities')
  @ApiOperation({ summary: 'Get recent system activities' })
  @ApiResponse({ 
    status: 200, 
    description: 'Recent activities retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'ACT-001' },
          type: { type: 'string', example: 'user_registration' },
          description: { type: 'string', example: 'New user registered' },
          timestamp: { type: 'string', example: '2024-01-20T14:30:00Z' },
          severity: { type: 'string', example: 'info' },
          user: { type: 'string', example: 'Dr. Sarah Johnson' }
        }
      }
    }
  })
  async getActivities() {
    return this.adminService.getRecentActivities()
  }

  @Get('users')
  @ApiOperation({ summary: 'Get user management data' })
  @ApiResponse({ 
    status: 200, 
    description: 'User management data retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'USER-001' },
          name: { type: 'string', example: 'Dr. Sarah Johnson' },
          email: { type: 'string', example: 'sarah.johnson@university.edu' },
          role: { type: 'string', example: 'Author' },
          status: { type: 'string', example: 'active' },
          lastLogin: { type: 'string', example: '2024-01-20 14:30' },
          submissions: { type: 'number', example: 3 },
          reviews: { type: 'number', example: 0 },
          createdAt: { type: 'string', example: '2024-01-15' }
        }
      }
    }
  })
  async getUsers() {
    return this.adminService.getUserManagementData()
  }

  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ 
    status: 200, 
    description: 'System health status retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'HEALTH-001' },
          component: { type: 'string', example: 'Database' },
          status: { type: 'string', example: 'healthy' },
          lastCheck: { type: 'string', example: '2024-01-20T14:30:00Z' },
          responseTime: { type: 'number', example: 45 },
          uptime: { type: 'string', example: '99.9%' }
        }
      }
    }
  })
  async getHealth() {
    return this.adminService.getSystemHealth()
  }

  @Get('editors')
  @ApiOperation({ summary: 'Get all editors' })
  @ApiResponse({ 
    status: 200, 
    description: 'Editors retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'USER-001' },
          name: { type: 'string', example: 'Dr. Sarah Johnson' },
          email: { type: 'string', example: 'sarah.johnson@university.edu' },
          role: { type: 'string', example: 'Editor in Chief' },
          affiliation: { type: 'string', example: 'University Medical Center' },
          department: { type: 'string', example: 'Cardiology' },
          specializations: { type: 'array', items: { type: 'string' }, example: ['Cardiology', 'Research'] }
        }
      }
    }
  })
  async getEditors() {
    return this.adminService.getEditors()
  }

  @Get('articles')
  @ApiOperation({ summary: 'Get all articles for admin management' })
  @ApiResponse({ 
    status: 200, 
    description: 'Articles retrieved successfully'
  })
  async getAllArticles() {
    return this.adminService.getAllArticles()
  }

  @Get('articles/:id')
  @ApiOperation({ summary: 'Get article details by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Article details retrieved successfully'
  })
  async getArticleById(@Param('id') id: string) {
    return this.adminService.getArticleById(id)
  }

  @Patch('articles/:id')
  @ApiOperation({ summary: 'Update article details' })
  @ApiResponse({ 
    status: 200, 
    description: 'Article updated successfully'
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'manuscript', maxCount: 1 },
      { name: 'supplementary', maxCount: 10 }
    ])
  )
  async updateArticle(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files: { manuscript?: Express.Multer.File[]; supplementary?: Express.Multer.File[] },
    @Request() req
  ) {
    // Parse JSON fields from multipart form data if present
    const updateArticleDto: AdminUpdateArticleDto = {
      ...(body.title && { title: body.title }),
      ...(body.abstract && { abstract: body.abstract }),
      ...(body.content && { content: body.content }),
      ...(body.type && { type: body.type }),
      ...(body.status && { status: body.status }),
      ...(body.keywords && { keywords: typeof body.keywords === 'string' ? JSON.parse(body.keywords) : body.keywords }),
      ...(body.authors && { authors: typeof body.authors === 'string' ? JSON.parse(body.authors) : body.authors }),
      ...(body.volume && { volume: body.volume }),
      ...(body.doi && { doi: body.doi }),
      ...(body.pages && { pages: body.pages }),
      ...(body.articleNumber && { articleNumber: body.articleNumber }),
      ...(body.featured !== undefined && { featured: body.featured === 'true' || body.featured === true }),
      ...(body.conflictOfInterest && { conflictOfInterest: body.conflictOfInterest }),
      ...(body.funding && { funding: body.funding }),
      ...(body.acknowledgments && { acknowledgments: body.acknowledgments }),
      ...(body.categories && { categories: typeof body.categories === 'string' ? JSON.parse(body.categories) : body.categories }),
      ...(body.references && { references: typeof body.references === 'string' ? JSON.parse(body.references) : body.references }),
    }
    
    return this.adminService.updateArticle(id, updateArticleDto, files, req.user.id)
  }

  @Post('articles/:id/manuscript')
  @ApiOperation({ summary: 'Replace manuscript file' })
  @ApiResponse({ 
    status: 200, 
    description: 'Manuscript file replaced successfully'
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'manuscript', maxCount: 1 }
    ])
  )
  async replaceManuscript(
    @Param('id') id: string,
    @UploadedFiles() files: { manuscript?: Express.Multer.File[] },
    @Request() req
  ) {
    return this.adminService.replaceManuscript(id, files.manuscript[0], req.user.id)
  }

  @Post('articles/:id/supplementary')
  @ApiOperation({ summary: 'Add supplementary files to article' })
  @ApiResponse({ 
    status: 200, 
    description: 'Supplementary files added successfully'
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'supplementary', maxCount: 10 }
    ])
  )
  async addSupplementaryFiles(
    @Param('id') id: string,
    @UploadedFiles() files: { supplementary?: Express.Multer.File[] },
    @Request() req
  ) {
    return this.adminService.addSupplementaryFiles(id, files.supplementary, req.user.id)
  }

  @Delete('articles/:id/supplementary/:fileIndex')
  @ApiOperation({ summary: 'Remove a supplementary file' })
  @ApiResponse({ 
    status: 200, 
    description: 'Supplementary file removed successfully'
  })
  async removeSupplementaryFile(
    @Param('id') id: string,
    @Param('fileIndex') fileIndex: string,
    @Request() req
  ) {
    return this.adminService.removeSupplementaryFile(id, parseInt(fileIndex), req.user.id)
  }

  @Delete('articles/:id')
  @ApiOperation({ summary: 'Delete article' })
  @ApiResponse({ 
    status: 200, 
    description: 'Article deleted successfully'
  })
  async deleteArticle(@Param('id') id: string, @Request() req) {
    return this.adminService.deleteArticle(id, req.user.id)
  }
}


