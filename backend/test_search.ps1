$userUrl = "http://localhost:5000/api/users"
$topicUrl = "http://localhost:5000/api/topics"
$postUrl = "http://localhost:5000/api/posts"

# 1. Login
$loginBody = @{
    email = "admin_test@brotalk.com"
    password = "password123"
} | ConvertTo-Json
$token = (Invoke-RestMethod -Uri "$userUrl/login" -Method Post -ContentType "application/json" -Body $loginBody).token
$headers = @{ Authorization = "Bearer $token" }

# 2. Get Topic ID (Technology)
$topics = Invoke-RestMethod -Uri $topicUrl -Method Get
$techTopic = $topics | Where-Object { $_.title -eq "Technology" }
$topicId = $techTopic._id

# 3. Create Unique Posts for Search
$post1 = @{ content = "Apple released a new iPhone today."; topicId = $topicId } | ConvertTo-Json
Invoke-RestMethod -Uri $postUrl -Method Post -ContentType "application/json" -Headers $headers -Body $post1 | Out-Null

$post2 = @{ content = "I love eating apples for breakfast."; topicId = $topicId } | ConvertTo-Json
Invoke-RestMethod -Uri $postUrl -Method Post -ContentType "application/json" -Headers $headers -Body $post2 | Out-Null

$post3 = @{ content = "Microsoft Windows 12 rumors."; topicId = $topicId } | ConvertTo-Json
Invoke-RestMethod -Uri $postUrl -Method Post -ContentType "application/json" -Headers $headers -Body $post3 | Out-Null

Start-Sleep -Seconds 1 # Wait for indexing? Usually fast.

# 4. Search for 'Apple'
Write-Host "Searching for 'Apple'..."
$results = Invoke-RestMethod -Uri "$postUrl/search?q=Apple" -Method Get
$results | Select-Object content, user | Format-Table

# 5. Search for 'Windows' in Technology topic
Write-Host "Searching for 'Windows' in Topic..."
$results2 = Invoke-RestMethod -Uri "$postUrl/search?q=Windows&topic=$topicId" -Method Get
$results2 | Select-Object content | Format-Table
