# 🚀 CI/CD Pipeline Integration

CI/CD orchestration service for automated build, test, and deployment workflows with Docker container support.

## Features

- 🐳 **Docker Integration**: Container builds and deployments
- 📋 **Build Orchestration**: Coordinate build stages
- 🧪 **Automated Testing**: Run tests in pipeline
- 😟 **GitHub Actions Support**: Native GitHub workflow integration
- 📦 **Build Artifacts**: Store and manage build outputs
- 📋 **Build Logs**: Comprehensive build logging
- 🖥️ **Status Tracking**: Real-time build status

## Installation

```bash
cd Coding/Languages/JavaScript/ci-cd-pipeline
npm install
```

## Environment Variables

```env
PORT=3008
DOCKER_HOST=unix:///var/run/docker.sock
NODE_ENV=development
REGISTRY=docker.io
```

## Usage

```bash
npm start
```

## Endpoints

- `POST /build` - Trigger a new build
- `GET /status/:buildId` - Get build status

## Build Pipeline Stages

- Source
- Build
- Test
- Deploy

## Dependencies

- `express@next` - Web framework
- `dockerode@next` - Docker API client

## License

MIT
