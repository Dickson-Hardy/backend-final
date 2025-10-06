import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  senderName: string;

  @Prop({ required: true })
  senderRole: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipientId: Types.ObjectId;

  @Prop({ required: true })
  recipientName: string;

  @Prop({ required: true })
  recipientRole: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  body: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ default: false })
  isArchived: boolean;

  @Prop({ type: [{ name: String, size: String, url: String }], default: [] })
  attachments: Array<{ name: string; size: string; url: string }>;

  @Prop({ type: Types.ObjectId, ref: 'Article' })
  relatedArticleId?: Types.ObjectId;

  @Prop()
  relatedArticleTitle?: string;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  parentMessageId?: Types.ObjectId;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Add indexes for performance
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ recipientId: 1, createdAt: -1 });
MessageSchema.index({ recipientId: 1, isRead: 1 });
