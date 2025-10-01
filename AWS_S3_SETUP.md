# AWS S3 Setup Guide for AMHSJ Backend

This guide will help you set up AWS S3 for file storage in your AMHSJ journal application.

## 🎯 Overview

The application now uses **AWS S3** instead of Cloudinary for file storage. S3 provides:
- ✅ Raw file access (no transformations)
- ✅ Presigned URLs for secure downloads
- ✅ Cost-effective storage (~$0.023/GB/month)
- ✅ 99.999999999% durability
- ✅ Perfect for academic documents (PDFs, Word files, supplementary materials)

---

## 📋 Prerequisites

1. **AWS Account** - Create one at [aws.amazon.com](https://aws.amazon.com)
2. **AWS CLI** (optional but recommended) - For testing and management

---

## 🚀 Step-by-Step Setup

### Step 1: Create an S3 Bucket

1. **Log in to AWS Console**
   - Go to [AWS S3 Console](https://s3.console.aws.amazon.com/s3/home)

2. **Create a new bucket**
   - Click **"Create bucket"**
   - **Bucket name**: Choose a unique name (e.g., `amhsj-journal-files`)
     - Must be globally unique
     - Use lowercase letters, numbers, and hyphens only
   - **AWS Region**: Choose closest to your users (e.g., `us-east-1`)
   - **Block Public Access**: 
     - ✅ Keep **all public access blocked** (recommended for security)
     - We'll use presigned URLs for access instead
   - **Bucket Versioning**: Enable (optional, but recommended for backup)
   - **Encryption**: Enable default encryption (recommended)
   - Click **"Create bucket"**

### Step 2: Create IAM User for Programmatic Access

1. **Go to IAM Console**
   - Navigate to [IAM Users](https://console.aws.amazon.com/iam/home#/users)

2. **Create a new user**
   - Click **"Add users"**
   - **User name**: `amhsj-backend-user`
   - **Access type**: Select **"Programmatic access"**
   - Click **"Next: Permissions"**

3. **Set permissions**
   - Click **"Attach existing policies directly"**
   - Search for and select **"AmazonS3FullAccess"** (or create a custom policy below)
   - Click **"Next: Tags"** → **"Next: Review"** → **"Create user"**

4. **Save credentials**
   - ⚠️ **IMPORTANT**: Copy the **Access Key ID** and **Secret Access Key**
   - You won't be able to see the secret key again!

### Step 3: (Optional) Create Custom IAM Policy for Better Security

Instead of using `AmazonS3FullAccess`, create a custom policy with minimal permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:HeadObject"
      ],
      "Resource": [
        "arn:aws:s3:::amhsj-journal-files/*",
        "arn:aws:s3:::amhsj-journal-files"
      ]
    }
  ]
}
```

Replace `amhsj-journal-files` with your actual bucket name.

### Step 4: Configure Environment Variables

Add the following to your `.env` file:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_S3_BUCKET=amhsj-journal-files
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID_HERE
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY_HERE
```

**Replace**:
- `us-east-1` with your chosen region
- `amhsj-journal-files` with your bucket name
- `YOUR_ACCESS_KEY_ID_HERE` with your actual access key ID
- `YOUR_SECRET_ACCESS_KEY_HERE` with your actual secret access key

---

## 🔐 CORS Configuration (If Needed)

If you're uploading files directly from the browser, configure CORS on your S3 bucket:

1. Go to your bucket in S3 Console
2. Click **"Permissions"** tab
3. Scroll to **"Cross-origin resource sharing (CORS)"**
4. Click **"Edit"** and add:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Replace `https://yourdomain.com` with your actual frontend domain.

---

## 📁 Folder Structure

Files will be organized in S3 as follows:

```
amhsj-journal-files/
├── amhsj/
│   ├── manuscripts/
│   │   └── 1696234567890-abc123xyz.pdf
│   ├── supplementary/
│   │   └── 1696234567891-def456uvw.zip
│   ├── images/
│   │   └── 1696234567892-ghi789rst.jpg
│   ├── profiles/
│   │   └── 1696234567893-jkl012mno.png
│   ├── covers/
│   │   └── 1696234567894-pqr345stu.jpg
│   └── news/
│       └── 1696234567895-vwx678yza.png
```

