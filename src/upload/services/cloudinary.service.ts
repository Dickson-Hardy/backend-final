import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { v2 as cloudinary } from "cloudinary"
import type { Express } from "express"
import type { CloudinaryUploadOptions, CloudinaryUploadResult } from "../interfaces/upload.interface"
import { extname } from "path"

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name)

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>("CLOUDINARY_CLOUD_NAME")
    const apiKey = this.configService.get<string>("CLOUDINARY_API_KEY")
    const apiSecret = this.configService.get<string>("CLOUDINARY_API_SECRET")

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.warn("Cloudinary credentials not configured - CloudinaryService will be disabled")
      return
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    })

    this.logger.log("Cloudinary configured successfully")
  }

  async uploadFile(file: Express.Multer.File, options: CloudinaryUploadOptions): Promise<CloudinaryUploadResult> {
    const cloudName = this.configService.get<string>("CLOUDINARY_CLOUD_NAME")
    const apiKey = this.configService.get<string>("CLOUDINARY_API_KEY")
    const apiSecret = this.configService.get<string>("CLOUDINARY_API_SECRET")

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.error("Cloudinary credentials not configured - cannot upload file")
      throw new Error("Cloudinary service is not configured")
    }

    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: options.folder,
        resource_type: options.resourceType,
        allowed_formats: options.allowedFormats,
        transformation: options.transformation,
        use_filename: true,
        unique_filename: true,
      }

      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          this.logger.error(`Cloudinary upload error: ${error.message}`)
          reject(error)
        } else {
          const normalizedFormat = this.normalizeFormat(result?.format, file)
          const version = result?.version

          const urlWithFormat = normalizedFormat
            ? cloudinary.url(result.public_id, {
                resource_type: result.resource_type,
                secure: false,
                format: normalizedFormat,
                version,
              })
            : result.url

          const secureUrlWithFormat = normalizedFormat
            ? cloudinary.url(result.public_id, {
                resource_type: result.resource_type,
                secure: true,
                format: normalizedFormat,
                version,
              })
            : result.secure_url

          const downloadUrl = secureUrlWithFormat
            ? `${secureUrlWithFormat}?attachment=${encodeURIComponent(
                file.originalname || `download.${normalizedFormat ?? "file"}`
              )}`
            : undefined

          resolve({
            publicId: result.public_id,
            url: urlWithFormat,
            secureUrl: secureUrlWithFormat,
            format: normalizedFormat ?? result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            resourceType: result.resource_type,
            createdAt: result.created_at,
            version,
            downloadUrl,
          })
        }
      })

      uploadStream.end(file.buffer)
    })
  }

  private normalizeFormat(resultFormat: string | undefined, file: Express.Multer.File): string | undefined {
    const directFormat = resultFormat?.toLowerCase()
    if (directFormat) {
      return directFormat
    }

    const filenameFormat = this.getFormatFromFilename(file.originalname)
    if (filenameFormat) {
      return filenameFormat
    }

    const mimeFormat = this.getFormatFromMime(file.mimetype)
    if (mimeFormat) {
      return mimeFormat
    }

    return undefined
  }

  private getFormatFromFilename(filename?: string): string | undefined {
    if (!filename) {
      return undefined
    }

    const extension = extname(filename).toLowerCase()
    if (!extension) {
      return undefined
    }

    return extension.replace(".", "") || undefined
  }

  private getFormatFromMime(mimetype?: string): string | undefined {
    if (!mimetype) {
      return undefined
    }

    const parts = mimetype.split("/")
    if (parts.length !== 2) {
      return undefined
    }

    const subtype = parts[1]?.toLowerCase()

    if (subtype === "vnd.openxmlformats-officedocument.wordprocessingml.document") {
      return "docx"
    }

    if (subtype === "msword") {
      return "doc"
    }

    if (subtype === "vnd.ms-excel") {
      return "xls"
    }

    if (subtype === "vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      return "xlsx"
    }

    if (subtype === "plain") {
      return "txt"
    }

    if (subtype.includes("+xml")) {
      return "xml"
    }

    return subtype || undefined
  }

  async deleteFile(publicId: string): Promise<any> {
    const cloudName = this.configService.get<string>("CLOUDINARY_CLOUD_NAME")
    const apiKey = this.configService.get<string>("CLOUDINARY_API_KEY")
    const apiSecret = this.configService.get<string>("CLOUDINARY_API_SECRET")

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.error("Cloudinary credentials not configured - cannot delete file")
      throw new Error("Cloudinary service is not configured")
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId)
      this.logger.log(`File deleted from Cloudinary: ${publicId}`)
      return result
    } catch (error) {
      this.logger.error(`Cloudinary deletion error: ${error.message}`)
      throw error
    }
  }

  async generateSignedUrl(publicId: string, transformation?: any): Promise<string> {
    const cloudName = this.configService.get<string>("CLOUDINARY_CLOUD_NAME")
    const apiKey = this.configService.get<string>("CLOUDINARY_API_KEY")
    const apiSecret = this.configService.get<string>("CLOUDINARY_API_SECRET")

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.error("Cloudinary credentials not configured - cannot generate signed URL")
      throw new Error("Cloudinary service is not configured")
    }

    try {
      const options = {
        sign_url: true,
        type: "authenticated",
        ...(transformation && { transformation }),
      }

      return cloudinary.url(publicId, options)
    } catch (error) {
      this.logger.error(`Cloudinary signed URL error: ${error.message}`)
      throw error
    }
  }

  async getFileInfo(publicId: string): Promise<any> {
    const cloudName = this.configService.get<string>("CLOUDINARY_CLOUD_NAME")
    const apiKey = this.configService.get<string>("CLOUDINARY_API_KEY")
    const apiSecret = this.configService.get<string>("CLOUDINARY_API_SECRET")

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.error("Cloudinary credentials not configured - cannot get file info")
      throw new Error("Cloudinary service is not configured")
    }

    try {
      return await cloudinary.api.resource(publicId)
    } catch (error) {
      this.logger.error(`Cloudinary file info error: ${error.message}`)
      throw error
    }
  }

  async listFiles(folder: string, maxResults = 100): Promise<any> {
    const cloudName = this.configService.get<string>("CLOUDINARY_CLOUD_NAME")
    const apiKey = this.configService.get<string>("CLOUDINARY_API_KEY")
    const apiSecret = this.configService.get<string>("CLOUDINARY_API_SECRET")

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.error("Cloudinary credentials not configured - cannot list files")
      throw new Error("Cloudinary service is not configured")
    }

    try {
      return await cloudinary.api.resources({
        type: "upload",
        prefix: folder,
        max_results: maxResults,
      })
    } catch (error) {
      this.logger.error(`Cloudinary list files error: ${error.message}`)
      throw error
    }
  }
}
