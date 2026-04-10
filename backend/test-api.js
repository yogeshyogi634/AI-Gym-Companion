// API Test Suite for AI Gym Companion Backend
// Run with: node test-api.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3000';
let uploadedFileId = null;

// Helper function to make HTTP requests
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const data = await response.text();
    
    let jsonData = null;
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      // Response might not be JSON
    }

    return {
      status: response.status,
      statusText: response.statusText,
      data: jsonData || data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      error: error.message,
      status: 0
    };
  }
}

// Helper function to create form data for file uploads
function createFormData(filePath, metadata = {}) {
  const formData = new FormData();
  
  // Create a test file if it doesn't exist
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, 'Test file content for API testing\nThis is a sample upload.');
  }
  
  const fileContent = fs.readFileSync(filePath);
  const blob = new Blob([fileContent], { type: 'text/plain' });
  
  formData.append('file', blob, path.basename(filePath));
  formData.append('metadata', JSON.stringify(metadata));
  
  return formData;
}

// Test functions
async function testHealthCheck() {
  console.log('\n🔍 Testing Server Health...');
  const result = await makeRequest(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'test' })
  });
  
  console.log(`Status: ${result.status}`);
  console.log('Response:', result.status === 200 ? '✅ Server is running' : '❌ Server issue');
}

async function testFileUpload() {
  console.log('\n📤 Testing File Upload...');
  
  const testFilePath = path.join(__dirname, 'test-upload-sample.txt');
  const formData = createFormData(testFilePath, {
    description: 'API Test Upload',
    category: 'testing',
    tags: ['api', 'test', 'upload']
  });

  const result = await makeRequest(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData
  });

  console.log(`Status: ${result.status}`);
  console.log('Response:', result.data);
  
  if (result.status === 200 && result.data.success) {
    uploadedFileId = result.data.upload.id;
    console.log('✅ Upload successful');
    console.log(`📄 File ID: ${uploadedFileId}`);
  } else {
    console.log('❌ Upload failed');
  }
  
  return result;
}

async function testGetAllUploads() {
  console.log('\n📋 Testing Get All Uploads...');
  
  const result = await makeRequest(`${BASE_URL}/api/uploads`);
  
  console.log(`Status: ${result.status}`);
  console.log('Response:', result.data);
  
  if (result.status === 200 && result.data.uploads) {
    console.log(`✅ Found ${result.data.uploads.length} upload(s)`);
  } else {
    console.log('❌ Failed to get uploads');
  }
  
  return result;
}

async function testGetSpecificUpload() {
  if (!uploadedFileId) {
    console.log('\n⏭️  Skipping Get Specific Upload (no file uploaded)');
    return;
  }
  
  console.log('\n🎯 Testing Get Specific Upload...');
  
  const result = await makeRequest(`${BASE_URL}/api/uploads/${uploadedFileId}`);
  
  console.log(`Status: ${result.status}`);
  console.log('Response:', result.data);
  
  if (result.status === 200 && result.data.id) {
    console.log('✅ Successfully retrieved specific upload');
  } else {
    console.log('❌ Failed to get specific upload');
  }
  
  return result;
}

async function testFileDownload() {
  if (!uploadedFileId) {
    console.log('\n⏭️  Skipping File Download (no file uploaded)');
    return;
  }
  
  console.log('\n⬇️  Testing File Download...');
  
  // First get the upload details to get the filename
  const uploadResult = await makeRequest(`${BASE_URL}/api/uploads/${uploadedFileId}`);
  
  if (uploadResult.status === 200 && uploadResult.data.filename) {
    const downloadResult = await makeRequest(`${BASE_URL}/uploads/${uploadResult.data.filename}`);
    
    console.log(`Status: ${downloadResult.status}`);
    console.log('Content preview:', typeof downloadResult.data === 'string' ? 
      downloadResult.data.substring(0, 50) + '...' : 'Binary data');
    
    if (downloadResult.status === 200) {
      console.log('✅ File download successful');
    } else {
      console.log('❌ File download failed');
    }
    
    return downloadResult;
  } else {
    console.log('❌ Could not get file details for download');
  }
}

async function testInvalidUploadId() {
  console.log('\n🚫 Testing Invalid Upload ID...');
  
  const result = await makeRequest(`${BASE_URL}/api/uploads/invalid123`);
  
  console.log(`Status: ${result.status}`);
  console.log('Response:', result.data);
  
  if (result.status === 404 || result.status === 400) {
    console.log('✅ Correctly handled invalid ID');
  } else {
    console.log('❌ Invalid ID not handled properly');
  }
  
  return result;
}

