# Switching Back to Cloudinary Storage

If you want to continue using Cloudinary (since you already have files there), follow these steps:

## Current Situation
- Your database has articles with Cloudinary URLs
- Backend is configured for GitHub storage
- Trying to edit articles fails because of storage mismatch

## Solution: Re-enable Cloudinary

### 1. Install Cloudinary SDK

```bash
cd backend
pnpm add cloudinary
```

### 2. Add Cloudinary Credentials to .env

Add these lines to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Get your credentials from: https://console.cloudinary.com/

### 3. Create Cloudinary Storage Service

Create `backend/src/upload/services/cloudinary-storage.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

@Injectable()
export class CloudinaryStorageService {
  private readonly logger = new Logger(CloudinaryStorageService.name);
  private enabled: boolean = false;

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.enabled = true;
      this.logger.log('Cloudinary storage configured successfully');
    } else {
      this.logger.warn('Cloudinary not configured');
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    options?: any
  ): Promise<CloudinaryUploadResult> {
    if (!this.enabled) {
      throw new Error('Cloudinary not configured');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          ...options,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              publicId: result.public_id,
              url: result.url,
              secureUrl: result.secure_url,
              format: result.format,
              bytes: result.bytes,
              width: result.width,
              height: result.height,
            });
          }
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    if (!this.enabled) {
      throw new Error('Cloudinary not configured');
    }

    await cloudinary.uploader.destroy(publicId);
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
```

### 4. Update Upload Module

Edit `backend/src/upload/upload.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { GitHubStorageService } from './services/github-storage.service';
import { CloudinaryStorageService } from './services/cloudinary-storage.service';

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [UploadService, GitHubStorageService, CloudinaryStorageService],
  exports: [UploadService],
})
export class UploadModule {}
```

### 5. Update Upload Service to Use Cloudinary

Edit the UploadService constructor and methods to use Cloudinary instead of GitHub.

## Temporary Fix: Allow Editing Without Re-uploading

If you just want to edit article metadata without changing files, the fixes I already applied should work:

1. ✅ Old Cloudinary files won't be deleted (skipped gracefully)
2. ✅ You can update article metadata without uploading new files

Just **don't upload new files** when editing until you decide which storage to use.

## Recommendation

**For your current situation**: Since you already have Cloudinary files:

1. Create the GitHub repository (it's free and easy)
2. Keep existing articles with Cloudinary URLs as-is
3. New uploads will go to GitHub
4. Both will work side-by-side

The backend is now fixed to handle both gracefully!
