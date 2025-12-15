# 🤖 AI Code Review Assistant

AI-powered code review service leveraging TensorFlow.js and Natural Language Processing to analyze code quality, detect patterns, and provide intelligent suggestions for improvement.

## Features

- 🧠 **Machine Learning Analysis**: TensorFlow.js models for code pattern recognition
- 📝 **Natural Language Processing**: Code understanding using `natural` library
- 🔍 **Vulnerability Detection**: Automatic security issue identification
- 💡 **Smart Suggestions**: Confidence-ranked improvement recommendations
- ⚡ **Real-time Processing**: Fast inference on submitted code
- 📊 **Metrics Export**: Complexity and maintainability scoring
- 🔌 **REST API**: Simple HTTP interface for integration

## Installation

```bash
cd ai-code-review-assistant
npm install
```

## Environment Variables

```env
PORT=3002
MODEL_PATH=./models/code-review-model.json
NODE_ENV=development
```

## Usage

### Start the Service

```bash
npm start          # Production
npm run dev        # Development with auto-reload
```

### API Endpoints

#### Submit Code for Review

```bash
curl -X POST http://localhost:3002/review \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function calculateSum(arr) {\n  var total = 0;\n  for (var i = 0; i < arr.length; i++) {\n    total += arr[i];\n  }\n  return total;\n}"
  }'
```

#### Response Example

```json
{
  "suggestions": [
    {
      "line": 1,
      "message": "Prefer 'const' or 'let' over 'var'",
      "confidence": 0.95,
      "severity": "warning",
      "fix": "const total = 0;"
    },
    {
      "line": 2,
      "message": "Function is too long, consider refactoring",
      "confidence": 0.8,
      "severity": "info"
    }
  ],
  "metrics": {
    "complexity": 2.3,
    "maintainability": 85,
    "security": {
      "issues": 0,
      "score": 100
    }
  }
}
```

## API Reference

### POST /review

Submit code for AI-powered review.

**Request Body:**

```json
{
  "code": "string (required) - Code to review",
  "language": "string (optional) - Programming language (default: javascript)",
  "context": "string (optional) - Additional context for better analysis"
}
```

**Response:**

```json
{
  "suggestions": [
    {
      "line": number,
      "message": "string",
      "confidence": number (0-1),
      "severity": "error | warning | info",
      "fix": "string (optional)"
    }
  ],
  "metrics": {
    "complexity": number,
    "maintainability": number (0-100),
    "security": {
      "issues": number,
      "score": number (0-100)
    }
  }
}
```

## Suggestion Types

### Security Issues
- Injection vulnerabilities
- Authentication/Authorization flaws
- Sensitive data exposure
- API misuse

### Code Quality
- Unused variables
- Unreachable code
- Duplicate logic
- Performance anti-patterns

### Best Practices
- ES6+ adoption
- Error handling
- Documentation
- Testing coverage indicators

## Model Architecture

```
┌────────────────────┐
│    Input Code String      │
└───────┬───────────┘
               │
      ┌─────┴─────┐
      │  Tokenization  │
      └─────┬─────┘
               │
   ┌───────┴───────┐
   │   NLP Processing   │
   └───────┬───────┘
               │
  ┌────────┴────────┐
  │  TensorFlow.js Model  │
  └────────┬────────┘
               │
  ┌────────┴────────┐
  │  Inference Output   │
  └─────────────────┘
```

## Examples

### Example 1: Security Issue Detection

```javascript
// Request
const code = `
function processUserInput(input) {
  return eval(input);
}
`;

// Response includes suggestion
// "Security: eval() is dangerous, use safer alternatives"
```

### Example 2: Code Quality Improvement

```javascript
// Request
const code = `
function fetchData(url) {
  fetch(url)
    .then(res => res.json())
    .then(data => console.log(data))
    // Missing .catch()
}
`;

// Response includes suggestion
// "Missing error handling for promise chain"
```

## Performance

- **Inference Time**: < 100ms per submission
- **Model Size**: ~5MB (TensorFlow.js)
- **Throughput**: 500+ reviews/sec on modern hardware

## Troubleshooting

### Model Loading Failed
- Check MODEL_PATH points to valid model file
- Ensure model.json and weights.bin are accessible
- Verify Node.js and TensorFlow.js compatibility

### Slow Inference
- Use TensorFlow.js-GPU for GPU acceleration
- Batch multiple code submissions
- Consider caching for identical inputs

## Dependencies

- `express@next` - Web framework
- `@tensorflow/tfjs-node@next` - ML inference
- `natural@next` - NLP utilities
- `pino@next` - Logging

## Future Enhancements

- [ ] Multi-language support
- [ ] Custom rule training
- [ ] Integration with Git hooks
- [ ] VSCode extension
- [ ] Performance profiling suggestions

## License

MIT
