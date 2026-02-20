import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Article, ArticleDocument, ArticleStatus } from '../articles/schemas/article.schema';
import { Review, ReviewDocument, ReviewStatus, ReviewRecommendation } from '../reviews/schemas/review.schema';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { EditorialDecision, EditorialDecisionDocument, DecisionStatus, DecisionType } from '../editorial-decisions/schemas/editorial-decision.schema';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AssignReviewerDto } from './dto/assign-reviewer.dto';
import { MakeEditorialDecisionDto } from './dto/make-editorial-decision.dto';

@Injectable()
export class ReviewWorkflowService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(EditorialDecision.name) private editorialDecisionModel: Model<EditorialDecisionDocument>,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
  ) {}

  async assignReviewer(assignDto: AssignReviewerDto, assignedById: string): Promise<Review> {
    // Validate article exists and is in correct status
    const article = await this.articleModel.findById(assignDto.articleId);
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (![ArticleStatus.SUBMITTED, ArticleStatus.UNDER_REVIEW].includes(article.status)) {
      throw new BadRequestException('Article is not available for review assignment');
    }

    // Validate reviewer exists and has reviewer role
    const reviewer = await this.userModel.findById(assignDto.reviewerId);
    if (!reviewer) {
      throw new NotFoundException('Reviewer not found');
    }

    if (![UserRole.REVIEWER, UserRole.ASSOCIATE_EDITOR, UserRole.EDITORIAL_BOARD].includes(reviewer.role)) {
      throw new BadRequestException('User is not authorized to review articles');
    }

    // Check if reviewer is already assigned to this article
    const existingReview = await this.reviewModel.findOne({
      articleId: new Types.ObjectId(assignDto.articleId),
      reviewerId: new Types.ObjectId(assignDto.reviewerId),
      status: { $ne: ReviewStatus.DECLINED }
    });

    if (existingReview) {
      throw new BadRequestException('Reviewer is already assigned to this article');
    }

    // Get assigner info
    const assigner = await this.userModel.findById(assignedById);

    // Create review assignment
    const review = new this.reviewModel({
      articleId: new Types.ObjectId(assignDto.articleId),
      articleTitle: article.title,
      reviewerId: new Types.ObjectId(assignDto.reviewerId),
      reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
      assignedBy: new Types.ObjectId(assignedById),
      assignedByName: `${assigner.firstName} ${assigner.lastName}`,
      status: ReviewStatus.PENDING,
      dueDate: new Date(assignDto.dueDate),
      isAnonymous: assignDto.isAnonymous || true,
    });

    const savedReview = await review.save();

    // Update article status to under review
    if (article.status === ArticleStatus.SUBMITTED) {
      article.status = ArticleStatus.UNDER_REVIEW;
      await article.save();
    }

    // Send email invitation to reviewer
    await this.emailService.sendReviewInvitation(
      reviewer.email,
      `${reviewer.firstName} ${reviewer.lastName}`,
      article.title,
      new Date(assignDto.dueDate),
      savedReview._id.toString()
    );

    // Create notification
    await this.notificationsService.create({
      userId: assignDto.reviewerId,
      type: NotificationType.REVIEW_ASSIGNED,
      title: 'New Review Assignment',
      message: `You have been assigned to review "${article.title}"`,
      actionUrl: `/dashboard/reviewer/reviews/${savedReview._id}`,
    });

    return savedReview;
  }

  async getReviewsForArticle(articleId: string): Promise<Review[]> {
    return this.reviewModel
      .find({ articleId: new Types.ObjectId(articleId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getReviewsForReviewer(reviewerId: string, status?: ReviewStatus): Promise<Review[]> {
    const query: any = { reviewerId: new Types.ObjectId(reviewerId) };
    
    if (status) {
      query.status = status;
    }

    return this.reviewModel
      .find(query)
      .sort({ dueDate: 1, createdAt: -1 })
      .exec();
  }

  async acceptReview(reviewId: string, reviewerId: string): Promise<Review> {
    const review = await this.reviewModel.findById(reviewId);
    
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.reviewerId.toString() !== reviewerId) {
      throw new ForbiddenException('Not authorized to accept this review');
    }

    if (review.status !== ReviewStatus.PENDING) {
      throw new BadRequestException('Review has already been responded to');
    }

    review.status = ReviewStatus.IN_PROGRESS;
    review.acceptedDate = new Date();

    const updatedReview = await review.save();

    // Notify editorial team
    await this.notificationsService.create({
      userId: review.assignedBy.toString(),
      type: NotificationType.REVIEW_SUBMITTED,
      title: 'Review Accepted',
      message: `${review.reviewerName} has accepted the review for "${review.articleTitle}"`,
      actionUrl: `/dashboard/editorial/reviews/${reviewId}`,
    });

    return updatedReview;
  }

  async declineReview(reviewId: string, reviewerId: string, reason?: string): Promise<Review> {
    const review = await this.reviewModel.findById(reviewId);
    
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.reviewerId.toString() !== reviewerId) {
      throw new ForbiddenException('Not authorized to decline this review');
    }

    if (review.status !== ReviewStatus.PENDING) {
      throw new BadRequestException('Review has already been responded to');
    }

    review.status = ReviewStatus.DECLINED;
    review.declinedDate = new Date();
    review.comments = reason;

    const updatedReview = await review.save();

    // Notify editorial team
    await this.notificationsService.create({
      userId: review.assignedBy.toString(),
      type: NotificationType.REVIEW_SUBMITTED,
      title: 'Review Declined',
      message: `${review.reviewerName} has declined the review for "${review.articleTitle}"`,
      actionUrl: `/dashboard/editorial/reviews/${reviewId}`,
    });

    return updatedReview;
  }

  async submitReview(reviewId: string, reviewerId: string, reviewData: any): Promise<Review> {
    const review = await this.reviewModel.findById(reviewId);
    
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.reviewerId.toString() !== reviewerId) {
      throw new ForbiddenException('Not authorized to submit this review');
    }

    if (review.status !== ReviewStatus.IN_PROGRESS) {
      throw new BadRequestException('Review is not in progress');
    }

    // Update review with submission data
    Object.assign(review, {
      ...reviewData,
      status: ReviewStatus.COMPLETED,
      submittedDate: new Date(),
    });

    const updatedReview = await review.save();

    // Check if all reviews are completed for editorial decision
    const allReviews = await this.getReviewsForArticle(review.articleId.toString());
    const completedReviews = allReviews.filter(r => r.status === ReviewStatus.COMPLETED);
    
    if (completedReviews.length >= 2) { // Minimum 2 reviews for decision
      await this.createEditorialDecision(review.articleId.toString());
    }

    // Notify editorial team
    await this.notificationsService.create({
      userId: review.assignedBy.toString(),
      type: NotificationType.REVIEW_SUBMITTED,
      title: 'Review Completed',
      message: `${review.reviewerName} has completed the review for "${review.articleTitle}"`,
      actionUrl: `/dashboard/editorial/reviews/${reviewId}`,
    });

    return updatedReview;
  }

  private async createEditorialDecision(articleId: string): Promise<EditorialDecision> {
    const article = await this.articleModel.findById(articleId);
    const reviews = await this.getReviewsForArticle(articleId);
    
    const decision = new this.editorialDecisionModel({
      articleId: new Types.ObjectId(articleId),
      articleTitle: article.title,
      authorName: article.authors[0] ? `${article.authors[0].firstName} ${article.authors[0].lastName}` : 'Unknown',
      submittedDate: new Date(),
      status: DecisionStatus.PENDING,
      recommendationsCount: reviews.length,
      recommendations: reviews.map(r => r.recommendation),
      priority: 'normal',
    });

    return decision.save();
  }

  async makeEditorialDecision(
    decisionId: string,
    decisionDto: MakeEditorialDecisionDto,
    editorId: string
  ): Promise<EditorialDecision> {
    const decision = await this.editorialDecisionModel.findById(decisionId);
    
    if (!decision) {
      throw new NotFoundException('Editorial decision not found');
    }

    const editor = await this.userModel.findById(editorId);
    
    // Update decision
    Object.assign(decision, {
      decision: decisionDto.decision,
      comments: decisionDto.comments,
      status: DecisionStatus.DECIDED,
      decidedDate: new Date(),
      decidedBy: new Types.ObjectId(editorId),
      decidedByName: `${editor.firstName} ${editor.lastName}`,
    });

    const updatedDecision = await decision.save();

    // Update article status based on decision
    const article = await this.articleModel.findById(decision.articleId);
    
    switch (decisionDto.decision) {
      case DecisionType.ACCEPT:
        article.status = ArticleStatus.ACCEPTED;
        article.acceptanceDate = new Date();
        break;
      case DecisionType.MINOR_REVISION:
      case DecisionType.MAJOR_REVISION:
        article.status = ArticleStatus.REVISION_REQUESTED;
        break;
      case DecisionType.REJECT:
        article.status = ArticleStatus.REJECTED;
        break;
    }

    await article.save();

    // Notify author
    await this.notificationsService.create({
      userId: article.correspondingAuthor.toString(),
      type: NotificationType.DECISION_MADE,
      title: 'Editorial Decision',
      message: `A decision has been made on your submission "${article.title}"`,
      actionUrl: `/dashboard/submissions/${article._id}`,
    });

    return updatedDecision;
  }

  async getEditorialQueue(): Promise<EditorialDecision[]> {
    return this.editorialDecisionModel
      .find({ status: { $ne: DecisionStatus.DECIDED } })
      .sort({ priority: -1, submittedDate: 1 })
      .exec();
  }

  async getReviewerStats(reviewerId: string) {
    const reviews = await this.reviewModel.find({
      reviewerId: new Types.ObjectId(reviewerId)
    });

    const completed = reviews.filter(r => r.status === ReviewStatus.COMPLETED);
    const pending = reviews.filter(r => r.status === ReviewStatus.PENDING);
    const inProgress = reviews.filter(r => r.status === ReviewStatus.IN_PROGRESS);

    return {
      total: reviews.length,
      completed: completed.length,
      pending: pending.length,
      inProgress: inProgress.length,
      averageRating: completed.length > 0 
        ? completed.reduce((sum, r) => sum + (r.ratings?.overall || 0), 0) / completed.length 
        : 0,
      onTimeSubmissions: completed.filter(r => 
        r.submittedDate && r.dueDate && r.submittedDate <= r.dueDate
      ).length,
    };
  }
}