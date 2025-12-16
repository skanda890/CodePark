/**
 * Webhook Server for GitHub API Rate Limit Manager
 * 
 * Features:
 * - GitHub event webhook handling
 * - Pre-deployment rate limit checks
 * - Webhook signature verification
 * - Health check endpoints
 * - GitHub Actions integration template
 * - GitLab CI integration template
 * - Prevents deployments with insufficient quota
 */

const http = require('http');
const crypto = require('crypto');

class WebhookServer {
  constructor(config = {}) {
    this.port = config.port || 3001;
    this.host = config.host || 'localhost';
    this.webhookSecret = config.webhookSecret;
    this.multiTokenManager = config.multiTokenManager;
    this.notificationService = config.notificationService;
    this.databaseLogger = config.databaseLogger;
    this.server = null;
    this.eventHandlers = new Map();
    this.deploymentHistory = [];
  }

  /**
   * Start webhook server
   */
  start() {
    this.server = http.createServer((req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Hub-Signature-256');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathname = url.pathname;

      if (pathname === '/webhook' && req.method === 'POST') {
        this.handleWebhook(req, res);
      } else if (pathname === '/pre-deploy-check' && req.method === 'POST') {
        this.handlePreDeployCheck(req, res);
      } else if (pathname === '/health' && req.method === 'GET') {
        this.handleHealth(res);
      } else if (pathname === '/deployment-history' && req.method === 'GET') {
        this.handleDeploymentHistory(res);
      } else {
        this.send404(res);
      }
    });

    return new Promise((resolve) => {
      this.server.listen(this.port, this.host, () => {
        console.log(`\n🪝 Webhook server running at http://${this.host}:${this.port}`);
        resolve({ running: true, url: `http://${this.host}:${this.port}` });
      });
    });
  }

