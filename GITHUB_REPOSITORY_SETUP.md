# GitHub Repository Setup for File Storage

The backend is currently configured to use GitHub Releases for file storage, but the repository doesn't exist yet.

## Quick Setup Steps

### 1. Create the Repository

Go to: https://github.com/new

- **Repository name**: `amhsj-files`
- **Description**: File storage for AMHSJ journal (manuscripts, images, etc.)
- **Visibility**: 
  - **Public** (recommended) - Files will be publicly accessible
  - **Private** - Requires token with repo access
- Click "Create repository"

### 2. Verify Token Permissions

Your GitHub token needs the following permissions:

#### For Classic Tokens:
- Go to: https://github.com/settings/tokens
- Edit your token or create a new one
- Ensure these scopes are checked:
  - ✅ `repo` (Full control of private repositories) OR
  - ✅ `public_repo` (Access public repositories only, if using public repo)

#### For Fine-Grained Tokens:
- Go to: https://github.com/settings/tokens?type=beta
- Repository access: Select `amhsj-files`
- Permissions:
  - **Contents**: Read and write access
  - **Metadata**: Read-only (automatic)

### 3. Update .env (if needed)

Your current configuration:
```
GITHUB_TOKEN=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
GITHUB_OWNER=Dickson-Hardy
GITHUB_REPO=amhsj-files
```

### 4. Test the Setup

After creating the repository, run:
```bash
node test-github-setup.js
```

All tests should pass ✅

### 5. Restart the Backend

```bash
npm run dev
```

---

## Option 2: Switch Back to Cloudinary

If you prefer to continue using Cloudinary for file storage, see `SWITCH_TO_CLOUDINARY.md`
