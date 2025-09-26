import { Injectable, BadRequestException, Logger } from "@nestjs/common"
import { CloudinaryService } from "./services/cloudinary.service"
import type { UploadResult, FileUploadOptions } from "./interfaces/upload.interface"
import type { Express } from "express"

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name)

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadFile(file: Express.Multer.File, options: FileUploadOptions): Promise<UploadResult> {
    try {
      this.validateFile(file, options.type)

      const result = await this.cloudinaryService.uploadFile(file, {
        folder: this.getFolderPath(options.type),
        resourceType: this.getResourceType(options.type),
        allowedFormats: this.getAllowedFormats(options.type),
        transformation: this.getTransformation(options.type),
      })

      this.logger.log(`File uploaded successfully: ${result.publicId}`)

      return {
        publicId: result.publicId,
        url: result.url,
        secureUrl: result.secureUrl,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        originalName: file.originalname,
        mimeType: file.mimetype,
      }
    } catch (error) {
      this.logger.error(`File upload failed: ${error.message}`)
      throw new BadRequestException(`Upload failed: ${error.message}`)
    }
  }

  async uploadMultipleFiles(files: Express.Multer.File[], options: FileUploadOptions): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options))
    return Promise.all(uploadPromises)
  }

  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await this.cloudinaryService.deleteFile(publicId)
      this.logger.log(`File deleted successfully: ${publicId}`)
      return result.result === "ok"
    } catch (error) {
      this.logger.error(`File deletion failed: ${error.message}`)
      return false
    }
  }

  async generateSignedUrl(publicId: string, transformation?: any): Promise<string> {
    return this.cloudinaryService.generateSignedUrl(publicId, transformation)
  }

  // Convenience methods for specific file types
  async uploadManuscript(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadFile(file, { type: 'manuscript' })
  }

  async uploadNews(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadFile(file, { type: 'news' })
  }

  async uploadProfile(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadFile(file, { type: 'profile' })
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadFile(file, { type: 'image' })
  }

  async uploadSupplementary(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadFile(file, { type: 'supplementary' })
  }

  private validateFile(file: Express.Multer.File, type: string): void {
    const maxSizes = {
      manuscript: 50 * 1024 * 1024, // 50MB
      image: 10 * 1024 * 1024, // 10MB
      supplementary: 100 * 1024 * 1024, // 100MB
      profile: 5 * 1024 * 1024, // 5MB
    }

    const allowedTypes = {
      manuscript: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      supplementary: [
        "application/pdf",
        "application/zip",
        "application/x-zip-compressed",
        "text/csv",
        "application/vnd.ms-excel",
      ],
      profile: ["image/jpeg", "image/png", "image/webp"],
    }

    const maxSize = maxSizes[type] || 10 * 1024 * 1024
    const allowed = allowedTypes[type] || allowedTypes.image

    if (file.size > maxSize) {
      throw new BadRequestException(`File size exceeds limit of ${maxSize / (1024 * 1024)}MB`)
    }

    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} not allowed for ${type}`)
    }
  }

  private getFolderPath(type: string): string {
    const folders = {
      manuscript: "amhsj/manuscripts",
      image: "amhsj/images",
      supplementary: "amhsj/supplementary",
      profile: "amhsj/profiles",
      cover: "amhsj/covers",
      news: "amhsj/news",
    }

    return folders[type] || "amhsj/misc"
  }

  private getResourceType(type: string): "image" | "video" | "raw" | "auto" {
    if (type === "image" || type === "profile" || type === "cover" || type === "news") {
      return "image"
    }
    return "raw"
  }

  private getAllowedFormats(type: string): string[] {
    const formats = {
      manuscript: ["pdf", "doc", "docx"],
      image: ["jpg", "jpeg", "png", "webp", "gif"],
      supplementary: ["pdf", "zip", "csv", "xls", "xlsx"],
      profile: ["jpg", "jpeg", "png", "webp"],
      cover: ["jpg", "jpeg", "png", "webp"],
      news: ["jpg", "jpeg", "png", "webp"],
    }

    return formats[type] || formats.image
  }

  private getTransformation(type: string): any {
    const transformations = {
      profile: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
      cover: [
        { width: 800, height: 1200, crop: "fill" },
        { quality: "auto", fetch_format: "auto" },
      ],
      news: [
        { width: 1200, height: 630, crop: "fill" },
        { quality: "auto", fetch_format: "auto" },
      ],
      image: [
        { width: 1200, crop: "limit" },
        { quality: "auto", fetch_format: "auto" },
      ],
    }

    return transformations[type]
  }
}
