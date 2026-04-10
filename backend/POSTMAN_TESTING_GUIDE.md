# Postman API Testing Guide for AI Gym Companion

## Quick Setup
1. Import the collection: `AI-Gym-Companion-API.postman_collection.json` 
2. Set base URL: `http://localhost:3000`
3. Make sure your server is running: `npm start`

## Available API Endpoints

### 1. 🔍 Health Check
**Endpoint:** `POST /api/chat`  
**Purpose:** Test if server is running  
**Headers:** `Content-Type: application/json`

**JSON Body:**
```json
{
    "prompt": "health check"
}
```

**Expected Response:**
```json
{
    "text": "...response from AI...",
    "usedModel": "gemini-2.5-flash"
}
```

---

### 2. 📤 File Upload
**Endpoint:** `POST /api/upload`  
**Purpose:** Upload a file with metadata  
**Type:** Form Data

**Form Data:**
- `file`: (Select any file from your computer)
- `metadata`: 
```json
{
    "description": "Test upload from Postman",
    "category": "testing", 
    "tags": ["postman", "api", "test"],
    "author": "Your Name"
}
```

**Expected Response:**
```json
{
    "success": true,
    "upload": {
        "id": "69c4bfb4f23b542f246f1d3d",
        "filename": "file-1774501812970-857515052.txt",
        "originalName": "test-file.txt",
        "mimetype": "text/plain",
        "size": 119,
        "uploadDate": "2026-03-26T05:10:12.971Z",
        "url": "/uploads/file-1774501812970-857515052.txt"
    }
}
```

---

### 3. 📋 Get All Uploads
**Endpoint:** `GET /api/uploads`  
**Purpose:** List all uploaded files

**Expected Response:**
```json
{
    "uploads": [
        {
            "id": "69c4bfb4f23b542f246f1d3d",
            "filename": "file-1774501812970-857515052.txt",
            "originalName": "test-file.txt",
            "mimetype": "text/plain",
            "size": 119,
            "uploadDate": "2026-03-26T05:10:12.971Z",
            "metadata": {
                "description": "Test upload from Postman",
                "category": "testing",
                "tags": ["postman", "api", "test"]
            },
            "url": "/uploads/file-1774501812970-857515052.txt"
        }
    ]
}
```

---

### 4. 🎯 Get Specific Upload
**Endpoint:** `GET /api/uploads/{uploadId}`  
**Purpose:** Get details of a specific upload  
**Replace {uploadId} with actual ID from upload response**

**Expected Response:**
```json
{
    "id": "69c4bfb4f23b542f246f1d3d",
    "filename": "file-1774501812970-857515052.txt",
    "originalName": "test-file.txt",
    "mimetype": "text/plain",
    "size": 119,
    "uploadDate": "2026-03-26T05:10:12.971Z",
    "metadata": {
        "description": "Test upload from Postman",
        "category": "testing"
    },
    "url": "/uploads/file-1774501812970-857515052.txt"
}
```

---

### 5. ⬇️ Download File
**Endpoint:** `GET /uploads/{filename}`  
**Purpose:** Download the actual file content  
**Replace {filename} with actual filename from upload response**

**Expected Response:** Raw file content

---

### 6. 🗑️ Delete Upload
**Endpoint:** `DELETE /api/uploads/{uploadId}`  
**Purpose:** Delete an uploaded file  
**Replace {uploadId} with actual ID**

**Expected Response:**
```json
{
    "success": true,
    "message": "Upload deleted successfully"
}
```

---

## Error Test Cases

### 7. 🚫 Upload Without File (Should Fail)
**Endpoint:** `POST /api/upload`  
**Form Data:** Only metadata, no file

**Expected Response (400):**
```json
{
    "error": "No file uploaded"
}
```

### 8. 🚫 Invalid Upload ID (Should Fail)
**Endpoint:** `GET /api/uploads/invalid123`

**Expected Response (404):**
```json
{
    "error": "Upload not found"
}
```

### 9. 🚫 Chat with Missing Data
**Endpoint:** `POST /api/chat`  
**JSON Body:**
```json
{
    "systemInstruction": "Test without prompt"
}
```

---

## Advanced Test Scenarios

### Multiple File Types Test
Test uploading different file types:

1. **Text File (.txt)**
   - Content: Plain text
   - Metadata: `{"type": "text", "category": "documents"}`

2. **JSON File (.json)**
   - Content: `{"test": "data", "number": 123}`
   - Metadata: `{"type": "json", "category": "data"}`

3. **CSV File (.csv)**
   - Content: `name,age\nJohn,25\nJane,30`
   - Metadata: `{"type": "csv", "category": "data"}`

4. **Image File (.jpg/.png)**
   - Upload any image
   - Metadata: `{"type": "image", "category": "media"}`

### Metadata Variations
Test different metadata structures:

**Minimal Metadata:**
```json
{
    "description": "Simple upload"
}
```

**Rich Metadata:**
```json
{
    "description": "Comprehensive test upload",
    "category": "testing",
    "tags": ["postman", "api", "comprehensive"],
    "author": "Test User",
    "project": "AI Gym Companion",
    "version": "1.0",
    "priority": "high",
    "notes": "This is a detailed test with rich metadata",
    "customFields": {
        "environment": "development",
        "testSuite": "postman",
        "timestamp": "2024-03-26T10:30:00Z"
    }
}
```

**Empty Metadata:**
```json
{}
```

---

## Test Sequence Recommendation

1. **Health Check** - Verify server is running
2. **Upload File** - Upload a test file (save the ID)
3. **Get All Uploads** - Verify file appears in list
4. **Get Specific Upload** - Use saved ID
5. **Download File** - Use filename from upload response
6. **Error Tests** - Test invalid scenarios
7. **Multiple File Types** - Test different file formats
8. **Delete Upload** - Clean up test data

---

## Environment Variables for Postman

Set these in your Postman environment:

- `baseUrl`: `http://localhost:3000`
- `uploadId`: (Will be set automatically by upload test)
- `filename`: (Will be set automatically by upload test)

---

## Tips for Testing

1. **File Size Limit**: Max 10MB files are allowed
2. **Supported File Types**: All file types supported
3. **Metadata**: Must be valid JSON string
4. **Error Handling**: Check both success and error responses
5. **Cleanup**: Delete test uploads to avoid cluttering database

---

## Collection Import Instructions

1. Open Postman
2. Click "Import" button
3. Select "File" tab
4. Choose `AI-Gym-Companion-API.postman_collection.json`
5. Click "Import"
6. Set environment variables if needed
7. Run individual requests or entire collection

The collection includes automated tests that will validate responses!