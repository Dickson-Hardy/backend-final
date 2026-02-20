import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Article, ArticleDocument, ArticleStatus } from '../articles/schemas/article.schema';
import { Draft, DraftDocument } from '../drafts/schemas/draft.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { SubmitRevisionDto } from './dto/submit-revision.dto';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
    @InjectModel(Draft.name) private draftModel: Model<DraftDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
  ) {}

  async createSubmission(
    createSubmissionDto: CreateSubmissionDto,
    authorId: string,
    files: { manuscript?: Express.Multer.File[]; supplementary?: Express.Multer.File[] }
  ): Promise<Article> {
    // Validate author exists
    const author = await this.userModel.findById(authorId);
    if (!author) {
      throw new NotFoundException('Author not found');
    }

    // Validate that manuscript file exists
    if (!files?.manuscript || files.manuscript.length === 0) {
      throw new BadRequestException('Manuscript file is required for submission');
    }

    // Validate corresponding author email matches one of the authors
    const correspondingAuthor = createSubmissionDto.authors.find(
      a => a.email === createSubmissionDto.correspondingAuthorEmail
    );
    if (!correspondingAuthor) {
      throw new BadRequestException(
        'Corresponding author email must match one of the listed authors'
      );
    }

    // Validate recommended reviewers (if provided)
    if (createSubmissionDto.recommendedReviewers && createSubmissionDto.recommendedReviewers.length > 0) {
      // Ensure no author is recommended as a reviewer
      const authorEmails = createSubmissionDto.authors.map(a => a.email.toLowerCase());
      const reviewerConflict = createSubmissionDto.recommendedReviewers.find(
        r => authorEmails.includes(r.email.toLowerCase())
      );
      if (reviewerConflict) {
        throw new BadRequestException(
          'Authors cannot be recommended as reviewers for their own submission'
        );
      }
    }

    // Create article from submission
    const article = new this.articleModel({
      ...createSubmissionDto,
      correspondingAuthor: new Types.ObjectId(authorId),
      status: ArticleStatus.SUBMITTED,
      submissionDate: new Date(),
      // Store recommended reviewers as metadata for editor review
      metadata: {
        recommendedReviewers: createSubmissionDto.recommendedReviewers || [],
        submittedBy: {
          userId: authorId,
          name: `${author.firstName} ${author.lastName}`,
          email: author.email,
        },
        submissionIp: author.lastLoginIp || 'unknown',
        submissionDate: new Date(),
      },
    });

    const savedArticle = await article.save();

    // Send confirmation email to corresponding author
    await this.emailService.sendSubmissionConfirmation(
      correspondingAuthor.email,
      `${correspondingAuthor.title || ''} ${correspondingAuthor.firstName} ${correspondingAuthor.lastName}`.trim(),
      savedArticle.title,
      savedArticle._id.toString()
    );

    // Send confirmation to all co-authors
    for (const coAuthor of createSubmissionDto.authors) {
      if (coAuthor.email !== correspondingAuthor.email) {
        await this.emailService.sendCoAuthorNotification(
          coAuthor.email,
          `${coAuthor.title || ''} ${coAuthor.firstName} ${coAuthor.lastName}`.trim(),
          savedArticle.title,
          `${correspondingAuthor.firstName} ${correspondingAuthor.lastName}`,
          savedArticle._id.toString()
        );
      }
    }

    // Create notification
    await this.notificationsService.create({
      userId: authorId,
      type: NotificationType.SUBMISSION_RECEIVED,
      title: 'Submission Received',
      message: `Your article "${savedArticle.title}" has been successfully submitted and is now under editorial review`,
      actionUrl: `/dashboard/submissions/${savedArticle._id}`,
    });

    // Notify editorial team about new submission
    await this.notificationsService.notifyEditorialTeam({
      type: NotificationType.NEW_SUBMISSION,
      title: 'New Submission Received',
      message: `New article "${savedArticle.title}" submitted by ${correspondingAuthor.firstName} ${correspondingAuthor.lastName}`,
      actionUrl: `/dashboard/editorial/submissions/${savedArticle._id}`,
    });

    // Remove draft if it exists
    if (createSubmissionDto.draftId) {
      await this.draftModel.findByIdAndDelete(createSubmissionDto.draftId);
    }

    return savedArticle;
  }

  async getAuthorSubmissions(authorId: string, status?: ArticleStatus): Promise<Article[]> {
    const query: any = { correspondingAuthor: new Types.ObjectId(authorId) };
    
    if (status) {
      query.status = status;
    }

    return this.articleModel
      .find(query)
      .sort({ submissionDate: -1 })
      .populate('volume', 'title number year')
      .exec();
  }

  async getSubmissionById(submissionId: string, authorId: string): Promise<Article> {
    const submission = await this.articleModel
      .findOne({
        _id: new Types.ObjectId(submissionId),
        correspondingAuthor: new Types.ObjectId(authorId)
      })
      .populate('volume', 'title number year')
      .populate('reviewers', 'firstName lastName email')
      .exec();

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return submission;
  }

  async updateSubmission(
    submissionId: string,
    authorId: string,
    updateDto: UpdateSubmissionDto
  ): Promise<Article> {
    const submission = await this.getSubmissionById(submissionId, authorId);

    // Only allow updates if submission is in draft or revision requested status
    if (![ArticleStatus.DRAFT, ArticleStatus.REVISION_REQUESTED].includes(submission.status)) {
      throw new BadRequestException('Cannot update submission in current status');
    }

    Object.assign(submission, updateDto);
    
    // If moving from revision requested to submitted, update status
    if (submission.status === ArticleStatus.REVISION_REQUESTED && updateDto.resubmit) {
      submission.status = ArticleStatus.UNDER_REVIEW;
      submission.submissionDate = new Date();
    }

    const updatedSubmission = await this.articleModel.findByIdAndUpdate(
      submissionId,
      { ...updateDto },
      { new: true }
    );

    return updatedSubmission;
  }

  async submitRevision(
    submissionId: string,
    authorId: string,
    revisionDto: SubmitRevisionDto,
    files?: { manuscript?: Express.Multer.File[]; supplementary?: Express.Multer.File[] }
  ): Promise<Article> {
    const submission = await this.getSubmissionById(submissionId, authorId);

    if (submission.status !== ArticleStatus.REVISION_REQUESTED) {
      throw new BadRequestException('Submission is not in revision requested status');
    }

    // Validate that either new files are provided or existing files remain
    if (!files?.manuscript && !submission.manuscriptFile) {
      throw new BadRequestException('Manuscript file is required for revision submission');
    }

    // Validate revision notes are provided
    if (!revisionDto.revisionNotes || revisionDto.revisionNotes.trim().length < 50) {
      throw new BadRequestException(\n        'Please provide detailed revision notes (minimum 50 characters) explaining changes made'\n      );\n    }\n\n    // Update submission with revision\n    const updatedSubmission = await this.articleModel.findByIdAndUpdate(\n      submissionId,\n      {\n        ...revisionDto,\n        status: ArticleStatus.UNDER_REVIEW,\n        resubmissionDate: new Date(),\n        revisionNotes: revisionDto.revisionNotes,\n        revisionCount: (submission.metadata?.revisionCount || 0) + 1,\n        'metadata.lastRevisionDate': new Date(),\n        'metadata.revisionHistory': [\n          ...(submission.metadata?.revisionHistory || []),\n          {\n            date: new Date(),\n            notes: revisionDto.revisionNotes,\n            fileUpdated: !!files?.manuscript,\n          },\n        ],\n      },\n      { new: true }\n    ).populate('authors volume');\n\n    // Get author details\n    const author = await this.userModel.findById(authorId);\n    const correspondingAuthor = submission.authors[0];\n\n    // Send confirmation email to author\n    await this.emailService.sendRevisionConfirmation(\n      typeof correspondingAuthor === 'object' && 'email' in correspondingAuthor\n        ? correspondingAuthor.email\n        : author.email,\n      `${author.firstName} ${author.lastName}`,\n      submission.title,\n      submissionId\n    );\n\n    // Notify author\n    await this.notificationsService.create({\n      userId: authorId,\n      type: NotificationType.REVISION_SUBMITTED,\n      title: 'Revision Submitted',\n      message: `Your revised manuscript \"${submission.title}\" has been resubmitted for review`,\n      actionUrl: `/dashboard/submissions/${submissionId}`,\n    });\n\n    // Notify editorial team with detailed info\n    await this.notificationsService.notifyEditorialTeam({\n      type: NotificationType.REVISION_SUBMITTED,\n      title: 'Revised Manuscript Received',\n      message: `Revised version of \"${submission.title}\" submitted by ${author.firstName} ${author.lastName}`,\n      actionUrl: `/dashboard/editorial/submissions/${submissionId}`,\n      priority: 'high',\n    });\n\n    // If there were assigned reviewers, notify them\n    if (submission.assignedReviewers && submission.assignedReviewers.length > 0) {\n      for (const reviewerId of submission.assignedReviewers) {\n        await this.notificationsService.create({\n          userId: reviewerId.toString(),\n          type: NotificationType.MANUSCRIPT_REVISED,\n          title: 'Manuscript Revised',\n          message: `The manuscript \"${submission.title}\" has been revised and is ready for re-review`,\n          actionUrl: `/dashboard/reviewer/review/${submissionId}`,\n        });\n      }\n    }\n\n    return updatedSubmission;\n  }

  async withdrawSubmission(submissionId: string, authorId: string, reason: string): Promise<Article> {
    const submission = await this.getSubmissionById(submissionId, authorId);

    if ([ArticleStatus.PUBLISHED, ArticleStatus.ACCEPTED].includes(submission.status)) {
      throw new BadRequestException('Cannot withdraw published or accepted submissions');
    }

    const updatedSubmission = await this.articleModel.findByIdAndUpdate(
      submissionId,
      {
        status: ArticleStatus.REJECTED,
        withdrawalReason: reason,
        withdrawalDate: new Date(),
      },
      { new: true }
    );

    return updatedSubmission;
  }

  async getSubmissionStats(authorId: string) {
    const submissions = await this.articleModel.find({
      correspondingAuthor: new Types.ObjectId(authorId)
    });

    return {
      total: submissions.length,
      draft: submissions.filter(s => s.status === ArticleStatus.DRAFT).length,
      submitted: submissions.filter(s => s.status === ArticleStatus.SUBMITTED).length,
      underReview: submissions.filter(s => s.status === ArticleStatus.UNDER_REVIEW).length,
      revisionRequested: submissions.filter(s => s.status === ArticleStatus.REVISION_REQUESTED).length,
      accepted: submissions.filter(s => s.status === ArticleStatus.ACCEPTED).length,
      published: submissions.filter(s => s.status === ArticleStatus.PUBLISHED).length,
      rejected: submissions.filter(s => s.status === ArticleStatus.REJECTED).length,
    };
  }
}