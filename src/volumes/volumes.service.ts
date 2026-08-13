import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { Model, Types } from "mongoose"
import { Volume, VolumeDocument } from "./schemas/volume.schema"
import { Article, ArticleDocument } from "../articles/schemas/article.schema"
import type { CreateVolumeDto } from "./dto/create-volume.dto"
import type { UpdateVolumeDto } from "./dto/update-volume.dto"

@Injectable()
export class VolumesService {
  private volumeModel: Model<VolumeDocument>
  private articleModel: Model<ArticleDocument>

  constructor(
    @InjectModel(Volume.name) volumeModel: Model<VolumeDocument>,
    @InjectModel(Article.name) articleModel: Model<ArticleDocument>
  ) {
    this.volumeModel = volumeModel
    this.articleModel = articleModel
  }

  async create(createVolumeDto: CreateVolumeDto, userRole?: string): Promise<Volume> {
    // Determine volume status based on user role
    let volumeStatus = createVolumeDto.status || 'draft'
    
    // If created by admin, automatically publish
    if (userRole === 'admin' && volumeStatus === 'draft') {
      volumeStatus = 'published'
    }
    
    const volumeData = {
      ...createVolumeDto,
      status: volumeStatus,
      // Only set publishDate to current date if not provided and status is published
      ...(volumeStatus === 'published' && !createVolumeDto.publishDate && { publishDate: new Date() })
    }
    
    const createdVolume = new this.volumeModel(volumeData)
    return createdVolume.save()
  }

  async findAll(): Promise<Volume[]> {
    return this.volumeModel
      .find()
      .populate("articles")
      .populate("editor", "firstName lastName email")
      .sort({ year: -1, volume: -1, issue: -1 })
      .exec()
  }

  async findOne(id: string): Promise<Volume> {
    // Validate the ObjectId
    if (!id || id === 'undefined' || id === 'null' || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid volume ID: ${id}`)
    }
    
    const volume = await this.volumeModel
      .findById(id)
      .populate("articles")
      .populate("editor", "firstName lastName email")
      .exec()

    if (!volume) {
      throw new NotFoundException(`Volume with ID ${id} not found`)
    }

    return volume
  }

  async findCurrent(): Promise<Volume | null> {
    const currentVolume = await this.volumeModel
      .findOne({ status: "published" })
      .populate("articles")
      .sort({ year: -1, volume: -1, issue: -1 })
      .exec()

    return currentVolume
  }

  async findRecent(limit = 6): Promise<Volume[]> {
    return this.volumeModel
      .find({ status: "published" })
      .populate("articles")
      .sort({ year: -1, volume: -1, issue: -1 })
      .limit(limit)
      .exec()
  }

  async update(id: string, updateVolumeDto: UpdateVolumeDto): Promise<Volume> {
    // Validate the ObjectId
    if (!id || id === 'undefined' || id === 'null' || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid volume ID: ${id}`)
    }
    
    const updatedVolume = await this.volumeModel
      .findByIdAndUpdate(id, updateVolumeDto, { new: true })
      .populate("articles")
      .populate("editor", "firstName lastName email")
      .exec()

    if (!updatedVolume) {
      throw new NotFoundException(`Volume with ID ${id} not found`)
    }

