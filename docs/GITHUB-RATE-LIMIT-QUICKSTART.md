# GitHub API Rate Limit - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Get Your GitHub Token (2 minutes)

1. Go to [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **"Generate new token"** (Classic)
3. Give it a name: `CodePark-RateLimit`
4. Select scopes:
   - ☑️ `repo` (Full control of private repositories)
   - ☑️ `read:org` (Read org and team membership)
5. Click **"Generate token"**
6. ⚠️ Copy the token immediately (you won't see it again)

### Step 2: Set Up Environment (1 minute)

```bash
# Option A: Using .env file (Recommended)
echo "GITHUB_TOKEN=ghp_your_token_here" >> .env

# Option B: Using environment variable
export GITHUB_TOKEN="ghp_your_token_here"
```

### Step 3: Check Your Rate Limits (2 minutes)

```bash
# Navigate to CodePark directory
cd CodePark

# Run the check command
npm run github:check-limit
```

✅ Done! You should see your current rate limit status.

---

## 📊 Common Commands

### Check Current Status

```bash
npm run github:check-limit
```

Shows:
- REST API remaining requests
- GraphQL API remaining points
- Search API remaining requests
- Time until reset

### Monitor Continuously

```bash
npm run github:monitor-limit
```

Automatically checks every 5 minutes. Press `Ctrl+C` to stop.

### Wait for Reset

```bash
npm run github:wait-reset
```

Waits until all rate limits are healthy. Exits automatically.

### Get Reset Recommendations

```bash
npm run github:reset-recommendations
```

Shows:
- Next reset times
- How to optimize API usage
- Strategies to avoid hitting limits

### Get JSON Output

```bash
npm run github:check-limit:json
```

Outputs rate limit data as JSON for scripts/automation.

---

## 😦 Understanding the Output

### Sample Output

```
[2025-12-14T12:35:00.123Z] [INFO] Checking GitHub API rate limits...

╔═══════════════ GitHub API Rate Limit Status ═══════════════╗

📊 REST API:
   Core API:
     • Limit:      5000 requests/hour
     • Remaining:  4750 (95.00%)     <- You have 95% of your quota left
     • Used:       250              <- You've used 250 requests
     • Reset in:   45m 30s          <- Resets in 45 minutes 30 seconds

🚀 GraphQL API:
   Authenticated as: skanda890
   • Limit:      5000 points/hour
   • Remaining:  4920 (98.40%)
   • Used:       80
   • Reset in:   52m 10s
```

### What Do The Numbers Mean?

| Field | Meaning |
|-------|----------|
| **Limit** | Total requests available in this hour |
| **Remaining** | How many requests you have left |
| **Percent** | Percentage of quota remaining |
| **Used** | How many requests you've already used |
| **Reset in** | Time until this limit resets |

### Health Status Colors

✅ **Healthy** (Green): 50%+ remaining
```
Remaining:  2500 (50.00%)
```

⚠️ **Warning** (Yellow): 20-50% remaining
```
Remaining:  1000 (20.00%)
```

🔴 **Critical** (Red): <20% remaining
```
Remaining:  500 (10.00%)
```

---

## 🚨 When You Run Out

### What Happens When Rate Limit Exceeded?

You'll get an error like:
```json
{
  "message": "API rate limit exceeded for user ID xxxxx.",
  "documentation_url": "https://docs.github.com/..."
}
```

### What To Do

**Option 1: Wait (Automatic)**
```bash
npm run github:wait-reset
# Waits automatically until limit resets
```

**Option 2: Check When It Resets**
```bash
npm run github:reset-recommendations
# Shows exact reset time
```

**Option 3: Optimize Usage** (Best)
- Use GraphQL (faster, costs less)
- Cache results (don't repeat calls)
- Batch requests together
- See detailed guide below

---

## 💡 Tips to Avoid Running Out

### Tip 1: Use GraphQL

❌ **Bad** - 3 separate API calls:
```bash
curl https://api.github.com/repos/owner/repo
curl https://api.github.com/repos/owner/repo/issues
curl https://api.github.com/repos/owner/repo/pulls
# Uses 3 requests from your quota
```

✅ **Good** - 1 GraphQL request:
```graphql
query {
  repository(owner: "owner", name: "repo") {
    name
    issues(first: 10) { nodes { id, title } }
    pullRequests(first: 10) { nodes { id, title } }
  }
}
# Uses only 1 request (at ~5 points)
```

### Tip 2: Cache Results

```javascript
const cache = {};
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

async function getRepo(owner, repo) {
  const key = `${owner}/${repo}`;
  
  // Check cache first
  if (cache[key] && Date.now() - cache[key].time < CACHE_TIME) {
    return cache[key].data;
  }
  
  // Fetch if not cached
  const data = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
  cache[key] = { data, time: Date.now() };
  return data;
}
```

### Tip 3: Check Before You Query

```javascript
const monitor = require('./scripts/github-api-rate-limit-reset');
const m = new monitor(process.env.GITHUB_TOKEN);

const limits = await m.checkRateLimits();

if (limits.graphql.remaining < 100) {
  console.log('Low on quota, queuing requests...');
  // Add request to queue, wait, etc.
}
```

### Tip 4: Use Authenticated Requests

❌ **Unauthenticated**: 60 requests/hour
✅ **Authenticated**: 5,000 requests/hour

Always use your token!

---

## 🛠️ Troubleshooting

### Problem: "GitHub token not provided"

**Solution 1**: Set environment variable
```bash
export GITHUB_TOKEN="your_token_here"
```

**Solution 2**: Create .env file
```bash
echo "GITHUB_TOKEN=ghp_xxxxx" > .env
```

**Solution 3**: Pass token directly
```bash
node scripts/github-api-rate-limit-reset.js --token ghp_xxxxx --check
```

### Problem: "Failed to get rate limit: 401"

**Solution**: Token is invalid
1. Go to [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Delete the old token
3. Generate a new one
4. Update your .env file
5. Try again

### Problem: "Failed to get rate limit: 403"

**Solution**: Token doesn't have required permissions
1. Go to [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Click the token
3. Add scopes: `repo`, `read:org`
4. Click "Save"
5. Try again

### Problem: Can't find npm scripts

**Solution**: Update package.json
```bash
npm install
# This should install all scripts

# Verify with:
npm run | grep github
```

---

## 📚 Learn More

### Detailed Documentation
- [Full Guide](./github-rate-limit-management.md) - Complete documentation
- [README](./GITHUB-RATE-LIMIT-README.md) - Project overview

### GitHub Resources
- [API Rate Limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api)
- [GraphQL API](https://docs.github.com/en/graphql)
- [Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

---

## 🙋 Help & Support

### Need Help?

1. 📚 Check the [Full Guide](./github-rate-limit-management.md)
2. 🔍 Search [GitHub Issues](https://github.com/skanda890/CodePark/issues)
3. 💬 Ask on [GitHub Discussions](https://github.com/skanda890/CodePark/discussions)
4. 📇 Open an [Issue](https://github.com/skanda890/CodePark/issues/new)

---

## 🚀 Pro Tips

### Tip 1: Add to Cron for Automatic Monitoring

```bash
# Every hour, check and log rate limits
0 * * * * cd ~/CodePark && npm run github:check-limit >> logs/rate-limit.log 2>&1
```

### Tip 2: Monitor in Background

```bash
# Start continuous monitoring in the background
npm run github:monitor-limit &

# Check it's running
jobs

# Stop it later
kill %1
```

### Tip 3: Export for Analysis

```bash
# Get JSON and pipe to file
npm run github:check-limit:json > rate-limit-$(date +%s).json

# Analyze multiple checkpoints
ls -la rate-limit-*.json
```

### Tip 4: Set Up Alerts

```bash
# In .env file
ENABLE_EMAIL_ALERTS=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_WEBHOOK_URL=https://your-webhook.com

# Alerts will be sent when rate limit gets low
```

---

## 📋 Quick Reference

### Commands

| Command | What It Does |
|---------|-------------|
| `npm run github:check-limit` | Show current rate limits |
| `npm run github:check-limit:json` | Show as JSON |
| `npm run github:monitor-limit` | Continuous monitoring |
| `npm run github:wait-reset` | Wait for reset |
| `npm run github:reset-recommendations` | Get optimization tips |

### Rate Limits

| API | Limit | Window |
|-----|-------|--------|
| REST (Auth) | 5,000 | 1 hour |
| GraphQL | 5,000 points | 1 hour |
| Search | 30 | 1 minute |

### Status Indicators

| Status | Remaining | Action |
|--------|-----------|--------|
| ✅ Healthy | 50%+ | Continue normally |
| ⚠️ Warning | 20-50% | Start optimizing |
| 🔴 Critical | <20% | Reduce API calls |
| 🕓 Exhausted | 0% | Wait or use different token |

---

## 🌐 Next Steps

1. ✅ Get your GitHub token
2. ✅ Set it in your environment
3. ✅ Run `npm run github:check-limit`
4. ✅ Bookmark [Full Guide](./github-rate-limit-management.md)
5. ✅ Set up monitoring if needed

---

**Happy coding!** 🚀

*For more help, see [docs/github-rate-limit-management.md](./github-rate-limit-management.md)*
