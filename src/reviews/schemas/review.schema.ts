import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

export enum ReviewStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DECLINED = 'declined',
  OVERDUE = 'overdue',
}

export enum ReviewRecommendation {
  ACCEPT = 'accept',
  MINOR_REVISION = 'minor_revision',
  MAJOR_REVISION = 'major_revision',
  REJECT = 'reject',
}

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'Article', required: true })
  articleId: Types.ObjectId;

  @Prop({ required: true })
  articleTitle: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reviewerId: Types.ObjectId;

  @Prop({ required: true })
  reviewerName: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assignedBy: Types.ObjectId;

  @Prop({ required: true })
  assignedByName: string;

  @Prop({ required: true, enum: Object.values(ReviewStatus) })
  status: ReviewStatus;

  @Prop()
  recommendation?: ReviewRecommendation;

  @Prop()
  comments?: string;

  @Prop()
  confidentialComments?: string; // Comments only visible to editors

  @Prop({ type: Date })
  dueDate: Date;

  @Prop({ type: Date })
  submittedDate?: Date;

  @Prop({ type: Date })
  acceptedDate?: Date;

  @Prop({ type: Date })
  declinedDate?: Date;

  @Prop({ default: false })
  isAnonymous: boolean;

  @Prop({ type: Object })
  ratings?: {
    originality?: number;
    methodology?: number;
    significance?: number;
    clarity?: number;
    overall?: number;
  };

  @Prop({ type: [String], default: [] })
  attachments: string[];
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Add indexes
ReviewSchema.index({ reviewerId: 1, status: 1 });
ReviewSchema.index({ articleId: 1 });
ReviewSchema.index({ dueDate: 1 });
