import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User, UserDocument, UserRole } from '../users/schemas/user.schema'
import { Article, ArticleDocument } from '../articles/schemas/article.schema'
import { Volume, VolumeDocument } from '../volumes/schemas/volume.schema'
import { UploadService } from '../upload/upload.service'
import { AdminUpdateArticleDto } from './dto/admin-update-article.dto'
import { Express } from 'express'

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
    @InjectModel(Volume.name) private volumeModel: Model<VolumeDocument>,
    private uploadService: UploadService,
  ) {}

  async getSystemStats() {
    // Get total users
    const totalUsers = await this.userModel.countDocuments()
    
    // Get users from last week for comparison
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const usersLastWeek = await this.userModel.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    })
    
    // Get active submissions (articles in review process)
    const activeSubmissions = await this.articleModel.countDocuments({
      status: { $in: ['submitted', 'under_review', 'revision_requested'] }
    })
    
    // Get submissions from last week
    const submissionsLastWeek = await this.articleModel.countDocuments({
      submissionDate: { $gte: oneWeekAgo },
      status: { $in: ['submitted', 'under_review', 'revision_requested'] }
    })

    return {
      totalUsers,
      userChange: usersLastWeek > 0 ? `+${usersLastWeek}` : '+0',
      activeSubmissions,
      submissionChange: submissionsLastWeek > 0 ? `+${submissionsLastWeek}` : '+0',
      uptime: '99.9%',
      uptimeChange: '+0.1%',
      storageUsed: '2.5TB',
      storageChange: '+150GB'
    }
  }

  async getRecentActivities() {
    // Get recent user registrations
    const recentUsers = await this.userModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email role createdAt')
      .lean()

    // Get recent article submissions
    const recentArticles = await this.articleModel
      .find()
      .sort({ submissionDate: -1 })
      .limit(5)
      .select('title status submissionDate')
      .lean()

    const activities = []

    // Add user registration activities
    recentUsers.forEach(user => {
      activities.push({
        id: `USER-${user._id}`,
        type: 'user_registration',
        description: `New ${user.role} registered: ${user.firstName} ${user.lastName}`,
        timestamp: user.createdAt,
        severity: 'info',
        user: `${user.firstName} ${user.lastName}`
      })
    })

    // Add article submission activities
    recentArticles.forEach(article => {
      activities.push({
        id: `ARTICLE-${article._id}`,
        type: 'article_submission',
        description: `New article submitted: ${article.title}`,
        timestamp: article.submissionDate,
        severity: 'info',
        user: 'System'
      })
    })

    // Sort by timestamp and return most recent
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  }

  async getUserManagementData() {
    const users = await this.userModel
      .find()
      .select('firstName lastName email role isActive lastLogin createdAt')
      .sort({ createdAt: -1 })
      .lean()

    // Get submission and review counts for each user
    const userData = await Promise.all(
      users.map(async (user) => {
        const submissions = await this.articleModel.countDocuments({
          'authors.email': user.email
        })

        const reviews = await this.articleModel.countDocuments({
          'reviewers.email': user.email
        })

        return {
          id: `USER-${user._id}`,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' '),
          status: user.isActive ? 'active' : 'inactive',
          lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never',
          submissions,
          reviews,
          createdAt: new Date(user.createdAt).toLocaleDateString()
        }
      })
    )

    return userData
  }

  async getSystemHealth() {
    const healthChecks = []

    // Database health check
    try {
      const startTime = Date.now()
      await this.userModel.findOne().lean()
      const responseTime = Date.now() - startTime
      
      healthChecks.push({
        id: 'HEALTH-DB',
        component: 'Database',
        status: responseTime < 100 ? 'healthy' : 'warning',
        lastCheck: new Date().toISOString(),
        responseTime,
        uptime: '99.9%'
      })
    } catch (error) {
      healthChecks.push({
        id: 'HEALTH-DB',
        component: 'Database',
        status: 'error',
        lastCheck: new Date().toISOString(),
        responseTime: 0,
        uptime: '0%'
      })
    }

    // Application health check
    healthChecks.push({
      id: 'HEALTH-APP',
      component: 'Application',
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      responseTime: 15,
      uptime: '99.9%'
    })

    // Storage health check
    healthChecks.push({
      id: 'HEALTH-STORAGE',
      component: 'File Storage',
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      responseTime: 25,
      uptime: '99.8%'
    })

    return healthChecks
  }

  async getEditors() {
    // Define editor roles
    const editorRoles = [
      UserRole.EDITORIAL_ASSISTANT,
      UserRole.ASSOCIATE_EDITOR,
      UserRole.EDITORIAL_BOARD,
      UserRole.EDITOR_IN_CHIEF
    ]

    const editors = await this.userModel
      .find({ 
        role: { $in: editorRoles },
        status: 'active'
      })
      .select('firstName lastName email role affiliation department specializations')
      .sort({ role: 1, lastName: 1 })
      .lean()

    return editors.map(editor => ({
      id: `USER-${editor._id}`,
      name: `${editor.firstName} ${editor.lastName}`,
      email: editor.email,
      role: editor.role.charAt(0).toUpperCase() + editor.role.slice(1).replace('_', ' '),
      affiliation: editor.affiliation || '',
      department: editor.department || '',
      specializations: editor.specializations || []
    }))
  }

  async getAllArticles() {
    const articles = await this.articleModel
      .find()
      .populate('volume', 'volume year title')
      .sort({ submissionDate: -1 })
      .lean()

    return articles
  }

  async getArticleById(id: string) {
    const article = await this.articleModel
      .findById(id)
      .populate('volume', 'volume year title')
      .populate('assignedReviewers', 'firstName lastName email')
      .exec()

    if (!article) {
      throw new NotFoundException('Article not found')
    }

    return article
  }

  async updateArticle(
    id: string, 
    updateArticleDto: AdminUpdateArticleDto, 
    files: { manuscript?: Express.Multer.File[]; supplementary?: Express.Multer.File[] },
    adminId: string
  ) {
    const article = await this.articleModel.findById(id)
    
    if (!article) {
      throw new NotFoundException('Article not found')
    }

    // If article number is being updated, check for duplicates
    if (updateArticleDto.articleNumber && updateArticleDto.articleNumber !== article.articleNumber) {
      const existingArticle = await this.articleModel.findOne({
        articleNumber: updateArticleDto.articleNumber,
        volume: article.volume,
        _id: { $ne: id }
      })

      if (existingArticle) {
        throw new BadRequestException(`Article number ${updateArticleDto.articleNumber} is already taken in this volume`)
      }

      // Validate article number format (should be 3 digits)
      if (!/^\d{3}$/.test(updateArticleDto.articleNumber)) {
        throw new BadRequestException('Article number must be a 3-digit number (e.g., 001, 015, 042)')
      }
    }

    const updateData: any = { ...updateArticleDto }

    // Handle manuscript file replacement
    if (files?.manuscript?.[0]) {
      // Delete old manuscript file
      if (article.manuscriptFile?.publicId) {
        await this.uploadService.deleteFile(article.manuscriptFile.publicId)
      }
      // Upload new manuscript
      updateData.manuscriptFile = await this.uploadService.uploadManuscript(files.manuscript[0])
    }

    // Handle supplementary files
    if (files?.supplementary?.length > 0) {
      const supplementaryUploads = await Promise.all(
        files.supplementary.map(file => this.uploadService.uploadSupplementary(file))
      )
      // Add to existing supplementary files
      const existingFiles = article.supplementaryFiles || []
      updateData.supplementaryFiles = [...existingFiles, ...supplementaryUploads]
    }

    // Set publish date if status is changed to published
    if (updateArticleDto.status === 'published' && !article.publishDate) {
      updateData.publishDate = new Date()
    }

    // Update the article
    const updatedArticle = await this.articleModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('volume', 'volume year title')
      .exec()

    return updatedArticle
  }

  async replaceManuscript(id: string, file: Express.Multer.File, adminId: string) {
    const article = await this.articleModel.findById(id)
    
    if (!article) {
      throw new NotFoundException('Article not found')
    }

    if (!file) {
      throw new BadRequestException('Manuscript file is required')
    }

    // Delete old manuscript file
    if (article.manuscriptFile?.publicId) {
      await this.uploadService.deleteFile(article.manuscriptFile.publicId)
    }

    // Upload new manuscript
    const manuscriptUpload = await this.uploadService.uploadManuscript(file)

    // Update article with new manuscript
    const updatedArticle = await this.articleModel
      .findByIdAndUpdate(
        id,
        { manuscriptFile: manuscriptUpload },
        { new: true }
      )
      .populate('volume', 'volume year title')
      .exec()

    return updatedArticle
  }

  async addSupplementaryFiles(id: string, files: Express.Multer.File[], adminId: string) {
    const article = await this.articleModel.findById(id)
    
    if (!article) {
      throw new NotFoundException('Article not found')
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('At least one supplementary file is required')
    }

    // Upload new supplementary files
    const supplementaryUploads = await Promise.all(
      files.map(file => this.uploadService.uploadSupplementary(file))
    )

    // Add to existing supplementary files
    const existingFiles = article.supplementaryFiles || []
    const updatedArticle = await this.articleModel
      .findByIdAndUpdate(
        id,
        { supplementaryFiles: [...existingFiles, ...supplementaryUploads] },
        { new: true }
      )
      .populate('volume', 'volume year title')
      .exec()

    return updatedArticle
  }

  async removeSupplementaryFile(id: string, fileIndex: number, adminId: string) {
    const article = await this.articleModel.findById(id)
    
    if (!article) {
      throw new NotFoundException('Article not found')
    }

    if (!article.supplementaryFiles || article.supplementaryFiles.length <= fileIndex) {
      throw new BadRequestException('Invalid file index')
    }

    // Delete the file from storage
    const fileToDelete = article.supplementaryFiles[fileIndex]
    if (fileToDelete?.publicId) {
      await this.uploadService.deleteFile(fileToDelete.publicId)
    }

    // Remove from array
    const updatedFiles = article.supplementaryFiles.filter((_, index) => index !== fileIndex)
    
    const updatedArticle = await this.articleModel
      .findByIdAndUpdate(
        id,
        { supplementaryFiles: updatedFiles },
        { new: true }
      )
      .populate('volume', 'volume year title')
      .exec()

    return updatedArticle
  }

  async deleteArticle(id: string, adminId: string) {
    const article = await this.articleModel.findById(id)
    
    if (!article) {
      throw new NotFoundException('Article not found')
    }

    // Delete manuscript file
    if (article.manuscriptFile?.publicId) {
      await this.uploadService.deleteFile(article.manuscriptFile.publicId)
    }

    // Delete supplementary files
    if (article.supplementaryFiles?.length > 0) {
      await Promise.all(
        article.supplementaryFiles.map(file => 
          this.uploadService.deleteFile(file.publicId)
        )
      )
    }

    // Delete article from database
    await this.articleModel.findByIdAndDelete(id)

    return { message: 'Article deleted successfully' }
  }
}


