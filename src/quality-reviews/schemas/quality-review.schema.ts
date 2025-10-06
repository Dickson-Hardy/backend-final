import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QualityReviewDocument = QualityReview & Document;

@Schema({ timestamps: true })
export class QualityReview {
  @Prop({ type: Types.ObjectId, ref: 'Article', required: true })
  articleId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  submittedBy: string;

  @Prop({ type: Date, default: Date.now })
  submittedDate: Date;

  @Prop({
    type: String,
    enum: ['pending', 'in_review', 'approved', 'rejected', 'requires_revision'],
    default: 'pending',
  })
  status: string;

  @Prop({
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  })
  priority: string;

  @Prop({
    type: {
      formatting: { type: Number, default: 0 },
      plagiarism: { type: Number, default: 0 },
      language: { type: Number, default: 0 },
      references: { type: Number, default: 0 },
    },
    default: {
      formatting: 0,
      plagiarism: 0,
      language: 0,
      references: 0,
    },
  })
  issues: {
    formatting: number;
    plagiarism: number;
    language: number;
    references: number;
  };

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedTo: Types.ObjectId;

  @Prop()
  lastReviewed: Date;

  @Prop()
  notes: string;

  @Prop()
  rejectionReason: string;
}

export const QualityReviewSchema = SchemaFactory.createForClass(QualityReview);
