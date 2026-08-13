import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Article, ArticleDocument, ArticleStatus } from './schemas/article.schema'
import { Volume, VolumeDocument } from '../volumes/schemas/volume.schema'

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
import { CreateArticleDto } from './dto/create-article.dto'
import { UpdateArticleDto } from './dto/update-article.dto'
import { UploadService } from '../upload/upload.service'
import { EmailService } from '../email/email.service'
import { UsersService } from '../users/users.service'
import { Express } from 'express'

@Injectable()
export class ArticlesService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
    @InjectModel(Volume.name) private volumeModel: Model<VolumeDocument>,
    private uploadService: UploadService,
    private emailService: EmailService,
    private usersService: UsersService
  ) {}

  async create(
    createArticleDto: CreateArticleDto,
    authorId: string,
    files: { manuscript?: Express.Multer.File[]; supplementary?: Express.Multer.File[] },
    userRole?: string
  ): Promise<Article> {
    // Upload manuscript file
    const manuscriptUpload = await this.uploadService.uploadManuscript(files.manuscript[0])
    
    // Upload supplementary files if provided
    let supplementaryFiles = []
    if (files.supplementary?.length > 0) {
      supplementaryFiles = await Promise.all(
        files.supplementary.map(file => this.uploadService.uploadSupplementary(file))
      )
    }

    // Determine article status based on user role
    let articleStatus = ArticleStatus.SUBMITTED
    let publishDate: Date | undefined = undefined
    let featured = false
    
    // If created by admin, automatically publish and feature
    if (userRole === 'admin') {
      articleStatus = ArticleStatus.PUBLISHED
      publishDate = new Date()
    }

    // Convert volume string to ObjectId if provided
    const volumeId = createArticleDto.volume 
      ? new Types.ObjectId(createArticleDto.volume) 
      : undefined

    let articleNumber: string | undefined
    if (userRole === 'admin') {
      if (!volumeId) {
        throw new BadRequestException('A volume is required for an admin publication upload')
      }
      const volume = await this.volumeModel.findById(volumeId)
      if (!volume) {
        throw new NotFoundException('Selected volume not found')
      }
      const numberedArticles = await this.articleModel
        .find({ volume: volumeId, articleNumber: { $exists: true, $ne: '' } })
        .select('articleNumber')
        .lean()
      const nextNumber = numberedArticles.reduce(
        (highest, item: any) => Math.max(highest, Number.parseInt(item.articleNumber, 10) || 0),
        0,
      ) + 1
      articleNumber = String(nextNumber).padStart(3, '0')
    }

    const article = new this.articleModel({
      ...createArticleDto,
      volume: volumeId, // Ensure volume is stored as ObjectId
      authors: createArticleDto.authors, // Store full author objects instead of just IDs
      correspondingAuthor: authorId, // Keep the corresponding author as user ID
      manuscriptFile: manuscriptUpload,
      supplementaryFiles,
      status: articleStatus,
      articleNumber,
      submissionDate: new Date(),
      featured,
      ...(publishDate && { publishDate }),
    })

    const savedArticle = await article.save()

    if (volumeId) {
      await this.volumeModel.findByIdAndUpdate(volumeId, {
        $addToSet: { articles: savedArticle._id },
      })
    }
    
    // Send confirmation email to author
    try {
      await this.emailService.sendSubmissionConfirmation(
        createArticleDto.correspondingAuthorEmail,
        `${savedArticle.authors[0]?.firstName || ''} ${savedArticle.authors[0]?.lastName || ''}`.trim(),
        savedArticle.title,
        savedArticle._id.toString(),
      )
    } catch {
      console.warn(`Article ${savedArticle._id} was saved, but its confirmation email could not be sent`)
    }
    
    return savedArticle
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters: { status?: string; category?: string; search?: string } = {}
  ) {
    const skip = (page - 1) * limit
    const query: any = {}

    if (filters.status) {
      query.status = filters.status
    }
    if (filters.category) {
      query.categories = filters.category
    }
    if (filters.search) {
      const escaped = escapeRegex(filters.search)
      query.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { abstract: { $regex: escaped, $options: 'i' } },
        { keywords: { $in: [new RegExp(escaped, 'i')] } },
      ]
    }

    const [articles, total] = await Promise.all([
      this.articleModel
        .find(query)
        .populate('assignedReviewers', 'firstName lastName email')
        .sort({ submissionDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.articleModel.countDocuments(query),
    ])

    return {
      articles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findPublished(
    page: number = 1,
    limit: number = 10,
    filters: {
      category?: string
      volume?: string
      sort?: string
      featured?: boolean
      search?: string
    } = {}
  ) {
    const skip = (page - 1) * limit
    const query: any = { status: ArticleStatus.PUBLISHED }

    if (filters.category) {
      query.categories = filters.category
    }
    if (filters.volume && Types.ObjectId.isValid(filters.volume)) {
      query.volume = new Types.ObjectId(filters.volume)
    }
    if (filters.featured === true) {
      query.featured = true
    }
    if (filters.search) {
      const escaped = escapeRegex(filters.search)
      query.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { abstract: { $regex: escaped, $options: 'i' } },
        { keywords: { $in: [new RegExp(escaped, 'i')] } },
        { 'authors.firstName': { $regex: escaped, $options: 'i' } },
        { 'authors.lastName': { $regex: escaped, $options: 'i' } },
      ]
    }

    const sortOptions: Record<string, Record<string, 1 | -1>> = {
      'date-asc': { publishDate: 1 },
      'date-desc': { publishDate: -1 },
      'title-asc': { title: 1 },
      'title-desc': { title: -1 },
      'views-desc': { viewCount: -1, publishDate: -1 },
    }
    const sort = sortOptions[filters.sort || 'date-desc'] || sortOptions['date-desc']

    const [articles, total] = await Promise.all([
      this.articleModel
        .find(query)
        .populate('volume', 'volume year title')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.articleModel.countDocuments(query),
    ])

    return {
      articles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findFeatured(): Promise<Article[]> {
    return this.articleModel
      .find({ status: ArticleStatus.PUBLISHED, featured: true })
      .populate('volume', 'volume year title')
      .sort({ publishDate: -1 })
      .limit(6)
      .exec()
  }

  async findRecent(limit: number = 5): Promise<Article[]> {
    return this.articleModel
      .find({ status: ArticleStatus.PUBLISHED })
      .populate('volume', 'volume year title')
      .sort({ publishDate: -1 })
      .limit(limit)
      .exec()
  }

  async findByAuthor(authorId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit
    const query = { correspondingAuthor: new Types.ObjectId(authorId) }

    const [articles, total] = await Promise.all([
      this.articleModel
        .find(query)
        .populate('volume', 'volume year title')
        .sort({ submissionDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.articleModel.countDocuments(query),
    ])

    return {
      articles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }


  async findByVolumeAndArticleNumber(volumeNumber: number, articleNumber: string): Promise<Article> {
    // First, find the volume by its volume number
    const volume = await this.volumeModel.findOne({ volume: volumeNumber }).exec()
    
    if (!volume) {
      throw new NotFoundException(`Volume ${volumeNumber} not found`)
    }
    
    // Now find the article by article number AND volume ID
    const article = await this.articleModel
      .findOne({
        articleNumber: articleNumber,
        volume: volume._id
      })
      .populate('volume', 'volume title year')
      .exec()

    if (!article) {
      throw new NotFoundException(`Article ${articleNumber} not found in volume ${volumeNumber}`)
    }

    return article
  }

  async findByVolume(volumeNumber: number): Promise<Article[]> {
    return this.articleModel
      .find({
        status: ArticleStatus.PUBLISHED
      })
      .populate('volume', 'volume title year')
      .exec()
      .then(articles => articles.filter(article => 
        article.volume && typeof article.volume === 'object' && 'volume' in article.volume && (article.volume as any).volume === volumeNumber
      ))
  }

  async findOne(id: string): Promise<Article> {
    const article = await this.articleModel
      .findById(id)
      .populate('assignedReviewers', 'firstName lastName email')
      .populate('volume', 'volume year title')
      .exec()

    if (!article) {
      throw new NotFoundException('Article not found')
    }

    return article
  }

  async update(id: string, updateArticleDto: UpdateArticleDto, userId: string, userRole?: string): Promise<Article> {
    const article = await this.articleModel.findById(id)
    if (!article) {
      throw new NotFoundException('Article not found')
    }

    // Only admin, editor-in-chief, editorial board, or associate editor can update articles
    const allowedRoles = ['admin', 'editor_in_chief', 'editorial_board', 'associate_editor']
    if (userRole && !allowedRoles.includes(userRole)) {
      throw new BadRequestException('You do not have permission to update this article')
    }

    // Convert volume string to ObjectId if provided in update
    const updateData = { ...updateArticleDto }
    if (updateData.volume) {
      updateData.volume = new Types.ObjectId(updateData.volume) as any
    }

    const updatedArticle = await this.articleModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec()

    if (!updatedArticle) {
      throw new NotFoundException('Article not found after update')
    }

    return updatedArticle
  }

  async updateArticleNumber(id: string, articleNumber: string, userId: string): Promise<Article> {
    const article = await this.articleModel.findById(id)
    if (!article) {
      throw new NotFoundException('Article not found')
    }

    // Check if article number is already taken in the same volume
    const existingArticle = await this.articleModel.findOne({
      articleNumber: articleNumber,
      volume: article.volume,
      _id: { $ne: id }
    })

    if (existingArticle) {
      throw new BadRequestException(`Article number ${articleNumber} is already taken in this volume`)
    }

    // Validate article number format (should be 3 digits)
    if (!/^\d{3}$/.test(articleNumber)) {
      throw new BadRequestException('Article number must be a 3-digit number (e.g., 001, 015, 042)')
    }

    const updatedArticle = await this.articleModel
      .findByIdAndUpdate(
        id, 
        { articleNumber: articleNumber }, 
        { new: true }
      )
      .populate('volume', 'volume title year')
      .exec()

    return updatedArticle
  }

  async updateStatus(
    id: string,
    status: string,
    editorId: string,
    reviewerComments?: string
  ): Promise<Article> {
    const article = await this.articleModel.findById(id)
    if (!article) {
      throw new NotFoundException('Article not found')
    }

    const updateData: any = { status }
    
    if (status === ArticleStatus.PUBLISHED) {
      updateData.publishDate = new Date()
    }
    
    if (reviewerComments) {
      updateData.reviewerComments = reviewerComments
    }

    const updatedArticle = await this.articleModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec()

    // Send status update email to author
    const author = article.authors[0]
    if (author?.email) {
      await this.emailService.sendStatusUpdate(
        author.email,
        `${author.firstName} ${author.lastName}`,
        article.title,
        status,
        article._id.toString()
      )
    }

    return updatedArticle
  }

  async assignReviewer(id: string, reviewerId: string, editorId: string): Promise<Article> {
    const article = await this.articleModel.findById(id)
    if (!article) {
      throw new NotFoundException('Article not found')
    }

    const updatedArticle = await this.articleModel
      .findByIdAndUpdate(
        id,
        { 
          $addToSet: { assignedReviewers: reviewerId },
          status: ArticleStatus.UNDER_REVIEW 
        },
        { new: true }
      )
      .populate('assignedReviewers', 'firstName lastName email')
      .exec()

    // Send review assignment email
    const reviewer = await this.usersService.findOne(reviewerId)
    if (reviewer?.email) {
      await this.emailService.sendReviewAssignment(
        reviewer.email,
        `${reviewer.firstName} ${reviewer.lastName}`,
        article.title,
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        article._id.toString()
      )
    }

    return updatedArticle
  }

  async submitReview(
    id: string,
    reviewerId: string,
    reviewData: { rating: number; comments: string; recommendation: string }
  ): Promise<Article> {
    const article = await this.articleModel.findById(id)
    if (!article) {
      throw new NotFoundException('Article not found')
    }

    if (!article.assignedReviewers.includes(new Types.ObjectId(reviewerId))) {
      throw new ForbiddenException('You are not assigned to review this article')
    }

    const review = {
      reviewer: reviewerId,
      rating: reviewData.rating,
      comments: reviewData.comments,
      recommendation: reviewData.recommendation,
      submittedDate: new Date(),
    }

    const updatedArticle = await this.articleModel
      .findByIdAndUpdate(
        id,
        { $push: { reviews: review } },
        { new: true }
      )
      .populate('assignedReviewers', 'firstName lastName email')
      .exec()

    // Notify editor about completed review
    // Find the editor who assigned the review (first author as fallback)
    const editor = await this.usersService.findOne(article.authors[0].toString())
    if (editor?.email) {
      await this.emailService.sendReviewCompleted(
        editor.email,
        `${editor.firstName} ${editor.lastName}`,
        article.title,
        article._id.toString()
      )
    }

    return updatedArticle
  }

  async incrementViews(id: string): Promise<Article> {
    return this.articleModel.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    ).exec()
  }

  async incrementDownloads(id: string): Promise<Article> {
    return this.articleModel.findByIdAndUpdate(
      id,
      { $inc: { downloads: 1 } },
      { new: true }
    ).exec()
  }

  async getStatistics() {
    const [
      totalArticles,
      publishedArticles,
      underReviewArticles,
      rejectedArticles,
      recentSubmissions,
    ] = await Promise.all([
      this.articleModel.countDocuments(),
      this.articleModel.countDocuments({ status: ArticleStatus.PUBLISHED }),
      this.articleModel.countDocuments({ status: ArticleStatus.UNDER_REVIEW }),
      this.articleModel.countDocuments({ status: ArticleStatus.REJECTED }),
      this.articleModel.countDocuments({
        submissionDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
    ])

    return {
      totalArticles,
      publishedArticles,
      underReviewArticles,
      rejectedArticles,
      recentSubmissions,
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    const article = await this.articleModel.findById(id)
    if (!article) {
      throw new NotFoundException('Article not found')
    }

    // Delete associated files
    if (article.manuscriptFile) {
      await this.uploadService.deleteFile(article.manuscriptFile.publicId)
    }
    
    if (article.supplementaryFiles?.length > 0) {
      await Promise.all(
        article.supplementaryFiles.map(file => 
          this.uploadService.deleteFile(file.publicId)
        )
      )
    }

    await this.articleModel.findByIdAndDelete(id)
  }

  async findAvailableForVolume(
    volumeId?: string,
    filters: { search?: string; category?: string; status?: string } = {}
  ) {
    const query: any = {}
    
    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status
    }

    if (filters.category && filters.category !== 'all') {
      query.categories = filters.category
    }

    if (filters.search) {
      const escaped = escapeRegex(filters.search)
      const searchRegex = { $regex: escaped, $options: 'i' }
      query.$or = [
        { title: searchRegex },
        { abstract: searchRegex },
        { keywords: { $in: [new RegExp(escaped, 'i')] } }
      ]
    }

    const articles = await this.articleModel
      .find(query)
      .sort({ submissionDate: -1 })
      .limit(50)
      .exec()

    return { articles, total: articles.length }
  }

  async getCategories(): Promise<string[]> {
    // Return predefined categories for the journal
    return [
      "Review Articles",
      "Clinical Research", 
      "Public Health",
      "Case Studies",
      "Editorials",
      "Basic Science",
      "Medical Education",
      "Health Policy",
      "Epidemiology",
      "Pharmacology"
    ]
  }
}
