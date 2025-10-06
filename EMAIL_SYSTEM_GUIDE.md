# 📧 AMHSJ Email System - Complete Guide

## 🎯 Overview

The AMHSJ email system provides professional, template-based email communications for all journal workflows. It supports dual email providers with intelligent routing based on email type.

---

## 🏗️ Architecture

### **Three-Layer Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│                   EmailService (Main)                   │
│  - Template Generation                                  │
│  - Provider Routing                                     │
│  - High-level Email Methods                            │
└────────────────┬────────────────────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
┌────────▼──────┐  ┌──────▼─────────┐
│ ResendService │  │  SmtpService   │
│  (Transactional)│  │ (Editorial)    │
└───────────────┘  └────────────────┘
```

---

## 📦 Components

### 1. **EmailService** (Main Orchestrator)
**Location:** `src/email/email.service.ts`

**Responsibilities:**
- Generate HTML templates for all email types
- Route emails to appropriate provider
- Provide high-level methods for each email type
- Handle errors and logging

**Key Methods:**
```typescript
// Core sending
sendEmail(options: EmailOptions): Promise<boolean>

// User lifecycle
sendWelcomeEmail(to, name)
sendVerificationEmail(to, name, token)

// Manuscript workflow
sendSubmissionConfirmation(to, authorName, articleTitle, submissionId)
sendReviewInvitation(to, reviewerName, articleTitle, deadline, submissionId)
sendReviewAssignment(to, reviewerName, articleTitle, deadline, submissionId)
sendReviewCompleted(to, editorName, articleTitle, submissionId)
sendStatusUpdate(to, authorName, articleTitle, status, submissionId)
sendRevisionRequest(to, authorName, articleTitle, comments, deadline, submissionId)
sendReminderEmail(to, recipientName, reminderType, articleTitle, deadline, submissionId)
sendDecisionNotification(to, authorName, articleTitle, decision, comments, submissionId)
sendPublicationNotification(to, authorName, articleTitle, doi, volumeNumber, issueNumber)

// Mass communication
sendNewsletterAlert(to[], subject, content)
```

---

### 2. **ResendService** (Modern API)
**Location:** `src/email/services/resend.service.ts`

**Use Cases:**
- ✅ Email verification
- ✅ Welcome emails
- ✅ System reminders
- ✅ General notifications

**Configuration:**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Features:**
- Modern REST API
- High deliverability
- Easy setup
- Built-in analytics
- Generous free tier (3,000 emails/month)

**Implementation:**
```typescript
const { data, error } = await this.resend.emails.send({
  from: "AMHSJ <noreply@amhsj.org>",
  to: options.to,
  subject: options.subject,
  html: options.template.html,
  text: options.template.text,
})
```

---

### 3. **SmtpService** (Traditional SMTP)
**Location:** `src/email/services/smtp.service.ts`

**Use Cases:**
- ✅ Editorial communications
- ✅ Review requests
- ✅ Decision letters
- ✅ Revision requests
- ✅ Publication notifications

**Configuration:**
```env
SMTP_HOST=smtppro.zoho.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
```

**Features:**
- Works with any SMTP provider (Gmail, Zoho, SendGrid, etc.)
- Personal "From" address
- Reply-to capability
- Institutional email branding

**Implementation:**
```typescript
await this.transporter.sendMail({
  from: `"AMHSJ Editorial Team" <${SMTP_USER}>`,
  to: options.to,
  subject: options.subject,
  html: options.template.html,
  text: options.template.text,
})
```

---

## 🔀 Smart Routing Logic

The system automatically routes emails based on their purpose:

```typescript
private getEmailProvider(type: "alert" | "editorial"): EmailProvider {
  // Use Resend for alerts and notifications, SMTP for editorial communications
  return type === "alert" ? "resend" : "smtp"
}
```

### **Routing Map:**

| Email Type | Provider | Reason |
|------------|----------|--------|
| Welcome | Resend | Transactional, automated |
| Verification | Resend | Transactional, time-sensitive |
| Reminders | Resend | Automated alerts |
| Submission Confirmation | SMTP | Editorial communication |
| Review Invitation | SMTP | Personal, requires response |
| Review Assignment | SMTP | Formal assignment |
| Review Completed | SMTP | Editorial notification |
| Status Update | SMTP | Editorial communication |
| Revision Request | SMTP | Editorial feedback |
| Decision Letter | SMTP | Official editorial decision |
| Publication Notice | Resend | Celebration notification |
| Newsletter | Resend | Mass communication |

---

## 📧 Email Templates

All templates follow a consistent design pattern:

### **Template Structure:**

```html
<div style="max-width: 650px; margin: 0 auto; font-family: Segoe UI;">
  
  <!-- Header with Gradient -->
  <div style="background: linear-gradient(135deg, color1, color2, color3);">
    <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);">
      <img src="logo.png" />
      <h1>Email Title</h1>
      <p>Subtitle</p>
    </div>
  </div>
  
  <!-- Main Content -->
  <div style="padding: 45px 35px;">
    <h2>Dear Dr. {name},</h2>
    <p>Main message...</p>
    
    <!-- Details Box -->
    <div style="background: #f0fdf4; border-left: 4px solid #color;">
      <h3>Section Title</h3>
      <p>Details...</p>
    </div>
    
    <!-- CTA Button -->
    <div style="text-align: center;">
      <a href="{link}" style="background: gradient; padding: 15px 35px;">
        Action Button
      </a>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="background: #f9fafb;">
    <p>© 2025 AMHSJ. All rights reserved.</p>
  </div>
  
