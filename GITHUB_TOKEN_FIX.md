# 🔧 GitHub Token Authentication Fix

## ⚠️ Issue
You're seeing this error:
```
Bad credentials - https://docs.github.com/rest
HttpError: Bad credentials
```

This means your GitHub token is **invalid, expired, or lacks proper permissions**.

---

## 🔑 Quick Fix (5 Minutes)

### Step 1: Generate a New GitHub Token

1. **Go to GitHub Settings**:
   - Log in to [GitHub](https://github.com)
   - Click your **profile picture** (top right)
   - Click **Settings**

2. **Navigate to Developer Settings**:
   - Scroll down in the left sidebar
   - Click **"Developer settings"** (at the very bottom)
   - Click **"Personal access tokens"**
   - Click **"Tokens (classic)"**

3. **Generate New Token**:
   - Click **"Generate new token (classic)"** button
   - GitHub may ask for your password - enter it

4. **Configure Token**:
   
   **Note/Description:**
   ```
   AMHSJ File Storage - Backend API
   ```

   **Expiration:**
   - Select **"No expiration"** (recommended for production)
   - Or select **"Custom"** and choose 1 year

   **Select scopes - THIS IS CRITICAL:**
   
   ✅ **Check the `repo` checkbox** - This is the MOST IMPORTANT step!
   
   ```
   ✅ repo (Full control of private repositories)
      ├── ✅ repo:status
      ├── ✅ repo_deployment  
      ├── ✅ public_repo
      ├── ✅ repo:invite
      └── ✅ security_events
   ```
   
   **Why `repo` scope?**
   - Allows creating releases
   - Allows uploading release assets (your PDFs)
   - Allows deleting release assets
   - Works with both private and public repositories

5. **Generate and Copy Token**:
   - Scroll down and click the green **"Generate token"** button
   - ⚠️ **CRITICAL**: **COPY THE TOKEN NOW!**
   - It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - You will **NEVER** see this token again!
   - If you lose it, you must generate a new one

---

### Step 2: Update Your .env File

1. **Open** `backend/.env` in your text editor

2. **Find this line**:
   ```env
   GITHUB_TOKEN=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
   ```

3. **Replace with your NEW token**:
   ```env
   GITHUB_TOKEN=ghp_YOUR_NEW_TOKEN_HERE
   ```

4. **Verify other settings**:
   ```env
   GITHUB_OWNER=Dickson-Hardy
   GITHUB_REPO=amhsj-files
   ```

5. **Save the file**

---

### Step 3: Verify Repository Access

Make sure the repository exists and you have access:

1. **Go to**: https://github.com/Dickson-Hardy/amhsj-files
2. **Check**:
   - ✅ Repository exists
   - ✅ You are the owner or have write access
   - ✅ Repository is not archived or disabled

If repository doesn't exist:
- Create it: https://github.com/new
- Name it: `amhsj-files`
- Make it **Private** (recommended) or **Public**
- ✅ Initialize with README
- Click **Create repository**

---

### Step 4: Restart Your Backend

**Stop the current backend** (if running):
```bash
# Press Ctrl+C in the terminal
```

**Start it again**:
```bash
cd backend
npm start
```

**Look for SUCCESS message**:
```
[GitHubStorageService] GitHub storage configured successfully
```

✅ **If you see this, you're good!**

❌ **If you still see errors, continue to troubleshooting below**

---

## 🧪 Test Your Fix

### Test 1: Check Backend Logs

When backend starts, you should see:
```
[GitHubStorageService] GitHub storage configured successfully
```

**NOT**:
```
[GitHubStorageService] GitHub storage not configured
```

### Test 2: Try Uploading a File

1. **Log in to your admin panel**: http://localhost:3000/dashboard/admin
2. **Go to**: Volume Management → Upload Article tab
3. **Fill in the form** and **upload a PDF**
4. **Watch the terminal** - you should see:
   ```
   [GitHubStorageService] File uploaded successfully: amhsj-manuscripts/1704123456789-abc123.pdf
   ```

### Test 3: Check GitHub Releases

1. **Go to**: https://github.com/Dickson-Hardy/amhsj-files/releases
2. **You should see a release** named: `storage-amhsj-manuscripts`
3. **Click on it** - you should see your uploaded file
4. **Click the file** - it should download

✅ **If all 3 tests pass, everything is working!**

---

## 🐛 Still Having Issues?

### Issue: "Repository is empty"

**Error**:
```
Validation Failed: Repository is empty
```

**Solution**:
```bash
cd backend
node initialize-github-storage.js
```

This creates an initial commit (GitHub requires at least one commit before releases).

---

### Issue: "Resource not accessible by personal access token"

**Cause**: Token doesn't have `repo` scope

**Solution**: 
1. Delete the old token on GitHub
2. Generate a new token
3. ✅ **MAKE SURE TO CHECK THE `repo` SCOPE**
4. Update `.env`
5. Restart backend

---

### Issue: "Not Found" or "404"

**Possible causes**:
- Repository name is wrong in `.env`
- Repository doesn't exist
- Repository is private and token lacks access

**Solution**:
1. Verify repository exists: https://github.com/Dickson-Hardy/amhsj-files
2. Check `.env` file:
   ```env
   GITHUB_OWNER=Dickson-Hardy  # ← Your GitHub username
   GITHUB_REPO=amhsj-files     # ← Exact repository name
   ```
3. Make sure there are no typos
4. Repository name is case-sensitive!

---

### Issue: Token Still Doesn't Work

**Try these steps**:

1. **Revoke old token**:
   - Go to: https://github.com/settings/tokens
   - Find the old token
   - Click **Delete**

2. **Generate a NEW token**:
   - Follow Step 1 above again
   - ✅ Make absolutely sure `repo` scope is checked
   - Copy the new token

3. **Clear any cached credentials**:
   ```bash
   # Delete these environment variables if they exist
   unset GITHUB_TOKEN
   ```

4. **Update `.env` with new token**

5. **Restart backend completely**:
   ```bash
   # Kill all node processes
   # Then start fresh
   cd backend
   npm start
   ```

---

## 🔐 Token Security Best Practices

### ✅ DO:
- Keep token in `.env` file only
- Add `.env` to `.gitignore`
- Use "No expiration" for production
- Give token a descriptive name
- Store token backup in password manager

### ❌ DON'T:
- Commit token to Git
- Share token publicly
- Post token in Discord/Slack
- Email token
- Use same token for multiple projects

---

## 📋 Checklist for Token Fix

- [ ] Went to GitHub Settings → Developer settings → Tokens
- [ ] Generated new token (classic)
- [ ] ✅ **CHECKED `repo` SCOPE** (MOST IMPORTANT!)
- [ ] Copied new token immediately
- [ ] Updated `backend/.env` with new token
- [ ] Verified `GITHUB_OWNER=Dickson-Hardy`
- [ ] Verified `GITHUB_REPO=amhsj-files`
- [ ] Saved `.env` file
- [ ] Restarted backend
- [ ] Saw "GitHub storage configured successfully" in logs
- [ ] Tested file upload
- [ ] Saw file in GitHub releases
- [ ] Successfully downloaded file

---

## 🎯 Common Mistakes

### Mistake #1: Forgot to check `repo` scope
**Symptom**: "Resource not accessible"
**Fix**: Generate new token with `repo` scope

### Mistake #2: Copied token with extra spaces
**Symptom**: "Bad credentials"
**Fix**: Copy token carefully, no spaces before/after

### Mistake #3: Token expired
**Symptom**: Worked before, now doesn't
**Fix**: Generate new token with no expiration

### Mistake #4: Wrong repository name
**Symptom**: "Not found" / 404
**Fix**: Check exact spelling in `.env`

### Mistake #5: Didn't restart backend
**Symptom**: Old token still being used
**Fix**: Stop backend (Ctrl+C) and start again

---

## 📞 Quick Reference

### Your Configuration
```env
# backend/.env
GITHUB_TOKEN=ghp_YOUR_NEW_TOKEN_HERE
GITHUB_OWNER=Dickson-Hardy
GITHUB_REPO=amhsj-files
```

### Repository URL
```
https://github.com/Dickson-Hardy/amhsj-files
```

### Token Settings Page
```
https://github.com/settings/tokens
```

### Required Token Scope
```
✅ repo (Full control of private repositories)
```

---

## ✅ After You Fix It

You should see:

**✅ Backend logs**:
```
[Nest] 17340  - 01/10/2025, 15:45:00     LOG [GitHubStorageService] GitHub storage configured successfully
```

**✅ File upload succeeds**:
```
[Nest] 17340  - 01/10/2025, 15:45:30     LOG [GitHubStorageService] File uploaded successfully: amhsj-manuscripts/1704123456789-abc.pdf
```

**✅ Files appear in GitHub**:
- Go to: https://github.com/Dickson-Hardy/amhsj-files/releases
- See your files attached to releases

---

## 💡 Pro Tip

**Save your token in a password manager** (like LastPass, 1Password, Bitwarden) with this info:
- **Title**: "AMHSJ GitHub Storage Token"
- **Username**: Dickson-Hardy
- **Password**: ghp_your_token_here
- **URL**: https://github.com/Dickson-Hardy/amhsj-files
- **Notes**: Has `repo` scope, used for file storage

This way you won't lose it if you need to reconfigure later!

---

**Need more help? Drop the error logs and I'll help you debug! 🚀**
