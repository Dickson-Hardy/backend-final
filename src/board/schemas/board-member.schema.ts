import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BoardMemberDocument = BoardMember & Document;

@Schema({ timestamps: true })
export class BoardMember {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({
    type: String,
    enum: ['editor_in_chief', 'associate_editor', 'editorial_assistant', 'reviewer'],
    required: true,
  })
  role: string;

  @Prop({ required: true })
  affiliation: string;

  @Prop({ type: [String], default: [] })
  expertise: string[];

  @Prop({
    type: String,
    enum: ['active', 'inactive', 'on_leave'],
    default: 'active',
  })
  status: string;

  @Prop({ type: Date, default: Date.now })
  joinedDate: Date;

  @Prop()
  bio: string;

  @Prop()
  publications: number;

  @Prop()
  hIndex: number;

  @Prop()
  profileImage: string;
}

export const BoardMemberSchema = SchemaFactory.createForClass(BoardMember);
