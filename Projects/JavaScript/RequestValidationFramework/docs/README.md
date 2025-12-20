# Request Validation Framework

A comprehensive, production-ready request validation system with JSON Schema support, custom rules, and middleware integration for Express/Fastify applications.

## Features

✅ JSON Schema validation with format support  
✅ Custom validation rules  
✅ Express/Fastify middleware  
✅ User-friendly error messages  
✅ Type coercion and defaults  
✅ Field-level and cross-field validation  
✅ Schema registration system  
✅ Multiple data sources (body, query, params)

## Installation

```bash
npm install codepark-request-validation ajv ajv-formats
```

## Quick Start

```javascript
const RequestValidator = require("./index.js");

const validator = new RequestValidator();

// Register a schema
const userSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    email: { type: "string", format: "email" },
    age: { type: "integer", minimum: 0 },
  },
  required: ["name", "email"],
};

validator.registerSchema("user", userSchema);

// Validate data
const result = validator.validate("user", {
  name: "John",
  email: "john@example.com",
  age: 30,
});

if (result.valid) {
  console.log("Valid data:", result.data);
} else {
  console.log("Validation errors:", result.errors);
}
```

## Advanced Usage

### Custom Validation Rules

```javascript
validator.registerRule("strongPassword", (value) => {
  if (value.length < 8) return "Min 8 characters";
  if (!/[A-Z]/.test(value)) return "Need uppercase";
  if (!/[0-9]/.test(value)) return "Need number";
  return true;
});

const result = validator.validateWithRules(
  { password: "MyPass123" },
  { password: "strongPassword" },
);
```

### Express Middleware

```javascript
const express = require("express");
const app = express();

app.post("/users", validator.middleware("user", "body"), (req, res) => {
  const userData = req.validatedData;
  // Process validated data
  res.json({ success: true, data: userData });
});
```

### Multiple Data Sources

```javascript
// Validate query parameters
app.get("/search", validator.middleware("searchQuery", "query"), (req, res) => {
  // req.validatedData contains validated query params
});

// Validate URL parameters
app.put("/users/:id", validator.middleware("userId", "params"), (req, res) => {
  // req.validatedData contains validated params
});
```

### Custom Error Formatter

```javascript
const validator = new RequestValidator({
  errorFormatter: (errors) => {
    return errors.map((err) => ({
      path: err.instancePath,
      message: err.message,
      code: err.keyword,
    }));
  },
});
```

## API Reference

### `registerSchema(name, schema)`

Registers a JSON Schema for reuse.

### `registerRule(name, validator)`

Registers a custom validation function.

### `validate(schemaName, data)`

Validates data against a registered schema.

### `validateWithRules(data, rules)`

Validates using custom rules.

### `middleware(schemaName, source, customRules)`

Creates Express middleware for validation.

## Error Messages

Smart, user-friendly error messages for common validation scenarios:

- Missing required fields
- Type mismatches
- Length constraints
- Number ranges
- Format errors
- Pattern mismatches

## Performance

- Compiled schema validation (AJV)
- Cached validator instances
- O(1) schema lookup
- Minimal memory overhead

## Best Practices

1. **Register schemas early** - During app initialization
2. **Reuse validators** - Create one instance per app
3. **Combine with authentication** - Always validate before auth checks
4. **Custom rules for business logic** - Use for domain-specific validation
5. **Log validation failures** - Monitor for attack patterns

## Testing

```bash
npm test
```

## License

MIT