</div>
```

### **Color Schemes by Type:**

| Email Type | Gradient Colors | Meaning |
|------------|-----------------|---------|
| Welcome | Blue (#1e40af → #60a5fa) | Professional, trust |
| Verification | Blue | Security, trust |
| Submission Confirmed | Green (#059669 → #34d399) | Success, positive |
| Review Invitation | Purple (#7c3aed → #c084fc) | Important, special |
| Review Assignment | Green | Confirmed action |
| Review Completed | Sky Blue (#0ea5e9 → #0369a1) | Information |
| Status Update | Dynamic (based on status) | Context-aware |
| Revision Request | Amber (#f59e0b → #b45309) | Action needed |
| Reminder | Red (#dc2626 → #f87171) | Urgent, time-sensitive |
| Decision | Dynamic (Green/Red) | Accept/Reject |
| Publication | Purple (#8b5cf6 → #c084fc) | Celebration |
| Newsletter | Gray (#1f2937 → #4b5563) | Informational |

---

## 🔗 Integration Points

### **1. User Registration (Auth Module)**

```typescript
// src/auth/auth.controller.ts

@Post('register')
async register(@Body() createUserDto: CreateUserDto) {
  const emailVerificationToken = crypto.randomBytes(32).toString('hex')
  
  const user = await this.usersService.create({
    ...createUserDto,
    emailVerificationToken,
    emailVerified: false
  })

  // Send verification email
  await this.emailService.sendVerificationEmail(
    user.email,
    user.firstName,
    emailVerificationToken
  )

  return { message: 'Check your email for verification' }
}
```

**Flow:**
1. User registers → Generate token
2. Store token in database
3. Send verification email with token link
4. User clicks link → Email verified

---

### **2. Article Submission (Articles Module)**

```typescript
// src/articles/articles.service.ts

