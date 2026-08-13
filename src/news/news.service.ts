import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { News, NewsDocument, NewsStatus } from './schemas/news.schema'
import { CreateNewsDto } from './dto/create-news.dto'
import { UpdateNewsDto } from './dto/update-news.dto'
import { UploadService } from '../upload/upload.service'
import { Express } from 'express'

@Injectable()
export class NewsService {
  constructor(
    @InjectModel(News.name) private newsModel: Model<NewsDocument>,
    private uploadService: UploadService
  ) {}

  async create(createNewsDto: CreateNewsDto, authorId: string, image?: Express.Multer.File): Promise<News> {
    let imageUpload = null
    if (image) {
      imageUpload = await this.uploadService.uploadNews(image)
    }

    const news = new this.newsModel({
      ...createNewsDto,
      author: authorId,
      image: imageUpload,
      publishDate: createNewsDto.publishDate
        ? new Date(createNewsDto.publishDate)
        : createNewsDto.status === NewsStatus.PUBLISHED
          ? new Date()
          : undefined,
    })

    return news.save()
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters: { type?: string; search?: string } = {}
  ) {
    const skip = (page - 1) * limit
    const query: any = {}

    if (filters.type) {
      query.type = filters.type
    }
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { content: { $regex: filters.search, $options: 'i' } },
        { tags: { $in: [new RegExp(filters.search, 'i')] } },
      ]
    }

    const [news, total] = await Promise.all([
      this.newsModel
        .find(query)
        .populate('author', 'firstName lastName email')
        .sort({ publishDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.newsModel.countDocuments(query),
    ])

    return {
      news,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findPublished(
    page: number = 1,
    limit: number = 10,
    filters: { type?: string } = {}
  ) {
    const skip = (page - 1) * limit
    const query: any = { status: NewsStatus.PUBLISHED }

    if (filters.type) {
      query.type = filters.type
    }

    const [news, total] = await Promise.all([
      this.newsModel
        .find(query)
        .populate('author', 'firstName lastName email')
        .sort({ publishDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.newsModel.countDocuments(query),
    ])

    return {
      news,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findRecent(limit: number = 5): Promise<News[]> {
    return this.newsModel
      .find({ status: NewsStatus.PUBLISHED })
      .populate('author', 'firstName lastName email')
      .sort({ publishDate: -1, createdAt: -1 })
      .limit(limit)
      .exec()
  }

  async findFeatured(limit: number = 3): Promise<News[]> {
    return this.newsModel
      .find({ status: NewsStatus.PUBLISHED, featured: true })
      .populate('author', 'firstName lastName email')
      .sort({ publishDate: -1, createdAt: -1 })
      .limit(limit)
      .exec()
  }

  async findOne(id: string): Promise<News> {
    const news = await this.newsModel
      .findById(id)
      .populate('author', 'firstName lastName email')
      .exec()

    if (!news) {
      throw new NotFoundException('News article not found')
    }

    return news
  }

  async update(
    id: string,
    updateNewsDto: UpdateNewsDto,
    userId: string,
    image?: Express.Multer.File
  ): Promise<News> {
    const news = await this.newsModel.findById(id)
    if (!news) {
      throw new NotFoundException('News article not found')
    }

    let imageUpload = news.image
    if (image) {
      // Delete old image if exists
      if (news.image?.publicId) {
        await this.uploadService.deleteFile(news.image.publicId)
      }
      imageUpload = await this.uploadService.uploadNews(image)
    }

    const updateData: any = { ...updateNewsDto, image: imageUpload }
    if (updateNewsDto.publishDate) {
      updateData.publishDate = new Date(updateNewsDto.publishDate)
    } else if (updateNewsDto.status === NewsStatus.PUBLISHED && !news.publishDate) {
      updateData.publishDate = new Date()
    }

    const updatedNews = await this.newsModel
      .findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      )
      .populate('author', 'firstName lastName email')
      .exec()

    return updatedNews
  }

  async incrementViews(id: string): Promise<News> {
    return this.newsModel.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).exec()
  }

  async remove(id: string, userId: string): Promise<void> {
    const news = await this.newsModel.findById(id)
    if (!news) {
      throw new NotFoundException('News article not found')
    }

    // Delete associated image
    if (news.image?.publicId) {
      await this.uploadService.deleteFile(news.image.publicId)
    }

    await this.newsModel.findByIdAndDelete(id)
  }
}
