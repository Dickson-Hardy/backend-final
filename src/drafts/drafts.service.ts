import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Draft, DraftDocument } from './schemas/draft.schema';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';
import { ArticlesService } from '../articles/articles.service';

@Injectable()
export class DraftsService {
  constructor(
    @InjectModel(Draft.name) private draftModel: Model<DraftDocument>,
    private articlesService: ArticlesService,
  ) {}

  async create(authorId: string, createDraftDto: CreateDraftDto): Promise<Draft> {
    const draft = new this.draftModel({
      ...createDraftDto,
      authorId: new Types.ObjectId(authorId),
    });

    draft.completionPercentage = this.calculateCompletionPercentage(draft);
    await draft.save();
    return draft;
  }

  async findByAuthor(authorId: string): Promise<Draft[]> {
    return this.draftModel
      .find({ authorId: new Types.ObjectId(authorId), status: 'draft' })
      .sort({ lastModified: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Draft> {
    const draft = await this.draftModel.findById(id).exec();
    if (!draft) {
      throw new NotFoundException('Draft not found');
    }
    return draft;
  }

  async update(id: string, updateDraftDto: UpdateDraftDto, userId?: string): Promise<Draft> {
    const draft = await this.findOne(id);

    if (userId && draft.authorId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own drafts');
    }

    const updatedDraft = await this.draftModel.findByIdAndUpdate(
      id,
      {
        ...updateDraftDto,
        lastModified: new Date(),
      },
      { new: true },
    );

    if (updatedDraft) {
      updatedDraft.completionPercentage = this.calculateCompletionPercentage(updatedDraft as any);
      await this.draftModel.findByIdAndUpdate(id, { completionPercentage: updatedDraft.completionPercentage });
    }

    return updatedDraft;
  }

  async delete(id: string, userId?: string): Promise<void> {
    const draft = await this.findOne(id);

    if (userId && draft.authorId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own drafts');
    }

    await this.draftModel.findByIdAndDelete(id).exec();
  }

  async submitAsArticle(id: string, userId: string): Promise<any> {
    const draft = await this.findOne(id);

    if (draft.authorId.toString() !== userId) {
      throw new ForbiddenException('You can only submit your own drafts');
    }

    if (draft.completionPercentage < 90) {
      throw new ForbiddenException('Draft must be at least 90% complete to submit');
    }

    // Create article submission from draft
    const articleData = {
      title: draft.formData.title || draft.title,
      abstract: draft.formData.abstract,
      keywords: draft.keywords,
      manuscriptType: draft.manuscriptType,
      ...draft.formData,
    };

    // TODO: Update this once we know the correct parameters for articlesService.create
    // For now, return a mock article
    const article = { id: 'mock-article-id', ...articleData };

    // Mark draft as submitted
    await this.draftModel.findByIdAndUpdate(id, { status: 'submitted' });

    return article;
  }

  private calculateCompletionPercentage(draft: Draft): number {
    const sections = draft.sections || {
      metadata: false,
      authors: false,
      abstract: false,
      manuscript: false,
      references: false,
    };

    const completedSections = Object.values(sections).filter((v) => v === true).length;
    const totalSections = Object.keys(sections).length;

    // Also consider if basic fields are filled
    let additionalScore = 0;
    if (draft.title) additionalScore += 10;
    if (draft.manuscriptType) additionalScore += 10;
    if (draft.keywords && draft.keywords.length > 0) additionalScore += 10;

    const sectionScore = (completedSections / totalSections) * 70;
    return Math.min(100, Math.round(sectionScore + additionalScore));
  }
}
