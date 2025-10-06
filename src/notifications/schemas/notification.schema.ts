import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  SUBMISSION_RECEIVED = 'submission_received',
  REVIEW_ASSIGNED = 'review_assigned',
  REVIEW_SUBMITTED = 'review_submitted',
  DECISION_MADE = 'decision_made',
  REVISION_REQUESTED = 'revision_requested',
  REVISION_SUBMITTED = 'revision_submitted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  MESSAGE_RECEIVED = 'message_received',
  COMMENT_ADDED = 'comment_added',
  DEADLINE_APPROACHING = 'deadline_approaching',
  GENERAL = 'general',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(NotificationType) })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Article' })
  relatedArticleId?: Types.ObjectId;

  @Prop()
  relatedArticleTitle?: string;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  relatedMessageId?: Types.ObjectId;

  @Prop()
  actionUrl?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Add indexes for performance
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });
