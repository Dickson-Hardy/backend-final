# Backend API Implementation Guide

This document outlines all the backend APIs that need to be implemented to support the newly created frontend dashboard pages.

## 🎯 Priority Order

1. **High Priority** - Critical for core functionality
2. **Medium Priority** - Important but can use existing workarounds
3. **Low Priority** - Nice to have, enhancement features

---

## 1. Drafts Management Module (HIGH PRIORITY)

### Location
`backend/src/drafts/`

### Schema
```typescript
@Schema()
export class Draft {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop()
  title: string;

  @Prop()
  manuscriptType: string;

  @Prop([String])
  keywords: string[];

  @Prop({ type: Date, default: Date.now })
  lastModified: Date;

  @Prop({ type: Number, default: 0 })
  completionPercentage: number;

  @Prop({
    type: {
      metadata: { type: Boolean, default: false },
      authors: { type: Boolean, default: false },
      abstract: { type: Boolean, default: false },
      manuscript: { type: Boolean, default: false },
      references: { type: Boolean, default: false },
    },
  })
  sections: {
    metadata: boolean;
    authors: boolean;
    abstract: boolean;
    manuscript: boolean;
    references: boolean;
  };

  @Prop({ type: Object })
  formData: Record<string, any>;
}
```

### Endpoints
```typescript
// GET /submissions/drafts - Get user's drafts
@Get('drafts')
@UseGuards(JwtAuthGuard)
async getUserDrafts(@Request() req) {
  return this.draftsService.findByAuthor(req.user.userId);
}

// POST /submissions/drafts - Create new draft
@Post('drafts')
@UseGuards(JwtAuthGuard)
async createDraft(@Request() req, @Body() createDraftDto: CreateDraftDto) {
  return this.draftsService.create(req.user.userId, createDraftDto);
}

// PATCH /submissions/drafts/:id - Update draft
@Patch('drafts/:id')
@UseGuards(JwtAuthGuard)
async updateDraft(@Param('id') id: string, @Body() updateDraftDto: UpdateDraftDto) {
  return this.draftsService.update(id, updateDraftDto);
}

// DELETE /submissions/drafts/:id - Delete draft
@Delete('drafts/:id')
@UseGuards(JwtAuthGuard)
async deleteDraft(@Param('id') id: string) {
  return this.draftsService.delete(id);
}

// POST /submissions/drafts/:id/submit - Convert draft to submission
@Post('drafts/:id/submit')
@UseGuards(JwtAuthGuard)
async submitDraft(@Param('id') id: string, @Request() req) {
  return this.draftsService.submitAsArticle(id, req.user.userId);
}
```

### Service Methods
- `calculateCompletionPercentage()` - Auto-calculate based on filled sections
- `autoSave()` - Periodic save functionality
- `submitAsArticle()` - Convert draft to article submission

---

## 2. Quality Review Module (HIGH PRIORITY)

### Location
`backend/src/quality-reviews/`

### Schema
```typescript
@Schema()
export class QualityReview {
  @Prop({ type: Types.ObjectId, ref: 'Article', required: true })
  articleId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  submittedBy: string;

  @Prop({ type: Date, default: Date.now })
  submittedDate: Date;

  @Prop({
    type: String,
    enum: ['pending', 'in_review', 'approved', 'rejected', 'requires_revision'],
    default: 'pending',
  })
  status: string;

  @Prop({
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  })
  priority: string;

  @Prop({
    type: {
      formatting: { type: Number, default: 0 },
      plagiarism: { type: Number, default: 0 },
      language: { type: Number, default: 0 },
      references: { type: Number, default: 0 },
    },
  })
  issues: {
    formatting: number;
    plagiarism: number;
    language: number;
    references: number;
  };

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedTo: Types.ObjectId;

  @Prop()
  lastReviewed: Date;

  @Prop()
  notes: string;
}
```

### Endpoints
```typescript
// GET /editorial/quality-reviews - Get all quality reviews
@Get('quality-reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('editorial_assistant', 'associate_editor', 'editor_in_chief')
async getQualityReviews() {
  return this.qualityReviewService.findAll();
}

// PATCH /editorial/quality-reviews/:id/start - Start review
@Patch('quality-reviews/:id/start')
@UseGuards(JwtAuthGuard)
async startReview(@Param('id') id: string, @Request() req) {
  return this.qualityReviewService.startReview(id, req.user.userId);
}

// PATCH /editorial/quality-reviews/:id/approve - Approve
@Patch('quality-reviews/:id/approve')
@UseGuards(JwtAuthGuard)
async approve(@Param('id') id: string) {
  return this.qualityReviewService.approve(id);
}

// PATCH /editorial/quality-reviews/:id/reject - Reject
@Patch('quality-reviews/:id/reject')
@UseGuards(JwtAuthGuard)
async reject(@Param('id') id: string, @Body() body: { reason: string }) {
  return this.qualityReviewService.reject(id, body.reason);
}
```

---

## 3. Reviewer Management Extensions (MEDIUM PRIORITY)

### Extend existing `backend/src/reviews/` module

### Add to User/Reviewer Schema
```typescript
@Prop({
  type: {
    totalReviews: { type: Number, default: 0 },
    completedReviews: { type: Number, default: 0 },
    avgCompletionTime: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    onTimeRate: { type: Number, default: 0 },
  },
})
performance: {
  totalReviews: number;
  completedReviews: number;
  avgCompletionTime: number;
  avgRating: number;
  onTimeRate: number;
};

@Prop({ type: Number, default: 0 })
currentLoad: number;

@Prop({ type: Number, default: 5 })
maxLoad: number;
```

### New Endpoints
```typescript
// GET /editorial/reviewers - Get all reviewers with stats
@Get('reviewers')
@UseGuards(JwtAuthGuard)
async getReviewers() {
  return this.reviewersService.findAllWithStats();
}

// POST /editorial/reviewers/invite - Invite new reviewer
@Post('reviewers/invite')
@UseGuards(JwtAuthGuard)
async inviteReviewer(@Body() inviteDto: InviteReviewerDto) {
  return this.reviewersService.sendInvitation(inviteDto);
}

// PATCH /editorial/reviewers/:id/status - Update status
@Patch('reviewers/:id/status')
@UseGuards(JwtAuthGuard)
async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
  return this.reviewersService.updateStatus(id, body.status);
}

// POST /editorial/reviewers/:id/remind - Send reminder
@Post('reviewers/:id/remind')
@UseGuards(JwtAuthGuard)
async sendReminder(@Param('id') id: string) {
  return this.reviewersService.sendReminderEmail(id);
}
```

---

## 4. Editorial Decisions Module (MEDIUM PRIORITY)

### Location
`backend/src/decisions/`

### Schema
```typescript
@Schema()
export class Decision {
  @Prop({ type: Types.ObjectId, ref: 'Article', required: true })
  articleId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop([String])
  authors: string[];

  @Prop({ type: Date, required: true })
  submittedDate: Date;

  @Prop({
    type: String,
    enum: ['accept', 'minor_revision', 'major_revision', 'reject', 'pending'],
    default: 'pending',
  })
  decision: string;

  @Prop()
  decisionDate: Date;

  @Prop()
  decisionBy: string;

  @Prop({ type: Number, default: 0 })
  reviewsCompleted: number;

  @Prop({ type: Number, default: 0 })
  totalReviews: number;

  @Prop({
    type: {
      accept: { type: Number, default: 0 },
      minor_revision: { type: Number, default: 0 },
      major_revision: { type: Number, default: 0 },
      reject: { type: Number, default: 0 },
    },
  })
  recommendations: {
    accept: number;
    minor_revision: number;
    major_revision: number;
    reject: number;
  };

  @Prop({
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal',
  })
  priority: string;

  @Prop({ type: Number, default: 0 })
  daysInReview: number;
}
```

### Endpoints
```typescript
// GET /editorial/decisions - Get all decisions
@Get('decisions')
@UseGuards(JwtAuthGuard)
async getDecisions() {
  return this.decisionsService.findAll();
}

// POST /editorial/decisions/:id - Make decision
@Post('decisions/:id')
@UseGuards(JwtAuthGuard)
async makeDecision(
  @Param('id') id: string,
  @Body() body: { decision: string },
  @Request() req,
) {
  return this.decisionsService.makeDecision(id, body.decision, req.user.userId);
}
```

---

## 5. Board Management Module (MEDIUM PRIORITY)

### Location
`backend/src/board/`

### Schema
```typescript
@Schema()
export class BoardMember {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({
    type: String,
    enum: ['editor_in_chief', 'associate_editor', 'editorial_assistant', 'reviewer'],
    required: true,
  })
  role: string;

  @Prop({ required: true })
  affiliation: string;

  @Prop([String])
  expertise: string[];

  @Prop({
    type: String,
    enum: ['active', 'inactive', 'on_leave'],
    default: 'active',
  })
  status: string;

  @Prop({ type: Date, default: Date.now })
  joinedDate: Date;

  @Prop()
  bio: string;

  @Prop()
  publications: number;

  @Prop()
  hIndex: number;
}
```

### Endpoints
```typescript
// GET /editorial/board - Get all board members
@Get('board')
@UseGuards(JwtAuthGuard)
async getBoardMembers() {
  return this.boardService.findAll();
}

// POST /editorial/board - Add board member
@Post('board')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('editor_in_chief', 'admin')
async addBoardMember(@Body() createDto: CreateBoardMemberDto) {
  return this.boardService.create(createDto);
}

// PATCH /editorial/board/:id - Update board member
@Patch('board/:id')
@UseGuards(JwtAuthGuard)
async updateBoardMember(@Param('id') id: string, @Body() updateDto: UpdateBoardMemberDto) {
  return this.boardService.update(id, updateDto);
}

// DELETE /editorial/board/:id - Remove board member
@Delete('board/:id')
@UseGuards(JwtAuthGuard)
async removeBoardMember(@Param('id') id: string) {
  return this.boardService.delete(id);
}
```

---

## 6. Analytics Module (LOW PRIORITY)

