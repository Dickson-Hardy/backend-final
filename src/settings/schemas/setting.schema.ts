import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document } from "mongoose"

export type SettingDocument = Setting & Document

@Schema({ timestamps: true })
export class Setting {
  @Prop({ required: true, unique: true })
  key: string

  @Prop({ required: true, type: Object })
  value: any

  @Prop()
  category: string

  @Prop()
  description: string

  @Prop({ default: false })
  isPublic: boolean
}

export const SettingSchema = SchemaFactory.createForClass(Setting)
