// security-scanner.js - Automated npm vulnerability detection
const { execSync } = require('child_process')
const axios = require('axios')
const fs = require('fs')
const path = require('path')

class SecurityScanner {
  constructor (projectPath) {
    this.projectPath = projectPath
    this.auditResults = null
    this.cveData = new Map()
    this.cache = new Map()
  }

  /**
   * Run npm audit and collect vulnerability data
   */
  async runAudit () {
    try {
      console.log('Running npm audit...')
      const result = execSync('npm audit --json', {
        cwd: this.projectPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      })

      this.auditResults = JSON.parse(result)
      console.log(
        `✓ Audit complete: ${this.auditResults.metadata.vulnerabilities.total} vulnerabilities found`
      )
      return this.auditResults
    } catch (err) {
      // npm audit exits with non-zero if vulnerabilities found
      try {
        this.auditResults = JSON.parse(err.stdout)
        console.log(
          `✓ Audit complete: ${this.auditResults.metadata.vulnerabilities.total} vulnerabilities found`
        )
        return this.auditResults
      } catch {
        throw new Error('Failed to parse npm audit results')
      }
    }
  }

  /**
   * Fetch CVE details from NVD API
   */
  async fetchCVEDetails (vuln) {
    const cveId = vuln.cve || vuln.id
    if (!cveId) return null
    if (this.cveData.has(cveId)) return this.cveData.get(cveId)

    try {
      // Check cache first
      if (this.cache.has(cveId)) {
        return this.cache.get(cveId)
      }

      const response = await axios.get(
        `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${cveId}`,
        { timeout: 5000 }
      )

      if (
        !response.data.vulnerabilities ||
        response.data.vulnerabilities.length === 0
      ) {
        return null
      }

      const vulnData = response.data.vulnerabilities[0].cve
      const cveData = {
        id: cveId,
        cvssScore:
          vulnData.metrics?.cvssMetricV3?.[0]?.cvssData?.baseScore || 'N/A',
        description:
          vulnData.descriptions?.[0]?.value || 'No description available',
        references: vulnData.references?.map((r) => r.url) || [],
        publishedDate: vulnData.published || 'Unknown'
      }

      this.cveData.set(cveId, cveData)
      this.cache.set(cveId, cveData)
      return cveData
    } catch (err) {
      console.warn(`⚠ Error fetching CVE ${cveId}: ${err.message}`)
      return null
    }
  }

  /**
   * Generate comprehensive vulnerability report
   */
  async generateReport () {
    if (!this.auditResults) {
      await this.runAudit()
    }

    const vulnerabilities = this.auditResults.vulnerabilities || {}
    const reportData = {
      timestamp: new Date().toISOString(),
      projectPath: this.projectPath,
      totalVulnerabilities: this.auditResults.metadata.vulnerabilities.total,
      critical: this.auditResults.metadata.vulnerabilities.critical,
      high: this.auditResults.metadata.vulnerabilities.high,
      medium: this.auditResults.metadata.vulnerabilities.medium,
      low: this.auditResults.metadata.vulnerabilities.low,
      vulnerabilities: []
    }

    // Fetch CVE details for all vulnerabilities
    console.log('\nFetching CVE details...')
    for (const [pkgName, vuln] of Object.entries(vulnerabilities)) {
      const cveDetails = await this.fetchCVEDetails(vuln)

      reportData.vulnerabilities.push({
        package: pkgName,
        severity: vuln.severity,
        range: vuln.range,
        fixAvailable: vuln.fixAvailable ? 'Yes' : 'No',
        cve: cveDetails
      })
    }

    // Sort by severity
    reportData.vulnerabilities.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    })

    return reportData
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport () {
    const report = await this.generateReport()

    const severityColors = {
      critical: '#d32f2f',
      high: '#f57c00',
      medium: '#fbc02d',
      low: '#388e3c'
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Audit Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 1000px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header p { opacity: 0.9; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; padding: 30px; border-bottom: 1px solid #eee; }
    .summary-card { text-align: center; }
    .summary-card .number { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
    .summary-card .label { color: #666; font-size: 14px; }
    .critical-card .number { color: #d32f2f; }
    .high-card .number { color: #f57c00; }
    .medium-card .number { color: #fbc02d; }
    .low-card .number { color: #388e3c; }
    .content { padding: 30px; }
    .table { width: 100%; border-collapse: collapse; }
    .table th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; }
    .table td { padding: 12px; border-bottom: 1px solid #eee; }
    .table tr:hover { background: #fafafa; }
    .severity { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; color: white; }
    .severity.critical { background: #d32f2f; }
    .severity.high { background: #f57c00; }
    .severity.medium { background: #fbc02d; color: #333; }
    .severity.low { background: #388e3c; }
    .footer { padding: 20px 30px; background: #f5f5f5; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Security Audit Report</h1>
      <p>CodePark Dependency Vulnerability Scan</p>
    </div>
    
    <div class="summary">
      <div class="summary-card critical-card">
        <div class="number">${report.critical}</div>
        <div class="label">Critical</div>
      </div>
      <div class="summary-card high-card">
        <div class="number">${report.high}</div>
        <div class="label">High</div>
      </div>
      <div class="summary-card medium-card">
        <div class="number">${report.medium}</div>
        <div class="label">Medium</div>
      </div>
      <div class="summary-card low-card">
        <div class="number">${report.low}</div>
        <div class="label">Low</div>
      </div>
    </div>
    
    <div class="content">
      <h2>Vulnerabilities</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Package</th>
            <th>Severity</th>
            <th>CVE ID</th>
            <th>CVSS Score</th>
            <th>Fix Available</th>
          </tr>
        </thead>
        <tbody>
          ${report.vulnerabilities
            .map(
              (v) => `
            <tr>
              <td>${v.package}</td>
              <td><span class="severity ${v.severity}">${v.severity.toUpperCase()}</span></td>
              <td>${v.cve?.id || 'N/A'}</td>
              <td>${v.cve?.cvssScore || 'N/A'}</td>
              <td>${v.fixAvailable}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
    
    <div class="footer">
      <p>Generated: ${report.timestamp}</p>
      <p>Project: ${report.projectPath}</p>
      <p>Total Vulnerabilities: ${report.totalVulnerabilities}</p>
    </div>
  </div>
</body>
</html>`

    const reportPath = path.join(this.projectPath, 'security-report.html')
    fs.writeFileSync(reportPath, html)
    console.log(`\n✓ Report saved to: ${reportPath}`)

    return reportPath
  }

  /**
   * Generate JSON report
   */
  async generateJSONReport () {
    const report = await this.generateReport()
    const reportPath = path.join(this.projectPath, 'security-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`✓ JSON report saved to: ${reportPath}`)
    return reportPath
  }
}

module.exports = SecurityScanner
