# Admin Article Management

This document describes the admin functionality for managing articles, including editing article details and managing uploaded files.

## Overview

Admins now have complete control over articles, including:
- Editing all article metadata (title, abstract, authors, keywords, etc.)
- Updating article status and publication information
- Replacing manuscript files
- Adding/removing supplementary files
- Deleting articles

## 🔥 Important: File Upload Support

The `PATCH /admin/articles/:id` endpoint now supports **BOTH** JSON and multipart form data:
- **JSON requests**: For updating metadata only
- **Form data requests**: For updating metadata AND uploading/replacing files simultaneously

When sending files, use `multipart/form-data` and send JSON fields as strings (arrays/objects as JSON.stringify).

## API Endpoints

All endpoints require admin authentication (JWT token with ADMIN role).

### 1. Get All Articles
```
GET /admin/articles
```
Retrieves all articles in the system for admin management.

**Response:**
```json
[
  {
    "_id": "article_id",
    "title": "Article Title",
    "status": "published",
    "authors": [...],
    "volume": {...},
    "manuscriptFile": {...},
    "supplementaryFiles": [...]
  }
]
```

### 2. Get Article Details
```
GET /admin/articles/:id
```
Retrieves detailed information about a specific article.

**Parameters:**
- `id` - Article ID

**Response:**
```json
{
  "_id": "article_id",
  "title": "Article Title",
  "abstract": "Abstract text...",
  "content": "Full content...",
  "keywords": ["keyword1", "keyword2"],
  "type": "research",
  "status": "published",
  "authors": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "affiliation": "University"
    }
  ],
  "volume": {
    "volume": 1,
    "year": 2024,
    "title": "Volume Title"
  },
  "manuscriptFile": {
    "url": "https://...",
    "originalName": "manuscript.pdf"
  },
  "supplementaryFiles": [...],
  "articleNumber": "001",
  "doi": "10.1234/example",
  "featured": true
}
```

### 3. Update Article
```
PATCH /admin/articles/:id
```
Updates article details. All fields are optional. **Can also handle file uploads!**

**Parameters:**
- `id` - Article ID

**Request Options:**

**Option A: JSON Only (for metadata updates)**
```
Content-Type: application/json
```
```json
{
  "title": "Updated Title",
  "abstract": "Updated abstract",
  "content": "Updated content",
  "keywords": ["new", "keywords"],
  "type": "research",
  "status": "published",
  "authors": [
    {
      "title": "Dr.",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "affiliation": "University"
    }
  ],
  "volume": "volume_id",
  "doi": "10.1234/example",
  "pages": "1-15",
  "articleNumber": "001",
  "featured": true,
  "conflictOfInterest": "None",
  "funding": "NIH Grant #12345",
  "acknowledgments": "We thank...",
  "categories": ["Clinical Research"],
  "references": ["Reference 1", "Reference 2"]
}
```

**Option B: Multipart Form Data (for metadata + file uploads)**
```
Content-Type: multipart/form-data
```
- `title` - Updated title (string)
- `abstract` - Updated abstract (string)
- `content` - Updated content (string)
- `keywords` - Keywords array as JSON string (e.g., '["keyword1","keyword2"]')
- `authors` - Authors array as JSON string
- `status` - Article status
- `featured` - Boolean (or "true"/"false" string)
- `manuscript` - New manuscript file (optional, replaces existing)
- `supplementary` - New supplementary files (optional, adds to existing, max 10 files)
- ... (any other fields)

**Response:**
```json
{
  "_id": "article_id",
  "title": "Updated Title",
  "manuscriptFile": {
    "url": "https://...",
    "originalName": "updated_manuscript.pdf"
  },
  "supplementaryFiles": [
    // ... includes newly added files
  ]
  // ... other updated article details
}
```

**Validation:**
- Article number must be 3 digits (e.g., 001, 042, 999)
- Article number must be unique within the same volume
- Status must be valid enum value
- Type must be valid enum value
- Authors must have required fields (firstName, lastName, email, affiliation)
- Manuscript files: PDF, DOC, DOCX (max 50MB)
- Supplementary files: PDF, ZIP, CSV, XLS, XLSX (max 100MB each)

### 4. Replace Manuscript File
```
POST /admin/articles/:id/manuscript
```
Replaces the manuscript file for an article. The old file is deleted from storage.

**Parameters:**
- `id` - Article ID

**Request:**
- Content-Type: `multipart/form-data`
- Field: `manuscript` (file)

**Supported Formats:**
- PDF (`.pdf`)
- Word (`.doc`, `.docx`)

**Max Size:** 50MB

**Response:**
```json
{
  "_id": "article_id",
  "manuscriptFile": {
    "publicId": "cloudinary_public_id",
    "url": "https://...",
    "secureUrl": "https://...",
    "originalName": "new_manuscript.pdf",
    "format": "pdf",
    "bytes": 1234567
  }
}
```

### 5. Add Supplementary Files
```
POST /admin/articles/:id/supplementary
```
Adds supplementary files to an article. Existing files are preserved.

**Parameters:**
- `id` - Article ID

