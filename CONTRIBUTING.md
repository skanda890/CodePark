# Contributing to CodePark

Thank you for your interest in contributing to CodePark! We welcome contributions from everyone. This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful in all communications and maintain a professional attitude.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing opinions, viewpoints, and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment or discrimination of any kind
- Offensive comments related to gender, sexual orientation, disability, mental illness, neuro(a)typicality, physical appearance, body size, race, or religion
- Trolling, insulting/derogatory comments, and personal or political attacks
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

## Getting Started

### Prerequisites

- Node.js 22.0.0 or higher
- npm 10.0.0 or higher
- Git
- Familiarity with Git and GitHub workflow
- Understanding of experimental npm packages

### Development Setup

1. **Fork the repository**

   ```bash
   # Visit https://github.com/skanda890/CodePark and click "Fork"
   ```

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR-USERNAME/CodePark.git
   cd CodePark
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/skanda890/CodePark.git
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Create a development branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

6. **Set up pre-commit hooks** (optional but recommended)
   ```bash
   npm run setup-husky
   ```

## Development Workflow

### Creating Features

1. **Create a feature branch from `main`**

   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   - Follow the coding standards (see below)
   - Write tests for new functionality
   - Update documentation as needed

3. **Run tests and linting**

   ```bash
   npm run lint
   npm run format
   npm test
   ```

4. **Commit your changes**

   ```bash
   git commit -m "feat: Add amazing feature"
   ```

5. **Push to your fork**

   ```bash
   git push origin feature/amazing-feature
   ```

6. **Create a Pull Request**
   - Go to https://github.com/skanda890/CodePark/pulls
   - Click "New Pull Request"
   - Select your branch and fill in the PR template

### Fixing Bugs

1. **Create a bug fix branch**

   ```bash
   git checkout -b fix/bug-description
   ```

2. **Reference the issue in commits**

   ```bash
   git commit -m "fix: Resolve issue #123 - description"
   ```

3. **Follow the same PR process as above**

## Coding Standards

### JavaScript/Node.js Style

- **ES6+ syntax**: Use modern JavaScript features
- **Async/await**: Prefer async/await over callbacks and promises
- **const/let**: Never use `var`
- **Arrow functions**: Use arrow functions for callbacks
- **Template literals**: Use backticks for strings with variables

### Code Quality

- **Linting**: Code must pass ESLint checks

  ```bash
  npm run lint
  ```

- **Formatting**: Code must be formatted with Prettier

  ```bash
  npm run format
  ```

- **No console.log**: Use the logging library (pino) instead
  ```javascript
  logger.info("Message");
  logger.error("Error");
  ```

### File Organization

```
src/
├── api/          # API routes and controllers
├── services/     # Business logic
├── models/       # Data models and schemas
├── middleware/   # Express middleware
├── utils/        # Utility functions
└── config/       # Configuration files
```

### Naming Conventions

- **Files**: kebab-case for files (`my-module.js`)
- **Directories**: kebab-case for directories (`my-module/`)
- **Functions**: camelCase for function names
- **Classes**: PascalCase for class names
- **Constants**: UPPER_SNAKE_CASE for constants

### Documentation

- **JSDoc comments**: Document all functions and classes

  ```javascript
  /**
   * Processes user data and returns formatted result
   * @param {Object} user - User object
   * @param {string} user.name - User's name
   * @param {string} user.email - User's email
   * @returns {Promise<Object>} Formatted user object
   */
  async function processUser(user) {
    // implementation
  }
  ```

- **README**: Keep README.md updated with new features
- **Comments**: Write clear comments for complex logic

## Testing Requirements

### Test Coverage

- **Minimum coverage**: 80% line coverage required
- **Unit tests**: Test individual functions and modules
- **Integration tests**: Test API endpoints and workflows
- **E2E tests**: Test complete user scenarios

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch

