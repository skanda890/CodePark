const swaggerJsdoc = require('swagger-jsdoc');

class APIDocumentationGenerator {
  constructor(options = {}) {
    this.title = options.title || 'API Documentation';
    this.version = options.version || '1.0.0';
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.endpoints = [];
  }

  registerEndpoint(method, path, handler, spec = {}) {
    this.endpoints.push({
      method: method.toUpperCase(),
      path,
      handler,
      spec: {
        summary: spec.summary || '',
        description: spec.description || '',
        parameters: spec.parameters || [],
        requestBody: spec.requestBody || null,
        responses: spec.responses || {}
      }
    });
  }

  generateOpenAPI() {
    const spec = {
      openapi: '3.0.0',
      info: {
        title: this.title,
        version: this.version
      },
      servers: [
        { url: this.baseUrl, description: 'API Server' }
      ],
      paths: {}
    };

    for (const endpoint of this.endpoints) {
      if (!spec.paths[endpoint.path]) {
        spec.paths[endpoint.path] = {};
      }

      spec.paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.spec.summary,
        description: endpoint.spec.description,
        parameters: endpoint.spec.parameters,
        requestBody: endpoint.spec.requestBody,
        responses: endpoint.spec.responses
      };
    }

    return spec;
  }

  generateMarkdown() {
    let markdown = `# ${this.title} v${this.version}\n\n`;
    markdown += `Base URL: \`${this.baseUrl}\`\n\n`;

    for (const endpoint of this.endpoints) {
      markdown += `## ${endpoint.spec.summary || endpoint.path}\n\n`;
      markdown += `**${endpoint.method}** \`${endpoint.path}\`\n\n`;
      markdown += `${endpoint.spec.description}\n\n`;

      if (endpoint.spec.parameters.length > 0) {
        markdown += `### Parameters\n\n`;
        for (const param of endpoint.spec.parameters) {
          markdown += `- \`${param.name}\` (${param.schema?.type}): ${param.description}\n`;
        }
        markdown += '\n';
      }
    }

    return markdown;
  }
}

module.exports = APIDocumentationGenerator;
