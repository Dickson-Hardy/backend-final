import { Injectable, BadRequestException } from "@nestjs/common"
import * as fs from "fs"
import * as path from "path"

@Injectable()
export class UploadService {
  async uploadFile(file: Express.Multer.File) {
    // For now, return file info
    // In production, upload to S3/cloud storage
    return {
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
    }
  }

  async uploadMultiple(files: Express.Multer.File[]) {
    const uploadedFiles = await Promise.all(
      files.map(file => this.uploadFile(file))
    )
    return uploadedFiles
  }

  async extractMetadata(file: Express.Multer.File) {
    const fileExtension = path.extname(file.originalname).toLowerCase()
    
    try {
      switch (fileExtension) {
        case '.pdf':
          return await this.extractPdfMetadata(file)
        case '.docx':
        case '.doc':
          return await this.extractDocxMetadata(file)
        case '.txt':
          return await this.extractTxtMetadata(file)
        default:
          throw new BadRequestException('Unsupported file type for metadata extraction')
      }
    } catch (error) {
      console.error('Error extracting metadata:', error)
      return {
        success: false,
        message: 'Failed to extract metadata. Please fill in the details manually.',
        extracted: {}
      }
    }
  }

  private async extractPdfMetadata(file: Express.Multer.File) {
    // For PDF extraction, we'll use pdf-parse
    try {
      const pdfParse = require('pdf-parse')
      const dataBuffer = file.buffer || fs.readFileSync(file.path)
      const data = await pdfParse(dataBuffer)
      
      const text = data.text
      const lines = text.split('\n').filter(line => line.trim())
      
      // Extract metadata using heuristics
      const metadata = {
        title: this.extractTitle(lines),
        abstract: this.extractAbstract(text),
        authors: this.extractAuthors(text),
        keywords: this.extractKeywords(text),
        email: this.extractEmail(text),
      }
      
      return {
        success: true,
        message: 'Metadata extracted successfully',
        extracted: metadata,
        fullText: text.substring(0, 5000) // First 5000 chars for preview
      }
    } catch (error) {
      console.error('PDF extraction error:', error)
      return {
        success: false,
        message: 'PDF parsing failed. Please install pdf-parse: npm install pdf-parse',
        extracted: {}
      }
    }
  }

  private async extractDocxMetadata(file: Express.Multer.File) {
    // For DOCX extraction, we'll use mammoth
    try {
      const mammoth = require('mammoth')
      const dataBuffer = file.buffer || fs.readFileSync(file.path)
      const result = await mammoth.extractRawText({ buffer: dataBuffer })
      
      const text = result.value
      const lines = text.split('\n').filter(line => line.trim())
      
      const metadata = {
        title: this.extractTitle(lines),
        abstract: this.extractAbstract(text),
        authors: this.extractAuthors(text),
        keywords: this.extractKeywords(text),
        email: this.extractEmail(text),
      }
      
      return {
        success: true,
        message: 'Metadata extracted successfully',
        extracted: metadata,
        fullText: text.substring(0, 5000)
      }
    } catch (error) {
      console.error('DOCX extraction error:', error)
      return {
        success: false,
        message: 'DOCX parsing failed. Please install mammoth: npm install mammoth',
        extracted: {}
      }
    }
  }

  private async extractTxtMetadata(file: Express.Multer.File) {
    try {
      const text = file.buffer ? file.buffer.toString('utf-8') : fs.readFileSync(file.path, 'utf-8')
      const lines = text.split('\n').filter(line => line.trim())
      
      const metadata = {
        title: this.extractTitle(lines),
        abstract: this.extractAbstract(text),
        authors: this.extractAuthors(text),
        keywords: this.extractKeywords(text),
        email: this.extractEmail(text),
      }
      
      return {
        success: true,
        message: 'Metadata extracted successfully',
        extracted: metadata,
        fullText: text.substring(0, 5000)
      }
    } catch (error) {
      console.error('TXT extraction error:', error)
      return {
        success: false,
        message: 'Failed to read text file',
        extracted: {}
      }
    }
  }

  // Heuristic extraction methods
  private extractTitle(lines: string[]): string {
    // Title is usually the first non-empty line or the longest line in first few lines
    if (lines.length === 0) return ''
    
    // Check first 5 lines for title
    const firstLines = lines.slice(0, 5)
    const longestLine = firstLines.reduce((a, b) => a.length > b.length ? a : b, '')
    
    return longestLine.trim()
  }

  private extractAbstract(text: string): string {
    // Look for abstract section
    const abstractRegex = /abstract[:\s]+([\s\S]{100,2000}?)(?=\n\n|introduction|keywords|1\.|I\.|$)/i
    const match = text.match(abstractRegex)
    
    if (match && match[1]) {
      return match[1].trim().replace(/\s+/g, ' ')
    }
    
    // Fallback: return first paragraph after title
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 100)
    return paragraphs[0]?.trim().substring(0, 500) || ''
  }

  private extractAuthors(text: string): Array<{firstName: string, lastName: string, email: string, affiliation: string}> {
    const authors: Array<{firstName: string, lastName: string, email: string, affiliation: string}> = []
    
    // Look for author section (usually after title, before abstract)
    const authorRegex = /(?:authors?|by)[:\s]+([^\n]{10,200})/i
    const match = text.match(authorRegex)
    
    if (match && match[1]) {
      const authorText = match[1]
      // Split by common separators
      const authorNames = authorText.split(/[,;]|and\s+/).map(a => a.trim())
      
      authorNames.forEach(name => {
        const parts = name.split(/\s+/)
        if (parts.length >= 2) {
          authors.push({
            firstName: parts[0],
            lastName: parts.slice(1).join(' '),
            email: '',
            affiliation: ''
          })
        }
      })
    }
    
    // If no authors found, try to extract from email addresses
    if (authors.length === 0) {
      const emails = this.extractAllEmails(text)
      emails.forEach(email => {
        const namePart = email.split('@')[0]
        const parts = namePart.split(/[._]/)
        if (parts.length >= 2) {
          authors.push({
            firstName: parts[0],
            lastName: parts[1],
            email: email,
            affiliation: ''
          })
        }
      })
    }
    
    return authors.slice(0, 5) // Limit to 5 authors
  }

  private extractKeywords(text: string): string[] {
    // Look for keywords section
    const keywordsRegex = /keywords?[:\s]+([^\n]{10,300})/i
    const match = text.match(keywordsRegex)
    
    if (match && match[1]) {
      return match[1]
        .split(/[,;]/)
        .map(k => k.trim())
        .filter(k => k.length > 2 && k.length < 50)
        .slice(0, 10)
    }
    
    return []
  }

  private extractEmail(text: string): string {
    const emails = this.extractAllEmails(text)
    return emails[0] || ''
  }

  private extractAllEmails(text: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    const matches = text.match(emailRegex)
    return matches ? [...new Set(matches)] : []
  }
}
