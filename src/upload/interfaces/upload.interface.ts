export interface UploadResult {
  publicId: string
  url: string
  secureUrl: string
  format: string
  bytes: number
  width?: number
  height?: number
  originalName?: string
  mimeType?: string
}

export interface FileUploadOptions {
  type: "manuscript" | "image" | "supplementary" | "profile" | "cover" | "news"
  userId?: string
  articleId?: string
  volumeId?: string
}

export interface CloudinaryUploadOptions {
  folder: string
  resourceType: "image" | "video" | "raw" | "auto"
  allowedFormats: string[]
  transformation?: any
}

export interface CloudinaryUploadResult {
  publicId: string
  url: string
  secureUrl: string
  format: string
  bytes: number
  width?: number
  height?: number
  resourceType: string
  createdAt: string
}
