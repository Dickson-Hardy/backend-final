import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { ResendService } from "./services/resend.service"
import { SmtpService } from "./services/smtp.service"
import type { EmailOptions, EmailTemplate, EmailProvider } from "./interfaces/email.interface"

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly resendService: ResendService,
    private readonly smtpService: SmtpService,
  ) {}

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const provider = this.getEmailProvider(options.type)

      if (provider === "resend") {
        return await this.resendService.sendEmail(options)
      } else {
        return await this.smtpService.sendEmail(options)
      }
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack)
      return false
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const template = this.getWelcomeTemplate(name)
    return this.sendEmail({
      to,
      subject: "Welcome to AMHSJ",
      template,
      type: "alert",
    })
  }

  async sendVerificationEmail(to: string, name: string, token: string): Promise<boolean> {
    const template = this.getVerificationTemplate(name, token)
    return this.sendEmail({
      to,
      subject: "Verify Your Email - AMHSJ",
      template,
      type: "alert",
    })
  }

  async sendSubmissionConfirmation(to: string, authorName: string, articleTitle: string, submissionId: string): Promise<boolean> {
    const template = this.getSubmissionConfirmationTemplate(authorName, articleTitle, submissionId)
    return this.sendEmail({
      to,
      subject: "Submission Confirmation - AMHSJ",
      template,
      type: "editorial",
    })
  }

  async sendReviewInvitation(to: string, reviewerName: string, articleTitle: string, deadline: Date, submissionId: string): Promise<boolean> {
    const template = this.getReviewInvitationTemplate(reviewerName, articleTitle, deadline, submissionId)
    return this.sendEmail({
      to,
      subject: "Review Invitation - AMHSJ",
      template,
      type: "editorial",
    })
  }

  async sendReviewAssignment(to: string, reviewerName: string, articleTitle: string, deadline: Date, submissionId: string): Promise<boolean> {
    const template = this.getReviewAssignmentTemplate(reviewerName, articleTitle, deadline, submissionId)
    return this.sendEmail({
      to,
      subject: "Review Assignment Confirmed - AMHSJ",
      template,
      type: "editorial",
    })
  }

  async sendReviewCompleted(to: string, editorName: string, articleTitle: string, submissionId: string): Promise<boolean> {
    const template = this.getReviewCompletedTemplate(editorName, articleTitle, submissionId)
    return this.sendEmail({
      to,
      subject: "Review Completed - AMHSJ",
      template,
      type: "editorial",
    })
  }

  async sendStatusUpdate(to: string, authorName: string, articleTitle: string, status: string, submissionId: string): Promise<boolean> {
    const template = this.getStatusUpdateTemplate(authorName, articleTitle, status, submissionId)
    return this.sendEmail({
      to,
      subject: `Status Update: ${status} - AMHSJ`,
      template,
      type: "editorial",
    })
  }

  async sendRevisionRequest(to: string, authorName: string, articleTitle: string, comments: string, deadline: Date, submissionId: string): Promise<boolean> {
    const template = this.getRevisionRequestTemplate(authorName, articleTitle, comments, deadline, submissionId)
    return this.sendEmail({
      to,
      subject: "Revision Request - AMHSJ",
      template,
      type: "editorial",
    })
  }

  async sendReminderEmail(to: string, recipientName: string, reminderType: string, articleTitle: string, deadline: Date, submissionId: string): Promise<boolean> {
    const template = this.getReminderTemplate(recipientName, reminderType, articleTitle, deadline, submissionId)
    return this.sendEmail({
      to,
      subject: `Reminder: ${reminderType} - AMHSJ`,
      template,
      type: "alert",
    })
  }

  async sendDecisionNotification(
    to: string,
    authorName: string,
    articleTitle: string,
    decision: string,
    comments?: string,
    submissionId?: string,
  ): Promise<boolean> {
    const template = this.getDecisionNotificationTemplate(authorName, articleTitle, decision, comments, submissionId)
    return this.sendEmail({
      to,
      subject: `Editorial Decision: ${decision} - AMHSJ`,
      template,
      type: "editorial",
    })
  }

  async sendPublicationNotification(
    to: string,
    authorName: string,
    articleTitle: string,
    doi: string,
    volumeNumber?: string,
    issueNumber?: string,
  ): Promise<boolean> {
    const template = this.getPublicationNotificationTemplate(authorName, articleTitle, doi, volumeNumber, issueNumber)
    return this.sendEmail({
      to,
      subject: "Article Published - AMHSJ",
      template,
      type: "alert",
    })
  }

  async sendNewsletterAlert(to: string[], subject: string, content: string): Promise<boolean> {
    const template = this.getNewsletterTemplate(content)
    const promises = to.map((email) =>
      this.sendEmail({
        to: email,
        subject,
        template,
        type: "alert",
      }),
    )

    const results = await Promise.allSettled(promises)
    const successCount = results.filter((result) => result.status === "fulfilled").length

    this.logger.log(`Newsletter sent to ${successCount}/${to.length} recipients`)
    return successCount > 0
  }

  private getEmailProvider(type: "alert" | "editorial"): EmailProvider {
    // Use Resend for alerts and notifications, SMTP for editorial communications
    return type === "alert" ? "resend" : "smtp"
  }

  private getWelcomeTemplate(name: string): EmailTemplate {
    return {
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; backdrop-filter: blur(10px);">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Welcome to AMHSJ</h1>
              <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">Advances in Medicine & Health Sciences Journal</p>
              <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0 0; font-size: 14px;">Peer-Reviewed Medical Research Platform</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 45px 35px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 25px; font-size: 24px; font-weight: 600;">Dear Dr. ${name},</h2>
            
            <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
              Welcome to the <strong>Advances in Medicine & Health Sciences Journal (AMHSJ)</strong> community! We are delighted to have you join our distinguished network of healthcare professionals, researchers, and medical practitioners.
            </p>
            
            <p style="color: #4b5563; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Your account has been successfully created and verified. You now have access to our comprehensive platform where you can:
            </p>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 25px 0;">
              <ul style="color: #374151; line-height: 1.8; margin: 0; padding-left: 20px; font-size: 15px;">
                <li><strong>Submit Research Articles:</strong> Share your groundbreaking medical research</li>
                <li><strong>Peer Review:</strong> Contribute to maintaining high academic standards</li>
                <li><strong>Access Library:</strong> Browse our extensive collection of peer-reviewed articles</li>
                <li><strong>Track Submissions:</strong> Monitor your manuscript's progress in real-time</li>
                <li><strong>Network:</strong> Connect with fellow researchers and medical professionals</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${this.configService.get("FRONTEND_URL")}/dashboard" 
                 style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.3);">
                Access Your Dashboard
              </a>
            </div>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border: 1px solid #f59e0b; margin: 30px 0;">
              <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">📋 Important Information:</h4>
              <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                Please review our <a href="${this.configService.get("FRONTEND_URL")}/guidelines" style="color: #1e40af; text-decoration: underline;">Author Guidelines</a> and 
                <a href="${this.configService.get("FRONTEND_URL")}/ethics" style="color: #1e40af; text-decoration: underline;">Ethics Policy</a> before submitting your first manuscript.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 35px; text-align: center;">
              If you have any questions or need assistance, please contact our editorial team at 
              <a href="mailto:editorial@amhsj.org" style="color: #3b82f6; text-decoration: none;">editorial@amhsj.org</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 25px 35px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} Advances in Medicine & Health Sciences Journal. All rights reserved.<br>
              This email was sent to you because you registered for an AMHSJ account.
            </p>
          </div>
        </div>
      `,
      text: `Welcome to AMHSJ, Dr. ${name}!\n\nYour account has been successfully created. You can now submit articles, participate in peer reviews, and access our extensive library of medical research.\n\nAccess your dashboard: ${this.configService.get("FRONTEND_URL")}/dashboard\n\nFor questions, contact: editorial@amhsj.org`,
    }
  }

  private getVerificationTemplate(name: string, token: string): EmailTemplate {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`
    
    return {
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; backdrop-filter: blur(10px);">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">📧 Verify Your Email</h1>
              <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">AMHSJ Account Verification</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 45px 35px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 25px; font-size: 24px; font-weight: 600;">Dear ${name},</h2>
            
            <p style="color: #4b5563; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Thank you for registering with the <strong>Advances in Medicine & Health Sciences Journal (AMHSJ)</strong>. 
              To complete your account setup and start submitting your research, please verify your email address.
            </p>
            
            <!-- Verification Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);">
                ✅ Verify Email Address
              </a>
            </div>
            
            <!-- Alternative Link -->
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 25px 0;">
              <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">If the button doesn't work, copy and paste this link:</p>
              <p style="color: #1e40af; margin: 0; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
            </div>
            
            <!-- Important Information -->
            <div style="background: #fef3c7; padding: 25px; border-radius: 8px; border: 1px solid #f59e0b; margin: 25px 0;">
              <h4 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">⚠️ Important Information</h4>
              <ul style="color: #92400e; line-height: 1.8; margin: 0; padding-left: 20px; font-size: 15px;">
                <li>This verification link will expire in <strong>24 hours</strong> for security reasons.</li>
                <li>If you didn't create an account with AMHSJ, please ignore this email.</li>
                <li>After verification, you'll be able to submit research articles and access all author features.</li>
              </ul>
            </div>
            
            <p style="color: #4b5563; line-height: 1.7; margin-bottom: 0; font-size: 16px;">
              If you have any questions or need assistance, please don't hesitate to contact our support team.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8fafc; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px;">
              <strong>Advances in Medicine & Health Sciences Journal</strong>
            </p>
            <p style="color: #94a3b8; margin: 0; font-size: 12px;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `
        AMHSJ Email Verification
        
        Dear ${name},
        
        Thank you for registering with the Advances in Medicine & Health Sciences Journal (AMHSJ). 
        To complete your account setup, please verify your email address by clicking the link below:
        
        ${verificationUrl}
        
        Important Information:
        - This verification link will expire in 24 hours for security reasons.
        - If you didn't create an account with AMHSJ, please ignore this email.
        - After verification, you'll be able to submit research articles and access all author features.
        
        If you have any questions, please contact our support team.
        
        Best regards,
        AMHSJ Editorial Team
      `
    }
  }

  private getSubmissionConfirmationTemplate(authorName: string, articleTitle: string, submissionId: string): EmailTemplate {
    const submissionDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    return {
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; backdrop-filter: blur(10px);">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">✅ Submission Confirmed</h1>
              <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">AMHSJ Manuscript Submission</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 45px 35px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 25px; font-size: 24px; font-weight: 600;">Dear Dr. ${authorName},</h2>
            
            <p style="color: #4b5563; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Thank you for submitting your manuscript to the <strong>Advances in Medicine & Health Sciences Journal (AMHSJ)</strong>. 
              We have successfully received your submission and it is now in our editorial system.
            </p>
            
            <!-- Submission Details -->
            <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; border-left: 4px solid #059669; margin: 25px 0;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">📄 Submission Details</h3>
              <div style="color: #374151; line-height: 1.8;">
                <p style="margin: 0 0 8px 0;"><strong>Manuscript Title:</strong> ${articleTitle}</p>
                <p style="margin: 0 0 8px 0;"><strong>Submission ID:</strong> AMHSJ-${submissionId}</p>
                <p style="margin: 0 0 8px 0;"><strong>Submission Date:</strong> ${submissionDate}</p>
                <p style="margin: 0;"><strong>Status:</strong> <span style="color: #059669; font-weight: 600;">Under Editorial Review</span></p>
              </div>
            </div>
            
            <!-- Next Steps -->
            <div style="background: #fef3c7; padding: 25px; border-radius: 8px; border: 1px solid #f59e0b; margin: 25px 0;">
              <h4 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📋 What Happens Next?</h4>
              <ol style="color: #92400e; line-height: 1.8; margin: 0; padding-left: 20px; font-size: 15px;">
                <li><strong>Initial Review (5-7 business days):</strong> Our editorial team will assess your manuscript for completeness and adherence to journal guidelines.</li>
                <li><strong>Peer Review Assignment:</strong> If accepted for review, your manuscript will be assigned to qualified reviewers in your field.</li>
                <li><strong>Review Process (2-4 weeks):</strong> Expert reviewers will evaluate your research methodology, findings, and contribution to the field.</li>
                <li><strong>Editorial Decision:</strong> You will receive a detailed decision letter with reviewer comments and recommendations.</li>
              </ol>
            </div>
            
            <!-- Important Information -->
            <div style="background: #eff6ff; padding: 25px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 25px 0;">
              <h4 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">ℹ️ Important Information</h4>
              <ul style="color: #1e40af; line-height: 1.8; margin: 0; padding-left: 20px; font-size: 15px;">
                <li>You can track your submission status in real-time through your author dashboard</li>
                <li>All communications regarding your manuscript will be sent to your registered email address</li>
                <li>Please ensure your contact information is up-to-date in your profile</li>
                <li>Do not submit the same manuscript to other journals while under review</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${this.configService.get("FRONTEND_URL")}/dashboard/submissions/${submissionId}" 
                 style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(5, 150, 105, 0.3);">
                Track Your Submission
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 35px; text-align: center;">
              Questions about your submission? Contact our editorial team at 
              <a href="mailto:editorial@amhsj.org" style="color: #3b82f6; text-decoration: none;">editorial@amhsj.org</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 25px 35px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} Advances in Medicine & Health Sciences Journal. All rights reserved.<br>
              This email confirms your manuscript submission to AMHSJ.
            </p>
          </div>
        </div>
      `,
      text: `Dear Dr. ${authorName},\n\nThank you for submitting your manuscript "${articleTitle}" to AMHSJ.\n\nSubmission Details:\n- Submission ID: AMHSJ-${submissionId}\n- Submission Date: ${submissionDate}\n- Status: Under Editorial Review\n\nYour manuscript will undergo initial editorial review within 5-7 business days. You can track your submission at: ${this.configService.get("FRONTEND_URL")}/dashboard/submissions/${submissionId}\n\nFor questions, contact: editorial@amhsj.org`,
    }
  }

  private getReviewInvitationTemplate(reviewerName: string, articleTitle: string, deadline: Date, submissionId: string): EmailTemplate {
    const deadlineFormatted = deadline.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    return {
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; backdrop-filter: blur(10px);">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">🔍 Review Invitation</h1>
              <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">AMHSJ Peer Review Request</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 45px 35px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 25px; font-size: 24px; font-weight: 600;">Dear Dr. ${reviewerName},</h2>
            
            <p style="color: #4b5563; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              We hope this message finds you well. The editorial team of the <strong>Advances in Medicine & Health Sciences Journal (AMHSJ)</strong> 
              would like to invite you to serve as a peer reviewer for a manuscript submitted to our journal.
            </p>
            
            <p style="color: #4b5563; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Your expertise and reputation in the field make you an ideal candidate to provide a thorough and constructive review of this research.
            </p>
            
            <!-- Manuscript Details -->
            <div style="background: #faf5ff; padding: 25px; border-radius: 8px; border-left: 4px solid #7c3aed; margin: 25px 0;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">📄 Manuscript Details</h3>
              <div style="color: #374151; line-height: 1.8;">
                <p style="margin: 0 0 8px 0;"><strong>Title:</strong> ${articleTitle}</p>
                <p style="margin: 0 0 8px 0;"><strong>Submission ID:</strong> AMHSJ-${submissionId}</p>
                <p style="margin: 0 0 8px 0;"><strong>Review Deadline:</strong> <span style="color: #dc2626; font-weight: 600;">${deadlineFormatted}</span></p>
                <p style="margin: 0;"><strong>Estimated Review Time:</strong> 2-3 hours</p>
              </div>
            </div>
            
            <!-- Review Guidelines -->
            <div style="background: #f0f9ff; padding: 25px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 25px 0;">
              <h4 style="color: #0c4a6e; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📋 Review Guidelines</h4>
              <ul style="color: #0c4a6e; line-height: 1.8; margin: 0; padding-left: 20px; font-size: 15px;">
                <li>Evaluate the manuscript's originality, methodology, and contribution to the field</li>
                <li>Assess the quality of research design, data analysis, and interpretation</li>
                <li>Provide constructive feedback to help authors improve their work</li>
                <li>Ensure adherence to ethical standards and journal guidelines</li>
                <li>Submit your review through our online system before the deadline</li>
              </ul>
            </div>
            
            <!-- Benefits -->
            <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 25px 0;">
              <h4 style="color: #166534; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">🎯 Benefits of Reviewing</h4>
              <ul style="color: #166534; line-height: 1.8; margin: 0; padding-left: 20px; font-size: 15px;">
                <li>Stay current with the latest research in your field</li>
                <li>Contribute to maintaining high academic standards</li>
                <li>Build your professional reputation and network</li>
                <li>Earn recognition as a valued AMHSJ reviewer</li>
                <li>Access to reviewer resources and training materials</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${this.configService.get("FRONTEND_URL")}/dashboard/reviewer/accept/${submissionId}" 
                 style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(34, 197, 94, 0.3); margin-right: 15px;">
                ✅ Accept Review
              </a>
              <a href="${this.configService.get("FRONTEND_URL")}/dashboard/reviewer/decline/${submissionId}" 
                 style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(107, 114, 128, 0.3);">
                ❌ Decline
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 35px; text-align: center;">
              Questions about this review invitation? Contact our editorial team at 
              <a href="mailto:editorial@amhsj.org" style="color: #3b82f6; text-decoration: none;">editorial@amhsj.org</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 25px 35px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} Advances in Medicine & Health Sciences Journal. All rights reserved.<br>
              This email is sent to qualified reviewers for AMHSJ peer review process.
            </p>
          </div>
        </div>
      `,
      text: `Dear Dr. ${reviewerName},\n\nYou are invited to review a manuscript for AMHSJ.\n\nManuscript Details:\n- Title: ${articleTitle}\n- Submission ID: AMHSJ-${submissionId}\n- Review Deadline: ${deadlineFormatted}\n\nPlease respond to this invitation by visiting: ${this.configService.get("FRONTEND_URL")}/dashboard/reviewer\n\nFor questions, contact: editorial@amhsj.org`,
    }
  }

  private getReviewAssignmentTemplate(reviewerName: string, articleTitle: string, deadline: Date, submissionId: string): EmailTemplate {
    const deadlineFormatted = deadline.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    return {
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; backdrop-filter: blur(10px);">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">✅ Review Assignment Confirmed</h1>
              <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">AMHSJ Peer Review Assignment</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 45px 35px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 25px; font-size: 24px; font-weight: 600;">Dear Dr. ${reviewerName},</h2>
            
            <p style="color: #4b5563; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              Thank you for accepting our invitation to review a manuscript for the <strong>Advances in Medicine & Health Sciences Journal (AMHSJ)</strong>. 
              Your expertise is invaluable to maintaining the high quality of our publication.
            </p>
            
            <!-- Assignment Details -->
            <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; border-left: 4px solid #059669; margin: 25px 0;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">📄 Assignment Details</h3>
              <div style="color: #374151; line-height: 1.8;">
                <p style="margin: 0 0 8px 0;"><strong>Manuscript Title:</strong> ${articleTitle}</p>
                <p style="margin: 0 0 8px 0;"><strong>Submission ID:</strong> AMHSJ-${submissionId}</p>
                <p style="margin: 0 0 8px 0;"><strong>Review Deadline:</strong> <span style="color: #dc2626; font-weight: 600;">${deadlineFormatted}</span></p>
                <p style="margin: 0;"><strong>Assignment Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${this.configService.get("FRONTEND_URL")}/dashboard/reviewer/review/${submissionId}" 
                 style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(5, 150, 105, 0.3);">
                Begin Review
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 35px; text-align: center;">
              Questions about this review? Contact our editorial team at 
              <a href="mailto:editorial@amhsj.org" style="color: #3b82f6; text-decoration: none;">editorial@amhsj.org</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 25px 35px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} Advances in Medicine & Health Sciences Journal. All rights reserved.<br>
              This email confirms your review assignment for AMHSJ.
            </p>
          </div>
        </div>
      `,
      text: `Dear Dr. ${reviewerName},\n\nYour review assignment has been confirmed.\n\nAssignment Details:\n- Title: ${articleTitle}\n- Submission ID: AMHSJ-${submissionId}\n- Review Deadline: ${deadlineFormatted}\n\nBegin your review at: ${this.configService.get("FRONTEND_URL")}/dashboard/reviewer/review/${submissionId}\n\nFor questions, contact: editorial@amhsj.org`,
    }
  }

  private getReviewCompletedTemplate(editorName: string, articleTitle: string, submissionId: string): EmailTemplate {
    return {
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; backdrop-filter: blur(10px);">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">📝 Review Completed</h1>
              <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">AMHSJ Editorial Notification</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 45px 35px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 25px; font-size: 24px; font-weight: 600;">Dear Dr. ${editorName},</h2>
            
            <p style="color: #4b5563; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              A peer review has been completed for a manuscript under your editorial supervision. The review is now ready for your evaluation and editorial decision.
            </p>
            
            <!-- Review Details -->
            <div style="background: #f0f9ff; padding: 25px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 25px 0;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">📄 Review Details</h3>
              <div style="color: #374151; line-height: 1.8;">
                <p style="margin: 0 0 8px 0;"><strong>Manuscript Title:</strong> ${articleTitle}</p>
                <p style="margin: 0 0 8px 0;"><strong>Submission ID:</strong> AMHSJ-${submissionId}</p>
                <p style="margin: 0 0 8px 0;"><strong>Review Completed:</strong> ${new Date().toLocaleDateString()}</p>
                <p style="margin: 0;"><strong>Status:</strong> <span style="color: #059669; font-weight: 600;">Ready for Editorial Decision</span></p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${this.configService.get("FRONTEND_URL")}/dashboard/editorial/review/${submissionId}" 
                 style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(14, 165, 233, 0.3);">
                View Review & Make Decision
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 35px; text-align: center;">
              Questions about this review? Contact our editorial team at 
              <a href="mailto:editorial@amhsj.org" style="color: #3b82f6; text-decoration: none;">editorial@amhsj.org</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 25px 35px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} Advances in Medicine & Health Sciences Journal. All rights reserved.<br>
              This email notifies you of a completed review for AMHSJ.
            </p>
          </div>
        </div>
      `,
      text: `Dear Dr. ${editorName},\n\nA peer review has been completed for manuscript "${articleTitle}" (AMHSJ-${submissionId}).\n\nReview completed: ${new Date().toLocaleDateString()}\nStatus: Ready for Editorial Decision\n\nView review and make decision at: ${this.configService.get("FRONTEND_URL")}/dashboard/editorial/review/${submissionId}\n\nFor questions, contact: editorial@amhsj.org`,
    }
  }

  private getStatusUpdateTemplate(authorName: string, articleTitle: string, status: string, submissionId: string): EmailTemplate {
    const statusColors = {
      'under_review': '#0ea5e9',
      'revision_requested': '#f59e0b',
      'accepted': '#22c55e',
      'rejected': '#ef4444',
      'published': '#8b5cf6'
    }
    
    const statusLabels = {
      'under_review': 'Under Review',
      'revision_requested': 'Revision Requested',
      'accepted': 'Accepted',
      'rejected': 'Rejected',
      'published': 'Published'
    }
    
    const color = statusColors[status] || '#6b7280'
    const label = statusLabels[status] || status
    
    return {
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 50%, ${color}aa 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; backdrop-filter: blur(10px);">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">📊 Status Update</h1>
              <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">AMHSJ Manuscript Status</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 45px 35px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 25px; font-size: 24px; font-weight: 600;">Dear Dr. ${authorName},</h2>
            
            <p style="color: #4b5563; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              We are writing to inform you of a status update regarding your manuscript submitted to the <strong>Advances in Medicine & Health Sciences Journal (AMHSJ)</strong>.
            </p>
            
            <!-- Status Details -->
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid ${color}; margin: 25px 0;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">📄 Status Details</h3>
              <div style="color: #374151; line-height: 1.8;">
                <p style="margin: 0 0 8px 0;"><strong>Manuscript Title:</strong> ${articleTitle}</p>
                <p style="margin: 0 0 8px 0;"><strong>Submission ID:</strong> AMHSJ-${submissionId}</p>
                <p style="margin: 0 0 8px 0;"><strong>New Status:</strong> <span style="color: ${color}; font-weight: 600;">${label}</span></p>
                <p style="margin: 0;"><strong>Update Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${this.configService.get("FRONTEND_URL")}/dashboard/submissions/${submissionId}" 
                 style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 ${color}30;">
                View Submission Details
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 35px; text-align: center;">
              Questions about this status update? Contact our editorial team at 
              <a href="mailto:editorial@amhsj.org" style="color: #3b82f6; text-decoration: none;">editorial@amhsj.org</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 25px 35px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} Advances in Medicine & Health Sciences Journal. All rights reserved.<br>
              This email provides a status update for your AMHSJ submission.
            </p>
          </div>
        </div>
      `,
      text: `Dear Dr. ${authorName},\n\nStatus update for your manuscript "${articleTitle}" (AMHSJ-${submissionId}).\n\nNew Status: ${label}\nUpdate Date: ${new Date().toLocaleDateString()}\n\nView details at: ${this.configService.get("FRONTEND_URL")}/dashboard/submissions/${submissionId}\n\nFor questions, contact: editorial@amhsj.org`,
    }
  }

  private getRevisionRequestTemplate(authorName: string, articleTitle: string, comments: string, deadline: Date, submissionId: string): EmailTemplate {
    const deadlineFormatted = deadline.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    return {
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; backdrop-filter: blur(10px);">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">📝 Revision Request</h1>
              <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">AMHSJ Editorial Decision</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 45px 35px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 25px; font-size: 24px; font-weight: 600;">Dear Dr. ${authorName},</h2>
            
            <p style="color: #4b5563; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              After careful consideration by our editorial team and peer reviewers, we are requesting revisions to your manuscript submitted to the <strong>Advances in Medicine & Health Sciences Journal (AMHSJ)</strong>.
            </p>
            
            <!-- Revision Details -->
            <div style="background: #fef3c7; padding: 25px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 25px 0;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">📄 Revision Details</h3>
              <div style="color: #374151; line-height: 1.8;">
                <p style="margin: 0 0 8px 0;"><strong>Manuscript Title:</strong> ${articleTitle}</p>
                <p style="margin: 0 0 8px 0;"><strong>Submission ID:</strong> AMHSJ-${submissionId}</p>
                <p style="margin: 0 0 8px 0;"><strong>Revision Deadline:</strong> <span style="color: #dc2626; font-weight: 600;">${deadlineFormatted}</span></p>
                <p style="margin: 0;"><strong>Status:</strong> <span style="color: #f59e0b; font-weight: 600;">Revision Requested</span></p>
              </div>
            </div>
            
            <!-- Reviewer Comments -->
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 25px 0;">
              <h4 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📋 Reviewer Comments & Recommendations</h4>
              <div style="color: #374151; line-height: 1.7; white-space: pre-wrap;">${comments}</div>
            </div>
            
            <!-- Next Steps -->
            <div style="background: #eff6ff; padding: 25px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 25px 0;">
              <h4 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📋 Next Steps</h4>
              <ol style="color: #1e40af; line-height: 1.8; margin: 0; padding-left: 20px; font-size: 15px;">
                <li>Carefully review all reviewer comments and editorial feedback</li>
                <li>Address each point systematically in your revision</li>
                <li>Prepare a detailed response letter explaining your changes</li>
                <li>Submit your revised manuscript before the deadline</li>
                <li>Include both the revised manuscript and response letter</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${this.configService.get("FRONTEND_URL")}/dashboard/submissions/${submissionId}/revise" 
                 style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(245, 158, 11, 0.3);">
                Submit Revision
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 35px; text-align: center;">
              Questions about the revision requirements? Contact our editorial team at 
              <a href="mailto:editorial@amhsj.org" style="color: #3b82f6; text-decoration: none;">editorial@amhsj.org</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 25px 35px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} Advances in Medicine & Health Sciences Journal. All rights reserved.<br>
              This email requests revisions for your AMHSJ submission.
            </p>
          </div>
        </div>
      `,
      text: `Dear Dr. ${authorName},\n\nRevision requested for your manuscript "${articleTitle}" (AMHSJ-${submissionId}).\n\nRevision Deadline: ${deadlineFormatted}\nStatus: Revision Requested\n\nReviewer Comments:\n${comments}\n\nSubmit revision at: ${this.configService.get("FRONTEND_URL")}/dashboard/submissions/${submissionId}/revise\n\nFor questions, contact: editorial@amhsj.org`,
    }
  }

  private getReminderTemplate(recipientName: string, reminderType: string, articleTitle: string, deadline: Date, submissionId: string): EmailTemplate {
    const deadlineFormatted = deadline.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    const daysUntilDeadline = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; backdrop-filter: blur(10px);">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">⏰ Reminder</h1>
              <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">AMHSJ ${reminderType} Deadline</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 45px 35px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 25px; font-size: 24px; font-weight: 600;">Dear Dr. ${recipientName},</h2>
            
            <p style="color: #4b5563; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              This is a friendly reminder regarding your ${reminderType.toLowerCase()} deadline for a manuscript submitted to the <strong>Advances in Medicine & Health Sciences Journal (AMHSJ)</strong>.
            </p>
            
            <!-- Reminder Details -->
            <div style="background: #fef2f2; padding: 25px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 25px 0;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">⏰ Reminder Details</h3>
              <div style="color: #374151; line-height: 1.8;">
                <p style="margin: 0 0 8px 0;"><strong>Manuscript Title:</strong> ${articleTitle}</p>
                <p style="margin: 0 0 8px 0;"><strong>Submission ID:</strong> AMHSJ-${submissionId}</p>
                <p style="margin: 0 0 8px 0;"><strong>Deadline:</strong> <span style="color: #dc2626; font-weight: 600;">${deadlineFormatted}</span></p>
                <p style="margin: 0;"><strong>Days Remaining:</strong> <span style="color: #dc2626; font-weight: 600;">${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''}</span></p>
              </div>
            </div>
            
            ${daysUntilDeadline <= 3 ? `
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border: 1px solid #f59e0b; margin: 25px 0;">
              <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">⚠️ Urgent Notice</h4>
              <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                This deadline is approaching quickly. Please prioritize this ${reminderType.toLowerCase()} to avoid any delays in the review process.
              </p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${this.configService.get("FRONTEND_URL")}/dashboard/${reminderType.toLowerCase().replace(' ', '-')}/${submissionId}" 
                 style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(220, 38, 38, 0.3);">
                Complete ${reminderType}
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 35px; text-align: center;">
              Questions about this deadline? Contact our editorial team at 
              <a href="mailto:editorial@amhsj.org" style="color: #3b82f6; text-decoration: none;">editorial@amhsj.org</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 25px 35px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} Advances in Medicine & Health Sciences Journal. All rights reserved.<br>
              This email is a reminder for your AMHSJ ${reminderType.toLowerCase()} deadline.
            </p>
          </div>
        </div>
      `,
      text: `Dear Dr. ${recipientName},\n\nReminder: ${reminderType} deadline approaching for "${articleTitle}" (AMHSJ-${submissionId}).\n\nDeadline: ${deadlineFormatted}\nDays Remaining: ${daysUntilDeadline}\n\nComplete your ${reminderType.toLowerCase()} at: ${this.configService.get("FRONTEND_URL")}/dashboard/${reminderType.toLowerCase().replace(' ', '-')}/${submissionId}\n\nFor questions, contact: editorial@amhsj.org`,
    }
  }

  private getDecisionNotificationTemplate(
    authorName: string,
    articleTitle: string,
    decision: string,
    comments?: string,
    submissionId?: string,
  ): EmailTemplate {
    const isAccepted = decision.toLowerCase().includes("accept")
    const isRejected = decision.toLowerCase().includes("reject")
    const color = isAccepted ? "#059669" : isRejected ? "#dc2626" : "#0ea5e9"
    const icon = isAccepted ? "🎉" : isRejected ? "❌" : "📋"

    return {
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 50%, ${color}aa 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; backdrop-filter: blur(10px);">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">${icon} Editorial Decision</h1>
              <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">AMHSJ Review Outcome</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 45px 35px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 25px; font-size: 24px; font-weight: 600;">Dear Dr. ${authorName},</h2>
            
            <p style="color: #4b5563; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              After careful consideration by our editorial team and peer reviewers, we have reached a decision regarding your manuscript submitted to the <strong>Advances in Medicine & Health Sciences Journal (AMHSJ)</strong>.
            </p>
            
            <!-- Decision Details -->
            <div style="background: ${isAccepted ? '#f0fdf4' : isRejected ? '#fef2f2' : '#f0f9ff'}; padding: 25px; border-radius: 8px; border-left: 4px solid ${color}; margin: 25px 0;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">📄 Decision Details</h3>
              <div style="color: #374151; line-height: 1.8;">
                <p style="margin: 0 0 8px 0;"><strong>Manuscript Title:</strong> ${articleTitle}</p>
                ${submissionId ? `<p style="margin: 0 0 8px 0;"><strong>Submission ID:</strong> AMHSJ-${submissionId}</p>` : ''}
                <p style="margin: 0 0 8px 0;"><strong>Editorial Decision:</strong> <span style="color: ${color}; font-weight: 600; font-size: 18px;">${decision}</span></p>
                <p style="margin: 0;"><strong>Decision Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
            </div>
            
            ${comments ? `
            <!-- Editorial Comments -->
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 25px 0;">
              <h4 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📋 Editorial Comments</h4>
              <div style="color: #374151; line-height: 1.7; white-space: pre-wrap;">${comments}</div>
            </div>
            ` : ''}
            
            <!-- Next Steps -->
            <div style="background: ${isAccepted ? '#f0fdf4' : isRejected ? '#fef2f2' : '#eff6ff'}; padding: 25px; border-radius: 8px; border-left: 4px solid ${color}; margin: 25px 0;">
              <h4 style="color: ${isAccepted ? '#166534' : isRejected ? '#991b1b' : '#1e40af'}; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📋 Next Steps</h4>
              <div style="color: ${isAccepted ? '#166534' : isRejected ? '#991b1b' : '#1e40af'}; line-height: 1.8; font-size: 15px;">
                ${isAccepted ? `
                  <p style="margin: 0 0 10px 0;">🎉 <strong>Congratulations!</strong> Your manuscript has been accepted for publication.</p>
                  <ul style="margin: 0; padding-left: 20px;">
                    <li>You will receive publication guidelines and formatting requirements</li>
                    <li>Our production team will contact you for final manuscript preparation</li>
                    <li>Your article will be published in an upcoming issue of AMHSJ</li>
                    <li>You will receive a DOI and publication notification</li>
                  </ul>
                ` : isRejected ? `
                  <p style="margin: 0 0 10px 0;">We appreciate your interest in AMHSJ and encourage you to:</p>
                  <ul style="margin: 0; padding-left: 20px;">
                    <li>Carefully review the editorial comments and suggestions</li>
                    <li>Consider addressing the reviewers' feedback</li>
                    <li>Submit a revised version or consider other journals</li>
                    <li>Continue contributing to medical research</li>
                  </ul>
                ` : `
                  <p style="margin: 0 0 10px 0;">Please review the editorial comments and follow the instructions provided.</p>
                `}
              </div>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${this.configService.get("FRONTEND_URL")}/dashboard/submissions${submissionId ? `/${submissionId}` : ''}" 
                 style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 ${color}30;">
                View Submission Details
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 35px; text-align: center;">
              Questions about this decision? Contact our editorial team at 
              <a href="mailto:editorial@amhsj.org" style="color: #3b82f6; text-decoration: none;">editorial@amhsj.org</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 25px 35px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} Advances in Medicine & Health Sciences Journal. All rights reserved.<br>
              This email provides the editorial decision for your AMHSJ submission.
            </p>
          </div>
        </div>
      `,
      text: `Dear Dr. ${authorName},\n\nEditorial decision for your manuscript "${articleTitle}"${submissionId ? ` (AMHSJ-${submissionId})` : ''}.\n\nDecision: ${decision}\nDecision Date: ${new Date().toLocaleDateString()}\n\n${comments ? `Editorial Comments:\n${comments}\n\n` : ''}View details at: ${this.configService.get("FRONTEND_URL")}/dashboard/submissions${submissionId ? `/${submissionId}` : ''}\n\nFor questions, contact: editorial@amhsj.org`,
    }
  }

  private getPublicationNotificationTemplate(authorName: string, articleTitle: string, doi: string, volumeNumber?: string, issueNumber?: string): EmailTemplate {
    const publicationDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    })
    
    return {
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; backdrop-filter: blur(10px);">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">🎉 Article Published!</h1>
              <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">AMHSJ Publication Notification</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 45px 35px; background: #ffffff;">
            <h2 style="color: #1f2937; margin-bottom: 25px; font-size: 24px; font-weight: 600;">Dear Dr. ${authorName},</h2>
            
            <p style="color: #4b5563; line-height: 1.7; margin-bottom: 25px; font-size: 16px;">
              <strong>Congratulations!</strong> Your research article has been successfully published in the <strong>Advances in Medicine & Health Sciences Journal (AMHSJ)</strong> and is now available online for the global medical community.
            </p>
            
            <!-- Publication Details -->
            <div style="background: #faf5ff; padding: 25px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin: 25px 0;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">📄 Publication Details</h3>
              <div style="color: #374151; line-height: 1.8;">
                <p style="margin: 0 0 8px 0;"><strong>Article Title:</strong> ${articleTitle}</p>
                <p style="margin: 0 0 8px 0;"><strong>DOI:</strong> <span style="color: #8b5cf6; font-weight: 600;">${doi}</span></p>
                <p style="margin: 0 0 8px 0;"><strong>Publication Date:</strong> ${publicationDate}</p>
                ${volumeNumber ? `<p style="margin: 0 0 8px 0;"><strong>Volume:</strong> ${volumeNumber}</p>` : ''}
                ${issueNumber ? `<p style="margin: 0 0 8px 0;"><strong>Issue:</strong> ${issueNumber}</p>` : ''}
                <p style="margin: 0;"><strong>Journal:</strong> Advances in Medicine & Health Sciences Journal (AMHSJ)</p>
              </div>
            </div>
            
            <!-- Impact Information -->
            <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 25px 0;">
              <h4 style="color: #166534; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">🌟 Your Research Impact</h4>
              <ul style="color: #166534; line-height: 1.8; margin: 0; padding-left: 20px; font-size: 15px;">
                <li>Your article is now accessible to researchers, clinicians, and medical professionals worldwide</li>
                <li>It contributes to the advancement of medical knowledge and evidence-based practice</li>
                <li>Your work will be indexed in major medical databases and search engines</li>
                <li>You can track citations and impact metrics through your author dashboard</li>
              </ul>
            </div>
            
            <!-- Sharing & Promotion -->
            <div style="background: #eff6ff; padding: 25px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 25px 0;">
              <h4 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📢 Share Your Achievement</h4>
              <p style="color: #1e40af; line-height: 1.7; margin: 0 0 15px 0; font-size: 15px;">
                Help increase the visibility and impact of your research by sharing it with your professional network:
              </p>
              <ul style="color: #1e40af; line-height: 1.8; margin: 0; padding-left: 20px; font-size: 15px;">
                <li>Share on social media platforms (LinkedIn, Twitter, Facebook)</li>
                <li>Present at conferences and medical meetings</li>
                <li>Include in your CV, research portfolio, and institutional profiles</li>
                <li>Send to colleagues and collaborators in your field</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${this.configService.get("FRONTEND_URL")}/articles/${doi}" 
                 style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.3); margin-right: 15px;">
                📖 View Published Article
              </a>
              <a href="${this.configService.get("FRONTEND_URL")}/articles/${doi}/share" 
                 style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.3);">
                📤 Share Article
              </a>
            </div>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border: 1px solid #f59e0b; margin: 30px 0;">
              <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">📊 Track Your Impact</h4>
              <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                Monitor your article's performance, citations, and downloads through your author dashboard. 
                <a href="${this.configService.get("FRONTEND_URL")}/dashboard/analytics" style="color: #1e40af; text-decoration: underline;">View Analytics</a>
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 35px; text-align: center;">
              Questions about your publication? Contact our editorial team at 
              <a href="mailto:editorial@amhsj.org" style="color: #3b82f6; text-decoration: none;">editorial@amhsj.org</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 25px 35px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} Advances in Medicine & Health Sciences Journal. All rights reserved.<br>
              This email confirms the publication of your article in AMHSJ.
            </p>
          </div>
        </div>
      `,
      text: `Congratulations Dr. ${authorName}!\n\nYour article "${articleTitle}" has been published in AMHSJ.\n\nPublication Details:\n- DOI: ${doi}\n- Publication Date: ${publicationDate}\n${volumeNumber ? `- Volume: ${volumeNumber}\n` : ''}${issueNumber ? `- Issue: ${issueNumber}\n` : ''}\n\nView your published article: ${this.configService.get("FRONTEND_URL")}/articles/${doi}\nShare your article: ${this.configService.get("FRONTEND_URL")}/articles/${doi}/share\n\nFor questions, contact: editorial@amhsj.org`,
    }
  }

  private getNewsletterTemplate(content: string): EmailTemplate {
    return {
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 50%, #4b5563 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; backdrop-filter: blur(10px);">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">📰 AMHSJ Newsletter</h1>
              <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">Advances in Medicine & Health Sciences Journal</p>
              <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0 0; font-size: 14px;">Latest Research & Updates</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 45px 35px; background: #ffffff;">
            <div style="color: #374151; line-height: 1.7; font-size: 16px;">
              ${content}
            </div>
            
            <!-- Newsletter Footer -->
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border-top: 1px solid #e5e7eb; margin: 40px 0 0 0;">
              <h4 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📚 Stay Connected</h4>
              <div style="color: #4b5563; line-height: 1.6; font-size: 14px;">
                <p style="margin: 0 0 10px 0;">Follow AMHSJ for the latest updates:</p>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Visit our website: <a href="${this.configService.get("FRONTEND_URL")}" style="color: #3b82f6; text-decoration: none;">amhsj.org</a></li>
                  <li>Submit your research: <a href="${this.configService.get("FRONTEND_URL")}/dashboard/submissions/new" style="color: #3b82f6; text-decoration: none;">Submit Manuscript</a></li>
                  <li>Join our reviewer network: <a href="${this.configService.get("FRONTEND_URL")}/become-reviewer" style="color: #3b82f6; text-decoration: none;">Become a Reviewer</a></li>
                </ul>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.configService.get("FRONTEND_URL")}/newsletter/unsubscribe" 
                 style="color: #6b7280; font-size: 12px; text-decoration: underline;">
                Unsubscribe from this newsletter
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 25px 35px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} Advances in Medicine & Health Sciences Journal. All rights reserved.<br>
              You received this email because you subscribed to AMHSJ updates.
            </p>
          </div>
        </div>
      `,
      text: `AMHSJ Newsletter\n\n${content.replace(/<[^>]*>/g, "")}\n\nStay connected:\n- Website: ${this.configService.get("FRONTEND_URL")}\n- Submit research: ${this.configService.get("FRONTEND_URL")}/dashboard/submissions/new\n- Become a reviewer: ${this.configService.get("FRONTEND_URL")}/become-reviewer\n\nUnsubscribe: ${this.configService.get("FRONTEND_URL")}/newsletter/unsubscribe`,
    }
  }
}
