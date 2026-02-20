import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Request,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { SubmitRevisionDto } from './dto/submit-revision.dto';

@Controller('submissions')
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'manuscript', maxCount: 1 },
      { name: 'supplementary', maxCount: 10 },
    ])
  )
  async createSubmission(
    @Body() createSubmissionDto: CreateSubmissionDto,
    @UploadedFiles() files: { manuscript?: Express.Multer.File[]; supplementary?: Express.Multer.File[] },
    @Request() req: any
  ) {
    return this.submissionsService.createSubmission(
      createSubmissionDto,
      req.user.id,
      files
    );
  }

  @Get('my-submissions')
  async getMySubmissions(
    @Request() req: any,
    @Query('status') status?: string
  ) {
    return this.submissionsService.getAuthorSubmissions(req.user.id, status);
  }

  @Get('stats')
  async getMyStats(@Request() req: any) {
    return this.submissionsService.getSubmissionStats(req.user.id);
  }

  @Get(':id')
  async getSubmission(
    @Param('id') id: string,
    @Request() req: any
  ) {
    return this.submissionsService.getSubmissionById(id, req.user.id);
  }

  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'manuscript', maxCount: 1 },
      { name: 'supplementary', maxCount: 10 },
    ])
  )
  async updateSubmission(
    @Param('id') id: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
    @Request() req: any
  ) {
    return this.submissionsService.updateSubmission(
      id,
      req.user.id,
      updateSubmissionDto
    );
  }

  @Post(':id/revisions')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'manuscript', maxCount: 1 },
      { name: 'supplementary', maxCount: 10 },
    ])
  )
  async submitRevision(
    @Param('id') id: string,
    @Body() revisionDto: SubmitRevisionDto,
    @UploadedFiles() files: { manuscript?: Express.Multer.File[]; supplementary?: Express.Multer.File[] },
    @Request() req: any
  ) {
    return this.submissionsService.submitRevision(
      id,
      req.user.id,
      revisionDto,
      files
    );
  }

  @Delete(':id')
  async withdrawSubmission(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any
  ) {
    return this.submissionsService.withdrawSubmission(id, req.user.id, reason);
  }

  // Editorial endpoints
  @Get('editorial/queue')
  @Roles(UserRole.ASSOCIATE_EDITOR, UserRole.EDITORIAL_BOARD, UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getEditorialQueue() {
    // Implementation for editorial queue
    return { message: 'Editorial queue endpoint' };
  }

  @Get('editorial/stats')
  @Roles(UserRole.ASSOCIATE_EDITOR, UserRole.EDITORIAL_BOARD, UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getEditorialStats() {
    // Implementation for editorial statistics
    return { message: 'Editorial stats endpoint' };
  }
}