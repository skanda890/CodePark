/**
 * Web Dashboard for GitHub API Rate Limit Manager
 * 
 * Features:
 * - Express.js-based server
 * - Real-time rate limit visualization
 * - REST API endpoints for monitoring
 * - Health status indicators (color-coded)
 * - Auto-refresh every 60 seconds
 * - Responsive design
 * - Interactive health monitoring
 */

const http = require('http');

class WebDashboard {
  constructor(config = {}) {
    this.port = config.port || 3000;
    this.host = config.host || 'localhost';
    this.multiTokenManager = config.multiTokenManager;
    this.databaseLogger = config.databaseLogger;
    this.notificationService = config.notificationService;
    this.requestQueue = config.requestQueue;
    this.server = null;
  }

  /**
   * Start the HTTP server
   */
  start() {
    this.server = http.createServer((req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathname = url.pathname;

      // Route handling
      if (pathname === '/' && req.method === 'GET') {
        this.serveDashboard(res);
      } else if (pathname === '/api/status' && req.method === 'GET') {
        this.handleStatusAPI(res);
      } else if (pathname === '/api/tokens' && req.method === 'GET') {
        this.handleTokensAPI(res);
      } else if (pathname === '/api/queue' && req.method === 'GET') {
        this.handleQueueAPI(res);
      } else if (pathname === '/api/health' && req.method === 'GET') {
        this.handleHealthAPI(res);
      } else if (pathname === '/api/history' && req.method === 'GET') {
        this.handleHistoryAPI(res);
      } else if (pathname === '/health' && req.method === 'GET') {
        this.handleHealthCheck(res);
      } else {
        this.send404(res);
      }
    });

    return new Promise((resolve) => {
      this.server.listen(this.port, this.host, () => {
        console.log(`\n✅ Dashboard running at http://${this.host}:${this.port}`);
        resolve({ running: true, url: `http://${this.host}:${this.port}` });
      });
    });
  }