Each file has a unique name: `timestamp-random.extension`

---

## 🧪 Testing Your Setup

### Test 1: Check S3 Service Initialization

Start your backend and look for this log:
```
[S3Service] AWS S3 configured successfully
```

If you see a warning instead, check your environment variables.

### Test 2: Upload a File

Use Postman or curl to test file upload:

```bash
curl -X POST http://localhost:3001/api/v1/upload/manuscript \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/test.pdf"
```

Expected response:
```json
{
  "publicId": "amhsj/manuscripts/1696234567890-abc123xyz.pdf",
  "url": "https://amhsj-journal-files.s3.us-east-1.amazonaws.com/amhsj/manuscripts/1696234567890-abc123xyz.pdf",
  "secureUrl": "https://amhsj-journal-files.s3.us-east-1.amazonaws.com/amhsj/manuscripts/1696234567890-abc123xyz.pdf",
  "format": "pdf",
  "bytes": 123456,
  "originalName": "test.pdf",
  "mimeType": "application/pdf",
  "downloadUrl": "https://amhsj-journal-files.s3.us-east-1.amazonaws.com/..."
}
```

### Test 3: Download a File

The `downloadUrl` in the response is a **presigned URL** that's valid for 7 days. Open it in your browser to download the file in its **raw, unmodified state**.

---

## 💰 Cost Estimation

### Storage Costs (us-east-1)
- **First 50 TB/month**: $0.023 per GB
- **Example**: 100GB of files = $2.30/month

### Request Costs
- **PUT/POST requests**: $0.005 per 1,000 requests
- **GET requests**: $0.0004 per 1,000 requests
- **Example**: 10,000 uploads + 100,000 downloads = $0.09/month

### Data Transfer
- **Download (to internet)**: $0.09 per GB (first GB/month is free)
- **Upload**: Free
- **Example**: 50GB downloads = $4.50/month

**Total for typical academic journal**: ~$10-20/month

---

## 🔄 Migration from Cloudinary

If you have existing files in Cloudinary, you can:

1. **Option A**: Keep old files in Cloudinary (system will work with both)
2. **Option B**: Manually download and re-upload to S3
3. **Option C**: Create a migration script (let me know if you need help)

---

## 🔒 Security Best Practices

1. ✅ **Never commit `.env` file** to version control
2. ✅ **Use presigned URLs** for file access (already implemented)
3. ✅ **Keep bucket private** (block all public access)
4. ✅ **Rotate access keys** periodically
5. ✅ **Enable bucket versioning** for backup
6. ✅ **Enable CloudTrail logging** for audit trails (optional)
7. ✅ **Use IAM roles** in production instead of access keys (when deployed to AWS)

---

## 🐛 Troubleshooting

### Error: "S3 client not initialized. Check AWS credentials."

**Solution**: Verify your `.env` file has all four AWS variables set correctly.

### Error: "Access Denied"

**Solutions**:
1. Check IAM user has correct permissions (PutObject, GetObject, etc.)
2. Verify bucket name is correct in `.env`
3. Ensure access keys are valid

### Error: "The bucket does not exist"

**Solution**: Double-check the bucket name in your `.env` file matches exactly.

### Presigned URLs not working

**Solutions**:
1. Check bucket region matches `AWS_REGION` in `.env`
2. Ensure IAM user has `GetObject` permission
3. Try regenerating the presigned URL (they expire after 7 days by default)

---

## 📚 Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)
- [S3 Pricing Calculator](https://calculator.aws/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

---

## ✅ Checklist

- [ ] AWS account created
- [ ] S3 bucket created (with unique name)
- [ ] IAM user created with programmatic access
- [ ] IAM policy attached (S3 permissions)
- [ ] Access keys saved securely
- [ ] `.env` file updated with AWS credentials
- [ ] CORS configured (if needed)
- [ ] Backend restarted and tested
- [ ] File upload tested successfully
- [ ] Presigned URL download tested

---

## 🆘 Need Help?

If you encounter any issues:
1. Check the backend logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test AWS credentials using AWS CLI: `aws s3 ls s3://your-bucket-name`
4. Review IAM permissions in AWS Console

---

**Migration complete! Your journal now uses AWS S3 for reliable, raw file storage with presigned URLs for secure access.**