**Request:**
- Content-Type: `multipart/form-data`
- Field: `supplementary` (multiple files, max 10)

**Supported Formats:**
- PDF (`.pdf`)
- ZIP (`.zip`)
- CSV (`.csv`)
- Excel (`.xls`, `.xlsx`)

**Max Size:** 100MB per file

**Response:**
```json
{
  "_id": "article_id",
  "supplementaryFiles": [
    {
      "publicId": "cloudinary_public_id",
      "url": "https://...",
      "originalName": "data.csv",
      "format": "csv",
      "bytes": 123456
    }
  ]
}
```

### 6. Remove Supplementary File
```
DELETE /admin/articles/:id/supplementary/:fileIndex
```
Removes a specific supplementary file from an article.

**Parameters:**
- `id` - Article ID
- `fileIndex` - Index of the file in the supplementaryFiles array (0-based)

**Response:**
```json
{
  "_id": "article_id",
  "supplementaryFiles": [
    // Updated array without the deleted file
  ]
}
```

### 7. Delete Article
```
DELETE /admin/articles/:id
```
Permanently deletes an article and all associated files.

**Parameters:**
- `id` - Article ID

**Response:**
```json
{
  "message": "Article deleted successfully"
}
```

## Usage Examples

### Update Article Metadata Only (JSON)
```bash
curl -X PATCH http://localhost:3001/admin/articles/123 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Research Title",
    "status": "published",
    "featured": true,
    "articleNumber": "042"
  }'
```

### Update Article with File Upload (Form Data)
```bash
curl -X PATCH http://localhost:3001/admin/articles/123 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "title=Updated Research Title" \
  -F "status=published" \
  -F "featured=true" \
  -F "manuscript=@/path/to/updated_manuscript.pdf" \
  -F "supplementary=@/path/to/new_data.csv"
```

### Replace Manuscript
```bash
curl -X POST http://localhost:3001/admin/articles/123/manuscript \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "manuscript=@/path/to/new_manuscript.pdf"
```

### Add Supplementary Files
```bash
curl -X POST http://localhost:3001/admin/articles/123/supplementary \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "supplementary=@/path/to/data1.csv" \
  -F "supplementary=@/path/to/data2.xlsx"
```

### Remove Supplementary File
```bash
curl -X DELETE http://localhost:3001/admin/articles/123/supplementary/0 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Frontend Integration

### Example: Fetch Article for Editing
```typescript
const fetchArticle = async (articleId: string) => {
  const response = await fetch(`/api/admin/articles/${articleId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return response.json()
}
```

### Example: Update Article (JSON Only)
```typescript
const updateArticle = async (articleId: string, updates: any) => {
  const response = await fetch(`/api/admin/articles/${articleId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  })
  return response.json()
}
```

### Example: Update Article with Files
```typescript
const updateArticleWithFiles = async (
  articleId: string, 
  updates: any,
  manuscriptFile?: File,
  supplementaryFiles?: File[]
) => {
  const formData = new FormData()
  
  // Add text fields
  Object.keys(updates).forEach(key => {
    const value = updates[key]
    if (Array.isArray(value) || typeof value === 'object') {
      formData.append(key, JSON.stringify(value))
    } else {
      formData.append(key, value)
    }
  })
  
  // Add manuscript file if provided
  if (manuscriptFile) {
    formData.append('manuscript', manuscriptFile)
  }
  
  // Add supplementary files if provided
  if (supplementaryFiles) {
    supplementaryFiles.forEach(file => {
      formData.append('supplementary', file)
    })
  }
  
  const response = await fetch(`/api/admin/articles/${articleId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type header - browser will set it with boundary
    },
    body: formData
  })
  return response.json()
}
```

### Example: Replace Manuscript
```typescript
const replaceManuscript = async (articleId: string, file: File) => {
  const formData = new FormData()
  formData.append('manuscript', file)
  
  const response = await fetch(`/api/admin/articles/${articleId}/manuscript`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })
  return response.json()
}
```

## Security

- All endpoints require JWT authentication
- Only users with ADMIN role can access these endpoints
- Role validation is enforced by `JwtAuthGuard` and `RolesGuard`
- File uploads are validated for type and size
- Article number uniqueness is enforced within volumes

## File Storage

- Files are stored on Cloudinary
- Old files are automatically deleted when replaced
- File metadata (URL, size, format) is stored in MongoDB
- Cloudinary public IDs are stored for file management

## Data Validation

The `AdminUpdateArticleDto` validates:
- String fields (title, abstract, content, etc.)
- Enum fields (status, type)
- Array fields (keywords, authors, categories, references)
- Email format for author emails
- Article number format (3 digits)

## Error Handling

Common errors:
- `404 Not Found` - Article doesn't exist
- `400 Bad Request` - Invalid data (duplicate article number, invalid format, etc.)
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User doesn't have ADMIN role

## Database Schema Updates

No schema changes were required. The existing Article schema supports all admin operations.

## Notes

- When updating article status to "published", the `publishDate` is automatically set if not already set
- Article number must be unique within a volume
- Deleting an article also deletes all associated files from Cloudinary
- File uploads are handled by the existing UploadService with Cloudinary integration
