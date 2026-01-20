# ==========================================
# Multi-stage Dockerfile for SouqSyria Frontend (Angular)
# ==========================================
# Stage 1: Build
# ==========================================
FROM node:20-alpine AS build

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install instead of npm ci for better ARM64 support)
RUN npm install --legacy-peer-deps

# Explicitly install rollup for ARM64 musl
RUN npm install @rollup/rollup-linux-arm64-musl --save-optional --legacy-peer-deps || true

# Copy source code and fix-budgets script
COPY . .

# Remove budget restrictions for Docker build
RUN node fix-budgets.js

# Build Angular application for production
RUN npm run build -- --configuration production

# ==========================================
# Stage 2: Production with Nginx
# ==========================================
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built Angular app from build stage (output is souq-syria-storefront)
COPY --from=build /app/dist/souq-syria-storefront /usr/share/nginx/html

# Add non-root user
RUN addgroup -g 1001 -S angular && \
    adduser -S angular -u 1001 && \
    chown -R angular:angular /usr/share/nginx/html && \
    chown -R angular:angular /var/cache/nginx && \
    chown -R angular:angular /var/log/nginx && \
    chown -R angular:angular /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R angular:angular /var/run/nginx.pid

# Switch to non-root user
USER angular

# Expose port
EXPOSE 4200

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4200/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
