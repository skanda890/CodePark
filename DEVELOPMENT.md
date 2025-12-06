# Development Guide - CodePark

Guidelines for contributing to CodePark Phase 1 implementation.

## Code Style

### JavaScript

- ES6+ syntax
- const/let (no var)
- Arrow functions
- Template literals
- Consistent 2-space indentation

```javascript
// Good
const greet = (name) => {
  console.log(`Hello, ${name}!`);
};

// Avoid
var greet = function(name) {
  console.log("Hello, " + name + "!");
};
```

### C#

- PascalCase for classes/methods
- camelCase for variables
- XML documentation comments
- LINQ expressions where appropriate

```csharp
/// <summary>Process BIOS event</summary>
public void ProcessBIOSEvent(ManagementBaseObject obj)
{
    var properties = GetBIOSProperties(obj);
    // Implementation
}
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]
[optional footer]
```

**Types**: feat, fix, docs, style, refactor, perf, test, chore

**Examples**:
```
feat(games): add room matchmaking
fix(compiler): handle execution timeout
docs(bios): add WMI event documentation
test(backup): add S3 upload tests
```

## Pull Request Process

1. Create branch from `feature/phase-1-implementation`
2. Make changes and commit
3. Push to branch
4. Create PR with description
5. Wait for CI/CD checks
6. Request review
7. Address feedback
8. Merge when approved

## Code Review Checklist

- [ ] Follows code style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.log/debug code
- [ ] Error handling implemented
- [ ] Security best practices
- [ ] Performance considered

## Testing Guidelines

### Unit Tests

```javascript
describe('GameRoom', () => {
  it('should add player to room', () => {
    const room = new GameRoom('room-1');
    const player = { id: 1, name: 'Alice' };
    
    room.addPlayer(player);
    
    expect(room.players).toHaveLength(1);
    expect(room.players[0]).toEqual(player);
  });
});
```

### Test Coverage

- Unit tests: 80%+ coverage
- Integration tests: Critical paths
- E2E tests: User flows

## Documentation

- README.md in each package
- JSDoc/XML comments for functions
- Examples in code templates
- API documentation

## Performance

- Profile before optimizing
- Measure impact
- Document changes
- Avoid premature optimization

## Security

- Validate all inputs
- Sanitize user data
- Use HTTPS for APIs
- Encrypt sensitive data
- Never commit secrets
- Use environment variables

---

**Updated**: December 6, 2025
