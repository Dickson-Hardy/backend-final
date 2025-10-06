import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument, ReviewStatus } from './schemas/review.schema';
import { CreateReviewDto, SubmitReviewDto, UpdateReviewStatusDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  async create(createReviewDto: CreateReviewDto, assignedById: string, assignedByName: string) {
    const review = new this.reviewModel({
      ...createReviewDto,
      articleId: new Types.ObjectId(createReviewDto.articleId),
      reviewerId: new Types.ObjectId(createReviewDto.reviewerId),
      assignedBy: new Types.ObjectId(assignedById),
      assignedByName,
      status: ReviewStatus.PENDING,
      dueDate: new Date(createReviewDto.dueDate),
    });

    return review.save();
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

    // Check if the user is the assigned reviewer
    if (review.reviewerId.toString() !== reviewerId) {
      throw new ForbiddenException('You are not authorized to submit this review');
    }

    if (review.status === ReviewStatus.COMPLETED) {
      throw new BadRequestException('Review has already been submitted');
    }

    Object.assign(review, {
      ...submitReviewDto,
      status: ReviewStatus.COMPLETED,
      submittedDate: new Date(),
    });

    return review.save();
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

    return review.save();
  }

  async declineReview(id: string, reviewerId: string, reason?: string) {
    const review = await this.findOne(id);

    if (review.reviewerId.toString() !== reviewerId) {
      throw new ForbiddenException('You are not authorized to decline this review');
    }

    if (review.status !== ReviewStatus.PENDING) {
      throw new BadRequestException('Review has already been responded to');
    }

    review.status = ReviewStatus.DECLINED;
    review.declinedDate = new Date();
    if (reason) {
      review.confidentialComments = reason;
    }

    return review.save();
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
    
    // In production, integrate with email service
    // For now, just update a reminder count
    return {
      success: true,
      message: 'Reminder sent successfully',
      reviewId,
      reviewerEmail: 'reviewer@example.com', // Would be fetched from user model
    };
  }
}
