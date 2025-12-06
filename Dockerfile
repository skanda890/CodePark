# CodePark - Security-Hardened Dockerfile
# Multi-stage build for optimized and secure container images

# ================================
# Stage 1: Dependencies
# ================================
FROM node:22-alpine AS dependencies

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    tini \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies (lockfile-only) for reproducible builds
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# ================================
# Stage 2: Builder
# ================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and dependencies from previous stage
COPY package*.json ./
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application source
COPY . .

# Build application (if needed)
# RUN npm run build

# ================================
# Stage 3: Production
# ================================
FROM node:22-alpine AS production

# Install dumb-init and security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy dependencies from dependencies stage
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application files from builder stage
COPY --from=builder --chown=nodejs:nodejs /app ./ 

# Create necessary directories with correct permissions
RUN mkdir -p logs uploads tmp && \
    chown -R nodejs:nodejs /app

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "index.js"]

# ================================
# Metadata
# ================================
LABEL maintainer="SkandaBT" \
      description="CodePark - Experimental collaboration platform" \
      version="3.0.0-experimental" \
      org.opencontainers.image.source="https://github.com/skanda890/CodePark" \
      org.opencontainers.image.licenses="MIT" \
      security.scan="enabled"
