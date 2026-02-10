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
    console.log('📝 Backend received volume data:', createVolumeDto)
    console.log('📝 Volume data type:', typeof createVolumeDto)
    console.log('📝 Volume data keys:', Object.keys(createVolumeDto))
    
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

  async getTitles(): Promise<string[]> {
    const volumes = await this.volumeModel.find({}, 'title').exec()
    return volumes.map(volume => volume.title)
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
    console.log('🚀 getVolumeArticles called with ID:', id)
    
    // Validate the ObjectId
    if (!id || id === 'undefined' || id === 'null' || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid volume ID: ${id}`)
    }
    
    // First get the raw volume to see what's in the articles field
    const rawVolume = await this.volumeModel.findById(id).exec()
    if (!rawVolume) {
      throw new NotFoundException(`Volume with ID ${id} not found`)
    }
    
    console.log('📝 Raw volume articles:', rawVolume.articles)
    console.log('📝 Articles field type:', typeof rawVolume.articles)
    console.log('📝 First article type:', rawVolume.articles?.[0] ? typeof rawVolume.articles[0] : 'none')
    
    // Try to populate the articles
    const volume = await this.volumeModel
      .findById(id)
      .populate({
        path: 'articles',
        select: 'title abstract authors submissionDate status categories type keywords'
      })
      .exec()
    
    console.log('📝 Volume articles after populate:', volume.articles)
    console.log('📝 First populated article:', volume.articles?.[0])
    
    // If populate didn't work, manually fetch the articles
    if (volume.articles && volume.articles.length > 0 && typeof volume.articles[0] === 'string') {
      console.log('📝 Articles are strings, manually fetching...')
      const articleIds = volume.articles as any[]
      const articles = await this.articleModel
        .find({ _id: { $in: articleIds } })
        .select('title abstract authors submissionDate status categories type keywords')
        .exec()
      
      console.log('📝 Manually fetched articles:', articles)
      return articles
    }
    
    return volume.articles || []
  }

  async assignArticles(volumeId: string, articleIds: string[]): Promise<Volume> {
    console.log('📝 Assigning articles:', { volumeId, articleIds })
    
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
    
    try {
      const volume = await this.volumeModel.findById(volumeId)
      if (!volume) {
        throw new NotFoundException(`Volume with ID ${volumeId} not found`)
      }

      console.log('📝 Found volume:', volume.title)

      // Add articles to volume
      await this.volumeModel.findByIdAndUpdate(
        volumeId,
        { $addToSet: { articles: { $each: articleIds } } }
      )

      console.log('📝 Updated volume with articles')

      // Update articles to reference this volume
      const updateData: any = { volume: volumeId }
      
      // If volume is published, automatically publish the articles
      if (volume.status === 'published') {
        updateData.status = 'published'
        updateData.publishedDate = new Date()
      }

      const articleUpdateResult = await this.articleModel.updateMany(
        { _id: { $in: articleIds } },
        updateData
      )

      console.log('📝 Updated articles:', articleUpdateResult)

      return this.findOne(volumeId)
    } catch (error) {
      console.error('❌ Error in assignArticles:', error)
      throw error
    }
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
