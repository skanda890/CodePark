# 🚀 GitHub Integration

OAuth 2.0 authentication and webhook handling for seamless GitHub integration. Enables pull request syncing, issue management, and automated workflows.

## Features

- 🔓 **OAuth 2.0 Flow**: Secure GitHub authentication
- 🤜 **Webhook Support**: Real-time GitHub event handling
- 📝 **PR Syncing**: Automatic pull request synchronization
- 📢 **Issue Management**: Create and track issues from CodePark
- 🔄 **Automated Workflows**: Trigger actions on GitHub events
- 🔌 **REST API**: Easy GitHub API access
- 💫 **Commit Analysis**: Extract insights from commits

## Installation

```bash
cd github-integration
npm install
```

## Environment Variables

```env
PORT=3004
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
GITHUB_WEBHOOK_SECRET=your-webhook-secret
NODE_ENV=development
CALLBACK_URL=http://localhost:3004/callback
```

## GitHub App Setup

### Create GitHub OAuth App

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: CodePark
   - **Homepage URL**: https://codepark.local
   - **Authorization callback URL**: http://localhost:3004/callback
4. Copy Client ID and Client Secret

## Usage

### Start the Service

```bash
npm start
```

### Authentication Flow

#### 1. Redirect User to GitHub

```javascript
// Frontend
window.location.href = 'http://localhost:3004/auth';
```

#### 2. Handle Callback

User is redirected to GitHub, then back to `/callback`

```json
{
  "message": "Authentication successful",
  "user": "github-username",
  "token": "github_pat_xxx"
}
```

## REST API Endpoints

### GET /auth

Initiates OAuth flow with GitHub.

```bash
curl http://localhost:3004/auth
```

Redirects user to GitHub authorization page.

### GET /callback

GitHub redirects here after authorization.

```bash
# Automatically handled after GitHub OAuth
# Returns: { message: 'Authentication successful', user: 'username' }
```

### POST /webhook

Receive GitHub webhook events.

```bash
curl -X POST http://localhost:3004/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: pull_request" \
  -H "X-Hub-Signature-256: sha256=xxx" \
  -d '{
    "action": "opened",
    "pull_request": {
      "number": 123,
      "title": "Fix bug",
      "user": { "login": "developer" }
    }
  }'
```

## Webhook Events

Supported GitHub events:

| Event | Action | Use Case |
|:---:|:---:|:---:|
| `push` | New commits | Trigger CI/CD |
| `pull_request` | PR opened/closed | Track contributions |
| `issues` | Issue created | Auto-create tasks |
| `release` | New release | Deploy notifications |
| `repository` | Repo changes | Update metadata |

## Usage Examples

### Example 1: Sync PRs

```javascript
const axios = require('axios');

const webhookPayload = {
  action: 'opened',
  pull_request: {
    number: 456,
    title: 'Add feature X',
    user: { login: 'alice' },
    created_at: '2025-12-15T10:00:00Z'
  }
};

// Send to CodePark to create a task
await axios.post('http://localhost:3004/webhook', webhookPayload);
```

### Example 2: Create GitHub Issue

```javascript
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: 'github_pat_xxx' });

await octokit.rest.issues.create({
  owner: 'user',
  repo: 'codepark',
  title: 'High priority task',
  body: 'This needs immediate attention'
});
```

### Example 3: Get PR Reviews

```javascript
const reviews = await octokit.rest.pulls.listReviews({
  owner: 'user',
  repo: 'codepark',
  pull_number: 123
});
```

## OAuth Flow Diagram

```
┌────────────┐     ┌──────────┐     ┌──────────┐
│  CodePark App │     │ GitHub OAuth │     │     User    │
└────────────┘     └──────────┘     └──────────┘
        │                 │                 │
        │ 1. Redirect   │                 │
        ├─────────────►│                 │
        │                 │ 2. Show auth     │
        │                 ├─────────────►│
        │                 │                 │
        │                 │ 3. Grant permission
        │                 │─────────────▶
        │ 4. Get token   │
        │←─────────────│
        │                 │
        │ 5. Redirect    │
        │ with token     │
        │←─────────────│
```

## Security

### HMAC Verification

Verify webhook authenticity:

```javascript
const crypto = require('crypto');

const signature = req.headers['x-hub-signature-256'];
const hash = crypto
  .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
  .update(req.body)
  .digest('hex');

if (hash !== signature.split('=')[1]) {
  throw new Error('Invalid webhook signature');
}
```

### Token Security

- Store tokens in secure environment variables
- Use personal access tokens with minimal scopes
- Rotate tokens regularly
- Never commit secrets to repository

## Troubleshooting

### OAuth Fails
- Check CLIENT_ID and CLIENT_SECRET are correct
- Verify CALLBACK_URL matches GitHub app settings
- Ensure redirect_uri parameter is exact

### Webhook Not Received
- Verify webhook is configured in GitHub settings
- Check WEBHOOK_SECRET matches GitHub webhook secret
- Ensure callback URL is publicly accessible
- Check firewall/NAT rules

### PR Sync Issues
- Verify token has `repo` scope
- Check repository access permissions
- Ensure user is collaborator on private repos

## Dependencies

- `express@next` - Web framework
- `@octokit/rest@next` - GitHub API client
- `simple-oauth2@next` - OAuth 2.0 library

## Rate Limits

GitHub API rate limits:
- **Authenticated**: 5,000 requests/hour
- **Unauthenticated**: 60 requests/hour

Use conditional requests to save quota.

## License

MIT
