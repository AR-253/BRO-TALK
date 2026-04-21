$userUrl = "http://localhost:5000/api/users"
$topicUrl = "http://localhost:5000/api/topics"
$postUrl = "http://localhost:5000/api/posts"
$commentUrl = "http://localhost:5000/api/comments"
$notifyUrl = "http://localhost:5000/api/notifications"

# Function to get token for a user, creating if doesn't exist
function Get-UserToken {
    param (
        [string]$name,
        [string]$email,
        [string]$password
    )
    
    $loginBody = @{ email = $email; password = $password } | ConvertTo-Json
    $loginUri = "$userUrl/login"
    
    try {
        $response = Invoke-RestMethod -Uri $loginUri -Method Post -ContentType "application/json" -Body $loginBody
        return $response.token
    } catch {
        # If login fails, try to register
        Write-Host "Registering $email..."
        $regBody = @{ name = $name; email = $email; password = $password } | ConvertTo-Json
        try {
            Invoke-RestMethod -Uri $userUrl -Method Post -ContentType "application/json" -Body $regBody | Out-Null
            # Login again after registration
            $response = Invoke-RestMethod -Uri $loginUri -Method Post -ContentType "application/json" -Body $loginBody
            return $response.token
        } catch {
            Write-Host "Registration/Login failed for $email: $_"
            exit 1
        }
    }
}

# 1. Setup Users
Write-Host "Setting up users..."
$tokenA = Get-UserToken -name "Admin Tester" -email "admin_test@brotalk.com" -password "password123"
$headersA = @{ Authorization = "Bearer $tokenA" }

$tokenB = Get-UserToken -name "Normie Bro" -email "normie@brotalk.com" -password "password123"
$headersB = @{ Authorization = "Bearer $tokenB" }

Write-Host "Users Ready."

# 2. Get Topic
$topics = Invoke-RestMethod -Uri $topicUrl -Method Get
if ($topics.Count -eq 0) {
    $topicBody = @{ title = "Notification Test Topic"; description = "Testing notifs" } | ConvertTo-Json
    $newTopic = Invoke-RestMethod -Uri $topicUrl -Method Post -ContentType "application/json" -Headers $headersA -Body $topicBody
    $topicId = $newTopic._id
} else {
    $topicId = $topics[0]._id
}


# 3. Create Post
$postBody = @{ content = "User B, reply to this!"; topicId = $topicId } | ConvertTo-Json
$post = Invoke-RestMethod -Uri $postUrl -Method Post -ContentType "application/json" -Headers $headersA -Body $postBody
$postId = $post._id
Write-Host "User A Created Post: $postId"

Start-Sleep -Seconds 1

# 4. Reply Notification Test (User B -> User A)
$commentBody = @{ content = "Replying to you!"; postId = $postId } | ConvertTo-Json
Invoke-RestMethod -Uri $commentUrl -Method Post -ContentType "application/json" -Headers $headersB -Body $commentBody | Out-Null
Write-Host "User B commented."

Start-Sleep -Seconds 1

Write-Host "Checking User A Notifications (Expect 'reply')..."
$notifsA = Invoke-RestMethod -Uri $notifyUrl -Method Get -Headers $headersA
$notifsA | Select-Object type, @{Name="Sender"; Expression={$_.sender.name}}, read | Format-Table

# 5. Mention Notification Test (User A -> MentionTarget)
$tokenMention = Get-UserToken -name "MentionTarget" -email "mention_target@brotalk.com" -password "password123"
$headersMention = @{ Authorization = "Bearer $tokenMention" }

$mentionBody = @{ content = "Hey @MentionTarget check this!"; postId = $postId } | ConvertTo-Json
Invoke-RestMethod -Uri $commentUrl -Method Post -ContentType "application/json" -Headers $headersA -Body $mentionBody | Out-Null
Write-Host "User A mentioned @MentionTarget."

Start-Sleep -Seconds 1

Write-Host "Checking MentionTarget Notifications (Expect 'mention')..."
$notifsMention = Invoke-RestMethod -Uri $notifyUrl -Method Get -Headers $headersMention
$notifsMention | Select-Object type, @{Name="Sender"; Expression={$_.sender.name}}, read | Format-Table
