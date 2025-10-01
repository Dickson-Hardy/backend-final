import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';

export interface GitHubUploadResult {
  downloadUrl: string;
  fileName: string;
  size: number;
  format: string;
  originalName: string;
  mimeType: string;
  releaseTag: string;
  assetId: number;
}

@Injectable()
export class GitHubStorageService {
  private readonly logger = new Logger(GitHubStorageService.name);
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private enabled: boolean = false;

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('GITHUB_TOKEN');
    this.owner = this.configService.get<string>('GITHUB_OWNER');
    this.repo = this.configService.get<string>('GITHUB_REPO');

    if (!token || !this.owner || !this.repo) {
      this.logger.warn(
        'GitHub storage not configured. Set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO in .env',
      );
      return;
    }

    this.octokit = new Octokit({ auth: token });
    this.enabled = true;
    this.logger.log('GitHub storage configured successfully');
  }

  /**
   * Upload a file to GitHub Releases
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<GitHubUploadResult> {
    if (!this.enabled) {
      throw new Error(
        'GitHub storage not configured. Check environment variables.',
      );
    }

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

      // Create or get release tag
      const releaseTag = await this.getOrCreateRelease(folder);

      // Upload file as release asset
      const uploadResponse = await this.octokit.repos.uploadReleaseAsset({
        owner: this.owner,
        repo: this.repo,
        release_id: releaseTag.id,
        name: fileName,
        data: file.buffer as any,
        headers: {
          'content-type': file.mimetype,
          'content-length': file.size,
        },
      });

      const downloadUrl = uploadResponse.data.browser_download_url;

      this.logger.log(`File uploaded successfully: ${fileName}`);

      return {
        downloadUrl,
        fileName,
        size: file.size,
        format: fileExtension || 'unknown',
        originalName: file.originalname,
        mimeType: file.mimetype,
        releaseTag: releaseTag.tag_name,
        assetId: uploadResponse.data.id,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload file: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to upload file to GitHub: ${error.message}`);
    }
  }

  /**
   * Upload multiple files to GitHub Releases
   */
  async uploadFiles(
    files: Express.Multer.File[],
    folder: string = 'uploads',
  ): Promise<GitHubUploadResult[]> {
    return Promise.all(files.map((file) => this.uploadFile(file, folder)));
  }

  /**
   * Delete a file from GitHub Releases
   */
  async deleteFile(assetId: number): Promise<void> {
    if (!this.enabled) {
      throw new Error('GitHub storage not configured.');
    }

    try {
      await this.octokit.repos.deleteReleaseAsset({
        owner: this.owner,
        repo: this.repo,
        asset_id: assetId,
      });

      this.logger.log(`File deleted successfully: Asset ID ${assetId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to delete file from GitHub: ${error.message}`);
    }
  }

  /**
   * Delete multiple files from GitHub Releases
   */
  async deleteFiles(assetIds: number[]): Promise<void> {
    await Promise.all(assetIds.map((id) => this.deleteFile(id)));
  }

  /**
   * Get or create a release for organizing files
   */
  private async getOrCreateRelease(folder: string): Promise<any> {
    const tagName = `storage-${folder.replace(/\//g, '-')}`;

    try {
      // Try to get existing release
      const release = await this.octokit.repos.getReleaseByTag({
        owner: this.owner,
        repo: this.repo,
        tag: tagName,
      });

      return release.data;
    } catch (error) {
      // Release doesn't exist, create it
      this.logger.log(`Creating new release: ${tagName}`);
      
      try {
        const newRelease = await this.octokit.repos.createRelease({
          owner: this.owner,
          repo: this.repo,
          tag_name: tagName,
          name: `Storage: ${folder}`,
          body: `Automated storage release for ${folder} files`,
          draft: false,
          prerelease: false,
        });

        return newRelease.data;
      } catch (createError) {
        this.logger.error(
          `Failed to create release. This usually means:\n` +
          `1. The repository '${this.owner}/${this.repo}' doesn't exist\n` +
          `2. The GitHub token doesn't have 'repo' or 'public_repo' scope\n` +
          `3. The repository is private and token lacks access\n` +
          `Error: ${createError.message}`
        );
        throw createError;
      }
    }
  }

  /**
   * List all files in a folder (release)
   */
  async listFiles(folder: string = 'uploads'): Promise<GitHubUploadResult[]> {
    if (!this.enabled) {
      throw new Error('GitHub storage not configured.');
    }

    try {
      const tagName = `storage-${folder.replace(/\//g, '-')}`;
      const release = await this.octokit.repos.getReleaseByTag({
        owner: this.owner,
        repo: this.repo,
        tag: tagName,
      });

      return release.data.assets.map((asset) => ({
        downloadUrl: asset.browser_download_url,
        fileName: asset.name,
        size: asset.size,
        format: asset.name.split('.').pop() || 'unknown',
        originalName: asset.name,
        mimeType: asset.content_type || 'application/octet-stream',
        releaseTag: tagName,
        assetId: asset.id,
      }));
    } catch (error) {
      if (error.status === 404) {
        return []; // No release/files yet
      }
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(assetId: number): Promise<{
    size: number;
    contentType: string;
    downloadUrl: string;
    name: string;
  }> {
    if (!this.enabled) {
      throw new Error('GitHub storage not configured.');
    }

    try {
      const asset = await this.octokit.repos.getReleaseAsset({
        owner: this.owner,
        repo: this.repo,
        asset_id: assetId,
      });

      return {
        size: asset.data.size,
        contentType: asset.data.content_type || 'application/octet-stream',
        downloadUrl: asset.data.browser_download_url,
        name: asset.data.name,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get file metadata: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * Check if GitHub storage is properly configured
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get repository info
   */
  getRepoInfo(): { owner: string; repo: string } {
    return {
      owner: this.owner,
      repo: this.repo,
    };
  }
}