async function testUploadWithoutFile() {
  console.log('\n🚫 Testing Upload Without File...');
  
  const formData = new FormData();
  formData.append('metadata', JSON.stringify({ test: 'no file' }));
  
  const result = await makeRequest(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData
  });
  
  console.log(`Status: ${result.status}`);
  console.log('Response:', result.data);
  
  if (result.status === 400) {
    console.log('✅ Correctly rejected upload without file');
  } else {
    console.log('❌ Should have rejected upload without file');
  }
  
  return result;
}

async function testUploadLargeFile() {
  console.log('\n📦 Testing Large File Upload (>10MB)...');
  
  // Create a large test file (11MB)
  const largeFilePath = path.join(__dirname, 'large-test-file.txt');
  const largeContent = 'A'.repeat(11 * 1024 * 1024); // 11MB of 'A's
  
  try {
    fs.writeFileSync(largeFilePath, largeContent);
    
    const formData = createFormData(largeFilePath, {
      description: 'Large file test',
      category: 'testing'
    });

    const result = await makeRequest(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData
    });

    console.log(`Status: ${result.status}`);
    console.log('Response:', result.data);
    
    if (result.status === 413 || (result.status === 400 && result.data.error)) {
      console.log('✅ Correctly rejected large file');
    } else {
      console.log('❌ Large file should have been rejected');
    }
    
    // Clean up
    fs.unlinkSync(largeFilePath);
    
    return result;
  } catch (error) {
    console.log(`❌ Error testing large file: ${error.message}`);
    // Clean up on error
    if (fs.existsSync(largeFilePath)) {
      fs.unlinkSync(largeFilePath);
    }
  }
}

async function testDeleteUpload() {
  if (!uploadedFileId) {
    console.log('\n⏭️  Skipping Delete Upload (no file uploaded)');
    return;
  }
  
  console.log('\n🗑️  Testing Delete Upload...');
  
  const result = await makeRequest(`${BASE_URL}/api/uploads/${uploadedFileId}`, {
    method: 'DELETE'
  });
  
  console.log(`Status: ${result.status}`);
  console.log('Response:', result.data);
  
  if (result.status === 200 && result.data.success) {
    console.log('✅ Successfully deleted upload');
    
    // Verify deletion by trying to get the file
    const verifyResult = await makeRequest(`${BASE_URL}/api/uploads/${uploadedFileId}`);
    if (verifyResult.status === 404) {
      console.log('✅ Confirmed file was deleted from database');
    } else {
      console.log('⚠️  File might still exist in database');
    }
  } else {
    console.log('❌ Failed to delete upload');
  }
  
  return result;
}

async function testMultipleFileTypes() {
  console.log('\n📁 Testing Multiple File Types...');
  
  const fileTypes = [
    { name: 'test.json', content: '{"test": "data"}', type: 'application/json' },
    { name: 'test.csv', content: 'name,age\nJohn,25', type: 'text/csv' },
    { name: 'test.xml', content: '<root><item>test</item></root>', type: 'application/xml' }
  ];
  
  const uploadedIds = [];
  
  for (const fileType of fileTypes) {
    const filePath = path.join(__dirname, fileType.name);
    fs.writeFileSync(filePath, fileType.content);
    
    const formData = createFormData(filePath, {
      description: `Test ${fileType.name} upload`,
      fileType: fileType.type
    });

    const result = await makeRequest(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData
    });
    
    console.log(`${fileType.name}: Status ${result.status}`);
    
    if (result.status === 200 && result.data.success) {
      uploadedIds.push(result.data.upload.id);
      console.log(`✅ ${fileType.name} uploaded successfully`);
    } else {
      console.log(`❌ ${fileType.name} upload failed`);
    }
    
    // Clean up test file
    fs.unlinkSync(filePath);
  }
  
  // Clean up uploaded files
  for (const id of uploadedIds) {
    await makeRequest(`${BASE_URL}/api/uploads/${id}`, { method: 'DELETE' });
  }
  
  console.log(`📊 Successfully uploaded ${uploadedIds.length}/${fileTypes.length} file types`);
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting AI Gym Companion API Tests');
  console.log('=====================================');
  
  const tests = [
    testHealthCheck,
    testFileUpload,
    testGetAllUploads,
    testGetSpecificUpload,
    testFileDownload,
    testInvalidUploadId,
    testUploadWithoutFile,
    testUploadLargeFile,
    testMultipleFileTypes,
    testDeleteUpload
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      await test();
      passedTests++;
    } catch (error) {
      console.log(`❌ Test ${test.name} failed with error: ${error.message}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  // Cleanup
  const testFiles = [
    path.join(__dirname, 'test-upload-sample.txt')
  ];
  
  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
  
  console.log('\n🧹 Cleanup completed');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };