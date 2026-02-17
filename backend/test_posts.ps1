$userUrl = "http://localhost:5000/api/users"
$topicUrl = "http://localhost:5000/api/topics"
$postUrl = "http://localhost:5000/api/posts"

# 1. Login User
$loginBody = @{
    email = "admin_test@brotalk.com"
    password = "password123"
} | ConvertTo-Json

Write-Host "Logging in..."
try {
    $loginResponse = Invoke-RestMethod -Uri "$userUrl/login" -Method Post -ContentType "application/json" -Body $loginBody
    $token = $loginResponse.token
    Write-Host "Logged In. Token obtained."
} catch {
    Write-Host "Login failed: $_"
    exit 1
}

$headers = @{
    Authorization = "Bearer $token"
}

# 2. Get Topic ID (Technology)
$topics = Invoke-RestMethod -Uri $topicUrl -Method Get
$techTopic = $topics | Where-Object { $_.title -eq "Technology" }
if (-not $techTopic) {
    Write-Host "Topic 'Technology' not found. Creating it..."
    $topicBody = @{ title = "Technology"; description = "Tech stuff" } | ConvertTo-Json
    $techTopic = Invoke-RestMethod -Uri $topicUrl -Method Post -ContentType "application/json" -Headers $headers -Body $topicBody
}
$topicId = $techTopic._id
Write-Host "Topic ID: $topicId"

# 3. Create Post (Normal)
$postBody = @{
    content = "Hello Brotalk! This is my first post."
    topicId = $topicId
} | ConvertTo-Json

Write-Host "Creating Normal Post..."
try {
    $postResponse = Invoke-RestMethod -Uri $postUrl -Method Post -ContentType "application/json" -Headers $headers -Body $postBody
    Write-Host "Post Created: $($postResponse._id)"
} catch {
    Write-Host "Post creation failed: $_"
}

# 4. Create Post (Anonymous)
$anonPostBody = @{
    content = "This is a secret... shhh!"
    topicId = $topicId
    isAnonymous = $true
} | ConvertTo-Json

Write-Host "Creating Anonymous Post..."
try {
    $anonResponse = Invoke-RestMethod -Uri $postUrl -Method Post -ContentType "application/json" -Headers $headers -Body $anonPostBody
    Write-Host "Anonymous Post Created: $($anonResponse._id)"
} catch {
    Write-Host "Anon Post creation failed: $_"
}

# 5. List Posts
Write-Host "Listing Posts for Topic..."
try {
    $posts = Invoke-RestMethod -Uri "$postUrl/topic/$topicId" -Method Get
    $posts | Select-Object content, @{Name="User"; Expression={$_.user.name}}, isAnonymous | Format-Table
} catch {
    Write-Host "Failed to list posts: $_"
}
