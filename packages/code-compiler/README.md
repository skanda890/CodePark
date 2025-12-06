# CodePark Code Compiler

Multi-language code compilation and execution engine with Docker-based sandboxing.

## Supported Languages

- Python 3.11
- JavaScript/Node.js 18
- Go 1.20
- Rust 1.70
- Java 17
- C# / .NET 7

## Features

- ✅ Docker-based sandboxing
- ✅ Resource limits (CPU, memory)
- ✅ Execution timeout (10s default)
- ✅ Network isolation
- ✅ Error handling and reporting
- ✅ Performance metrics
- ✅ Safe code execution

## Installation

```bash
cd packages/code-compiler
npm install

# Ensure Docker is running
docker --version
```

## Usage

```javascript
const CodeCompiler = require("./src/compiler");

const compiler = new CodeCompiler();

const pythonCode = `
print("Hello, World!")
print(sum([1, 2, 3, 4, 5]))
`;

try {
  const result = await compiler.compile(pythonCode, "python");
  console.log("Result:", result);
} catch (err) {
  console.error("Compilation Error:", err.message);
}
```

## Result Format

```javascript
{
  status: 'success',        // 'success' or 'error'
  output: 'Hello, World!',  // Program output
  error: '',                // Error message (if any)
  executionTime: 234,       // Milliseconds
  language: 'python',       // Language name
  exitCode: 0               // Process exit code
}
```

## Docker Setup

### Start Docker Container

```bash
docker-compose up -d
```

### Pull Images

```bash
docker pull python:3.11-slim
docker pull node:18-alpine
docker pull golang:1.20-alpine
docker pull rust:1.70-alpine
docker pull openjdk:17-jdk-slim
docker pull mcr.microsoft.com/dotnet/sdk:7.0
```

## Configuration

Edit `src/compiler.js` to customize:

- Memory limit (256MB default)
- CPU quota
- Execution timeout (10s default)
- Language runtimes

## Security

- Network disabled
- Memory-limited containers
- CPU-limited containers
- 10-second execution timeout
- Automatic cleanup
- No persistent storage

## Architecture

```
src/
├── compiler.js       # Main compiler
├── sandbox.js        # Sandboxing logic
└── language-adapters/
    └── [language].js   # Language-specific handlers
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

MIT