async create(createArticleDto: CreateArticleDto, authorId: string) {
  const article = await this.articleModel.create({
    ...createArticleDto,
    authors: [authorId],
    status: 'under_review'
  })

  // Send confirmation email
  await this.emailService.sendSubmissionConfirmation(
    authorId,
    article.authors[0].toString(),
    article.title,
    article._id.toString()
  )

  return article
}
```

**Flow:**
1. Author submits article
2. Article saved to database
3. Confirmation email sent immediately
4. Email includes submission ID and tracking link

---

### **3. Review Process (Reviews Module)**

```typescript
// Invite reviewer
async inviteReviewer(articleId: string, reviewerId: string) {
  const article = await this.articleModel.findById(articleId)
  const reviewer = await this.userModel.findById(reviewerId)
  
  const deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
  
  await this.emailService.sendReviewInvitation(
    reviewer.email,
    reviewer.firstName,
    article.title,
    deadline,
    article._id.toString()
  )
}

// Reviewer accepts
async acceptReview(reviewId: string) {
  const review = await this.reviewModel.findById(reviewId)
  const article = await this.articleModel.findById(review.articleId)
  
  await this.emailService.sendReviewAssignment(
    review.reviewerEmail,
    review.reviewerName,
    article.title,
    review.deadline,
    article._id.toString()
  )
}

// Review completed
async completeReview(reviewId: string) {
  const review = await this.reviewModel.findById(reviewId)
  const article = await this.articleModel.findById(review.articleId)
  
  await this.emailService.sendReviewCompleted(
    article.editorEmail,
    article.editorName,
    article.title,
    article._id.toString()
  )
}
```

---

### **4. Editorial Decisions**

```typescript
async makeDecision(articleId: string, decision: string, comments: string) {
  const article = await this.articleModel.findById(articleId)
  
  await this.emailService.sendDecisionNotification(
    article.authorEmail,
    article.authorName,
    article.title,
    decision,
    comments,
    article._id.toString()
  )
  
  if (decision === 'Accepted') {
    // Also send publication notification later
    await this.emailService.sendPublicationNotification(
      article.authorEmail,
      article.authorName,
      article.title,
      article.doi,
      article.volume,
      article.issue
    )
  }
}
```

---

## 🔧 Configuration

### **Environment Variables Required:**

```bash
# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000  # Development
FRONTEND_URL=https://amhsj.org      # Production

# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# SMTP Configuration
SMTP_HOST=smtppro.zoho.com          # Or smtp.gmail.com, smtp.sendgrid.net
SMTP_PORT=587                        # 587 for TLS, 465 for SSL
SMTP_USER=noreply@amhsj.org         # Your email address
SMTP_PASS=your-app-password         # App-specific password
```

### **Recommended SMTP Providers:**

1. **Zoho Mail** (Recommended for professional journals)
   - Free tier: 5,000 emails/day
   - Professional email addresses
   - Host: `smtppro.zoho.com`
   - Port: 587

2. **Gmail**
   - Free tier: 500 emails/day
   - Requires app password
   - Host: `smtp.gmail.com`
   - Port: 587

3. **SendGrid**
   - Free tier: 100 emails/day
   - Professional transactional service
   - Host: `smtp.sendgrid.net`
   - Port: 587

4. **Amazon SES**
   - 62,000 emails/month free (AWS free tier)
   - Very cheap beyond free tier
   - Requires AWS setup

---

## 🧪 Testing

### **1. Test Endpoint (Admin Only)**

```bash
# Test Resend
POST /email/test
{
  "to": "your-email@example.com",
  "type": "resend"
}

# Test SMTP
POST /email/test
{
  "to": "your-email@example.com",
  "type": "smtp"
}
```

### **2. Manual Testing Workflow**

```bash
# 1. Start backend
cd backend
npm run start:dev

# 2. Register a new user (triggers verification email)
POST http://localhost:3001/auth/register
{
  "email": "test@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePass123!",
  "role": "author"
}

# 3. Check email inbox for verification email

# 4. Submit an article (triggers submission confirmation)
POST http://localhost:3001/articles
{
  "title": "Test Article",
  "abstract": "Test abstract...",
  "keywords": ["test"]
}

