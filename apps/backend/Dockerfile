# ============================================================================
# Stage 1: Builder
# ============================================================================
# Multi-stage build reduces the final image size by excluding build dependencies
# and build artifacts. This stage compiles TypeScript and installs production
# dependencies only.
# ============================================================================
FROM node:20-alpine AS builder

# Set working directory for build
WORKDIR /build

# Install build dependencies
# dumb-init: To handle signals properly in container
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

# Copy package files to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for build)
# npm ci is used instead of npm install for reproducible builds in CI/CD
RUN npm ci

# Copy source code
COPY . .

# Build NestJS application (compiles TypeScript to JavaScript)
# Output goes to dist/ directory
RUN npm run build

# Prune node_modules to only include production dependencies
# This reduces the image size significantly by removing dev dependencies
RUN npm prune --production

# ============================================================================
# Stage 2: Production Runtime
# ============================================================================
# Lightweight runtime image containing only necessary runtime dependencies
# and the compiled application
# ============================================================================
FROM node:20-alpine

# Set NODE_ENV to production for optimal performance
ENV NODE_ENV=production \
    PORT=3000 \
    # Disable npm version check to reduce startup time
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    # Improve signal handling in containers
    NODE_OPTIONS="--max-old-space-size=1024"

# Create non-root user for security
# Running as root is a security risk in production
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Install runtime dependencies only
# dumb-init: Proper signal handling for graceful shutdown
# curl: For health checks
RUN apk add --no-cache \
    dumb-init \
    curl \
    postgresql-client

# Copy compiled code from builder stage
COPY --from=builder --chown=nodejs:nodejs /build/dist ./dist

# Copy node_modules from builder stage (production only)
COPY --from=builder --chown=nodejs:nodejs /build/node_modules ./node_modules

# Copy package.json for reference (not used, but helpful)
COPY --chown=nodejs:nodejs package*.json ./

# Create directories for application data
RUN mkdir -p /app/logs /app/uploads && \
    chown -R nodejs:nodejs /app

# Switch to non-root user for security
USER nodejs

# Expose the application port
# Default port 3000, but can be overridden with PORT environment variable
EXPOSE 3000

# Health check configuration
# Verifies that the application is responding to requests
# - interval: Check every 30 seconds
# - timeout: Allow 10 seconds for the check to complete
# - retries: Mark unhealthy after 3 failed checks (90 seconds total)
# - start-period: Allow 40 seconds for application startup before health checks
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init as entrypoint to handle signals correctly
# This ensures the Node.js process receives SIGTERM for graceful shutdown
ENTRYPOINT ["dumb-init", "--"]

# Start the application
# - Node.js process will run as PID 1 in the container
# - All signals will be properly propagated
# - Graceful shutdown will work correctly
CMD ["node", "dist/main"]
