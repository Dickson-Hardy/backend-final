import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { type Document, Types } from "mongoose"

export type VolumeDocument = Volume & Document

export enum VolumeStatus {
  DRAFT = "draft",
  IN_PROGRESS = "in_progress",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

@Schema({ timestamps: true })
export class Volume {
  @Prop({ required: true })
  volume: number

  @Prop()
  issue?: number

  @Prop({ required: true })
  year: number

  @Prop({ required: true })
  title: string

  @Prop()
  description: string

  @Prop({ type: String, enum: VolumeStatus, default: VolumeStatus.DRAFT })
  status: VolumeStatus

  @Prop()
  coverImage: string

  @Prop()
  publishDate: Date

  @Prop()
  doi: string

  @Prop()
  pages: string

  @Prop([{ type: Types.ObjectId, ref: "Article" }])
  articles: Types.ObjectId[]

  @Prop({ type: Types.ObjectId, ref: "User" })
  editor?: Types.ObjectId

  @Prop()
  issn: string

  @Prop()
  isbn: string

  @Prop({ default: false })
  featured: boolean

  @Prop({ default: 0 })
  downloadCount: number

  @Prop({ default: 0 })
  viewCount: number
}

export const VolumeSchema = SchemaFactory.createForClass(Volume)
