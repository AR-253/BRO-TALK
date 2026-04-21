$userUrl = "http://localhost:5000/api/users"
$topicUrl = "http://localhost:5000/api/topics"
$postUrl = "http://localhost:5000/api/posts"
$commentUrl = "http://localhost:5000/api/comments"

# 1. Login
$loginBody = @{
    email = "admin_test@brotalk.com"
    password = "password123"
} | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "$userUrl/login" -Method Post -ContentType "application/json" -Body $loginBody
$token = $loginResponse.token
$headers = @{ Authorization = "Bearer $token" }
Write-Host "Logged In."

# 2. Get Topic & Create Post
$topics = Invoke-RestMethod -Uri $topicUrl -Method Get
$topicId = $topics[0]._id
if (-not $topicId) { Write-Error "No topics found"; exit 1 }

$postBody = @{ content = "Post for comments"; topicId = $topicId } | ConvertTo-Json
$post = Invoke-RestMethod -Uri $postUrl -Method Post -ContentType "application/json" -Headers $headers -Body $postBody
$postId = $post._id
Write-Host "Post Created: $postId"

# 3. Add Top-Level Comment
$commentBody = @{ content = "First!"; postId = $postId } | ConvertTo-Json
$comment1 = Invoke-RestMethod -Uri $commentUrl -Method Post -ContentType "application/json" -Headers $headers -Body $commentBody
Write-Host "Top Level Comment Added: $($comment1._id)"

# 4. Reply to Comment
$replyBody = @{ content = "Reply to first!"; postId = $postId; parentCommentId = $comment1._id } | ConvertTo-Json
$reply1 = Invoke-RestMethod -Uri $commentUrl -Method Post -ContentType "application/json" -Headers $headers -Body $replyBody
Write-Host "Reply Added: $($reply1._id) to parent $($comment1._id)"

# 5. Fetch Comments Tree
Write-Host "Fetching Comment Tree..."
$tree = Invoke-RestMethod -Uri "$commentUrl/post/$postId" -Method Get

# Simple recursive printer
function Print-Tree($nodes, $indent) {
    foreach ($node in $nodes) {
        Write-Host "$indent- $($node.content) (User: $($node.user.name))"
        if ($node.children.Count -gt 0) {
            Print-Tree $node.children "$indent  "
        }
    }
}

Print-Tree $tree ""
