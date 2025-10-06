import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DraftDocument = Draft & Document;

@Schema({ timestamps: true })
export class Draft {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop()
  title: string;

  @Prop()
  manuscriptType: string;

  @Prop({ type: [String], default: [] })
  keywords: string[];

  @Prop({ type: Date, default: Date.now })
  lastModified: Date;

  @Prop({ type: Number, default: 0 })
  completionPercentage: number;

  @Prop({
    type: {
      metadata: { type: Boolean, default: false },
      authors: { type: Boolean, default: false },
      abstract: { type: Boolean, default: false },
      manuscript: { type: Boolean, default: false },
      references: { type: Boolean, default: false },
    },
    default: {
      metadata: false,
      authors: false,
      abstract: false,
      manuscript: false,
      references: false,
    },
  })
  sections: {
    metadata: boolean;
    authors: boolean;
    abstract: boolean;
    manuscript: boolean;
    references: boolean;
  };

  @Prop({ type: Object, default: {} })
  formData: Record<string, any>;

  @Prop({ type: String, enum: ['draft', 'submitted'], default: 'draft' })
  status: string;
}

export const DraftSchema = SchemaFactory.createForClass(Draft);
