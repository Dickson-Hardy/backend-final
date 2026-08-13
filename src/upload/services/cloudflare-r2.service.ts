import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

export interface R2UploadResult {
  key: string;
  url: string;
  size: number;
  format: string;
  originalName: string;
  mimeType: string;
}

@Injectable()
export class CloudflareR2StorageService {
  private readonly logger = new Logger(CloudflareR2StorageService.name);
  private s3: S3Client;
  private bucket: string;
  private publicUrl: string;
  private enabled: boolean = false;

  constructor(private configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucket = this.configService.get<string>('R2_BUCKET_NAME') || '';
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL') || '';

    if (!accountId || !accessKeyId || !secretAccessKey || !this.bucket) {
      this.logger.warn(
        'Cloudflare R2 not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in .env',
      );
      return;
    }

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.enabled = true;
    this.logger.log('Cloudflare R2 storage configured successfully');
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<R2UploadResult> {
    if (!this.enabled) {
      throw new Error(
        'Cloudflare R2 not configured. Check environment variables.',
      );
    }

    try {
      const timestamp = Date.now();
      const randomString = randomBytes(16).toString('hex');
      const fileExtension = file.originalname.split('.').pop() || 'bin';
      const key = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ContentLength: file.size,
        }),
      );

      const url = this.publicUrl
        ? `${this.publicUrl}/${key}`
        : `https://${this.bucket}.${this.configService.get<string>('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com/${key}`;

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        key,
        url,
        size: file.size,
        format: fileExtension || 'unknown',
        originalName: file.originalname,
        mimeType: file.mimetype,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload file: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to upload file to R2: ${error.message}`);
    }
  }

  async uploadFiles(
    files: Express.Multer.File[],
    folder: string = 'uploads',
  ): Promise<R2UploadResult[]> {
    return Promise.all(files.map((file) => this.uploadFile(file, folder)));
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.enabled) {
      throw new Error('Cloudflare R2 not configured.');
    }

    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to delete file from R2: ${error.message}`);
    }
  }

  async deleteFiles(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.deleteFile(key)));
  }

  async listFiles(folder: string = 'uploads'): Promise<R2UploadResult[]> {
    if (!this.enabled) {
      throw new Error('Cloudflare R2 not configured.');
    }

    try {
      const response = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: folder + '/',
        }),
      );

      return (response.Contents || []).map((item) => ({
        key: item.Key!,
        url: this.publicUrl
          ? `${this.publicUrl}/${item.Key}`
          : `https://${this.bucket}.${this.configService.get<string>('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com/${item.Key}`,
        size: item.Size || 0,
        format: item.Key!.split('.').pop() || 'unknown',
        originalName: item.Key!.split('/').pop() || '',
        mimeType: 'application/octet-stream',
      }));
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  async getFileMetadata(key: string): Promise<{
    size: number;
    contentType: string;
    url: string;
    key: string;
  }> {
    if (!this.enabled) {
      throw new Error('Cloudflare R2 not configured.');
    }

    try {
      const response = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        url: this.publicUrl
          ? `${this.publicUrl}/${key}`
          : `https://${this.bucket}.${this.configService.get<string>('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com/${key}`,
        key,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get file metadata: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
