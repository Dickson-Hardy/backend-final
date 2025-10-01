# 🎉 GitHub Releases Storage Setup Guide

## **FREE Unlimited File Storage for Your Academic Journal!**

Your AMHSJ backend now uses **GitHub Releases** for file storage - completely FREE with unlimited storage and bandwidth!

---

## 🎯 Why GitHub Releases?

✅ **Completely FREE** - No monthly costs ever  
✅ **Unlimited storage** - Store all your articles  
✅ **Unlimited bandwidth** - No download fees  
✅ **2GB per file** - Perfect for academic PDFs  
✅ **CDN-backed** - Fast downloads globally  
✅ **Version control** - Track file changes  
✅ **Simple API** - Easy to use  
✅ **No credit card** - Just a GitHub account  

---

## 📋 Prerequisites

1. **GitHub Account** (free) - Create at [github.com](https://github.com)
2. That's it! No credit card, no AWS account, nothing else needed.

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create a GitHub Repository for Storage

1. **Go to GitHub** and log in
2. **Create a new repository**:
   - Click the **"+"** icon → **"New repository"**
   - **Repository name**: `amhsj-files` (or any name you prefer)
   - **Description**: "File storage for AMHSJ journal"
   - **Visibility**: 
     - ✅ **Private** (recommended for academic content)
     - Or **Public** if you want public access
   - ✅ Initialize with README
   - Click **"Create repository"**

### Step 2: Generate a Personal Access Token

1. **Go to Settings**:
   - Click your profile picture → **Settings**
   
2. **Navigate to Developer Settings**:
   - Scroll down to **"Developer settings"** (left sidebar)
   - Click **"Personal access tokens"**
   - Click **"Tokens (classic)"**
   
3. **Generate New Token**:
   - Click **"Generate new token (classic)"**
   - **Note**: "AMHSJ File Storage"
   - **Expiration**: Select "No expiration" or "Custom" (e.g., 1 year)
   - **Select scopes**:
     - ✅ `repo` (Full control of private repositories)
       - This includes:
         - `repo:status`
         - `repo_deployment`
         - `public_repo`
         - `repo:invite`
         - `security_events`
   
4. **Generate and Copy Token**:
   - Click **"Generate token"**
   - ⚠️ **IMPORTANT**: Copy the token NOW! You won't see it again.
   - It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 3: Configure Environment Variables

Edit `backend/.env`:

```env
# GitHub Storage Configuration (FREE!)
GITHUB_TOKEN=ghp_your_actual_token_here
GITHUB_OWNER=your-github-username
GITHUB_REPO=amhsj-files
```

**Replace**:
- `ghp_your_actual_token_here` → Your actual GitHub token from Step 2
- `your-github-username` → Your GitHub username
- `amhsj-files` → Your repository name (if different)

**Example**:
```env
GITHUB_TOKEN=ghp_1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T
GITHUB_OWNER=john-doe
GITHUB_REPO=amhsj-files
```

### Step 4: Initialize the Repository (IMPORTANT!)

If you created an **empty repository** (without README), you MUST initialize it first:

```bash
cd backend
node initialize-github-storage.js
```

This creates an initial commit, which is required before releases can be created.

**Expected output**:
```
✅ Repository successfully initialized!
```

**If repository already has content**, you'll see:
```
✅ Repository already has content
   No initialization needed!
```

### Step 5: Restart Your Backend

```bash
cd backend
npm start
```

Look for this log message:
```
[GitHubStorageService] GitHub storage configured successfully
```

✅ **Done!** You now have FREE unlimited storage!

---

## 📁 How It Works

### File Organization

Files are automatically organized using **GitHub Releases**:

```
Repository: amhsj-files
├── Release: storage-amhsj-manuscripts
│   ├── 1704123456789-abc123.pdf
│   ├── 1704123457890-def456.pdf
│   └── 1704123458901-ghi789.pdf
├── Release: storage-amhsj-supplementary
│   ├── 1704123459012-jkl012.zip
│   └── 1704123460123-mno345.csv
├── Release: storage-amhsj-images
│   ├── 1704123461234-pqr678.jpg
│   └── 1704123462345-stu901.png
└── Release: storage-amhsj-profiles
    └── 1704123463456-vwx234.jpg
```

Each folder type gets its own Release tag for organization.

### Download URLs

Files get permanent public download URLs:

```
https://github.com/owner/repo/releases/download/storage-amhsj-manuscripts/1704123456789-abc123.pdf
```

These URLs:
- ✅ Never expire
- ✅ Work instantly (no presigning needed)
- ✅ Are CDN-backed for fast global delivery
- ✅ Support direct download
- ✅ Can be embedded in browsers

---

## 🔒 Security & Privacy

### Private Repository (Recommended)
- Files are **NOT publicly accessible** by default
- Download URLs require authentication
- Perfect for unpublished articles or sensitive data

### Public Repository
- Files are **publicly accessible** via download URLs
- Good for published articles
- No authentication needed
- Better for sharing

### Token Security
⚠️ **IMPORTANT**: 
- **Never commit** your `.env` file to Git
- Keep your GitHub token secret
- Token has full access to your repository
- Rotate tokens periodically

---

## 📊 Features & Capabilities

### File Upload
```typescript
// Automatically handled by your backend
POST /api/v1/upload/manuscript
// File is uploaded to GitHub Releases
// Returns download URL immediately
```

### File Types Supported
- ✅ **Manuscripts**: PDF, DOC, DOCX (up to 2GB each)
- ✅ **Supplementary**: ZIP, CSV, XLS, XLSX
- ✅ **Images**: JPG, PNG, WebP, GIF
- ✅ **Any file type** under 2GB

### Storage Limits
- **Per file**: 2GB
- **Total storage**: Unlimited
- **Bandwidth**: Unlimited
- **Number of files**: Unlimited
- **Releases**: Unlimited

---

## 🧪 Testing Your Setup

### Test 1: Upload a File

Use your admin panel or curl:

```bash
curl -X POST http://localhost:3001/api/v1/upload/manuscript \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.pdf"
```

**Expected response**:
```json
{
  "publicId": "123456789",
  "url": "https://github.com/owner/repo/releases/download/...",
  "secureUrl": "https://github.com/owner/repo/releases/download/...",
  "format": "pdf",
  "bytes": 123456,
  "originalName": "test.pdf",
  "mimeType": "application/pdf",
  "downloadUrl": "https://github.com/owner/repo/releases/download/..."
}
```

### Test 2: Verify File on GitHub

1. Go to your repository
2. Click **"Releases"** (right sidebar)
3. You should see a release like `storage-amhsj-manuscripts`
4. Click it to see your uploaded file
5. Click the file to download it

### Test 3: Download via URL

Copy the `downloadUrl` from the response and:
- Open it in your browser
- Should download the file immediately
- File should be identical to the original

---

## 💰 Cost Comparison

| Service | Storage | Bandwidth | Cost/Month | Cost/Year |
|---------|---------|-----------|------------|-----------|
| **GitHub Releases** | Unlimited | Unlimited | **$0** | **$0** |
| AWS S3 (100GB) | 100GB | 100GB | $15-25 | $180-300 |
| Cloudinary | 25GB | 25GB | $89+ | $1,068+ |

**Savings**: $180-1,068 per year! 🎉

---

## 🔧 Advanced Configuration

### Multiple Repositories

You can use different repositories for different content:

```env
# Manuscripts
GITHUB_TOKEN=ghp_token_here
GITHUB_OWNER=your-username
GITHUB_REPO=amhsj-manuscripts

# Or separate by volume
GITHUB_REPO=amhsj-volume-1
```

### Rate Limits

GitHub API rate limits:
- **Authenticated requests**: 5,000/hour
- **File uploads**: No specific limit
- **Release creation**: No specific limit

For a typical academic journal, you'll never hit these limits.

### Backup Strategy

Your files are already backed up because:
1. ✅ GitHub has automatic backups
2. ✅ Releases are permanent (unless manually deleted)
3. ✅ You can clone the repository for local backup
4. ✅ Multiple copies on GitHub's infrastructure

---

## 🐛 Troubleshooting

### Error: "Repository is empty"

**Symptoms**:
```
Validation Failed: {"resource":"Release","code":"custom","message":"Repository is empty."}
```

**Solution**: 
1. Run the initialization script:
   ```bash
   cd backend
   node initialize-github-storage.js
   ```
2. Restart your backend
3. Try uploading again

**Why this happens**: GitHub requires at least one commit before releases can be created.

### Error: "GitHub storage not configured"

**Solution**: 
1. Check your `.env` file has all 3 variables
2. Verify no typos in variable names
3. Restart the backend

### Error: "Bad credentials" or "401 Unauthorized"

**Solution**:
1. Verify your GitHub token is correct
2. Check token hasn't expired
3. Ensure token has `repo` scope
4. Generate a new token if needed

### Error: "Repository not found"

**Solution**:
1. Verify `GITHUB_OWNER` and `GITHUB_REPO` are correct
2. Check repository exists
3. Ensure token has access to the repository
4. For private repos, verify token has `repo` scope

### Error: "Release asset too large"

**Solution**:
- GitHub has a 2GB limit per file
- Split large files or compress them
- Consider alternative storage for files > 2GB

### Files not showing up in GitHub

**Solution**:
1. Go to repository → **Releases** tab
2. Look for releases starting with `storage-`
3. Files are attached to releases, not in the main repo

---

## 📚 API Reference

### Upload File
```typescript
const result = await githubStorage.uploadFile(file, 'amhsj/manuscripts')
```

### Delete File
```typescript
await githubStorage.deleteFile(assetId)
```

### List Files
```typescript
const files = await githubStorage.listFiles('amhsj/manuscripts')
```

### Get Metadata
```typescript
const metadata = await githubStorage.getFileMetadata(assetId)
```

---

## 🔄 Migration from Cloudinary/S3

Your existing files in Cloudinary/S3 are **NOT automatically migrated**. Options:

### Option A: Keep Old System for Existing Files
- New uploads → GitHub
- Old files → Stay in Cloudinary/S3
- System works with both

### Option B: Manual Migration
1. Download files from Cloudinary/S3
2. Re-upload through admin panel
3. Update database records

### Option C: Automated Migration Script
Let me know if you need help creating a migration script!

---

## ✅ Benefits Recap

### For Your Journal
- ✅ **$0 hosting costs** - Save $180-1,000/year
- ✅ **Unlimited articles** - No storage limits
- ✅ **Fast downloads** - CDN-backed globally
- ✅ **Professional URLs** - Direct download links
- ✅ **Version control** - Track file history
- ✅ **Reliable** - GitHub's infrastructure

### For Readers
- ✅ **Fast downloads** - GitHub's CDN
- ✅ **Always available** - 99.9% uptime
- ✅ **No registration** - Direct download links
- ✅ **No wait times** - Instant access

### For Admins
- ✅ **Easy setup** - 5 minutes
- ✅ **No maintenance** - GitHub handles it
- ✅ **Transparent** - See all files on GitHub
- ✅ **No billing** - Never worry about costs

---

## 🎓 Best Practices

### 1. Use Private Repository
- Keep unpublished content secure
- Control access via GitHub permissions
- Switch to public when articles are published

### 2. Organize by Volume/Issue
- Create clear folder names
- Use consistent naming conventions
- Example: `amhsj/volume-1`, `amhsj/volume-2`

### 3. Keep Token Secure
- Never commit to Git
- Store in `.env` only
- Rotate periodically (annually)
- Use fine-grained tokens for extra security

### 4. Monitor Usage
- Check GitHub Actions tab for activity
- Review releases periodically
- Clean up old/unused files

### 5. Backup Strategy
- Clone repository locally periodically
- Export database with file references
- Document your setup

---

## 📞 Support & Resources

### GitHub Documentation
- [About Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
- [Managing releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
- [Personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

### Octokit (GitHub API Library)
- [Octokit Documentation](https://octokit.github.io/rest.js/)

### Need Help?
If you encounter any issues, check:
1. Backend logs for detailed error messages
2. GitHub repository settings
3. Token permissions and expiration
4. `.env` file configuration

---

## ✅ Setup Checklist

- [ ] Created GitHub repository (`amhsj-files`)
- [ ] Generated personal access token with `repo` scope
- [ ] Copied token (won't see it again!)
- [ ] Updated `.env` file with:
  - [ ] `GITHUB_TOKEN`
  - [ ] `GITHUB_OWNER`
  - [ ] `GITHUB_REPO`
- [ ] Restarted backend
- [ ] Saw "GitHub storage configured successfully" in logs
- [ ] Tested file upload
- [ ] Verified file appears in GitHub Releases
- [ ] Tested file download via URL
- [ ] Committed `.env` to `.gitignore` (IMPORTANT!)

---

**🎉 Congratulations! You now have FREE unlimited storage for your academic journal!**

No more monthly bills, no storage limits, no bandwidth fees - just pure freedom to focus on publishing great research! 🚀
