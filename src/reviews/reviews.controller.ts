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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, SubmitReviewDto, UpdateReviewStatusDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { ReviewStatus } from './schemas/review.schema';
import { InviteReviewerDto } from './dto/invite-reviewer.dto';
import { UpdateReviewerStatusDto } from './dto/update-reviewer-status.dto';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  create(@Body() createReviewDto: CreateReviewDto, @Request() req) {
    return this.reviewsService.create(
      createReviewDto,
      req.user.userId,
      req.user.name || `${req.user.firstName} ${req.user.lastName}`,
    );
  }

  @Get('my-reviews')
  findMyReviews(@Request() req, @Query('status') status?: ReviewStatus) {
    return this.reviewsService.findAllForReviewer(req.user.userId, status);
  }

  @Get('article/:articleId')
  findAllForArticle(@Param('articleId') articleId: string) {
    return this.reviewsService.findAllForArticle(articleId);
  }

  @Get('statistics')
  getMyStatistics(@Request() req) {
    return this.reviewsService.getReviewerStatistics(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Post(':id/submit')
  submitReview(
    @Param('id') id: string,
    @Body() submitReviewDto: SubmitReviewDto,
    @Request() req,
  ) {
    return this.reviewsService.submitReview(id, submitReviewDto, req.user.userId);
  }

  @Post(':id/accept')
  acceptReview(@Param('id') id: string, @Request() req) {
    return this.reviewsService.acceptReview(id, req.user.userId);
  }

  @Post(':id/decline')
  declineReview(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.reviewsService.declineReview(id, req.user.userId, reason);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateReviewStatusDto,
  ) {
    return this.reviewsService.updateStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.reviewsService.delete(id);
  }

  // Reviewer Management Endpoints
  @Get('editorial/reviewers')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EDITOR_IN_CHIEF, UserRole.ASSOCIATE_EDITOR, UserRole.EDITORIAL_BOARD, UserRole.ADMIN)
  getAllReviewers() {
    return this.reviewsService.getAllReviewers();
  }

  @Post('editorial/reviewers/invite')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EDITOR_IN_CHIEF, UserRole.ASSOCIATE_EDITOR, UserRole.EDITORIAL_BOARD, UserRole.ADMIN)
  inviteReviewer(@Body() inviteDto: InviteReviewerDto, @Request() req) {
    // In production, this would send an invitation email
    return {
      success: true,
      message: 'Invitation sent successfully',
      ...inviteDto,
    };
  }

  @Post('editorial/reviewers/:id/remind')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EDITOR_IN_CHIEF, UserRole.ASSOCIATE_EDITOR, UserRole.EDITORIAL_BOARD, UserRole.ADMIN)
  sendReminder(@Param('id') id: string) {
    return this.reviewsService.sendReminder(id);
  }

  @Patch('editorial/reviewers/:id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)
  updateReviewerStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateReviewerStatusDto,
  ) {
    // In production, this would update user status
    return {
      success: true,
      message: 'Reviewer status updated',
      id,
      ...updateStatusDto,
    };
  }
}
