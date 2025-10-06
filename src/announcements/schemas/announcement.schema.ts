import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnnouncementDocument = Announcement & Document;

export enum AnnouncementType {
  GENERAL = 'general',
  CALL_FOR_PAPERS = 'call_for_papers',
  SPECIAL_ISSUE = 'special_issue',
  EDITORIAL_CHANGE = 'editorial_change',
  CONFERENCE = 'conference',
  DEADLINE = 'deadline',
  ACHIEVEMENT = 'achievement',
}

@Schema({ timestamps: true })
export class Announcement {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, enum: Object.values(AnnouncementType) })
  type: AnnouncementType;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ required: true })
  createdByName: string;

  @Prop({ default: true })
  isPublished: boolean;

  @Prop({ default: false })
  isPinned: boolean;

  @Prop({ type: Date })
  publishDate: Date;

  @Prop({ type: Date })
  expiryDate?: Date;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 0 })
  views: number;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);

// Add indexes
AnnouncementSchema.index({ isPublished: 1, publishDate: -1 });
AnnouncementSchema.index({ type: 1 });
AnnouncementSchema.index({ isPinned: -1, publishDate: -1 });
