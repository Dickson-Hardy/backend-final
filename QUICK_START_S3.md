# 🚀 Quick Start: AWS S3 Setup (5 Minutes)

If you want to get S3 working ASAP, follow these steps:

## Step 1: Create AWS Account (2 minutes)
1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Follow the signup process (you'll need a credit card, but won't be charged much)

## Step 2: Create S3 Bucket (1 minute)
1. Go to https://s3.console.aws.amazon.com/s3/home
2. Click "Create bucket"
3. **Bucket name**: `amhsj-journal-files` (or any unique name)
4. **Region**: `us-east-1` (or closest to you)
5. **Block Public Access**: Keep ALL boxes checked ✅
6. Click "Create bucket"

## Step 3: Create IAM User (2 minutes)
1. Go to https://console.aws.amazon.com/iam/home#/users
2. Click "Add users"
3. **User name**: `amhsj-backend`
4. **Access type**: Check "Programmatic access"
5. Click "Next: Permissions"
6. Click "Attach existing policies directly"
7. Search for and check "AmazonS3FullAccess"
8. Click through to "Create user"
9. **IMPORTANT**: Copy your:
   - Access Key ID
   - Secret Access Key
   (You can't see the secret again!)

## Step 4: Update .env File (30 seconds)

Open `backend/.env` and update these lines:

```env
AWS_REGION=us-east-1
AWS_S3_BUCKET=amhsj-journal-files
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

Replace with your actual values from Step 3.

## Step 5: Start Backend (30 seconds)

```bash
cd backend
npm start
```

Look for this message:
```
[S3Service] AWS S3 configured successfully
```

## Step 6: Test Upload (30 seconds)

Upload a file through your admin panel or run:

```bash
curl -X POST http://localhost:3001/api/v1/upload/manuscript \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.pdf"
```

If you get a response with `publicId`, `url`, and `downloadUrl` - **YOU'RE DONE!** ✅

---

## Troubleshooting

**Error: "S3 client not initialized"**
- Double-check all 4 AWS variables in `.env`
- Make sure there are no typos
- No quotes needed around values

**Error: "Access Denied"**
- Go back to IAM Console
- Check that "AmazonS3FullAccess" policy is attached to your user
- Verify bucket name matches exactly

**Still stuck?**
- Check `AWS_S3_SETUP.md` for detailed guide
- View backend logs for specific error messages
- Verify you're using the correct region

---

## What You Get

✅ **Raw file downloads** - Files in their original format  
✅ **Secure access** - Presigned URLs that expire  
✅ **Cost effective** - ~$2-5/month for typical usage  
✅ **Reliable** - 99.999999999% durability  
✅ **Unlimited storage** - No file limits  

---

## Next Steps

- [ ] Configure CORS if uploading from browser (see AWS_S3_SETUP.md)
- [ ] Set up CloudFront CDN for faster downloads (optional)
- [ ] Enable S3 versioning for backups (optional)
- [ ] Create custom IAM policy with minimal permissions (see AWS_S3_SETUP.md)

**That's it! You now have AWS S3 working with raw file access!** 🎉