### Location
`backend/src/analytics/`

### Endpoints
```typescript
// GET /editorial/analytics?range=12months
@Get('analytics')
@UseGuards(JwtAuthGuard)
async getAnalytics(@Query('range') range: string) {
  return this.analyticsService.generateReport(range);
}

// GET /editorial/analytics/export?range=12months
@Get('analytics/export')
@UseGuards(JwtAuthGuard)
async exportAnalytics(@Query('range') range: string, @Res() res) {
  const pdf = await this.analyticsService.generatePDF(range);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename=analytics-${range}.pdf`,
  });
  return res.send(pdf);
}
```

### Service Methods
```typescript
class AnalyticsService {
  async generateReport(range: string) {
    // Aggregate data from articles, reviews, decisions
    const submissions = await this.getSubmissionTrends(range);
    const decisions = await this.getDecisionStats(range);
    const reviewTimes = await this.getReviewTimeTrends(range);
    const countries = await this.getTopCountries(range);
    const keywords = await this.getTopKeywords(range);
    
    return {
      overview: { ... },
      submissions,
      decisions,
      reviewTimes,
      topCountries: countries,
      topKeywords: keywords,
    };
  }
  
  async generatePDF(range: string) {
    // Use library like pdfkit or puppeteer
    const data = await this.generateReport(range);
    return this.pdfGenerator.create(data);
  }
}
```

---

## 7. Volume/Issue Management Extensions (MEDIUM PRIORITY)

### Extend existing `backend/src/volumes/` module

### Add Issue Schema
```typescript
@Schema()
export class Issue {
  @Prop({ type: Types.ObjectId, ref: 'Volume', required: true })
  volumeId: Types.ObjectId;

  @Prop({ required: true })
  issueNumber: number;

  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop({ type: Date, required: true })
  publicationDate: Date;

  @Prop({
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  })
  status: string;

  @Prop({ type: Number, default: 0 })
  articleCount: number;

  @Prop()
  coverImage: string;
}
```

### New Endpoints
```typescript
// POST /admin/volumes - Create volume
@Post('volumes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
async createVolume(@Body() createDto: CreateVolumeDto) {
  return this.volumesService.create(createDto);
}

// GET /admin/volumes/:id/issues - Get volume issues
@Get('volumes/:id/issues')
async getVolumeIssues(@Param('id') id: string) {
  return this.issuesService.findByVolume(id);
}

// GET /admin/issues - Get all issues
@Get('issues')
@UseGuards(JwtAuthGuard)
async getAllIssues() {
  return this.issuesService.findAll();
}

// POST /admin/issues - Create issue
@Post('issues')
@UseGuards(JwtAuthGuard)
async createIssue(@Body() createDto: CreateIssueDto) {
  return this.issuesService.create(createDto);
}

// PATCH /admin/issues/:id - Update issue
@Patch('issues/:id')
@UseGuards(JwtAuthGuard)
async updateIssue(@Param('id') id: string, @Body() updateDto: UpdateIssueDto) {
  return this.issuesService.update(id, updateDto);
}

// PATCH /admin/issues/:id/publish - Publish issue
@Patch('issues/:id/publish')
@UseGuards(JwtAuthGuard)
async publishIssue(@Param('id') id: string) {
  return this.issuesService.publish(id);
}

// DELETE /admin/issues/:id - Delete issue
@Delete('issues/:id')
@UseGuards(JwtAuthGuard)
async deleteIssue(@Param('id') id: string) {
  return this.issuesService.delete(id);
}
```

---

## 📝 Implementation Checklist

For each module:
- [ ] Create module directory
- [ ] Define schema with Mongoose decorators
- [ ] Create DTOs (Create, Update)
- [ ] Implement service with business logic
- [ ] Create controller with endpoints
- [ ] Add to app.module.ts imports
- [ ] Add authentication guards
- [ ] Add role-based authorization
- [ ] Write unit tests
- [ ] Test endpoints with Postman/Insomnia
- [ ] Update API documentation

## 🔐 Security Considerations

1. **All endpoints require authentication** - Use `@UseGuards(JwtAuthGuard)`
2. **Role-based access** - Use `@Roles()` decorator where appropriate
3. **Input validation** - Use class-validator in DTOs
4. **Rate limiting** - Consider adding for invite/email endpoints
5. **File upload security** - Validate file types and sizes
6. **SQL injection prevention** - Use Mongoose properly (already handled)

## 🧪 Testing Strategy

1. **Unit Tests**
   - Service methods
   - DTO validation
   - Business logic

2. **Integration Tests**
   - Controller endpoints
   - Database operations
   - Authentication/authorization

3. **E2E Tests**
   - Complete workflows
   - Cross-module interactions

---

**Estimated Implementation Time**: 15-20 hours for all modules

**Recommended Order**:
1. Drafts (4 hours)
2. Quality Reviews (3 hours)
3. Reviewer Management (2 hours)
4. Editorial Decisions (3 hours)
5. Board Management (2 hours)
6. Volume/Issue Extensions (3 hours)
7. Analytics (4 hours)
