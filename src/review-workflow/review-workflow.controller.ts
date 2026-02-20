import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { ReviewWorkflowService } from './review-workflow.service';
import { AssignReviewerDto } from './dto/assign-reviewer.dto';
import { MakeEditorialDecisionDto } from './dto/make-editorial-decision.dto';

@Controller('review-workflow')
@UseGuards(JwtAuthGuard)
export class ReviewWorkflowController {
  constructor(private readonly reviewWorkflowService: ReviewWorkflowService) {}

  // Editorial endpoints
  @Post('assign-reviewer')
  @Roles(UserRole.ASSOCIATE_EDITOR, UserRole.EDITORIAL_BOARD, UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async assignReviewer(
    @Body() assignDto: AssignReviewerDto,
    @Request() req: any
  ) {
    return this.reviewWorkflowService.assignReviewer(assignDto, req.user.id);
  }

  @Get('editorial/queue')
  @Roles(UserRole.ASSOCIATE_EDITOR, UserRole.EDITORIAL_BOARD, UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getEditorialQueue() {
    return this.reviewWorkflowService.getEditorialQueue();
  }

  @Post('editorial-decision/:id')
  @Roles(UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async makeEditorialDecision(
    @Param('id') id: string,
    @Body() decisionDto: MakeEditorialDecisionDto,
    @Request() req: any
  ) {
    return this.reviewWorkflowService.makeEditorialDecision(id, decisionDto, req.user.id);
  }

  // Reviewer endpoints
  @Get('my-reviews')
  @Roles(UserRole.REVIEWER, UserRole.ASSOCIATE_EDITOR, UserRole.EDITORIAL_BOARD, UserRole.EDITOR_IN_CHIEF)
  @UseGuards(RolesGuard)
  async getMyReviews(
    @Request() req: any,
    @Query('status') status?: string
  ) {
    return this.reviewWorkflowService.getReviewsForReviewer(req.user.id, status as any);
  }

  @Get('my-stats')
  @Roles(UserRole.REVIEWER, UserRole.ASSOCIATE_EDITOR, UserRole.EDITORIAL_BOARD, UserRole.EDITOR_IN_CHIEF)
  @UseGuards(RolesGuard)
  async getMyReviewStats(@Request() req: any) {
    return this.reviewWorkflowService.getReviewerStats(req.user.id);
  }

  @Post('reviews/:id/accept')
  @Roles(UserRole.REVIEWER, UserRole.ASSOCIATE_EDITOR, UserRole.EDITORIAL_BOARD, UserRole.EDITOR_IN_CHIEF)
  @UseGuards(RolesGuard)
  async acceptReview(
    @Param('id') id: string,
    @Request() req: any
  ) {
    return this.reviewWorkflowService.acceptReview(id, req.user.id);
  }

  @Post('reviews/:id/decline')
  @Roles(UserRole.REVIEWER, UserRole.ASSOCIATE_EDITOR, UserRole.EDITORIAL_BOARD, UserRole.EDITOR_IN_CHIEF)
  @UseGuards(RolesGuard)
  async declineReview(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any
  ) {
    return this.reviewWorkflowService.declineReview(id, req.user.id, reason);
  }

  @Post('reviews/:id/submit')
  @Roles(UserRole.REVIEWER, UserRole.ASSOCIATE_EDITOR, UserRole.EDITORIAL_BOARD, UserRole.EDITOR_IN_CHIEF)
  @UseGuards(RolesGuard)
  async submitReview(
    @Param('id') id: string,
    @Body() reviewData: any,
    @Request() req: any
  ) {
    return this.reviewWorkflowService.submitReview(id, req.user.id, reviewData);
  }

  // Article-specific endpoints
  @Get('articles/:id/reviews')
  @Roles(UserRole.ASSOCIATE_EDITOR, UserRole.EDITORIAL_BOARD, UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getArticleReviews(@Param('id') id: string) {
    return this.reviewWorkflowService.getReviewsForArticle(id);
  }
}