const { Octokit } = require('@octokit/rest');
require('dotenv').config();

async function testGitHubSetup() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  console.log('Testing GitHub Setup...\n');
  console.log(`Owner: ${owner}`);
  console.log(`Repo: ${repo}`);
  console.log(`Token: ${token ? token.substring(0, 10) + '...' : 'NOT SET'}\n`);

  if (!token || !owner || !repo) {
    console.error('❌ Missing environment variables!');
    console.error('Please set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO in .env');
    return;
  }

  const octokit = new Octokit({ auth: token });

  try {
    // Test 1: Check if user can authenticate
    console.log('Test 1: Checking authentication...');
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login}\n`);

    // Test 2: Check if repository exists and is accessible
    console.log('Test 2: Checking repository access...');
    const { data: repository } = await octokit.repos.get({
      owner,
      repo,
    });
    console.log(`✅ Repository found: ${repository.full_name}`);
    console.log(`   Private: ${repository.private}`);
    console.log(`   Permissions: ${JSON.stringify(repository.permissions)}\n`);

    // Test 3: Check token scopes
    console.log('Test 3: Checking token permissions...');
    const response = await octokit.request('HEAD /');
    const scopes = response.headers['x-oauth-scopes'];
    console.log(`✅ Token scopes: ${scopes || 'No scopes header (might be fine-grained token)'}\n`);

    // Test 4: Try to list releases
    console.log('Test 4: Listing releases...');
    const { data: releases } = await octokit.repos.listReleases({
      owner,
      repo,
      per_page: 5,
    });
    console.log(`✅ Found ${releases.length} releases`);
    if (releases.length > 0) {
      releases.forEach(r => {
        console.log(`   - ${r.tag_name}: ${r.assets.length} assets`);
      });
    }
    console.log();

    // Test 5: Try to create a test release
    console.log('Test 5: Testing release creation...');
    const testTag = `test-${Date.now()}`;
    try {
      const { data: testRelease } = await octokit.repos.createRelease({
        owner,
        repo,
        tag_name: testTag,
        name: 'Test Release',
        body: 'This is a test release. Will be deleted.',
        draft: true, // Draft so it doesn't create actual tags
      });
      console.log(`✅ Successfully created test release: ${testRelease.tag_name}`);
      
      // Clean up test release
      await octokit.repos.deleteRelease({
        owner,
        repo,
        release_id: testRelease.id,
      });
      console.log(`✅ Successfully deleted test release\n`);
    } catch (error) {
      console.error(`❌ Failed to create release: ${error.message}`);
      console.error('   This might mean:');
      console.error('   - Token lacks "repo" or "public_repo" scope');
      console.error('   - Token lacks "Contents" write permission (for fine-grained tokens)');
      console.error('   - Repository settings prevent releases\n');
      throw error;
    }

    console.log('🎉 All tests passed! GitHub storage is properly configured.');

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure the repository exists: https://github.com/' + owner + '/' + repo);
    console.error('2. For classic tokens: ensure "repo" scope is enabled');
    console.error('3. For fine-grained tokens: ensure these permissions:');
    console.error('   - Contents: Read and write');
    console.error('   - Metadata: Read-only (automatic)');
    console.error('4. If private repo: ensure token has access');
    console.error('\nCreate a new token at: https://github.com/settings/tokens');
  }
}

testGitHubSetup();