  /**
   * Handle GitHub webhook
   */
  handleWebhook(req, res) {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        // Verify webhook signature
        const signature = req.headers['x-hub-signature-256'];
        if (!this.verifySignature(body, signature)) {
          this.sendJSON(res, { error: 'Invalid signature' }, 401);
          return;
        }

        const payload = JSON.parse(body);
        const event = req.headers['x-github-event'];

        // Log event
        if (this.databaseLogger) {
          await this.databaseLogger.log({
            type: 'webhook_event',
            event,
            action: payload.action,
            timestamp: new Date()
          });
        }

        // Handle event
        let result = { event, processed: false };
        
        if (event === 'push') {
          result = this.handlePushEvent(payload);
        } else if (event === 'pull_request') {
          result = this.handlePullRequestEvent(payload);
        } else if (event === 'workflow_run') {
          result = this.handleWorkflowRunEvent(payload);
        } else if (event === 'deployment') {
          result = await this.handleDeploymentEvent(payload);
        }

        this.sendJSON(res, result, 200);
      } catch (error) {
        console.error('Webhook error:', error);
        this.sendJSON(res, { error: error.message }, 400);
      }
    });
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload, signature) {
    if (!signature || !this.webhookSecret) {
      return false;
    }

    const hash = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    const expectedSignature = `sha256=${hash}`;

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Handle push event
   */
  handlePushEvent(payload) {
    return {
      type: 'push',
      repository: payload.repository?.name,
      branch: payload.ref?.split('/').pop(),
      commits: payload.commits?.length,
      processed: true
    };
  }

  /**
   * Handle pull request event
   */
  handlePullRequestEvent(payload) {
    return {
      type: 'pull_request',
      action: payload.action,
      repository: payload.repository?.name,
      pullNumber: payload.pull_request?.number,
      processed: true
    };
  }

  /**
   * Handle workflow run event
   */
  handleWorkflowRunEvent(payload) {
    return {
      type: 'workflow_run',
      action: payload.action,
      repository: payload.repository?.name,
      status: payload.workflow_run?.status,
      processed: true
    };
  }

  /**
   * Handle deployment event
   */
  async handleDeploymentEvent(payload) {
    const { environment, ref } = payload.deployment;
    
    // Record deployment
    const deployment = {
      timestamp: new Date(),
      environment,
      ref,
      status: 'pending',
      rateLimit: this.multiTokenManager?.getTeamQuota()
    };

    this.deploymentHistory.push(deployment);

    return {
      type: 'deployment',
      environment,
      ref,
      processed: true
    };
  }

  /**
   * Handle pre-deployment rate limit check
   */
  async handlePreDeployCheck(req, res) {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { minQuota = 100 } = payload;

        const quota = this.multiTokenManager.getTeamQuota();
        const canDeploy = quota.teamStats.combinedRemaining >= minQuota;

        const response = {
          canDeploy,
          timestamp: new Date(),
          quota: {
            remaining: quota.teamStats.combinedRemaining,
            limit: quota.teamStats.combinedLimit,
            health: quota.healthStatus
          },
          minRequired: minQuota,
          message: canDeploy
            ? 'Deployment approved: Sufficient quota available'
            : `Deployment blocked: Insufficient quota (${quota.teamStats.combinedRemaining} < ${minQuota})`
        };

        const statusCode = canDeploy ? 200 : 403;
        this.sendJSON(res, response, statusCode);

        // Log deployment check
        if (this.databaseLogger) {
          await this.databaseLogger.log({
            type: 'deployment_check',
            canDeploy,
            quota: quota.teamStats.combinedRemaining,
            timestamp: new Date()
          });
        }
      } catch (error) {
        this.sendJSON(res, { error: error.message }, 400);
      }
    });
  }

  /**
   * Handle health check
   */
  handleHealth(res) {
    const quota = this.multiTokenManager.getTeamQuota();
    const isHealthy = quota.healthStatus === 'healthy';

    this.sendJSON(res, {
      status: isHealthy ? 'healthy' : 'degraded',
      health: quota.healthStatus,
      timestamp: new Date()
    }, isHealthy ? 200 : 503);
  }

  /**
   * Handle deployment history
   */
  handleDeploymentHistory(res) {
    this.sendJSON(res, {
      deployments: this.deploymentHistory.slice(-50).reverse(),
      total: this.deploymentHistory.length
    });
  }

  /**
   * Get GitHub Actions integration template
   */
  getGitHubActionsTemplate() {
    return `
# .github/workflows/pre-deploy-check.yml
name: Pre-Deployment Rate Limit Check

on:
  workflow_dispatch:
  deployment:

jobs:
  rate-limit-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check API Rate Limit
        id: rate-limit
        run: |
          RESPONSE=$(curl -s -X POST http://rate-limit-manager:3001/pre-deploy-check \
            -H "Content-Type: application/json" \
            -d '{
              "minQuota": 500,
              "environment": "${{ github.environment }}"
            }')
          
          echo "Response: $RESPONSE"
          CAN_DEPLOY=$(echo $RESPONSE | jq -r '.canDeploy')
          
          if [ "$CAN_DEPLOY" != "true" ]; then
            echo "::error::Insufficient API quota for deployment"
            exit 1
          fi
          
          echo "Deployment approved"
      
      - name: Deploy
        if: success()
        run: echo "Deploying..."
    `;
  }

  /**
   * Get GitLab CI integration template
   */
  getGitLabCITemplate() {
    return `
# .gitlab-ci.yml (excerpt)
pre_deploy_check:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add curl jq
  script:
    - |
      RESPONSE=$(curl -s -X POST http://rate-limit-manager:3001/pre-deploy-check \
        -H "Content-Type: application/json" \
        -d '{
          "minQuota": 500,
          "environment": "$CI_ENVIRONMENT_NAME"
        }')
      
      CAN_DEPLOY=$(echo $RESPONSE | jq -r '.canDeploy')
      
      if [ "$CAN_DEPLOY" != "true" ]; then
        echo "Deployment blocked: Insufficient API quota"
        exit 1
      fi
      
      echo "Deployment approved"
    `;
  }

  /**
   * Stop webhook server
   */
  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('Webhook server stopped');
          resolve({ stopped: true });
        });
      } else {
        resolve({ stopped: false });
      }
    });
  }

  /**
   * Send JSON response
   */
  sendJSON(res, data, statusCode = 200) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  /**
   * Send 404 response
   */
  send404(res) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
}

module.exports = WebhookServer;
