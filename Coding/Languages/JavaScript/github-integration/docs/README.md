# 🚀 GitHub Integration

OAuth 2.0 authentication and webhook handling for seamless GitHub integration. Enables pull request syncing, issue management, and automated workflows.

## Features

- 🔐 **OAuth 2.0 Flow**: Secure GitHub authentication
- 🙌 **Webhook Support**: Real-time GitHub event handling
- 📝 **PR Syncing**: Automatic pull request synchronization
- 📢 **Issue Management**: Create and track issues from CodePark
- 🔄 **Automated Workflows**: Trigger actions on GitHub events
- 📖 **REST API**: Easy GitHub API access
- 💬 **Commit Analysis**: Extract insights from commits

## Installation

```bash
cd Coding/Languages/JavaScript/github-integration
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

## Usage

```bash
npm start
```

## Endpoints

- `GET /auth` - Initiate GitHub OAuth flow
- `GET /callback` - Handle GitHub OAuth callback
- `POST /webhook` - Receive GitHub webhooks

## Webhook Events

- `push` - New commits
- `pull_request` - PR opened/closed
- `issues` - Issue created
- `release` - New release

## Dependencies

- `express@next` - Web framework
- `@octokit/rest@next` - GitHub API client
- `simple-oauth2@next` - OAuth 2.0 library

## License

MIT
