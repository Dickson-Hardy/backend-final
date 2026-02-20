import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { type Document, Types } from "mongoose"
import { UploadResult } from "../../upload/interfaces/upload.interface"

export type ArticleDocument = Article & Document

export enum ArticleStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  UNDER_REVIEW = "under_review",
  REVISION_REQUESTED = "revision_requested",
  ACCEPTED = "accepted",
  PUBLISHED = "published",
  REJECTED = "rejected",
}

export enum ArticleType {
  RESEARCH = "research",
  REVIEW = "review",
  CASE_STUDY = "case_study",
  EDITORIAL = "editorial",
  LETTER = "letter",
  COMMENTARY = "commentary",
}

@Schema({ timestamps: true })
export class Article {
  @Prop({ required: true })
  title: string

  @Prop({ required: true })
  abstract: string

  @Prop({ required: true })
  content: string

  @Prop([String])
  keywords: string[]

  @Prop({ type: String, enum: ArticleType, required: true })
  type: ArticleType

  @Prop({ type: String, enum: ArticleStatus, default: ArticleStatus.DRAFT })
  status: ArticleStatus

  @Prop([{
    title: { type: String, required: false },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    affiliation: { type: String, required: true }
  }])
  authors: Array<{
    title?: string
    firstName: string
    lastName: string
    email: string
    affiliation: string
  }>

  @Prop({ type: Types.ObjectId, ref: "User" })
  correspondingAuthor: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: "Volume" })
  volume: Types.ObjectId

  @Prop()
  doi: string

  @Prop()
  pages: string

  @Prop()
  articleNumber: string

  @Prop()
  submissionDate: Date

  @Prop()
  acceptanceDate: Date

  @Prop()
  publishDate: Date

  @Prop([String])
  categories: string[]

  @Prop({ type: Object })
  manuscriptFile: UploadResult

  @Prop([Object])
  supplementaryFiles: UploadResult[]

  @Prop([{ type: Types.ObjectId, ref: "User" }])
  reviewers: Types.ObjectId[]

  @Prop([{ type: Types.ObjectId, ref: "User" }])
  assignedReviewers: Types.ObjectId[]

  @Prop({ default: 0 })
  viewCount: number

  @Prop({ default: 0 })
  downloadCount: number

  @Prop({ default: 0 })
  citationCount: number

  @Prop()
  conflictOfInterest: string

  @Prop()
  funding: string

  @Prop()
  acknowledgments: string

  @Prop([String])
  references: string[]

  @Prop({ default: false })
  featured: boolean

  @Prop()
  withdrawalReason: string

  @Prop()
  withdrawalDate: Date

  @Prop()
  revisionNotes: string
}

export const ArticleSchema = SchemaFactory.createForClass(Article)
