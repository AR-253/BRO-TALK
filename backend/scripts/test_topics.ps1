$adminUrl = "http://localhost:5000/api/users"
$topicUrl = "http://localhost:5000/api/topics"

# 1. Register Admin
$adminBody = @{
    name = "Admin User"
    email = "admin_test@brotalk.com"
    password = "password123"
    role = "admin"
} | ConvertTo-Json

Write-Host "Registering Admin..."
try {
    $adminResponse = Invoke-RestMethod -Uri $adminUrl -Method Post -ContentType "application/json" -Body $adminBody
    $token = $adminResponse.token
    Write-Host "Admin Registered. Token obtained."
} catch {
    Write-Host "Registration failed. User might exist. Attempting Login..."
    $loginUrl = "http://localhost:5000/api/users/login"
    $loginBody = @{
        email = "admin_test@brotalk.com"
        password = "password123"
    } | ConvertTo-Json
    try {
        $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -ContentType "application/json" -Body $loginBody
        $token = $loginResponse.token
        Write-Host "Admin Logged In. Token obtained."
    } catch {
        Write-Host "Login failed: $_"
        exit 1
    }
}

# 2. Create Topic
$headers = @{
    Authorization = "Bearer $token"
}
$topicBody = @{
    title = "Technology"
    description = "All things tech"
} | ConvertTo-Json

Write-Host "Creating Topic 'Technology'..."
try {
    $topicResponse = Invoke-RestMethod -Uri $topicUrl -Method Post -ContentType "application/json" -Headers $headers -Body $topicBody
    Write-Host "Topic Created: $($topicResponse.title)"
} catch {
    Write-Host "Topic creation failed (might already exist): $_"
}

# 3. List Topics
Write-Host "Listing All Topics..."
try {
    $topics = Invoke-RestMethod -Uri $topicUrl -Method Get
    $topics | Format-Table title, description, isActive
} catch {
    Write-Host "Failed to list topics: $_"
}
