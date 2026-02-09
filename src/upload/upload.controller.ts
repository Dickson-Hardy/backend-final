import { Controller, Post, UploadedFile, UploadedFiles, UseInterceptors, BadRequestException } from "@nestjs/common"
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express"
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from "@nestjs/swagger"
import { UploadService } from "./upload.service"

@ApiTags("upload")
@Controller("upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload a single file" })
  @ApiResponse({ status: 201, description: "File uploaded successfully" })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file provided")
    }
    return this.uploadService.uploadFile(file)
  }

  @Post("multiple")
  @UseInterceptors(FilesInterceptor("files"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload multiple files" })
  @ApiResponse({ status: 201, description: "Files uploaded successfully" })
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files provided")
    }
    return this.uploadService.uploadMultiple(files)
  }

  @Post("extract-metadata")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Extract metadata from document" })
  @ApiResponse({ status: 200, description: "Metadata extracted successfully" })
  async extractMetadata(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file provided")
    }
    return this.uploadService.extractMetadata(file)
  }
}
