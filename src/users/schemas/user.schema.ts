import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import type { Document } from "mongoose"
import { UploadResult } from "../../upload/interfaces/upload.interface"

export type UserDocument = User & Document

export enum UserRole {
  AUTHOR = "author",
  REVIEWER = "reviewer",
  EDITORIAL_ASSISTANT = "editorial_assistant",
  ASSOCIATE_EDITOR = "associate_editor",
  EDITORIAL_BOARD = "editorial_board",
  EDITOR_IN_CHIEF = "editor_in_chief",
  ADMIN = "admin",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  firstName: string

  @Prop({ required: true })
  lastName: string

  @Prop({ required: true, unique: true })
  email: string

  @Prop({ required: true })
  password: string

  @Prop({ type: String, enum: UserRole, default: UserRole.AUTHOR })
  role: UserRole

  @Prop({ type: String, enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus

  @Prop()
  affiliation: string

  @Prop()
  department: string

  @Prop()
  orcidId: string

  @Prop()
  bio: string

  @Prop([String])
  specializations: string[]

  @Prop({ type: Object })
  profileImage: UploadResult

  @Prop({ default: Date.now })
  lastLogin: Date

  @Prop({ default: false })
  emailVerified: boolean

  @Prop()
  emailVerificationToken: string

  @Prop()
  passwordResetToken: string

  @Prop()
  passwordResetExpires: Date

  // Timestamps are automatically added by Mongoose when timestamps: true
  createdAt: Date
  updatedAt: Date

  // Computed property for backward compatibility
  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE
  }
}

export const UserSchema = SchemaFactory.createForClass(User)
