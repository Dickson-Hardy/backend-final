import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Article, ArticleDocument, ArticleStatus } from './schemas/article.schema'
import { CreateArticleDto } from './dto/create-article.dto'
import { UpdateArticleDto } from './dto/update-article.dto'
import { UploadService } from '../upload/upload.service'
import { EmailService } from '../email/email.service'
import { Express } from 'express'

@Injectable()
export class ArticlesService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
    private uploadService: UploadService,
    private emailService: EmailService
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
        files.supplementary.map(file => this.uploadService.uploadManuscript(file))
      )
    }

    // Determine article status based on user role
    let articleStatus = ArticleStatus.SUBMITTED
    let publishedDate: Date | undefined = undefined
    let featured = false
    
    // If created by admin, automatically publish and feature
    if (userRole === 'admin') {
      articleStatus = ArticleStatus.PUBLISHED
      publishedDate = new Date()
      featured = true
    }

    const article = new this.articleModel({
      ...createArticleDto,
      authors: createArticleDto.authors, // Store full author objects instead of just IDs
      correspondingAuthor: authorId, // Keep the corresponding author as user ID
      manuscriptFile: manuscriptUpload,
      supplementaryFiles,
      status: articleStatus,
      submissionDate: new Date(),
      featured,
      ...(publishedDate && { publishedDate }),
    })

    const savedArticle = await article.save()
    
    // Send confirmation email to author
    await this.emailService.sendSubmissionConfirmation(authorId, savedArticle.authors[0].toString(), savedArticle.title, savedArticle._id.toString())
    
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
      query.category = filters.category
    }
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { abstract: { $regex: filters.search, $options: 'i' } },
        { keywords: { $in: [new RegExp(filters.search, 'i')] } },
      ]
    }

    const [articles, total] = await Promise.all([
      this.articleModel
        .find(query)
        .populate('authors', 'firstName lastName email')
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
    filters: { category?: string; featured?: boolean; search?: string } = {}
  ) {
    console.log('🔍 findPublished called with:', { page, limit, filters })
    console.log('🔍 ArticleStatus.PUBLISHED value:', ArticleStatus.PUBLISHED)
    
    const skip = (page - 1) * limit
    const query: any = { status: ArticleStatus.PUBLISHED }

    if (filters.category) {
      query.category = filters.category
    }
    if (filters.featured === true) {
      query.featured = true
    }
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { abstract: { $regex: filters.search, $options: 'i' } },
        { keywords: { $in: [new RegExp(filters.search, 'i')] } },
      ]
    }

    console.log('🔍 Final query:', JSON.stringify(query))

    // First, let's check what articles exist with any status
    const allArticles = await this.articleModel.find({}).select('title status').exec()
    console.log('🔍 All articles in database:', allArticles.map(a => ({ title: a.title, status: a.status })))

    const [articles, total] = await Promise.all([
      this.articleModel
        .find(query)
        .populate('authors', 'firstName lastName email')
        .populate('volume', 'number year title')
        .sort({ publishedDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.articleModel.countDocuments(query),
    ])

    console.log('🔍 Found articles:', articles.length)
    console.log('🔍 Total count:', total)

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
      .populate('volume', 'number year title')
      .sort({ publishedDate: -1 })
      .limit(6)
      .exec()
  }

  async findRecent(limit: number = 5): Promise<Article[]> {
    return this.articleModel
      .find({ status: ArticleStatus.PUBLISHED })
      .populate('volume', 'number year title')
      .sort({ publishedDate: -1 })
      .limit(limit)
      .exec()
  }

  async findByAuthor(authorId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit
    const query = { authors: authorId }

    const [articles, total] = await Promise.all([
      this.articleModel
        .find(query)
        .populate('volume', 'number year title')
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
    console.log('📝 Finding article:', { volumeNumber, articleNumber })
    
    const article = await this.articleModel
      .findOne({
        articleNumber: articleNumber
      })
      .populate('authors', 'firstName lastName email affiliation')
      .populate('volume', 'volume title year')
      .exec()

    console.log('📝 Found article:', article ? { id: article._id, title: article.title, status: article.status, volume: article.volume } : 'null')

    if (!article) {
      throw new NotFoundException('Article not found')
    }

    // Verify the article belongs to the specified volume
    if (article.volume && typeof article.volume === 'object' && 'volume' in article.volume) {
      const articleVolumeNumber = (article.volume as any).volume
      console.log('📝 Comparing volume numbers:', { requested: volumeNumber, articleVolume: articleVolumeNumber })
      if (articleVolumeNumber !== volumeNumber) {
        throw new NotFoundException(`Article not found in specified volume. Article belongs to volume ${articleVolumeNumber}, requested volume ${volumeNumber}`)
      }
    } else {
      console.log('📝 Article volume not populated or invalid:', article.volume)
      throw new NotFoundException('Article volume information not available')
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

  async update(id: string, updateArticleDto: UpdateArticleDto, userId: string): Promise<Article> {
    const article = await this.articleModel.findById(id)
    if (!article) {
      throw new NotFoundException('Article not found')
    }

    // Check if user is author or has editorial permissions
    if (article.authors[0].toString() !== userId) {
      // Add role check here if needed
    }

    const updatedArticle = await this.articleModel
      .findByIdAndUpdate(id, updateArticleDto, { new: true })
      .populate('authors', 'firstName lastName email')
      .exec()

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
      .populate('authors', 'firstName lastName email affiliation')
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
      updateData.publishedDate = new Date()
    }
    
    if (reviewerComments) {
      updateData.reviewerComments = reviewerComments
    }

    const updatedArticle = await this.articleModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('authors', 'firstName lastName email')
      .exec()

    // Send status update email to author
    await this.emailService.sendStatusUpdate(article.authors[0].toString(), article.authors[0].toString(), article.title, status, article._id.toString())

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
      .populate('authors', 'firstName lastName email')
      .populate('assignedReviewers', 'firstName lastName email')
      .exec()

    // Send review assignment email
    await this.emailService.sendReviewAssignment(reviewerId, reviewerId, article.title, new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), article._id.toString())

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
      .populate('authors', 'firstName lastName email')
      .populate('assignedReviewers', 'firstName lastName email')
      .exec()

    // Notify editor about completed review
    await this.emailService.sendReviewCompleted(article.authors[0].toString(), article.authors[0].toString(), article.title, article._id.toString())

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
    // First, let's see all articles
    const allArticles = await this.articleModel.find({}).exec()
    console.log('📝 Total articles in database:', allArticles.length)
    
    // If no articles exist, return empty result
    if (allArticles.length === 0) {
      return { articles: [], total: 0 }
    }

    // For now, let's show ALL articles to debug
    const query: any = {}
    
    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status
    }

    if (filters.category && filters.category !== 'all') {
      query.category = filters.category
    }

    if (filters.search) {
      const searchRegex = { $regex: filters.search, $options: 'i' }
      query.$or = [
        { title: searchRegex },
        { abstract: searchRegex },
        { keywords: { $in: [new RegExp(filters.search, 'i')] } }
      ]
    }

    console.log('📝 Available articles query:', JSON.stringify(query, null, 2))

    const articles = await this.articleModel
      .find(query)
      .populate('authors', 'firstName lastName email')
      .sort({ submissionDate: -1 })
      .limit(50)
      .exec()

    console.log('📝 Found available articles:', articles.length)

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
