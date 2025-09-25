import { Controller, Post, Delete, Get, Param, Query, UseInterceptors, UseGuards, Body } from "@nestjs/common"
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger"
import { UploadService } from "./upload.service"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { UserRole } from "../users/schemas/user.schema"
import type { FileUploadOptions } from "./interfaces/upload.interface"
import type { Express } from "express"

@ApiTags("upload")
@Controller("upload")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Upload file" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 201, description: "File uploaded successfully" })
  async upload(file: Express.Multer.File, @Body() options: FileUploadOptions) {
    return this.uploadService.uploadFile(file, options)
  }

  @Post("multiple")
  @UseInterceptors(FilesInterceptor("files", 10))
  @ApiOperation({ summary: "Upload multiple files" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 201, description: "Files uploaded successfully" })
  async uploadMultiple(files: Express.Multer.File[], @Body() options: FileUploadOptions) {
    return this.uploadService.uploadMultipleFiles(files, options)
  }

  @Post("manuscript")
  @UseInterceptors(FileInterceptor("manuscript"))
  @ApiOperation({ summary: "Upload manuscript file" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 201, description: "Manuscript uploaded successfully" })
  async uploadManuscript(file: Express.Multer.File, @Body("articleId") articleId?: string) {
    return this.uploadService.uploadFile(file, {
      type: "manuscript",
      articleId,
    })
  }

  @Post("cover")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF)
  @UseInterceptors(FileInterceptor("cover"))
  @ApiOperation({ summary: "Upload volume cover image" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 201, description: "Cover image uploaded successfully" })
  async uploadCover(file: Express.Multer.File, @Body("volumeId") volumeId?: string) {
    return this.uploadService.uploadFile(file, {
      type: "cover",
      volumeId,
    })
  }

  @Post("profile")
  @UseInterceptors(FileInterceptor("profile"))
  @ApiOperation({ summary: "Upload profile image" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 201, description: "Profile image uploaded successfully" })
  async uploadProfile(file: Express.Multer.File, @Body("userId") userId?: string) {
    return this.uploadService.uploadFile(file, {
      type: "profile",
      userId,
    })
  }

  @Post("news")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF)
  @UseInterceptors(FileInterceptor("image"))
  @ApiOperation({ summary: "Upload news featured image" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 201, description: "News image uploaded successfully" })
  async uploadNewsImage(file: Express.Multer.File) {
    return this.uploadService.uploadFile(file, {
      type: "news",
    })
  }

  @Delete(":publicId")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF)
  @ApiOperation({ summary: "Delete file" })
  @ApiResponse({ status: 200, description: "File deleted successfully" })
  async deleteFile(@Param("publicId") publicId: string) {
    const result = await this.uploadService.deleteFile(publicId)
    return { success: result }
  }

  @Get("signed-url/:publicId")
  @ApiOperation({ summary: "Generate signed URL for private file access" })
  @ApiResponse({ status: 200, description: "Signed URL generated" })
  async getSignedUrl(@Param("publicId") publicId: string, @Query("transformation") transformation?: string) {
    const transformationObj = transformation ? JSON.parse(transformation) : undefined
    const url = await this.uploadService.generateSignedUrl(publicId, transformationObj)
    return { url }
  }
}
