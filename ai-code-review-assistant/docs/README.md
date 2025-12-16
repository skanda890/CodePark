# 🤖 AI Code Review Assistant

AI-powered code review service leveraging TensorFlow.js and Natural Language Processing to analyze code quality, detect patterns, and provide intelligent suggestions for improvement.

## Features

- 🧠 **Machine Learning Analysis**: TensorFlow.js models for code pattern recognition
- 📝 **Natural Language Processing**: Code understanding using `natural` library
- 🔍 **Vulnerability Detection**: Automatic security issue identification
- 💡 **Smart Suggestions**: Confidence-ranked improvement recommendations
- ⚡ **Real-time Processing**: Fast inference on submitted code
- 📊 **Metrics Export**: Complexity and maintainability scoring
- 🖥️ **REST API**: Simple HTTP interface for integration

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

```bash
npm start          # Production
npm run dev        # Development
```

## API Endpoints

### POST /review

Submit code for AI-powered review.

```bash
curl -X POST http://localhost:3002/review \
  -H "Content-Type: application/json" \
  -d '{ "code": "function test() { var x = 1; }" }'
```

## Suggestion Types

- Security Issues
- Code Quality
- Best Practices

## Performance

- **Inference Time**: < 100ms per submission
- **Model Size**: ~5MB (TensorFlow.js)
- **Throughput**: 500+ reviews/sec

## Dependencies

- `express@next` - Web framework
- `@tensorflow/tfjs-node@next` - ML inference
- `natural@next` - NLP utilities
- `pino@next` - Logging

## License

MIT