  /**
   * Stop the HTTP server
   */
  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('Dashboard server stopped');
          resolve({ stopped: true });
        });
      } else {
        resolve({ stopped: false, message: 'Server not running' });
      }
    });
  }

  /**
   * Serve dashboard HTML
   */
  serveDashboard(res) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub API Rate Limit Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .header h1 {
            color: #667eea;
            margin-bottom: 10px;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
        }
        .status-healthy { background: #4caf50; color: white; }
        .status-warning { background: #ff9800; color: white; }
        .status-critical { background: #f44336; color: white; }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .card h2 {
            color: #667eea;
            font-size: 18px;
            margin-bottom: 15px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 10px;
        }
        
        .stat-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .stat-label { color: #666; font-size: 14px; }
        .stat-value { font-weight: bold; color: #333; font-size: 14px; }
        
        .progress-bar {
            width: 100%;
            height: 24px;
            background: #f0f0f0;
            border-radius: 12px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
        }
        
        .token-list {
            list-style: none;
        }
        
        .token-item {
            background: #f9f9f9;
            padding: 12px;
            margin-bottom: 10px;
            border-radius: 6px;
            border-left: 4px solid #667eea;
        }
        
        .token-health {
            font-size: 12px;
            font-weight: bold;
        }
        
        .health-high { color: #4caf50; }
        .health-medium { color: #ff9800; }
        .health-low { color: #f44336; }
        
        .refresh-info {
            text-align: center;
            color: #999;
            font-size: 12px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #f0f0f0;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #999;
        }
        
        @media (max-width: 768px) {
            .grid { grid-template-columns: 1fr; }
            .stat-row { flex-wrap: wrap; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 GitHub API Rate Limit Dashboard</h1>
            <div id="overall-status" class="status-badge">Loading...</div>
        </div>
        
        <div id="content" class="loading">Loading dashboard...</div>
    </div>
    
    <script>
        let autoRefreshInterval;
        
        async function fetchDashboardData() {
            try {
                const [status, tokens, queue] = await Promise.all([
                    fetch('/api/status').then(r => r.json()),
                    fetch('/api/tokens').then(r => r.json()),
                    fetch('/api/queue').then(r => r.json())
                ]);
                
                renderDashboard(status, tokens, queue);
            } catch (error) {
                document.getElementById('content').innerHTML = `
                    <div style="color: red; padding: 20px;">
                        Error loading dashboard: ${error.message}
                    </div>
                `;
            }
        }
        
        function renderDashboard(status, tokens, queue) {
            const healthClass = status.healthStatus === 'healthy' ? 'status-healthy' :
                               status.healthStatus === 'warning' ? 'status-warning' : 'status-critical';
            
            document.getElementById('overall-status').innerHTML = `
                <span class="status-badge ${healthClass}">${status.healthStatus}</span>
            `;
            
            let html = '<div class="grid">';
            
            // Team Overview
            html += `
                <div class="card">
                    <h2>Team Overview</h2>
                    <div class="stat-row">
                        <span class="stat-label">Total Requests</span>
                        <span class="stat-value">${status.teamStats.totalRequests}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Total Errors</span>
                        <span class="stat-value">${status.teamStats.totalErrors}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Combined Remaining</span>
                        <span class="stat-value">${status.teamStats.combinedRemaining}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Combined Limit</span>
                        <span class="stat-value">${status.teamStats.combinedLimit}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Average Health</span>
                        <span class="stat-value">${status.teamStats.averageHealth.toFixed(1)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${status.teamStats.averageHealth}%">
                            ${status.teamStats.averageHealth.toFixed(0)}%
                        </div>
                    </div>
                </div>
            `;
            
            // Tokens Status
            html += `<div class="card"><h2>Token Status</h2><ul class="token-list">`;
            tokens.forEach((token, idx) => {
                const healthClass = token.health > 70 ? 'health-high' :
                                   token.health > 40 ? 'health-medium' : 'health-low';
                html += `
                    <li class="token-item">
                        <div style="font-weight: bold; margin-bottom: 8px;">Token #${token.id}</div>
                        <div class="stat-row">
                            <span class="stat-label">Health</span>
                            <span class="token-health ${healthClass}">${token.health.toFixed(1)}%</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Remaining</span>
                            <span class="stat-value">${token.remaining}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Used</span>
                            <span class="stat-value">${token.percentageUsed.toFixed(1)}%</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Status</span>
                            <span class="stat-value">${token.active ? '✅ Active' : '❌ Inactive'}</span>
                        </div>
                    </li>
                `;
            });
            html += `</ul></div>`;
            
            // Queue Status
            html += `
                <div class="card">
                    <h2>Request Queue</h2>
                    <div class="stat-row">
                        <span class="stat-label">Total Queued</span>
                        <span class="stat-value">${queue.queueLengths.total}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Critical</span>
                        <span class="stat-value">${queue.queueLengths.critical}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">High</span>
                        <span class="stat-value">${queue.queueLengths.high}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Normal</span>
                        <span class="stat-value">${queue.queueLengths.normal}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Low</span>
                        <span class="stat-value">${queue.queueLengths.low}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Active Requests</span>
                        <span class="stat-value">${queue.activeRequests}/${queue.maxConcurrent}</span>
                    </div>
                </div>
            `;
            
            html += '</div>';
            html += '<div class="refresh-info">Auto-refreshing every 60 seconds</div>';
            
            document.getElementById('content').innerHTML = html;
        }
        
        // Initial load
        fetchDashboardData();
        
        // Auto-refresh every 60 seconds
        autoRefreshInterval = setInterval(fetchDashboardData, 60000);
    </script>
</body>
</html>
    `;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }

  /**
   * Handle /api/status endpoint
   */
  handleStatusAPI(res) {
    const quota = this.multiTokenManager.getTeamQuota();
    this.sendJSON(res, quota);
  }

  /**
   * Handle /api/tokens endpoint
   */
  handleTokensAPI(res) {
    const tokens = this.multiTokenManager.getAllTokenStats();
    this.sendJSON(res, tokens);
  }

  /**
   * Handle /api/queue endpoint
   */
  handleQueueAPI(res) {
    if (!this.requestQueue) {
      this.sendJSON(res, { message: 'Queue not configured' });
      return;
    }
    const status = this.requestQueue.getQueueStatus();
    this.sendJSON(res, status);
  }

  /**
   * Handle /api/health endpoint
   */
  handleHealthAPI(res) {
    const quota = this.multiTokenManager.getTeamQuota();
    const queueHealth = this.requestQueue ? this.requestQueue.getQueueHealth() : null;
    
    this.sendJSON(res, {
      overall: quota.healthStatus,
      quota: quota,
      queue: queueHealth,
      timestamp: new Date()
    });
  }

  /**
   * Handle /api/history endpoint
   */
  handleHistoryAPI(res) {
    const url = new URL(`http://localhost${process.env.npm_request_url || ''}`);
    const type = url.searchParams.get('type') || 'all';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let history = [];
    
    if (this.databaseLogger) {
      // Get logs from database
      history = this.databaseLogger.logs.slice(-limit).reverse();
    }
    
    this.sendJSON(res, { history, limit });
  }

  /**
   * Handle /health endpoint for Kubernetes/monitoring
   */
  handleHealthCheck(res) {
    const quota = this.multiTokenManager.getTeamQuota();
    const isHealthy = quota.healthStatus === 'healthy';
    const statusCode = isHealthy ? 200 : 503;
    
    this.sendJSON(res, {
      status: isHealthy ? 'healthy' : 'degraded',
      health: quota.healthStatus,
      timestamp: new Date()
    }, statusCode);
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
    res.end(JSON.stringify({ error: 'Not found', status: 404 }));
  }
}

module.exports = WebDashboard;
