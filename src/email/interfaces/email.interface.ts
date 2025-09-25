export interface EmailTemplate {
  html: string
  text: string
}

export interface EmailOptions {
  to: string
  subject: string
  template: EmailTemplate
  type: "alert" | "editorial"
}

export type EmailProvider = "resend" | "smtp"

export interface NewsletterSubscription {
  email: string
  name?: string
  preferences: {
    newArticles: boolean
    editorialUpdates: boolean
    specialIssues: boolean
    generalNews: boolean
  }
  subscriptionDate: Date
  active: boolean
}
