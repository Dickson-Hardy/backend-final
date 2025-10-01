// Test script for admin article update with file uploads
// Run with: node test-admin-update.js

const FormData = require('form-data');
const fs = require('fs');

// Example 1: Update metadata only (JSON)
async function updateMetadataOnly(token, articleId) {
  const response = await fetch(`http://localhost:3001/admin/articles/${articleId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Updated Title',
      status: 'published',
      featured: true,
      articleNumber: '042'
    })
  });
  
  return response.json();
}

// Example 2: Update with file upload (Form Data)
async function updateWithFiles(token, articleId, manuscriptPath) {
  const formData = new FormData();
  
  // Add metadata fields
  formData.append('title', 'Updated Title with New Manuscript');
  formData.append('status', 'published');
  formData.append('featured', 'true');
  formData.append('abstract', 'Updated abstract text');
  
  // Add keywords as JSON string
  formData.append('keywords', JSON.stringify(['keyword1', 'keyword2', 'keyword3']));
  
  // Add authors as JSON string
  formData.append('authors', JSON.stringify([
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      affiliation: 'University'
    }
  ]));
  
  // Add manuscript file if provided
  if (manuscriptPath && fs.existsSync(manuscriptPath)) {
    formData.append('manuscript', fs.createReadStream(manuscriptPath));
  }
  
  const response = await fetch(`http://localhost:3001/admin/articles/${articleId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      ...formData.getHeaders()
    },
    body: formData
  });
  
  return response.json();
}

// Example 3: Add supplementary files while updating
async function updateWithSupplementaryFiles(token, articleId, supplementaryPaths) {
  const formData = new FormData();
  
  // Add metadata
  formData.append('title', 'Article with New Supplementary Files');
  
  // Add multiple supplementary files
  supplementaryPaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      formData.append('supplementary', fs.createReadStream(filePath));
    }
  });
  
  const response = await fetch(`http://localhost:3001/admin/articles/${articleId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      ...formData.getHeaders()
    },
    body: formData
  });
  
  return response.json();
}

// Browser-compatible version (for frontend)
async function browserUpdateWithFiles(token, articleId, formDataFromUI) {
  // formDataFromUI is already a FormData object from the browser
  // Example construction:
  // const formData = new FormData();
  // formData.append('title', titleInput.value);
  // formData.append('manuscript', fileInput.files[0]);
  
  const response = await fetch(`/api/admin/articles/${articleId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
      // Do NOT set Content-Type - browser will set it automatically with boundary
    },
    body: formDataFromUI
  });
  
  return response.json();
}

// Example usage:
// const token = 'your-admin-jwt-token';
// const articleId = '507f1f77bcf86cd799439011';
// 
// // Update metadata only
// const result1 = await updateMetadataOnly(token, articleId);
// console.log('Updated:', result1);
//
// // Update with new manuscript
// const result2 = await updateWithFiles(token, articleId, './new-manuscript.pdf');
// console.log('Updated with files:', result2);
//
// // Add supplementary files
// const result3 = await updateWithSupplementaryFiles(token, articleId, ['./data1.csv', './data2.xlsx']);
// console.log('Added supplementary files:', result3);

module.exports = {
  updateMetadataOnly,
  updateWithFiles,
  updateWithSupplementaryFiles,
  browserUpdateWithFiles
};
