import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QualityReview, QualityReviewDocument } from './schemas/quality-review.schema';
import { CreateQualityReviewDto } from './dto/create-quality-review.dto';
import { UpdateQualityReviewDto } from './dto/update-quality-review.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

@Injectable()
export class QualityReviewsService {
  constructor(
    @InjectModel(QualityReview.name)
    private qualityReviewModel: Model<QualityReviewDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async create(createDto: CreateQualityReviewDto): Promise<QualityReview> {
    const review = new this.qualityReviewModel({
      ...createDto,
      articleId: new Types.ObjectId(createDto.articleId),
    });
    return review.save();
  }

  async findAll(): Promise<QualityReview[]> {
    return this.qualityReviewModel
      .find()
      .populate('assignedTo', 'firstName lastName email')
      .sort({ submittedDate: -1 })
      .exec();
  }

  async findOne(id: string): Promise<QualityReview> {
    const review = await this.qualityReviewModel
      .findById(id)
      .populate('assignedTo', 'firstName lastName email')
      .exec();

    if (!review) {
      throw new NotFoundException('Quality review not found');
    }
    return review;
  }

  async update(id: string, updateDto: UpdateQualityReviewDto): Promise<QualityReview> {
    const review = await this.qualityReviewModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();

    if (!review) {
      throw new NotFoundException('Quality review not found');
    }
    return review;
  }

  async startReview(id: string, userId: string): Promise<QualityReview> {
    return this.qualityReviewModel
      .findByIdAndUpdate(
        id,
        {
          status: 'in_review',
          assignedTo: new Types.ObjectId(userId),
          lastReviewed: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  async approve(id: string): Promise<QualityReview> {
    const review = await this.findOne(id);

    // Send notification to author
    await this.notificationsService.create({
      userId: review.articleId.toString(),
      type: NotificationType.SUBMISSION_RECEIVED,
      title: 'Article Approved',
      message: `Your article "${review.title}" has passed quality review`,
      actionUrl: `/dashboard/submissions/${review.articleId}`,
    });

    return this.qualityReviewModel
      .findByIdAndUpdate(
        id,
        {
          status: 'approved',
          lastReviewed: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  async reject(id: string, reason: string): Promise<QualityReview> {
    const review = await this.findOne(id);

    // Send notification to author
    await this.notificationsService.create({
      userId: review.articleId.toString(),
      type: NotificationType.REVISION_REQUESTED,
      title: 'Article Rejected',
      message: `Your article "${review.title}" did not pass quality review`,
      actionUrl: `/dashboard/submissions/${review.articleId}`,
    });

    return this.qualityReviewModel
      .findByIdAndUpdate(
        id,
        {
          status: 'rejected',
          rejectionReason: reason,
          lastReviewed: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  async requiresRevision(id: string, notes: string): Promise<QualityReview> {
    return this.qualityReviewModel
      .findByIdAndUpdate(
        id,
        {
          status: 'requires_revision',
          notes,
          lastReviewed: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  async delete(id: string): Promise<void> {
    const result = await this.qualityReviewModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Quality review not found');
    }
  }
}
