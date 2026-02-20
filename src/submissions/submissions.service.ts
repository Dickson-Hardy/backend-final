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
        submissionIp: 'unknown',
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
      type: NotificationType.SUBMISSION_RECEIVED,
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
      throw new BadRequestException(
        'Please provide detailed revision notes (minimum 50 characters) explaining changes made'
      );
    }

    // Update submission with revision
    const updatedSubmission = await this.articleModel.findByIdAndUpdate(
      submissionId,
      {
        ...revisionDto,
        status: ArticleStatus.UNDER_REVIEW,
        resubmissionDate: new Date(),
        revisionNotes: revisionDto.revisionNotes,
        revisionCount: ((submission as any).metadata?.revisionCount || 0) + 1,
        'metadata.lastRevisionDate': new Date(),
        'metadata.revisionHistory': [
          ...((submission as any).metadata?.revisionHistory || []),
          {
            date: new Date(),
            notes: revisionDto.revisionNotes,
            fileUpdated: !!files?.manuscript,
          },
        ],
      },
      { new: true }
    ).populate('authors volume');

    // Get author details
    const author = await this.userModel.findById(authorId);
    const correspondingAuthor = submission.authors[0];

    // Send confirmation email to author
    await this.emailService.sendRevisionConfirmation(
      typeof correspondingAuthor === 'object' && 'email' in correspondingAuthor
        ? (correspondingAuthor as any).email
        : author.email,
      `${author.firstName} ${author.lastName}`,
      submission.title,
      submissionId
    );

    // Notify author
    await this.notificationsService.create({
      userId: authorId,
      type: NotificationType.REVISION_SUBMITTED,
      title: 'Revision Submitted',
      message: `Your revised manuscript "${submission.title}" has been resubmitted for review`,
      actionUrl: `/dashboard/submissions/${submissionId}`,
    });

    // Notify editorial team with detailed info
    await this.notificationsService.notifyEditorialTeam({
      type: NotificationType.REVISION_SUBMITTED,
      title: 'Revised Manuscript Received',
      message: `Revised version of "${submission.title}" submitted by ${author.firstName} ${author.lastName}`,
      actionUrl: `/dashboard/editorial/submissions/${submissionId}`,
      priority: 'high',
    });

    return updatedSubmission;
  }

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