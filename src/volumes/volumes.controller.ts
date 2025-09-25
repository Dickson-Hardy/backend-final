import { Controller, Get, Post, Patch, Param, Delete, UseGuards, Query, Body, Request } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import { VolumesService } from "./volumes.service"
import type { CreateVolumeDto } from "./dto/create-volume.dto"
import type { UpdateVolumeDto } from "./dto/update-volume.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { UserRole } from "../users/schemas/user.schema"

@ApiTags("volumes")
@Controller("volumes")
export class VolumesController {
  constructor(private readonly volumesService: VolumesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new volume" })
  @ApiResponse({ status: 201, description: "Volume created successfully" })
  create(@Body() createVolumeDto: CreateVolumeDto, @Request() req) {
    console.log('📝 Controller received volume data:', createVolumeDto)
    console.log('📝 Controller data type:', typeof createVolumeDto)
    console.log('📝 Controller data keys:', Object.keys(createVolumeDto))
    console.log('📝 Controller data JSON:', JSON.stringify(createVolumeDto))
    return this.volumesService.create(createVolumeDto, req.user.role)
  }

  @Get()
  @ApiOperation({ summary: "Get all volumes" })
  @ApiResponse({ status: 200, description: "List of all volumes" })
  findAll() {
    return this.volumesService.findAll()
  }

  @Get("current")
  @ApiOperation({ summary: "Get current volume" })
  @ApiResponse({ status: 200, description: "Current volume" })
  findCurrent() {
    return this.volumesService.findCurrent()
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent volumes' })
  @ApiResponse({ status: 200, description: 'List of recent volumes' })
  findRecent(@Query('limit') limit?: number) {
    return this.volumesService.findRecent(limit);
  }

  @Get('titles')
  @ApiOperation({ summary: 'Get volume titles' })
  @ApiResponse({ status: 200, description: 'List of volume titles' })
  getTitles() {
    return this.volumesService.getTitles();
  }

  @Get(':id/articles')
  @ApiOperation({ summary: 'Get articles for volume' })
  @ApiResponse({ status: 200, description: 'List of articles in volume' })
  getVolumeArticles(@Param('id') id: string) {
    return this.volumesService.getVolumeArticles(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get volume by ID' })
  @ApiResponse({ status: 200, description: 'Volume details' })
  findOne(@Param('id') id: string) {
    return this.volumesService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update volume" })
  @ApiResponse({ status: 200, description: "Volume updated successfully" })
  update(@Param('id') id: string, @Body() updateVolumeDto: UpdateVolumeDto) {
    return this.volumesService.update(id, updateVolumeDto)
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update volume status' })
  @ApiResponse({ status: 200, description: 'Volume status updated successfully' })
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.volumesService.update(id, { status: body.status as any })
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete volume' })
  @ApiResponse({ status: 200, description: 'Volume deleted successfully' })
  remove(@Param('id') id: string) {
    return this.volumesService.remove(id);
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'Increment volume view count' })
  incrementViewCount(@Param('id') id: string) {
    return this.volumesService.incrementViewCount(id);
  }

  @Post(':id/download')
  @ApiOperation({ summary: 'Increment volume download count' })
  incrementDownloadCount(@Param('id') id: string) {
    return this.volumesService.incrementDownloadCount(id);
  }

  @Post(':id/articles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign articles to volume' })
  assignArticles(@Param('id') id: string, @Body() body: { articleIds: string[] }) {
    console.log('📝 Controller assignArticles:', { id, body })
    try {
      return this.volumesService.assignArticles(id, body.articleIds);
    } catch (error) {
      console.error('❌ Controller error:', error)
      throw error
    }
  }

  @Delete(':id/articles/:articleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove article from volume' })
  removeArticle(@Param('id') id: string, @Param('articleId') articleId: string) {
    return this.volumesService.removeArticle(id, articleId);
  }
}