# 5. Check email for submission confirmation
```

### **3. Check Logs**

```bash
# Backend logs will show:
[EmailService] Email sent via Resend: msg_abc123
[EmailService] Email sent via SMTP: <message-id@domain>
```

---

## ✅ Verification Checklist

### **Setup Verification:**

- [ ] `nodemailer` package installed (check `package.json`)
- [ ] `resend` package installed (check `package.json`)
- [ ] `.env` file exists with all required variables
- [ ] `RESEND_API_KEY` is valid (check Resend dashboard)
- [ ] `SMTP_USER` and `SMTP_PASS` are correct
- [ ] `FRONTEND_URL` points to correct domain

### **Module Verification:**

- [ ] `EmailModule` is imported in `app.module.ts`
- [ ] `EmailService` is injected in modules that need it:
  - [ ] AuthModule (for verification emails)
  - [ ] ArticlesModule (for submission confirmations)
  - [ ] ReviewsModule (for review emails)
  - [ ] EditorialDecisionsModule (for decision emails)

### **Integration Verification:**

- [ ] User registration sends verification email
- [ ] Article submission sends confirmation email
- [ ] Review invitation sends to reviewer
- [ ] Decision notification sends to author

---

## 🚨 Troubleshooting

### **Problem: Emails not sending**

**Check:**
1. Environment variables are set correctly
2. API keys are valid
3. SMTP credentials are correct
4. Network connectivity (firewall, VPN)
5. Email provider limits not exceeded

**Solution:**
```bash
# Check logs
npm run start:dev
# Look for errors like:
# [EmailService] Failed to send email: Invalid API key
# [SmtpService] SMTP error: Authentication failed
```

---

### **Problem: Emails going to spam**

**Causes:**
1. No SPF/DKIM records configured
2. Sender domain not verified
3. "From" email doesn't match SMTP account

**Solutions:**
1. **Verify domain with email provider**
2. **Set up SPF record** (DNS):
   ```
   v=spf1 include:_spf.zoho.com ~all
   ```
3. **Set up DKIM** (follow provider instructions)
4. **Use matching "From" address**:
   ```typescript
   from: `"AMHSJ" <${SMTP_USER}>`  // Must match SMTP_USER
   ```

---

### **Problem: Resend API key invalid**

**Steps to get API key:**
1. Go to https://resend.com
2. Sign up for free account
3. Verify your domain (or use resend.dev for testing)
4. Create API key in dashboard
5. Copy key starting with `re_`
6. Add to `.env`: `RESEND_API_KEY=re_...`

---

### **Problem: Gmail SMTP not working**

**Solution:**
1. Enable 2-factor authentication on Gmail
2. Generate app-specific password:
   - Google Account → Security → App Passwords
   - Create new app password
   - Use this password (NOT your regular Gmail password)
3. Update `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password-here
   ```

---

## 🎯 Best Practices

### **1. Error Handling**
```typescript
try {
  await this.emailService.sendSubmissionConfirmation(...)
} catch (error) {
  // Log error but don't fail the request
  this.logger.error(`Failed to send email: ${error.message}`)
  // Article was still created successfully
}
```

### **2. Async/Non-blocking**
```typescript
// Don't await email sending in critical paths
this.emailService.sendSubmissionConfirmation(...).catch(err => {
  this.logger.error('Email failed:', err)
})

// Continue with response
return { success: true, article }
```

### **3. Template Consistency**
- All templates use same base structure
- Consistent color scheme
- Mobile-responsive design
- Plain text fallback always included

### **4. Link Generation**
```typescript
// Always use FRONTEND_URL from config
const verificationUrl = `${this.configService.get("FRONTEND_URL")}/auth/verify?token=${token}`