# AI-specific tests
npm run test:ai
```

### Writing Tests

- Use Jest as the testing framework
- Place tests in `tests/` directory
- Name test files `*.test.js`
- Follow the Arrange-Act-Assert pattern

```javascript
describe("UserService", () => {
  describe("createUser", () => {
    it("should create a new user with valid data", async () => {
      // Arrange
      const userData = { name: "John", email: "john@example.com" };

      // Act
      const result = await createUser(userData);

      // Assert
      expect(result.id).toBeDefined();
      expect(result.name).toBe("John");
    });
  });
});
```

## Security Considerations

### Before Contributing Code

- [ ] Run `npm audit` to check for vulnerabilities
- [ ] Run `npm run security-check` for comprehensive scanning
- [ ] Never commit secrets, API keys, or credentials
- [ ] Don't use `localStorage` or `sessionStorage` (use variables)
- [ ] Validate and sanitize all user inputs
- [ ] Use parameterized queries (Prisma handles this)

### Security Issues

If you discover a security vulnerability, please email security@example.com instead of using the issue tracker.

## Commit Messages

### Format

```
type(scope): subject

body

footer
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring without feature changes
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, or tooling changes
- **ci**: CI/CD configuration changes

### Examples

```bash
# Feature
git commit -m "feat(ai): Add code suggestion ML model"

# Bug fix
git commit -m "fix(auth): Fix JWT token expiration issue"

# Documentation
git commit -m "docs(api): Update GraphQL schema examples"

# Performance
git commit -m "perf(db): Add connection pooling"
```

## Pull Request Process

### Before Submitting

- [ ] Fork the repository
- [ ] Create a descriptive branch name
- [ ] Make your changes
- [ ] Update tests and documentation
- [ ] Run `npm run lint` and `npm run format`
- [ ] Run `npm test` to ensure tests pass
- [ ] Run `npm run security-check` for security validation
- [ ] Rebase on the latest `main` branch

### Pull Request Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Tested locally

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] Security checks pass

## Related Issues

Fixes #(issue number)

## Screenshots (if applicable)

Add screenshots for UI changes
```

## Review Process

### What Reviewers Look For

- Code quality and adherence to standards
- Test coverage and quality
- Documentation accuracy
- Security implications
- Performance impact
- Backwards compatibility

### Responding to Reviews

- Respond to all feedback
- Push additional commits if changes are requested
- Use the "Resolve conversation" button after addressing feedback
- Request re-review when ready

### Merging

- PRs require at least 1 approval from a maintainer
- All conversations must be resolved
- All checks must pass
- Squash and merge for clean history

## Issue Reporting

### Before Creating an Issue

- Search existing issues to avoid duplicates
- Check the documentation and FAQ
- Test with the latest version

### Issue Template

```markdown
## Description

Clear description of the issue

## Steps to Reproduce

1. Step one
2. Step two
3. Step three

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Environment

- Node.js version:
- npm version:
- OS: Windows / macOS / Linux
- Browser (if applicable):

## Error Messages

Include relevant error messages or logs

## Additional Context

Any other relevant information
```

## Documentation Contributions

We welcome documentation improvements!

### Documentation Guidelines

- Use clear, simple language
- Include code examples where appropriate
- Keep examples up-to-date
- Add table of contents for long documents
- Use proper markdown formatting
- Proofread for typos and grammar

### Documentation Locations

- **Main docs**: `/docs/` directory
- **API docs**: `docs/API.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Auto-update guide**: `Coding/Scripts/auto-update/README.md`
- **Contributing guide**: `CONTRIBUTING.md` (this file)
- **Changelog**: `CHANGELOG.md`

## Community

### Getting Help

- **Discussions**: [GitHub Discussions](https://github.com/skanda890/CodePark/discussions)
- **Issues**: [GitHub Issues](https://github.com/skanda890/CodePark/issues)
- **Wiki**: [GitHub Wiki](https://github.com/skanda890/CodePark/wiki)

### Staying Updated

- Watch the repository for updates
- Follow the [Changelog](CHANGELOG.md)
- Subscribe to release notifications
- Join community discussions

## Recognition

Contributors will be recognized in:

- Pull request acknowledgments
- Release notes
- Contributors list (coming soon)
- Project documentation

## Useful Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Git Guide](https://git-scm.com/book/en/v2)
- [GitHub Guides](https://guides.github.com/)
- [CodePark Architecture](docs/ARCHITECTURE.md)
- [CodePark API Documentation](docs/API.md)

## Questions?

Feel free to:

- Open a GitHub Discussion
- Create an issue with the `question` label
- Check existing documentation
- Review past issues and PRs

## License

By contributing to CodePark, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for making CodePark better!** 🎉
