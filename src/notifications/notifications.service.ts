import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const notification = new this.notificationModel({
      ...createNotificationDto,
      userId: new Types.ObjectId(createNotificationDto.userId),
      relatedArticleId: createNotificationDto.relatedArticleId
        ? new Types.ObjectId(createNotificationDto.relatedArticleId)
        : undefined,
      relatedMessageId: createNotificationDto.relatedMessageId
        ? new Types.ObjectId(createNotificationDto.relatedMessageId)
        : undefined,
    });

    return notification.save();
  }

  async findAllForUser(userId: string, unreadOnly: boolean = false) {
    const query: any = { userId: new Types.ObjectId(userId) };
    
    if (unreadOnly) {
      query.isRead = false;
    }

    return this.notificationModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50) // Limit to last 50 notifications
      .exec();
  }

  async findOne(id: string, userId: string) {
    const notification = await this.notificationModel.findById(id).exec();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Check if user has access to this notification
    if (notification.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this notification');
    }

    return notification;
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto, userId: string) {
    const notification = await this.findOne(id, userId);
    Object.assign(notification, updateNotificationDto);
    return notification.save();
  }

  async markAsRead(id: string, userId: string) {
    return this.update(id, { isRead: true }, userId);
  }

  async markAllAsRead(userId: string) {
    return this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true }
    ).exec();
  }

  async delete(id: string, userId: string) {
    const notification = await this.findOne(id, userId);
    return this.notificationModel.findByIdAndDelete(id).exec();
  }

  async deleteAll(userId: string): Promise<{ deletedCount?: number }> {
    return this.notificationModel.deleteMany({
      userId: new Types.ObjectId(userId)
    }).exec();
  }

  async getUnreadCount(userId: string) {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  // Helper methods for common notification types
  async notifySubmissionReceived(
    userId: string,
    articleId: string,
    articleTitle: string,
    submissionId: string
  ) {
    return this.create({
      userId,
      type: NotificationType.SUBMISSION_RECEIVED,
      title: 'Submission Received',
      message: `Your manuscript "${articleTitle}" has been successfully submitted.`,
      relatedArticleId: articleId,
      relatedArticleTitle: articleTitle,
      actionUrl: `/dashboard/submissions`,
      metadata: { submissionId },
    });
  }

  async notifyReviewAssigned(
    userId: string,
    articleId: string,
    articleTitle: string,
    dueDate?: Date
  ) {
    return this.create({
      userId,
      type: NotificationType.REVIEW_ASSIGNED,
      title: 'New Review Assignment',
      message: `You have been assigned to review "${articleTitle}".`,
      relatedArticleId: articleId,
      relatedArticleTitle: articleTitle,
      actionUrl: `/dashboard/reviewer`,
      metadata: { dueDate },
    });
  }

  async notifyDecisionMade(
    userId: string,
    articleId: string,
    articleTitle: string,
    decision: 'accepted' | 'rejected' | 'revision_requested'
  ) {
    const messages = {
      accepted: 'Congratulations! Your manuscript has been accepted for publication.',
      rejected: 'Unfortunately, your manuscript was not accepted for publication.',
      revision_requested: 'Your manuscript requires revisions before final decision.',
    };

    return this.create({
      userId,
      type: NotificationType.DECISION_MADE,
      title: 'Decision on Your Manuscript',
      message: messages[decision],
      relatedArticleId: articleId,
      relatedArticleTitle: articleTitle,
      actionUrl: `/dashboard/submissions`,
      metadata: { decision },
    });
  }

  async notifyMessageReceived(
    userId: string,
    messageId: string,
    senderName: string,
    subject: string
  ) {
    return this.create({
      userId,
      type: NotificationType.MESSAGE_RECEIVED,
      title: 'New Message',
      message: `You received a new message from ${senderName}: "${subject}"`,
      relatedMessageId: messageId,
      actionUrl: `/dashboard/messages`,
      metadata: { senderName, subject },
    });
  }

  async notifyDeadlineApproaching(
    userId: string,
    articleId: string,
    articleTitle: string,
    deadlineType: string,
    daysRemaining: number
  ) {
    return this.create({
      userId,
      type: NotificationType.DEADLINE_APPROACHING,
      title: `${deadlineType} Deadline Approaching`,
      message: `The ${deadlineType.toLowerCase()} for "${articleTitle}" is due in ${daysRemaining} days.`,
      relatedArticleId: articleId,
      relatedArticleTitle: articleTitle,
      actionUrl: `/dashboard/submissions`,
      metadata: { deadlineType, daysRemaining },
    });
  }
}
