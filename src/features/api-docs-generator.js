/**
 * API Documentation Generator (Feature #27)
 * Generates OpenAPI/Swagger documentation
 */

class APIDocsGenerator {
  constructor(options = {}) {
    this.title = options.title || 'API';
    this.version = options.version || '1.0.0';
    this.paths = new Map();
    this.schemas = new Map();
  }

  /**
   * Register endpoint
   */
  registerEndpoint(path, method, details) {
    const key = `${method.toUpperCase()} ${path}`;
    this.paths.set(key, {
      path,
      method: method.toUpperCase(),
      summary: details.summary,
      description: details.description,
      parameters: details.parameters || [],
      requestBody: details.requestBody,
      responses: details.responses,
      tags: details.tags || [],
    });
  }

  /**
   * Register schema
   */
  registerSchema(name, schema) {
    this.schemas.set(name, schema);
  }

  /**
   * Generate OpenAPI document
   */
  generateOpenAPI() {
    const paths = {};

    for (const [key, endpoint] of this.paths.entries()) {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }

      paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.summary,
        description: endpoint.description,
        parameters: endpoint.parameters,
        requestBody: endpoint.requestBody,
        responses: endpoint.responses,
        tags: endpoint.tags,
      };
    }

    return {
      openapi: '3.0.0',
      info: {
        title: this.title,
        version: this.version,
      },
      paths,
      components: {
        schemas: Object.fromEntries(this.schemas),
      },
    };
  }

  /**
   * Generate Markdown docs
   */
  generateMarkdown() {
    let markdown = `# ${this.title} API Documentation\n\n`;
    markdown += `Version: ${this.version}\n\n`;

    for (const [key, endpoint] of this.paths.entries()) {
      markdown += `## ${endpoint.method} ${endpoint.path}\n\n`;
      markdown += `${endpoint.summary || endpoint.description || ''}\n\n`;

      if (endpoint.parameters.length > 0) {
        markdown += '### Parameters\n\n';
        endpoint.parameters.forEach((param) => {
          markdown += `- \`${param.name}\` (${param.type}): ${param.description || ''}\n`;
        });
        markdown += '\n';
      }

      markdown += '---\n\n';
    }

    return markdown;
  }
}

module.exports = APIDocsGenerator;