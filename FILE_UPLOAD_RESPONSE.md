# File Upload Response Format

## When You Upload a PDF File

### Example Request
```bash
curl -X POST http://localhost:3001/admin/articles/123/manuscript \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "manuscript=@research-paper.pdf"
```

### Example Response
```json
{
  "_id": "article_id_123",
  "title": "My Research Article",
  "manuscriptFile": {
    "publicId": "amhsj/manuscripts/abc123def456",
    "url": "http://res.cloudinary.com/your-cloud/raw/upload/v1234567890/amhsj/manuscripts/abc123def456.pdf",
    "secureUrl": "https://res.cloudinary.com/your-cloud/raw/upload/v1234567890/amhsj/manuscripts/abc123def456.pdf",
    "format": "pdf",                           // ✅ File format
    "bytes": 2457600,                          // ✅ File size (2.4 MB)
    "originalName": "research-paper.pdf",      // ✅ Original filename
    "mimeType": "application/pdf"              // ✅ MIME type
  },
  "supplementaryFiles": [],
  // ... other article fields
}
```

## When You Upload Word Documents

### DOCX File
```json
{
  "manuscriptFile": {
    "publicId": "amhsj/manuscripts/xyz789",
    "url": "https://res.cloudinary.com/.../manuscript.docx",
    "secureUrl": "https://res.cloudinary.com/.../manuscript.docx",
    "format": "docx",                          // ✅ Shows as DOCX
    "bytes": 1536000,
    "originalName": "manuscript.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  }
}
```

### DOC File
```json
{
  "manuscriptFile": {
    "format": "doc",                           // ✅ Shows as DOC
    "originalName": "old-manuscript.doc",
    "mimeType": "application/msword"
  }
}
```

## When You Upload Supplementary Files

### CSV File
```json
{
  "supplementaryFiles": [
    {
      "publicId": "amhsj/supplementary/data123",
      "url": "https://res.cloudinary.com/.../data.csv",
      "secureUrl": "https://res.cloudinary.com/.../data.csv",
      "format": "csv",                         // ✅ Shows as CSV
      "bytes": 512000,
      "originalName": "research-data.csv",
      "mimeType": "text/csv"
    }
  ]
}
```

### ZIP File
```json
{
  "supplementaryFiles": [
    {
      "format": "zip",                         // ✅ Shows as ZIP
      "originalName": "additional-files.zip",
      "mimeType": "application/zip",
      "bytes": 5242880                         // 5 MB
    }
  ]
}
```

### Excel File
```json
{
  "supplementaryFiles": [
    {
      "format": "xlsx",                        // ✅ Shows as XLSX
      "originalName": "analysis.xlsx",
      "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
  ]
}
```

## Displaying Files in Frontend

### Show File Format Badge
```typescript
const FileFormatBadge = ({ file }) => {
  const formatColors = {
    pdf: 'bg-red-100 text-red-800',
    doc: 'bg-blue-100 text-blue-800',
    docx: 'bg-blue-100 text-blue-800',
    csv: 'bg-green-100 text-green-800',
    xlsx: 'bg-green-100 text-green-800',
    zip: 'bg-purple-100 text-purple-800'
  }
  
  return (
    <span className={`px-2 py-1 rounded text-xs uppercase ${formatColors[file.format]}`}>
      {file.format}
    </span>
  )
}
```

### Show File Size
```typescript
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Usage
<span>{formatFileSize(file.bytes)}</span>
// Output: "2.4 MB"
```

### Display File in UI
```tsx
<div className="file-item">
  <div className="flex items-center gap-3">
    {/* File Icon based on format */}
    {file.format === 'pdf' && <FileText className="text-red-600" />}
    {file.format.includes('doc') && <FileText className="text-blue-600" />}
    {file.format === 'csv' && <Table className="text-green-600" />}
    
    {/* File Details */}
    <div>
      <div className="font-medium">{file.originalName}</div>
      <div className="text-sm text-gray-500">
        <FileFormatBadge file={file} />
        <span className="ml-2">{formatFileSize(file.bytes)}</span>
      </div>
    </div>
    
    {/* Download Button */}
    <a 
      href={file.secureUrl} 
      download={file.originalName}
      className="btn-download"
    >
      Download
    </a>
  </div>
</div>
```

## Supported Formats by Type

### Manuscript Files
- **PDF** → `format: "pdf"`, `mimeType: "application/pdf"`
- **DOC** → `format: "doc"`, `mimeType: "application/msword"`
- **DOCX** → `format: "docx"`, `mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"`

### Supplementary Files
- **PDF** → `format: "pdf"`
- **ZIP** → `format: "zip"`
- **CSV** → `format: "csv"`
- **XLS** → `format: "xls"`
- **XLSX** → `format: "xlsx"`

### Image Files (Covers, News, etc.)
- **JPEG** → `format: "jpg"` or `"jpeg"`
- **PNG** → `format: "png"`
- **WEBP** → `format: "webp"`
- **GIF** → `format: "gif"`

## File Download Example

```typescript
const downloadFile = (file: UploadResult) => {
  // Use the secure URL for download
  const link = document.createElement('a')
  link.href = file.secureUrl
  link.download = file.originalName || 'download'
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
```

## Checking File Type in Code

```typescript
// Check if file is PDF
if (file.format === 'pdf' || file.mimeType === 'application/pdf') {
  console.log('This is a PDF file')
}

// Check if file is Word document
if (['doc', 'docx'].includes(file.format)) {
  console.log('This is a Word document')
}

// Check if file is spreadsheet
if (['csv', 'xls', 'xlsx'].includes(file.format)) {
  console.log('This is a spreadsheet')
}

// Get file extension from original name
const extension = file.originalName?.split('.').pop()
console.log('File extension:', extension) // "pdf", "docx", etc.
```

## Summary

✅ **YES** - When you upload a PDF, you will see:
- `format: "pdf"`
- `mimeType: "application/pdf"`
- `originalName: "your-file.pdf"`

✅ The format is preserved and stored correctly in the database

✅ You can display the correct file icon/badge based on the format

✅ You can download files with their original names and formats

✅ All file metadata is available for display in your frontend
