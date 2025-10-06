import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EditorialDecisionDocument = EditorialDecision & Document;

export enum DecisionStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  DECIDED = 'decided',
}

export enum DecisionType {
  ACCEPT = 'accept',
  REJECT = 'reject',
  MINOR_REVISION = 'minor_revision',
  MAJOR_REVISION = 'major_revision',
}

export enum Priority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Schema({ timestamps: true })
export class EditorialDecision {
  @Prop({ type: Types.ObjectId, ref: 'Article', required: true })
  articleId: Types.ObjectId;

  @Prop({ required: true })
  articleTitle: string;

  @Prop({ required: true })
  authorName: string;

  @Prop({ type: Date, required: true })
  submittedDate: Date;

  @Prop({ type: String, enum: DecisionStatus, default: DecisionStatus.PENDING })
  status: DecisionStatus;

  @Prop({ type: String, enum: DecisionType })
  decision?: DecisionType;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedTo?: Types.ObjectId;

  @Prop()
  assignedToName?: string;

  @Prop({ type: String, enum: Priority, default: Priority.NORMAL })
  priority: Priority;

  @Prop({ type: Date })
  dueDate?: Date;

  @Prop({ type: Number, default: 0 })
  recommendationsCount: number;

  @Prop({ type: [String], default: [] })
  recommendations: string[];

  @Prop({ type: Date })
  decidedDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  decidedBy?: Types.ObjectId;

  @Prop()
  decidedByName?: string;

  @Prop()
  notes?: string;

  @Prop()
  comments?: string;
}

export const EditorialDecisionSchema = SchemaFactory.createForClass(EditorialDecision);

// Virtual field for days in review
EditorialDecisionSchema.virtual('daysInReview').get(function() {
  const now = this.decidedDate || new Date();
  const submitted = this.submittedDate;
  return Math.floor((now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));
});