// NOT hardcoded:
// const url = "http://localhost:3000/auth/verify?token=" + token
```

### **5. Personalization**
- Always use recipient's name
- Include relevant article/submission details
- Provide tracking links
- Set appropriate deadlines

---

## 📊 Monitoring & Analytics

### **Resend Analytics**
- Login to Resend dashboard
- View email delivery rates
- Track opens and clicks
- Monitor bounce rates

### **Backend Logging**
```typescript
this.logger.log(`Email sent to ${email}: ${subject}`)
this.logger.error(`Email failed: ${error.message}`)
```

### **Database Tracking** (Future Enhancement)
```typescript
// Create EmailLog collection
{
  recipient: 'user@example.com',
  subject: 'Submission Confirmation',
  type: 'submission_confirmation',
  provider: 'smtp',
  status: 'sent',
  sentAt: new Date(),
  articleId: '...',
  userId: '...'
}
```

---

## 🚀 Production Deployment

### **Pre-deployment Checklist:**

1. **Environment Variables:**
   ```bash
   # Set in production environment
   FRONTEND_URL=https://amhsj.org
   RESEND_API_KEY=re_production_key
   SMTP_HOST=smtppro.zoho.com
   SMTP_USER=noreply@amhsj.org
   SMTP_PASS=production_password
   ```

2. **Domain Verification:**
   - [ ] Verify domain with Resend
   - [ ] Set up SPF record
   - [ ] Set up DKIM
   - [ ] Test email deliverability

3. **Email Templates:**
   - [ ] Update logo URL to production CDN
   - [ ] Test all links point to production domain
   - [ ] Verify all templates render correctly

4. **Rate Limits:**
   - [ ] Check provider limits (Resend: 3,000/month free)
   - [ ] Plan for scaling (upgrade plan if needed)
   - [ ] Implement retry logic for failures

5. **Monitoring:**
   - [ ] Set up email delivery monitoring
   - [ ] Configure alerts for failures
   - [ ] Track bounce rates

---

## 📈 Scaling Considerations

### **If you exceed free tier limits:**

1. **Upgrade Resend:**
   - Pro plan: $20/month for 50,000 emails
   - Business plan: Custom pricing

2. **Use AWS SES:**
   - $0.10 per 1,000 emails
   - Very cost-effective at scale
   - Requires more setup

3. **Queue System:**
   - Implement Bull/BullMQ for email queues
   - Retry failed emails
   - Batch sending for newsletters

4. **Multiple Providers:**
   - Fallback to secondary provider if primary fails
   - Load balance across providers

---

## 🎨 Customization

### **Adding New Email Template:**

1. **Add method to EmailService:**
```typescript
async sendCustomEmail(to: string, data: any): Promise<boolean> {
  const template = this.getCustomTemplate(data)
  return this.sendEmail({
    to,
    subject: 'Custom Subject',
    template,
    type: 'editorial', // or 'alert'
  })
}
```

2. **Create template method:**
```typescript
private getCustomTemplate(data: any): EmailTemplate {
  return {
    html: `<div>Your HTML template here</div>`,
    text: `Your plain text version here`
  }
}
```

3. **Use in your module:**
```typescript
await this.emailService.sendCustomEmail(email, data)
```

---

## 📚 Resources

- **Resend Docs:** https://resend.com/docs
- **Nodemailer Docs:** https://nodemailer.com/
- **Email Design Best Practices:** https://www.emailonacid.com/
- **SPF/DKIM Setup:** https://mxtoolbox.com/

---

## ✨ Summary

Your email system is **production-ready** with:

✅ **11 professional email templates** covering all workflows
✅ **Dual provider support** (Resend + SMTP) with smart routing
✅ **Full integration** with auth, articles, and review workflows
✅ **Beautiful HTML templates** with mobile-responsive design
✅ **Plain text fallbacks** for all emails
✅ **Error handling** and logging
✅ **Easy configuration** via environment variables
✅ **Scalable architecture** ready for growth

**Next steps:**
1. Configure your `.env` file with valid credentials
2. Test email sending with the test endpoint
3. Verify emails are delivered correctly
4. Monitor logs for any issues
5. Deploy to production with domain verification

Your journal now has a **professional email communication system**! 🎉
