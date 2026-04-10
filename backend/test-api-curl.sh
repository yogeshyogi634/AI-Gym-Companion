#!/bin/bash

# API Test Suite using curl commands
# Make sure your server is running on localhost:3000

BASE_URL="http://localhost:3000"
TEST_FILE="test-sample.txt"
LARGE_FILE="large-test.txt"

echo "🚀 AI Gym Companion API Tests"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Create test file
create_test_file() {
    echo "Creating test file for upload..."
    echo "This is a test file for API testing." > $TEST_FILE
    echo "It contains sample data to verify upload functionality." >> $TEST_FILE
    echo "File size: $(wc -c < $TEST_FILE) bytes" >> $TEST_FILE
}

# Test 1: Health Check (using existing chat endpoint)
echo -e "\n${BLUE}🔍 Test 1: Server Health Check${NC}"
response=$(curl -s -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{"prompt":"health check"}' \
  $BASE_URL/api/chat -o /dev/null)
print_result $([ "$response" -eq 200 ] && echo 0 || echo 1) "Server health check"

# Test 2: File Upload
echo -e "\n${BLUE}📤 Test 2: File Upload${NC}"
create_test_file

upload_response=$(curl -s -X POST \
  -F "file=@$TEST_FILE" \
  -F 'metadata={"description":"Test upload via curl","category":"testing","tags":["api","curl"]}' \
  $BASE_URL/api/upload)

echo "Upload response: $upload_response"

# Extract file ID from response
file_id=$(echo $upload_response | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Extracted file ID: $file_id"

if [[ $upload_response == *"success":true* ]]; then
    print_result 0 "File upload successful"
else
    print_result 1 "File upload failed"
fi

# Test 3: Get All Uploads
echo -e "\n${BLUE}📋 Test 3: Get All Uploads${NC}"
all_uploads_response=$(curl -s $BASE_URL/api/uploads)
echo "All uploads response: $all_uploads_response"

if [[ $all_uploads_response == *"uploads"* ]]; then
    print_result 0 "Get all uploads successful"
else
    print_result 1 "Get all uploads failed"
fi

# Test 4: Get Specific Upload
if [ ! -z "$file_id" ]; then
    echo -e "\n${BLUE}🎯 Test 4: Get Specific Upload${NC}"
    specific_upload_response=$(curl -s $BASE_URL/api/uploads/$file_id)
    echo "Specific upload response: $specific_upload_response"
    
    if [[ $specific_upload_response == *"$file_id"* ]]; then
        print_result 0 "Get specific upload successful"
    else
        print_result 1 "Get specific upload failed"
    fi
else
    echo -e "\n${YELLOW}⏭️  Test 4: Skipping Get Specific Upload (no file ID)${NC}"
fi

# Test 5: Download File
if [ ! -z "$file_id" ]; then
    echo -e "\n${BLUE}⬇️  Test 5: File Download${NC}"
    
    # Get filename from upload details
    filename=$(echo $specific_upload_response | grep -o '"filename":"[^"]*"' | cut -d'"' -f4)
    
    if [ ! -z "$filename" ]; then
        download_response=$(curl -s -w "%{http_code}" $BASE_URL/uploads/$filename -o downloaded_file.txt)
        
        if [ "$download_response" -eq 200 ] && [ -f downloaded_file.txt ]; then
            print_result 0 "File download successful"
            echo "Downloaded file size: $(wc -c < downloaded_file.txt) bytes"
            rm -f downloaded_file.txt
        else
            print_result 1 "File download failed"
        fi
    else
        print_result 1 "Could not extract filename for download"
    fi
else
    echo -e "\n${YELLOW}⏭️  Test 5: Skipping File Download (no file ID)${NC}"
fi

# Test 6: Invalid Upload ID
echo -e "\n${BLUE}🚫 Test 6: Invalid Upload ID${NC}"
invalid_response=$(curl -s -w "%{http_code}" $BASE_URL/api/uploads/invalid123 -o /dev/null)

if [ "$invalid_response" -eq 404 ] || [ "$invalid_response" -eq 400 ]; then
    print_result 0 "Invalid ID handled correctly"
else
    print_result 1 "Invalid ID not handled properly (got $invalid_response)"
fi

# Test 7: Upload without file
echo -e "\n${BLUE}🚫 Test 7: Upload Without File${NC}"
no_file_response=$(curl -s -w "%{http_code}" -X POST \
  -F 'metadata={"description":"No file test"}' \
  $BASE_URL/api/upload -o /dev/null)

if [ "$no_file_response" -eq 400 ]; then
    print_result 0 "Upload without file correctly rejected"
else
    print_result 1 "Upload without file should be rejected (got $no_file_response)"
fi

# Test 8: Large file upload (>10MB)
echo -e "\n${BLUE}📦 Test 8: Large File Upload (>10MB)${NC}"
echo "Creating large file (11MB)..."
dd if=/dev/zero of=$LARGE_FILE bs=1M count=11 2>/dev/null

large_file_response=$(curl -s -w "%{http_code}" -X POST \
  -F "file=@$LARGE_FILE" \
  -F 'metadata={"description":"Large file test"}' \
  $BASE_URL/api/upload -o /dev/null)

if [ "$large_file_response" -eq 413 ] || [ "$large_file_response" -eq 400 ]; then
    print_result 0 "Large file correctly rejected"
else
    print_result 1 "Large file should be rejected (got $large_file_response)"
fi

rm -f $LARGE_FILE

# Test 9: Multiple file types
echo -e "\n${BLUE}📁 Test 9: Multiple File Types${NC}"

# JSON file
echo '{"test": "data", "number": 123}' > test.json
json_response=$(curl -s -X POST -F "file=@test.json" -F 'metadata={"type":"json"}' $BASE_URL/api/upload)
json_success=$(echo $json_response | grep -c "success\":true")

# CSV file
echo "name,age,city" > test.csv
echo "John,25,NYC" >> test.csv
csv_response=$(curl -s -X POST -F "file=@test.csv" -F 'metadata={"type":"csv"}' $BASE_URL/api/upload)
csv_success=$(echo $csv_response | grep -c "success\":true")

# XML file
echo '<?xml version="1.0"?><root><item>test</item></root>' > test.xml
xml_response=$(curl -s -X POST -F "file=@test.xml" -F 'metadata={"type":"xml"}' $BASE_URL/api/upload)
xml_success=$(echo $xml_response | grep -c "success\":true")

total_success=$((json_success + csv_success + xml_success))
print_result $([ $total_success -eq 3 ] && echo 0 || echo 1) "Multiple file types ($total_success/3 successful)"

# Extract IDs for cleanup
json_id=$(echo $json_response | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
csv_id=$(echo $csv_response | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
xml_id=$(echo $xml_response | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

# Test 10: Delete Upload
echo -e "\n${BLUE}🗑️  Test 10: Delete Upload${NC}"

if [ ! -z "$file_id" ]; then
    delete_response=$(curl -s -X DELETE $BASE_URL/api/uploads/$file_id)
    echo "Delete response: $delete_response"
    
    if [[ $delete_response == *"success":true* ]]; then
        print_result 0 "Delete upload successful"
        
        # Verify deletion
        verify_response=$(curl -s -w "%{http_code}" $BASE_URL/api/uploads/$file_id -o /dev/null)
        if [ "$verify_response" -eq 404 ]; then
            print_result 0 "Deletion verified"
        else
            print_result 1 "Deletion not verified properly"
        fi
    else
        print_result 1 "Delete upload failed"
    fi
else
    echo -e "${YELLOW}⏭️  Skipping delete test (no file ID)${NC}"
fi

# Cleanup remaining test files
echo -e "\n${BLUE}🧹 Cleanup${NC}"
for id in $json_id $csv_id $xml_id; do
    if [ ! -z "$id" ]; then
        curl -s -X DELETE $BASE_URL/api/uploads/$id > /dev/null
    fi
done

rm -f $TEST_FILE test.json test.csv test.xml downloaded_file.txt

echo -e "\n${GREEN}🎉 All tests completed!${NC}"
echo "Check the output above for individual test results."