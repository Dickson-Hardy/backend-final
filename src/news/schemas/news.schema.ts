import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { type Document, Types } from "mongoose"
import { UploadResult } from "../../upload/interfaces/upload.interface"

export type NewsDocument = News & Document

export enum NewsType {
  NEWS = "news",
  ANNOUNCEMENT = "announcement",
  UPDATE = "update",
}

export enum NewsPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum NewsStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

@Schema({ timestamps: true })
export class News {
  @Prop({ required: true })
  title: string

  @Prop({ required: true })
  content: string

  @Prop()
  excerpt: string

  @Prop({ type: String, enum: NewsType, required: true })
  type: NewsType

  @Prop({ type: String, enum: NewsPriority, default: NewsPriority.MEDIUM })
  priority: NewsPriority

  @Prop({ type: String, enum: NewsStatus, default: NewsStatus.DRAFT })
  status: NewsStatus

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  author: Types.ObjectId

  @Prop()
  publishDate: Date

  @Prop()
  expiryDate: Date

  @Prop([String])
  tags: string[]

  @Prop({ type: Object })
  featuredImage: UploadResult

  @Prop({ type: Object })
  image: UploadResult

  @Prop({ default: 0 })
  viewCount: number

  @Prop({ default: false })
  featured: boolean

  @Prop({ default: true })
  allowComments: boolean
}

export const NewsSchema = SchemaFactory.createForClass(News)
