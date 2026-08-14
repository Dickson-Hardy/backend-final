import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common"
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
    const duplicateQuery: any = { volume: createVolumeDto.volume }
    if (createVolumeDto.issue !== undefined) {
      duplicateQuery.$or = [
        { issue: createVolumeDto.issue },
        { issue: { $exists: false } },
        { issue: null },
      ]
    }

    const duplicate = await this.volumeModel
      .findOne(duplicateQuery)
      .select('volume issue year title status')
      .lean()
    if (duplicate) {
      throw new ConflictException({
        code: 'DUPLICATE_VOLUME',
        message: `Volume ${createVolumeDto.volume}${createVolumeDto.issue !== undefined ? `, Issue ${createVolumeDto.issue}` : ''} already exists. Open the existing volume instead.`,
        duplicate,
      })
    }

    const volumeStatus = createVolumeDto.status || 'draft'
    
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
    
    const existingVolume = await this.volumeModel.findById(id)
    if (!existingVolume) {
      throw new NotFoundException(`Volume with ID ${id} not found`)
    }

    if (updateVolumeDto.volume !== undefined || Object.prototype.hasOwnProperty.call(updateVolumeDto, 'issue')) {
      const volumeNumber = updateVolumeDto.volume ?? existingVolume.volume
      const issueNumber = Object.prototype.hasOwnProperty.call(updateVolumeDto, 'issue')
        ? updateVolumeDto.issue
        : existingVolume.issue
      const duplicateQuery: any = { _id: { $ne: new Types.ObjectId(id) }, volume: volumeNumber }
      if (issueNumber !== undefined && issueNumber !== null) {
        duplicateQuery.$or = [{ issue: issueNumber }, { issue: { $exists: false } }, { issue: null }]
      }
      const duplicate = await this.volumeModel.findOne(duplicateQuery).select('volume issue title').lean()
      if (duplicate) {
        throw new ConflictException({
          code: 'DUPLICATE_VOLUME',
          message: `Volume ${volumeNumber}${issueNumber !== undefined ? `, Issue ${issueNumber}` : ''} already exists.`,
          duplicate,
        })
      }
    }

    const updateData: any = { ...updateVolumeDto }
    if (updateVolumeDto.status === 'published' && !updateVolumeDto.publishDate && !existingVolume.publishDate) {
      updateData.publishDate = new Date()
    }

    const updatedVolume = await this.volumeModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate("articles")
      .populate("editor", "firstName lastName email")
      .exec()

    if (!updatedVolume) {
      throw new NotFoundException(`Volume with ID ${id} not found`)
    }

    if (updateVolumeDto.status === 'published' && existingVolume.status !== 'published') {
      const now = new Date()
      await this.articleModel.updateMany(
        { volume: new Types.ObjectId(id) },
        [{ $set: { status: 'published', publishDate: { $ifNull: ['$publishDate', now] } } }],
      )
    } else if (
      existingVolume.status === 'published' &&
      (updateVolumeDto.status === 'draft' || updateVolumeDto.status === 'in_progress')
    ) {
      await this.articleModel.updateMany(
        { volume: new Types.ObjectId(id), status: 'published' },
        { $set: { status: 'accepted' }, $unset: { publishDate: 1 } },
      )
    }

    return this.findOne(id)
  }

  async remove(id: string): Promise<void> {
    // Validate the ObjectId
    if (!id || id === 'undefined' || id === 'null' || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid volume ID: ${id}`)
    }
    
    const volume = await this.volumeModel.findById(id).select('_id').lean()
    if (!volume) {
      throw new NotFoundException(`Volume with ID ${id} not found`)
    }

    await this.articleModel.updateMany(
      { volume: new Types.ObjectId(id) },
      [
        {
          $set: {
            status: {
              $cond: [{ $eq: ['$status', 'published'] }, 'accepted', '$status'],
            },
          },
        },
        { $unset: ['volume', 'articleNumber', 'publishDate'] },
      ],
    )
    await this.volumeModel.findByIdAndDelete(id).exec()
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
        select: 'title abstract content authors submissionDate publishDate status categories type keywords articleNumber doi pages manuscriptFile supplementaryFiles featured viewCount downloadCount volume'
      })
      .exec()
    
    // If populate didn't work, manually fetch the articles
    if (volume.articles && volume.articles.length > 0 && typeof volume.articles[0] === 'string') {
      const articleIds = volume.articles as any[]
      const articles = await this.articleModel
        .find({ _id: { $in: articleIds } })
        .select('title abstract content authors submissionDate publishDate status categories type keywords articleNumber doi pages manuscriptFile supplementaryFiles featured viewCount downloadCount volume')
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
    
    const uniqueArticleIds = [...new Set(articleIds)]
    if (uniqueArticleIds.length === 0) {
      throw new BadRequestException('Select at least one article to assign')
    }

    // Validate article ObjectIds
    for (const articleId of uniqueArticleIds) {
      if (!articleId || articleId === 'undefined' || articleId === 'null' || !Types.ObjectId.isValid(articleId)) {
        throw new BadRequestException(`Invalid article ID: ${articleId}`)
      }
    }
    
    const volume = await this.volumeModel.findById(volumeId)
    if (!volume) {
      throw new NotFoundException(`Volume with ID ${volumeId} not found`)
    }

    const objectIds = uniqueArticleIds.map(id => new Types.ObjectId(id))
    const articles = await this.articleModel.find({ _id: { $in: objectIds } }).exec()
    if (articles.length !== uniqueArticleIds.length) {
      const foundIds = new Set(articles.map(article => article._id.toString()))
      const missingIds = uniqueArticleIds.filter(id => !foundIds.has(id))
      throw new NotFoundException(`Article${missingIds.length > 1 ? 's' : ''} not found: ${missingIds.join(', ')}`)
    }

    const existingNumberedArticles = await this.articleModel
      .find({
        volume: new Types.ObjectId(volumeId),
        _id: { $nin: objectIds },
        articleNumber: { $exists: true, $ne: '' },
      })
      .select('articleNumber')
      .lean()
    const occupiedNumbers = new Set(
      existingNumberedArticles
        .map((article: any) => Number.parseInt(article.articleNumber, 10))
        .filter((number: number) => Number.isFinite(number) && number > 0),
    )

    const now = new Date()
    const operations = articles.map(article => {
      let articleNumber = Number.parseInt(article.articleNumber, 10)
      if (!Number.isFinite(articleNumber) || articleNumber < 1 || occupiedNumbers.has(articleNumber)) {
        articleNumber = 1
        while (occupiedNumbers.has(articleNumber)) articleNumber += 1
      }
      occupiedNumbers.add(articleNumber)

      const $set: Record<string, any> = {
        volume: new Types.ObjectId(volumeId),
        articleNumber: String(articleNumber).padStart(3, '0'),
      }
      const $unset: Record<string, 1> = {}
      if (volume.status === 'published') {
        $set.status = 'published'
        $set.publishDate = article.publishDate || now
      } else if (article.status === 'published') {
        $set.status = 'accepted'
        $unset.publishDate = 1
      }

      return {
        updateOne: {
          filter: { _id: article._id },
          update: Object.keys($unset).length ? { $set, $unset } : { $set },
        },
      }
    })

    // An article belongs to one volume only. Remove stale references before adding it here.
    await this.volumeModel.updateMany(
      { _id: { $ne: new Types.ObjectId(volumeId) } },
      { $pull: { articles: { $in: objectIds } } },
    )
    await this.articleModel.bulkWrite(operations)
    await this.volumeModel.findByIdAndUpdate(volumeId, {
      $addToSet: { articles: { $each: objectIds } },
    })

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

    const article = await this.articleModel.findById(articleId)
    if (!article) {
      throw new NotFoundException(`Article with ID ${articleId} not found`)
    }

    if (article.volume?.toString() === volumeId) {
      const update: any = { $unset: { volume: 1, articleNumber: 1 } }
      if (article.status === 'published') {
        update.$set = { status: 'accepted' }
        update.$unset.publishDate = 1
      }
      await this.articleModel.findByIdAndUpdate(articleId, update)
    }

    return this.findOne(volumeId)
  }
}
