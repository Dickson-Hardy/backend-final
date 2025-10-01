/**
 * Initialize GitHub Storage Repository
 * 
 * This script initializes an empty GitHub repository by creating
 * an initial commit, which is required before releases can be created.
 * 
 * Usage: node initialize-github-storage.js
 */

const { Octokit } = require('@octokit/rest');
require('dotenv').config();

async function initializeRepository() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    console.error('❌ Error: Missing required environment variables');
    console.error('   Please set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO in .env');
    process.exit(1);
  }

  const octokit = new Octokit({ auth: token });

  console.log('🚀 Initializing GitHub storage repository...');
  console.log(`   Repository: ${owner}/${repo}`);
  console.log('');

  try {
    // Check if repository exists
    console.log('📡 Checking repository...');
    const repoInfo = await octokit.repos.get({
      owner,
      repo,
    });
    console.log('✅ Repository found');
    console.log('');

    // Check if repository is empty
    console.log('📂 Checking repository content...');
    try {
      const contents = await octokit.repos.getContent({
        owner,
        repo,
        path: '',
      });
      console.log('✅ Repository already has content');
      console.log('   No initialization needed!');
      return;
    } catch (error) {
      if (error.status === 404) {
        console.log('⚠️  Repository is empty - needs initialization');
        console.log('');
      } else {
        throw error;
      }
    }

    // Initialize repository with README
    console.log('📝 Creating initial README.md...');
    const readmeContent = `# AMHSJ File Storage

This repository is used for storing academic journal files via GitHub Releases.

## About

- **Purpose**: File storage for AMHSJ (Ateneo de Manila High School Journal)
- **Method**: GitHub Releases API
- **Files**: Manuscripts, supplementary materials, images, profiles

## Structure

Files are organized using GitHub Releases with tags like:
- \`storage-amhsj-manuscripts\` - Article manuscripts (PDF, DOC, DOCX)
- \`storage-amhsj-supplementary\` - Supplementary files (ZIP, CSV, etc.)
- \`storage-amhsj-images\` - Article images
- \`storage-amhsj-profiles\` - Profile pictures

## Access

Files are accessed via download URLs from releases. This repository should not be modified manually.

---

**Initialized**: ${new Date().toISOString()}
**System**: AMHSJ Backend File Storage
`;

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'README.md',
      message: 'Initialize repository for file storage',
      content: Buffer.from(readmeContent).toString('base64'),
    });

    console.log('✅ README.md created');
    console.log('');

    // Verify initialization
    console.log('🔍 Verifying initialization...');
    const verification = await octokit.repos.getContent({
      owner,
      repo,
      path: 'README.md',
    });

    if (verification.data) {
      console.log('✅ Repository successfully initialized!');
      console.log('');
      console.log('🎉 Success! Your repository is now ready for file storage.');
      console.log('');
      console.log('Next steps:');
      console.log('1. Restart your backend server');
      console.log('2. Try uploading a file through the admin panel');
      console.log('3. Check GitHub Releases tab to see uploaded files');
      console.log('');
      console.log(`View repository: https://github.com/${owner}/${repo}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.status === 401) {
      console.error('');
      console.error('Authentication failed. Please check:');
      console.error('1. GITHUB_TOKEN is correct');
      console.error('2. Token has not expired');
      console.error('3. Token has "repo" scope');
    } else if (error.status === 404) {
      console.error('');
      console.error('Repository not found. Please check:');
      console.error(`1. Repository ${owner}/${repo} exists on GitHub`);
      console.error('2. GITHUB_OWNER and GITHUB_REPO are correct');
      console.error('3. Token has access to this repository');
    } else {
      console.error('');
      console.error('Full error:', error);
    }
    
    process.exit(1);
  }
}

// Run the initialization
initializeRepository();
