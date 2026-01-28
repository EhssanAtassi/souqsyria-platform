# ============================================================================
# Stage 1: Builder
# ============================================================================
# Compiles Angular application from TypeScript to optimized JavaScript
# Performs production build with ahead-of-time (AOT) compilation and
# tree-shaking to minimize bundle size
# ============================================================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /build

# Install build dependencies if needed
RUN apk add --no-cache \
    python3 \
    make \
    g++

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# Install all dependencies using npm ci for reproducible builds
# npm ci is preferred in Docker because it respects lock file exactly
RUN npm ci

# Copy source code
COPY . .

# Build Angular application in production mode
# Options:
# --configuration production: Uses production build configuration
# --output-hashing all: Enables content-based hashing for cache busting
# --source-map false: Disables source maps to reduce bundle size
# Results in optimized build output in dist/souq-syria-storefront/
RUN npm run build -- --configuration production --source-map false

# ============================================================================
# Stage 2: Production Runtime (Nginx)
# ============================================================================
# Lightweight Nginx image serves the compiled Angular SPA
# Includes security headers, caching rules, and SPA routing configuration
# ============================================================================
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 101 -S nginx && \
    adduser -S nginx -u 101

# Copy Nginx configuration
# Custom configuration handles SPA routing, caching, and security headers
COPY nginx.conf /etc/nginx/nginx.conf

# Copy compiled Angular application from builder stage
# dist/souq-syria-storefront contains the production build output
COPY --from=builder /build/dist/souq-syria-storefront /usr/share/nginx/html

# Create necessary directories with proper permissions
RUN mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html

# Switch to nginx user for security
USER nginx

# Expose port 80 for HTTP traffic
EXPOSE 80

# Health check configuration
# Verifies that Nginx is responding to requests
# - interval: Check every 30 seconds
# - timeout: Allow 5 seconds for the check to complete
# - retries: Mark unhealthy after 3 failed checks (90 seconds total)
# - start-period: Allow 10 seconds for Nginx startup
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
    CMD curl -f http://localhost/index.html || exit 1

# Start Nginx in foreground mode
# foreground mode ensures Nginx runs as PID 1 for proper signal handling
CMD ["nginx", "-g", "daemon off;"]