    return updatedVolume
  }

  async remove(id: string): Promise<void> {
    // Validate the ObjectId
    if (!id || id === 'undefined' || id === 'null' || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid volume ID: ${id}`)
    }
    
    const result = await this.volumeModel.findByIdAndDelete(id).exec()
    if (!result) {
      throw new NotFoundException(`Volume with ID ${id} not found`)
    }
  }

  async incrementViewCount(id: string): Promise<void> {
    // Validate the ObjectId
    if (!id || id === 'undefined' || id === 'null' || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid volume ID: ${id}`)
    }
    
    await this.volumeModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } })
  }

  async incrementDownloadCount(id: string): Promise<void> {
    // Validate the ObjectId
    if (!id || id === 'undefined' || id === 'null' || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid volume ID: ${id}`)
    }
    
    await this.volumeModel.findByIdAndUpdate(id, { $inc: { downloadCount: 1 } })
  }

  async getTitles(): Promise<Array<{ _id: string; title: string; volume: number; year: number }>> {
    const volumes = await this.volumeModel
      .find({}, 'title volume year')
      .sort({ year: -1, volume: -1 })
      .lean()
      .exec()

    return volumes.map(volume => ({
      _id: volume._id.toString(),
      title: volume.title,
      volume: volume.volume,
      year: volume.year,
    }))
  }

  async findByNumber(volumeNumber: number): Promise<Volume> {
    const volume = await this.volumeModel
      .findOne({ volume: volumeNumber })
      .populate("articles")
      .populate("editor", "firstName lastName email")
      .exec()

    if (!volume) {
      throw new NotFoundException(`Volume with number ${volumeNumber} not found`)
    }

    return volume
  }

  async getVolumeArticles(id: string): Promise<any[]> {
    // Validate the ObjectId
    if (!id || id === 'undefined' || id === 'null' || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid volume ID: ${id}`)
    }
    
    // First get the raw volume to see what's in the articles field
    const rawVolume = await this.volumeModel.findById(id).exec()
    if (!rawVolume) {
      throw new NotFoundException(`Volume with ID ${id} not found`)
    }
    
    // Try to populate the articles
    const volume = await this.volumeModel
      .findById(id)
      .populate({
        path: 'articles',
        select: 'title abstract authors submissionDate status categories type keywords'
      })
      .exec()
    
    // If populate didn't work, manually fetch the articles
    if (volume.articles && volume.articles.length > 0 && typeof volume.articles[0] === 'string') {
      const articleIds = volume.articles as any[]
      const articles = await this.articleModel
        .find({ _id: { $in: articleIds } })
        .select('title abstract authors submissionDate status categories type keywords')
        .exec()
      
      return articles
    }
    
    return volume.articles || []
  }

  async assignArticles(volumeId: string, articleIds: string[]): Promise<Volume> {
    // Validate the volume ObjectId
    if (!volumeId || volumeId === 'undefined' || volumeId === 'null' || !Types.ObjectId.isValid(volumeId)) {
      throw new BadRequestException(`Invalid volume ID: ${volumeId}`)
    }
    
    // Validate article ObjectIds
    for (const articleId of articleIds) {
      if (!articleId || articleId === 'undefined' || articleId === 'null' || !Types.ObjectId.isValid(articleId)) {
        throw new BadRequestException(`Invalid article ID: ${articleId}`)
      }
    }
    
    const volume = await this.volumeModel.findById(volumeId)
    if (!volume) {
      throw new NotFoundException(`Volume with ID ${volumeId} not found`)
    }

    // Add articles to volume
    await this.volumeModel.findByIdAndUpdate(
      volumeId,
      { $addToSet: { articles: { $each: articleIds } } }
    )

    // Update articles to reference this volume
    const updateData: any = { volume: volumeId }
    
    // If volume is published, automatically publish the articles
    if (volume.status === 'published') {
      updateData.status = 'published'
      updateData.publishDate = new Date()
    }

    await this.articleModel.updateMany(
      { _id: { $in: articleIds } },
      updateData
    )

    return this.findOne(volumeId)
  }

  async removeArticle(volumeId: string, articleId: string): Promise<Volume> {
    // Validate the volume ObjectId
    if (!volumeId || volumeId === 'undefined' || volumeId === 'null' || !Types.ObjectId.isValid(volumeId)) {
      throw new BadRequestException(`Invalid volume ID: ${volumeId}`)
    }
    
    // Validate the article ObjectId
    if (!articleId || articleId === 'undefined' || articleId === 'null' || !Types.ObjectId.isValid(articleId)) {
      throw new BadRequestException(`Invalid article ID: ${articleId}`)
    }

    const volume = await this.volumeModel.findById(volumeId)
    if (!volume) {
      throw new NotFoundException(`Volume with ID ${volumeId} not found`)
    }

    // Remove article from volume
    await this.volumeModel.findByIdAndUpdate(
      volumeId,
      { $pull: { articles: articleId } }
    )

    // Remove volume reference from article
    await this.articleModel.findByIdAndUpdate(
      articleId,
      { $unset: { volume: 1 } }
    )

    return this.findOne(volumeId)
  }
}
