import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument, ReviewStatus } from './schemas/review.schema';
import { CreateReviewDto, SubmitReviewDto, UpdateReviewStatusDto } from './dto/create-review.dto';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserDocument } from '../users/schemas/user.schema';
import { ArticleDocument } from '../articles/schemas/article.schema';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel('User') private userModel: Model<UserDocument>,
    @InjectModel('Article') private articleModel: Model<ArticleDocument>,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createReviewDto: CreateReviewDto, assignedById: string, assignedByName: string) {
    // Validate reviewer exists
    const reviewer = await this.userModel.findById(createReviewDto.reviewerId);
    if (!reviewer) {
      throw new NotFoundException('Reviewer not found');
    }

    // Validate article exists
    const article = await this.articleModel.findById(createReviewDto.articleId);
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Check if reviewer is already assigned to this article
    const existingReview = await this.reviewModel.findOne({
      articleId: new Types.ObjectId(createReviewDto.articleId),
      reviewerId: new Types.ObjectId(createReviewDto.reviewerId),
    });

    if (existingReview) {
      throw new BadRequestException('This reviewer is already assigned to this article');
    }

    // Validate reviewer is not an author of the article
    const isAuthor = article.authors.some(
      (author: any) => 
        author.email.toLowerCase() === reviewer.email.toLowerCase()
    );

    if (isAuthor) {
      throw new BadRequestException('Authors cannot review their own submissions');
    }

    const review = new this.reviewModel({
      ...createReviewDto,
      articleId: new Types.ObjectId(createReviewDto.articleId),
      reviewerId: new Types.ObjectId(createReviewDto.reviewerId),
      assignedBy: new Types.ObjectId(assignedById),
      assignedByName,
      status: ReviewStatus.PENDING,
      dueDate: new Date(createReviewDto.dueDate),
    });

    const savedReview = await review.save();

    // Send invitation email to reviewer
    await this.emailService.sendReviewInvitation(
      reviewer.email,
      `${reviewer.firstName} ${reviewer.lastName}`,
      article.title,
      new Date(createReviewDto.dueDate),
      article._id.toString()
    );

    // Create notification for reviewer
    await this.notificationsService.create({
      userId: createReviewDto.reviewerId,
      type: 'review_invitation',
      title: 'New Review Invitation',
      message: `You have been invited to review "${article.title}"`,
      actionUrl: `/dashboard/reviewer/review/${savedReview._id}`,
    });

    return savedReview;
  }

  async findAllForReviewer(reviewerId: string, status?: ReviewStatus) {
    const query: any = { reviewerId: new Types.ObjectId(reviewerId) };
    
    if (status) {
      query.status = status;
    }

    return this.reviewModel
      .find(query)
      .sort({ dueDate: 1, createdAt: -1 })
      .exec();
  }

  async findAllForArticle(articleId: string) {
    return this.reviewModel
      .find({ articleId: new Types.ObjectId(articleId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    const review = await this.reviewModel.findById(id).exec();
    
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async submitReview(id: string, submitReviewDto: SubmitReviewDto, reviewerId: string) {
    const review = await this.findOne(id);

    // Check if the user is the assigned  reviewer
    if (review.reviewerId.toString() !== reviewerId) {
      throw new ForbiddenException('You are not authorized to submit this review');
    }

    if (review.status === ReviewStatus.COMPLETED) {
      throw new BadRequestException('Review has already been submitted');
    }

    if (review.status !== ReviewStatus.IN_PROGRESS && review.status !== ReviewStatus.PENDING) {
      throw new BadRequestException('Review must be accepted before submission');
    }

    // Validate ratings
    const { originality, methodology, significance, clarity, overall } = submitReviewDto.ratings;
    if (!originality || !methodology || !significance || !clarity || !overall) {
      throw new BadRequestException('All rating fields are required');
    }

    Object.assign(review, {
      ...submitReviewDto,
      status: ReviewStatus.COMPLETED,
      submittedDate: new Date(),
    });

    const savedReview = await review.save();

    // Get article and reviewer details
    const article = await this.articleModel.findById(review.articleId);
    const reviewer = await this.userModel.findById(reviewerId);

    // Send completion notification to editorial team
    await this.emailService.sendReviewCompleted(
      'editorial@amhsj.org', // In production, get from editors
      'Editorial Team',
      article.title,
      article._id.toString()
    );

    // Notify article's corresponding author (if appropriate per journal policy)
    // Most journals don't notify authors until decision is made

    // Create notification for editorial team
    await this.notificationsService.notifyEditorialTeam({
      type: 'review_completed',
      title: 'Review Completed',
      message: `Review completed for "${article.title}" by ${reviewer.firstName} ${reviewer.lastName}`,
      actionUrl: `/dashboard/editorial/articles/${article._id}`,
      priority: 'high',
    });

    return savedReview;
  }

  async acceptReview(id: string, reviewerId: string) {
    const review = await this.findOne(id);

    if (review.reviewerId.toString() !== reviewerId) {
      throw new ForbiddenException('You are not authorized to accept this review');
    }

    if (review.status !== ReviewStatus.PENDING) {
      throw new BadRequestException('Review has already been responded to');
    }

    review.status = ReviewStatus.IN_PROGRESS;
    review.acceptedDate = new Date();

    const savedReview = await review.save();

    // Get article and reviewer details
    const article = await this.articleModel.findById(review.articleId);
    const reviewer = await this.userModel.findById(reviewerId);

    // Send assignment confirmation email
    await this.emailService.sendReviewAssignment(
      reviewer.email,
      `${reviewer.firstName} ${reviewer.lastName}`,
      article.title,
      review.dueDate,
      article._id.toString()
    );

    // Create notification for reviewer
    await this.notificationsService.create({
      userId: reviewerId,
      type: 'review_accepted',
      title: 'Review Assignment Confirmed',
      message: `You have accepted the review for "${article.title}"`,
      actionUrl: `/dashboard/reviewer/review/${id}`,
    });

    // Notify editorial team
    await this.notificationsService.notifyEditorialTeam({
      type: 'reviewer_accepted',
      title: 'Reviewer Accepted Assignment',
      message: `${reviewer.firstName} ${reviewer.lastName} accepted review for "${article.title}"`,
      actionUrl: `/dashboard/editorial/articles/${article._id}`,
    });

    return savedReview;
  }

  async declineReview(id: string, reviewerId: string, reason?: string) {
    const review = await this.findOne(id);

    if (review.reviewerId.toString() !== reviewerId) {
      throw new ForbiddenException('You are not authorized to decline this review');
    }

    if (review.status !== ReviewStatus.PENDING) {
      throw new BadRequestException('Review has already been responded to');
    }

    if (!reason || reason.trim().length < 20) {
      throw new BadRequestException('Please provide a reason for declining (minimum 20 characters)');
    }

    review.status = ReviewStatus.DECLINED;
    review.declinedDate = new Date();
    if (reason) {
      review.confidentialComments = reason;
    }

    const savedReview = await review.save();

    // Get article and reviewer details
    const article = await this.articleModel.findById(review.articleId);
    const reviewer = await this.userModel.findById(reviewerId);

    // Notify editorial team about declined review
    await this.notificationsService.notifyEditorialTeam({
      type: 'reviewer_declined',
      title: 'Reviewer Declined Assignment',
      message: `${reviewer.firstName} ${reviewer.lastName} declined review for "${article.title}". Reason: ${reason}`,
      actionUrl: `/dashboard/editorial/articles/${article._id}`,
      priority: 'high',
    });

    // Send email to editorial team
    await this.emailService.sendEmail({
      to: 'editorial@amhsj.org',
      subject: `Reviewer Declined - ${article.title}`,
      template: {
        html: `<p>Reviewer ${reviewer.firstName} ${reviewer.lastName} (${reviewer.email}) has declined the review invitation for "${article.title}".</p><p><strong>Reason:</strong> ${reason}</p><p>Please assign a new reviewer.</p>`,
        text: `Reviewer ${reviewer.firstName} ${reviewer.lastName} has declined the review for "${article.title}". Reason: ${reason}`,
      },
      type: 'editorial',
    });

    return savedReview;
  }

  async updateStatus(id: string, updateStatusDto: UpdateReviewStatusDto) {
    const review = await this.findOne(id);
    
    Object.assign(review, updateStatusDto);
    
    return review.save();
  }

  async getReviewerStatistics(reviewerId: string) {
    const reviews = await this.reviewModel
      .find({ reviewerId: new Types.ObjectId(reviewerId) })
      .exec();

    const total = reviews.length;
    const completed = reviews.filter(r => r.status === ReviewStatus.COMPLETED).length;
    const pending = reviews.filter(r => r.status === ReviewStatus.PENDING).length;
    const inProgress = reviews.filter(r => r.status === ReviewStatus.IN_PROGRESS).length;
    const declined = reviews.filter(r => r.status === ReviewStatus.DECLINED).length;
    const overdue = reviews.filter(r => r.status === ReviewStatus.OVERDUE).length;

    const averageCompletionTime = reviews
      .filter(r => r.submittedDate && r.acceptedDate)
      .reduce((acc, r) => {
        const days = Math.floor(
          (r.submittedDate!.getTime() - r.acceptedDate!.getTime()) / (1000 * 60 * 60 * 24)
        );
        return acc + days;
      }, 0) / (completed || 1);

    return {
      total,
      completed,
      pending,
      inProgress,
      declined,
      overdue,
      averageCompletionTime: Math.round(averageCompletionTime),
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  async delete(id: string) {
    const review = await this.findOne(id);
    return this.reviewModel.findByIdAndDelete(id).exec();
  }

  // Check for overdue reviews and update status
  async updateOverdueReviews() {
    const now = new Date();
    
    return this.reviewModel.updateMany(
      {
        status: { $in: [ReviewStatus.PENDING, ReviewStatus.IN_PROGRESS] },
        dueDate: { $lt: now },
      },
      { status: ReviewStatus.OVERDUE }
    ).exec();
  }

  // Reviewer management methods
  async getAllReviewers() {
    const reviewers = await this.reviewModel.aggregate([
      {
        $group: {
          _id: '$reviewerId',
          totalReviews: { $sum: 1 },
          completedReviews: {
            $sum: { $cond: [{ $eq: ['$status', ReviewStatus.COMPLETED] }, 1, 0] },
          },
          pendingReviews: {
            $sum: { $cond: [{ $eq: ['$status', ReviewStatus.PENDING] }, 1, 0] },
          },
          inProgressReviews: {
            $sum: { $cond: [{ $eq: ['$status', ReviewStatus.IN_PROGRESS] }, 1, 0] },
          },
          lastReviewDate: { $max: '$submittedDate' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          id: '$_id',
          name: '$user.name',
          email: '$user.email',
          expertise: '$user.expertise',
          totalReviews: 1,
          completedReviews: 1,
          pendingReviews: 1,
          inProgressReviews: 1,
          lastReviewDate: 1,
          responseRate: {
            $cond: [
              { $gt: ['$totalReviews', 0] },
              { $multiply: [{ $divide: ['$completedReviews', '$totalReviews'] }, 100] },
              0,
            ],
          },
          status: '$user.status',
        },
      },
    ]);

    return reviewers;
  }

  async sendReminder(reviewId: string) {
    const review = await this.findOne(reviewId);
    
    if (review.status === ReviewStatus.COMPLETED) {
      throw new BadRequestException('Cannot send reminder for completed review');
    }

    if (review.status === ReviewStatus.DECLINED) {
      throw new BadRequestException('Cannot send reminder for declined review');
    }

    // Get article and reviewer details
    const article = await this.articleModel.findById(review.articleId);
    const reviewer = await this.userModel.findById(review.reviewerId);

    if (!reviewer || !article) {
      throw new NotFoundException('Reviewer or article not found');
    }

    // Send reminder email
    await this.emailService.sendReminderEmail(
      reviewer.email,
      `${reviewer.firstName} ${reviewer.lastName}`,
      review.status === ReviewStatus.IN_PROGRESS ? 'Review Completion' : 'Review Response',
      article.title,
      review.dueDate,
      article._id.toString()
    );

    // Create notification
    await this.notificationsService.create({
      userId: review.reviewerId.toString(),
      type: 'review_reminder',
      title: 'Review Reminder',
      message: review.status === ReviewStatus.IN_PROGRESS
        ? `Reminder: Please complete your review for "${article.title}" by ${review.dueDate.toLocaleDateString()}`
        : `Reminder: Please respond to the review invitation for "${article.title}"`,
      actionUrl: `/dashboard/reviewer/review/${reviewId}`,
    });

    return {
      success: true,
      message: 'Reminder sent successfully',
      reviewId,
      reviewerEmail: reviewer.email,
      reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
    };
  }
}
